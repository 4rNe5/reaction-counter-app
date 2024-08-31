import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, InteractionManager, PanResponder, Animated } from "react-native";
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

interface ReactionResult {
  time: number;
  date: string;
}

const STORAGE_KEY = '@reaction_results';
const USERNAME_KEY = '@userName';

export default function ReactionTestView() {
  const [state, setState] = useState<'ready' | 'waiting' | 'click' | 'result' | 'tooEarly'>('ready');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number | null>(null);

  // Animated value for the notice position
  const noticeTranslateY = useRef(new Animated.Value(-100)).current; // 초기값을 화면 위로 설정

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

    // Listener to detect updates to the username
    const userNameListener = async () => {
      const userName = await AsyncStorage.getItem(USERNAME_KEY);
      if (userName) {
        Animated.timing(noticeTranslateY, {
          toValue: -100, // Move notice up off the screen
          duration: 300, // 300ms animation
          useNativeDriver: true,
        }).start(() => setShowNotice(false)); // Hide notice after animation
      }
    };

    // Watch for changes in the AsyncStorage
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

  // Add the effect for the slide down animation when notice appears
  useEffect(() => {
    if (showNotice) {
      Animated.timing(noticeTranslateY, {
        toValue: 0, // Move notice to its original position
        duration: 300, // 300ms animation for the sliding down effect
        useNativeDriver: true,
      }).start();
    }
  }, [showNotice, noticeTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Enable pan responder only for vertical swipe gestures
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Adjust notice position based on swipe gesture
        if (gestureState.dy < 0) {
          noticeTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swipe is strong enough, hide the notice with an animation
        if (gestureState.dy < -50) {
          Animated.timing(noticeTranslateY, {
            toValue: -100, // Move notice up off the screen
            duration: 300, // 300ms animation
            useNativeDriver: true,
          }).start(() => setShowNotice(false)); // Hide notice after animation
        } else {
          // If swipe is not strong enough, return to original position
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
    const delay = Math.floor(Math.random() * 5000) + 1000;
    timeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        setState('click');
        frameRef.current = requestAnimationFrame(() => {
          startTimeRef.current = performance.now();
        });
      });
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'click') {
      const endTime = performance.now();
      const newReactionTime = Math.round(endTime - startTimeRef.current);
      setReactionTime(newReactionTime - 100);
      setState('result');
      saveResult(newReactionTime - 100);
    } else if (state === 'waiting') {
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
    startTimeRef.current = 0;
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
        reset();
        break;
    }
  }, [state, startTest, handleClick, reset]);

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
      </Text>

      <Text style={styles.titleFont_2}>
        {state === 'ready' && '테스트를 시작하세요!'}
        {state === 'waiting' && '빠르게 탭하세요!'}
      </Text>

      {state === 'result' && (
        <Text style={styles.subresultFont}>{<Text style={styles.resultFont}>{reactionTime}</Text>} ms</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          state === 'click' && styles.greenButton,
          state === 'tooEarly' && styles.redButton,
          (state === 'result' || state === 'tooEarly') && styles.restartButton,
        ]}
        onPress={handleButtonPress}
      >
        <Text style={[
          styles.buttonText,
          state === 'result' && styles.buttonResultText,
        ]}>
          {state === 'ready' && '시작하기!'}
          {state === 'waiting' && '대기 중...'}
          {state === 'click' && '텝하세요!'}
          {(state === 'result' || state === 'tooEarly') && '다시하기!'}
        </Text>
      </TouchableOpacity>
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
    width: 240,
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
  resultListButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 5,
  },
  resultListButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro',
  },
});
