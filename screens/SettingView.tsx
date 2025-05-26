import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingButton from "../components/SettingButton";
import { BAD_WORD_LIST } from "../BAD_WORD_LIST";

// Constants
const STORAGE_KEY = '@userName';
const MAX_USERNAME_LENGTH = 12;
const PRIVACY_POLICY_URL = 'https://4-rne5.notion.site/Action-1fbcffa1aad84bbea8820ded398f51d3?pvs=4';

// Messages
const MESSAGES = {
  EMPTY_USERNAME: '유저명을 입력해주세요.',
  INAPPROPRIATE_USERNAME: '부적절한 단어가 포함되어 있습니다. 다른 유저명을 선택해주세요.',
  SAVE_SUCCESS: '유저 닉네임이 정상적으로 저장되었어요!!',
  SAVE_FAILED: '유저 닉네임의 저장에 실패하였어요..',
} as const;

// Utils
const isAppropriateUsername = (username: string): boolean => {
  const lowercaseUsername = username.toLowerCase();
  return !BAD_WORD_LIST.some(word => lowercaseUsername.includes(word));
};

const validateUsername = (username: string): string | null => {
  if (username.trim().length === 0) {
    return MESSAGES.EMPTY_USERNAME;
  }

  if (!isAppropriateUsername(username)) {
    return MESSAGES.INAPPROPRIATE_USERNAME;
  }

  return null;
};

export default function RankingView() {
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load username on component mount
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUsername) {
          setUsername(savedUsername);
          setNewUsername(savedUsername);
        }
      } catch (error) {
        console.error('Failed to load username:', error);
      }
    };

    loadUsername();
  }, []);


  const handleSaveUsername = useCallback(async () => {
    const validationError = validateUsername(newUsername);
    if (validationError) {
      Alert.alert('오류', validationError);
      return;
    }

    setIsLoading(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newUsername);
      setUsername(newUsername);
      Alert.alert('성공!', MESSAGES.SAVE_SUCCESS);
    } catch (error) {
      console.error('유저 닉네임 변경 실패:', error);
      Alert.alert('실패..', MESSAGES.SAVE_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [newUsername]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>유저 & 설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>사용자명 설정</Text>
        <TextInput
          style={styles.input}
          value={newUsername}
          onChangeText={setNewUsername}
          placeholder="공백 포함 12자까지 가능합니다."
          maxLength={MAX_USERNAME_LENGTH}
          placeholderTextColor="#8e8e8e"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSaveUsername}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '저장 중...' : '저장하기'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.currentUsername}>현재 유저명: {username}</Text>
      </View>

      <View style={styles.section}>
        <SettingButton
          title="개인정보 처리방침"
          url={PRIVACY_POLICY_URL}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#232323',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#cccccc',
    fontSize: 42,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 80,
  },
  label: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#cccccc',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    fontFamily: 'Pretendard-Medium',
    fontSize: 16,
    padding: 12,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#3e3e3e',
    color: '#e8e8e8',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ff390d',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    height: 50,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#ffffff',
    fontSize: 17,
  },
  currentUsername: {
    fontFamily: 'San Francisco',
    color: '#555555',
    fontSize: 14,
  },
});