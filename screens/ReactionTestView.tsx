import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function ReactionTestView() {
  const [state, setState] = useState('ready');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);
  const timeoutRef = useRef(null);

  const startTest = useCallback(() => {
    setState('waiting');
    const delay = Math.floor(Math.random() * 3000) + 1000; // Random delay between 1-4 seconds
    timeoutRef.current = setTimeout(() => {
      setState('click');
      setStartTime(Date.now());
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'click') {
      const endTime = Date.now();
      setReactionTime(endTime - startTime);
      setState('result');
    } else if (state === 'waiting') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setState('tooEarly');
    }
  }, [state, startTime]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState('ready');
    setReactionTime(null);
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
      <Text style={styles.titleFont}>
        {state === 'ready' && '아래 버튼을 눌러'}
        {state === 'waiting' && '초록색이 되는 순간'}
        {state === 'click' && '탭하세요!'}
        {state === 'result' && '반응 시간:'}
        {state === 'tooEarly' && '너무 빨리 탭했습니다!'}
      </Text>

        <Text style={styles.titleFont_2}>
          {state === 'ready' && '테스트를 시작하세요!'}
          {state === 'waiting' && '빠르게 탭하세요!'}
        </Text>

      {state === 'result' && (
        <Text style={styles.resultFont}>{reactionTime} ms</Text>
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
        <Text style={styles.buttonText}>
          {state === 'ready' && '시작하기!'}
          {state === 'waiting' && '대기 중...'}
          {state === 'click' && '텝하세요!'}
          {(state === 'result' || state === 'tooEarly') && '다시 시작'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#232323',
  },
  titleFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#b8b8b8',
    fontSize: 32,
    paddingBottom: 6,
    textAlign: 'center',
  },
  titleFont_2: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#b8b8b8',
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
    fontSize: 60,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#c34023',
    padding: 15,
    width: 200,
    height: 200,
    borderRadius: 120,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartButton: {
    backgroundColor: '#c34023',
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
});