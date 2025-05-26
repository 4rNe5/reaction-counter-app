import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { API_URL } from "../api";

interface ReactionResult {
  time: number;
  date: string;
}

type TestState = 'ready' | 'waiting' | 'click' | 'result' | 'tooEarly' | 'failed';

// Constants
const STORAGE_KEY = '@reaction_results';
const USERNAME_KEY = '@userName';
const MIN_REACTION_TIME = 80;
const REACTION_TIME_ADJUSTMENT = 60;


function ReactionTestView() {
  const [state, setState] = useState<TestState>('ready');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Refs
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number | null>(null);
  const buttonPressedRef = useRef(false);
  const buttonHeldDuringWaitingRef = useRef(false);
  const noticeTranslateY = useRef(new Animated.Value(-100)).current;
  const userNameCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // PocketBase 인스턴스 메모이제이션
  const pb = useMemo(() => new PocketBase(API_URL), []);


  const checkUserName = useCallback(async (): Promise<void> => {
    try {
      const userName = await AsyncStorage.getItem(USERNAME_KEY);
      if (!userName && !showNotice) {
        setShowNotice(true);
      } else if (userName && showNotice) {
        hideNotice();
      }
    } catch (error) {
      console.error('Failed to fetch userName:', error);
    }
  }, [showNotice]);


  const hideNotice = useCallback((): void => {
    Animated.timing(noticeTranslateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowNotice(false));
  }, [noticeTranslateY]);


  const showNoticeAnimation = useCallback((): void => {
    Animated.timing(noticeTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [noticeTranslateY]);

  // PanResponder 메모이제이션
  const panResponder = useMemo(
    () => PanResponder.create({
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
          hideNotice();
        } else {
          Animated.spring(noticeTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
    [noticeTranslateY, hideNotice]
  );

  // 정리 함수
  const cleanup = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    if (userNameCheckIntervalRef.current) {
      clearInterval(userNameCheckIntervalRef.current);
    }
  }, []);


  useEffect(() => {
    checkUserName();

    // 주기적으로 사용자명 확인
    userNameCheckIntervalRef.current = setInterval(checkUserName, 1000);

    return cleanup;
  }, [checkUserName, cleanup]);

  // 알림 표시
  useEffect(() => {
    if (showNotice) {
      showNoticeAnimation();
    }
  }, [showNotice, showNoticeAnimation]);

  // 테스트 시작
  const startTest = useCallback((): void => {
    setState('waiting');
    buttonPressedRef.current = false;
    buttonHeldDuringWaitingRef.current = false;

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


  const saveResult = useCallback(async (time: number): Promise<void> => {
    try {
      const existingResultsString = await AsyncStorage.getItem(STORAGE_KEY);
      const existingResults: ReactionResult[] = existingResultsString
        ? JSON.parse(existingResultsString)
        : [];

      const newResult: ReactionResult = {
        time,
        date: new Date().toISOString(),
      };

      const updatedResults = [...existingResults, newResult];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
    } catch (error) {
      console.error('Failed to save result:', error);
    }
  }, []);

  // 클릭 처리
  const handleClick = useCallback((): void => {
    if (state === 'click' && !buttonPressedRef.current) {
      buttonPressedRef.current = true;
      const endTime = performance.now();
      const newReactionTime = Math.round(endTime - startTimeRef.current) - REACTION_TIME_ADJUSTMENT;

      if (newReactionTime <= 0 || newReactionTime < MIN_REACTION_TIME) {
        setState('failed');
        setReactionTime(null);
      } else {
        setReactionTime(newReactionTime);
        setState('result');
        saveResult(newReactionTime);
      }
    } else if (state === 'waiting') {
      buttonHeldDuringWaitingRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setState('tooEarly');
    }
  }, [state, saveResult]);


  const reset = useCallback((): void => {
    cleanup();
    setState('ready');
    setReactionTime(null);
    setIsSaved(false);
    startTimeRef.current = 0;
    buttonPressedRef.current = false;
    buttonHeldDuringWaitingRef.current = false;
  }, [cleanup]);


  const handleButtonPress = useCallback((): void => {
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

  const handleButtonPressIn = useCallback((): void => {
    if (state === 'waiting') {
      buttonHeldDuringWaitingRef.current = true;
    }
  }, [state]);

  const handleSaveButtonPress = useCallback(async (): Promise<void> => {
    if (isSaved) {
      Alert.alert('이미 저장된 기록입니다.', '기록은 한 번만 저장할 수 있습니다.');
      return;
    }

    if (reactionTime === null) {
      Alert.alert('오류', '반응 속도가 없습니다. 다시 시도해주세요.');
      return;
    }

    try {
      const userName = await AsyncStorage.getItem(USERNAME_KEY);
      if (!userName) {
        Alert.alert('닉네임이 설정되지 않았어요!', '설정 페이지에서 닉네임을 설정해주세요.');
        return;
      }

      const data = { userName, reactionMs: reactionTime };
      const record = await pb.collection('reaction_records').create(data);

      if (record) {
        setIsSaved(true);
        Alert.alert('저장 성공', '기록이 성공적으로 저장되었습니다!');
      }
    } catch (error) {
      Alert.alert('저장 오류', '기록 저장에 실패했습니다. 나중에 다시 시도해주세요.');
      console.error('Save operation failed:', error);
    }
  }, [reactionTime, isSaved, pb]);

  // 텍스트 메모
  const textContent = useMemo(() => {
    const titleTexts = {
      ready: '아래 버튼을 눌러',
      waiting: '초록색이 되는 순간',
      click: '탭하세요!',
      result: '당신의 반응 속도는',
      tooEarly: '너무 빨리 탭했습니다!',
      failed: '측정 실패!'
    };

    const subtitleTexts = {
      ready: '테스트를 시작하세요!',
      waiting: '빠르게 탭하세요!',
      failed: '다시 시도해주세요.'
    };

    const buttonTexts = {
      ready: '시작하기!',
      waiting: '대기 중...',
      click: '텝하세요!',
      result: '다시하기!',
      tooEarly: '다시하기!',
      failed: '다시하기!'
    };

    return {
      title: titleTexts[state],
      // @ts-ignore
      subtitle: subtitleTexts[state] || '',
      button: buttonTexts[state]
    };
  }, [state]);

  // 버튼 색 메모
  const buttonStyle = useMemo(() => [
    styles.button,
    state === 'click' && styles.greenButton,
    state === 'tooEarly' && styles.redButton,
    (['result', 'tooEarly', 'failed'].includes(state)) && styles.restartButton,
  ], [state]);

  const buttonTextStyle = useMemo(() => [
    styles.buttonText,
    (['result', 'failed'].includes(state)) && styles.buttonResultText,
  ], [state]);

  return (
    <View style={styles.container}>
      {showNotice && (
        <Animated.View
          style={[styles.noticeContainer, { transform: [{ translateY: noticeTranslateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.noticeTitleContainer}>
            <FontAwesome6 name="circle-exclamation" size={22} color="#ff390d" />
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

      {state === 'result' && (
        <Image
          source={require('../assets/Fire.png')}
          style={styles.fireImage}
        />
      )}

      <Text style={styles.titleFont}>{textContent.title}</Text>

      {textContent.subtitle && (
        <Text style={styles.titleFont_2}>{textContent.subtitle}</Text>
      )}

      {state === 'result' && reactionTime && (
        <Text style={styles.subresultFont}>
          <Text style={styles.resultFont}>{reactionTime}</Text> ms
        </Text>
      )}

      <TouchableOpacity
        style={buttonStyle}
        onPress={handleButtonPress}
        onPressIn={handleButtonPressIn}
      >
        <Text style={buttonTextStyle}>
          {textContent.button}
        </Text>
      </TouchableOpacity>

      {state === 'result' && (
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
  noticeTitleContainer: {
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
    marginTop: 20,
  },
  subresultFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 45,
    marginBottom: 20,
    marginTop: 10,
  },
  fireImage: {
    width: 175,
    height: 175,
    marginBottom: 25,
    marginTop: -50,
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
});

export default ReactionTestView;