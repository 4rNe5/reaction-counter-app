import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  InteractionManager,
  PanResponder,
  Animated,
  Alert
} from "react-native";
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import PocketBase from "pocketbase";

interface ReactionResult {
  time: number;
  date: string;
}

const STORAGE_KEY = '@reaction_results';
const USERNAME_KEY = '@userName';
const MIN_REACTION_TIME = 80; // Minimum reaction time threshold in milliseconds
const REACTION_TIME_ADJUSTMENT = 60; // Adjustment value in milliseconds

export default function ReactionTestView() {
  const [state, setState] = useState<'ready' | 'waiting' | 'click' | 'result' | 'tooEarly' | 'failed'>('ready');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // New state to track if the record is saved
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number | null>(null);
  const buttonPressedRef = useRef(false);
  const buttonHeldDuringWaitingRef = useRef(false); // New flag to track if button is held during waiting

  const noticeTranslateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const checkUserName = async () => {
      try {
        const userName = await AsyncStorage.getItem(USERNAME_KEY);
        if (!userName) {
          setShowNotice(true);
        }
      } catch (error) {
        console.error('Failed to fetch userName', error);
      }
    };

    checkUserName();

    const userNameListener = async () => {
      const userName = await AsyncStorage.getItem(USERNAME_KEY);
      if (userName) {
        Animated.timing(noticeTranslateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowNotice(false));
      }
    };

    const interval = setInterval(userNameListener, 1000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [noticeTranslateY]);

  useEffect(() => {
    if (showNotice) {
      Animated.timing(noticeTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showNotice, noticeTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < 0) {
          noticeTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.timing(noticeTranslateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowNotice(false));
        } else {
          Animated.spring(noticeTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const startTest = useCallback(() => {
    setState('waiting');
    buttonPressedRef.current = false;
    buttonHeldDuringWaitingRef.current = false; // Reset the flag
    const delay = Math.floor(Math.random() * 3000) + 1000;
    timeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (buttonHeldDuringWaitingRef.current) {
          setState('failed');
        } else {
          setState('click');
          frameRef.current = requestAnimationFrame(() => {
            startTimeRef.current = performance.now();
          });
        }
      });
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'click' && !buttonPressedRef.current) {
      buttonPressedRef.current = true;
      const endTime = performance.now();
      let newReactionTime = Math.round(endTime - startTimeRef.current) - REACTION_TIME_ADJUSTMENT; // Apply adjustment
      if (newReactionTime <= 0 || newReactionTime < MIN_REACTION_TIME) {
        setState('failed');
        setReactionTime(null);
      } else {
        setReactionTime(newReactionTime);
        setState('result');
        saveResult(newReactionTime);
      }
    } else if (state === 'waiting') {
      buttonHeldDuringWaitingRef.current = true; // Set the flag if button is held during waiting
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setState('tooEarly');
    }
  }, [state]);

  const saveResult = async (time: number) => {
    try {
      const existingResultsString = await AsyncStorage.getItem(STORAGE_KEY);
      const existingResults: ReactionResult[] = existingResultsString ? JSON.parse(existingResultsString) : [];
      const newResult: ReactionResult = {
        time,
        date: new Date().toISOString(),
      };
      const updatedResults = [...existingResults, newResult];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
    } catch (error) {
      console.error('Failed to save result', error);
    }
  };

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    setState('ready');
    setReactionTime(null);
    setIsSaved(false); // Reset the save status
    startTimeRef.current = 0;
    buttonPressedRef.current = false;
    buttonHeldDuringWaitingRef.current = false; // Reset the flag
  }, []);

  const handleButtonPress = useCallback(() => {
    switch (state) {
      case 'ready':
        startTest();
        break;
      case 'waiting':
      case 'click':
        handleClick();
        break;
      case 'result':
      case 'tooEarly':
      case 'failed':
        reset();
        break;
    }
  }, [state, startTest, handleClick, reset]);

  const handleSaveButtonPress = useCallback(async () => {
    if (isSaved) {
      Alert.alert('이미 저장된 기록입니다.', '기록은 한 번만 저장할 수 있습니다.');
      return;
    }

    try {
      const userName = await AsyncStorage.getItem(USERNAME_KEY);
      if (!userName) {
        Alert.alert('닉네임이 설정되지 않았어요!', '설정 페이지에서 닉네임을 설정해주세요.');
        return;
      }

      if (reactionTime === null) {
        Alert.alert('오류', '반응 속도가 없습니다. 다시 시도해주세요.');
        return;
      }

      const pb = new PocketBase('https://reaction-counter.fly.dev');
      const data = { userName: userName, reactionMs: reactionTime };

      try {
        const record = await pb.collection('reaction_records').create(data);
        if (record) {
          setIsSaved(true); // Update the save status
          Alert.alert('저장 성공', '기록이 성공적으로 저장되었습니다!');
        }
      } catch (error) {
        Alert.alert('저장 오류', '기록 저장에 실패했습니다. 나중에 다시 시도해주세요.');
        console.error('Save operation failed', error);
      }
    } catch (error) {
      Alert.alert('오류', '기록 저장 중 문제가 발생했습니다. 나중에 다시 시도해주세요.');
      console.error('Save operation failed', error);
    }
  }, [reactionTime, isSaved]);

  return (
    <View style={styles.container}>
      {showNotice && (
        <Animated.View
          style={[styles.noticeContainer, { transform: [{ translateY: noticeTranslateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.noticeTitlecontainer}>
            <FontAwesome6 name="circle-exclamation" size={22} color={'#ff390d'} />
            <Text style={styles.noticeTitle}>서비스 알림!</Text>
          </View>

          <Text style={styles.noticeText}>
            사용 전, 본인의 닉네임을 설정해주세요!
          </Text>
          <Text style={styles.noticeText}>
            설정 페이지에서 닉네임을 설정할 수 있습니다.
          </Text>
        </Animated.View>
      )}

      {state === 'result' && <Image source={require('../assets/Fire.png')} style={{ width: 175, height: 175, marginBottom: 25, marginTop: -50 }} />}
      <Text style={styles.titleFont}>
        {state === 'ready' && '아래 버튼을 눌러'}
        {state === 'waiting' && '초록색이 되는 순간'}
        {state === 'click' && '탭하세요!'}
        {state === 'result' && '당신의 반응 속도는'}
        {state === 'tooEarly' && '너무 빨리 탭했습니다!'}
        {state === 'failed' && '측정 실패!'}
      </Text>

      <Text style={styles.titleFont_2}>
        {state === 'ready' && '테스트를 시작하세요!'}
        {state === 'waiting' && '빠르게 탭하세요!'}
        {state === 'failed' && '다시 시도해주세요.'}
      </Text>

      {state === 'result' && (
        <Text style={styles.subresultFont}>{<Text style={styles.resultFont}>{reactionTime}</Text>} ms</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          state === 'click' && styles.greenButton,
          state === 'tooEarly' && styles.redButton,
          (state === 'result' || state === 'tooEarly' || state === 'failed') && styles.restartButton,
        ]}
        onPress={handleButtonPress}
        onPressIn={() => {
          if (state === 'waiting') {
            buttonHeldDuringWaitingRef.current = true; // Set the flag if button is pressed during waiting
          }
        }}
      >
        <Text style={[
          styles.buttonText,
          (state === 'result' || state === 'failed') && styles.buttonResultText,
        ]}>
          {state === 'ready' && '시작하기!'}
          {state === 'waiting' && '대기 중...'}
          {state === 'click' && '텝하세요!'}
          {(state === 'result' || state === 'tooEarly' || state === 'failed') && '다시하기!'}
        </Text>
      </TouchableOpacity>
        {(state === 'result') && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveButtonPress}>
            <Text style={styles.saveButtonText}>기록 저장하기!</Text>
          </TouchableOpacity>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#232323',
  },
  separator: {
    backgroundColor: '#b55d27',
    height: 1,
    marginVertical: 10,
    width: 150,
  },
  noticeTitlecontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  noticeTitle: {
    fontFamily: 'Pretendard-Bold',
    color: '#ff390d',
    fontSize: 18,
    marginLeft: 10,
  },
  noticeContainer: {
    width: '90%',
    position: 'absolute',
    top: 50,
    backgroundColor: '#ffd5cc',
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
    zIndex: 9999,
  },
  noticeText: {
    color: '#ff390d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 34,
    paddingBottom: 10,
    textAlign: 'center',
  },
  titleFont_2: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 34,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 60,
    marginBottom: 20,
    marginTop: -20,
  },
  subresultFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 45,
    marginBottom: 20,
    marginTop: -20,
  },
  button: {
    backgroundColor: '#ea411b',
    padding: 15,
    width: 240,
    height: 240,
    borderRadius: 120,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartButton: {
    backgroundColor: '#ea411b',
    padding: 15,
    width: 260,
    height: 80,
    borderRadius: 80,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenButton: {
    backgroundColor: '#4CAF50',
  },
  redButton: {
    backgroundColor: '#a12525',
  },
  buttonText: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
    fontSize: 32,
  },
  buttonResultText: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
    fontSize: 28,
  },
  buttonContainer: {
    marginTop: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 74,
  },
  saveButton: {
    backgroundColor: '#4184cf',
    padding: 15,
    marginTop: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
    fontSize: 20,
  },
  shareButton: {
    backgroundColor: '#26b120',
    padding: 15,
    marginTop: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
    fontSize: 20,
  },
});