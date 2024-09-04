import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import SettingButton from "../components/SettingButton";
import { BAD_WORD_LIST } from "../BAD_WORD_LIST";

// 닉네임이 적절한지 검사하는 함수
const isAppropriateUsername = (username: string) => {
  const lowercaseUsername = username.toLowerCase();
  return !BAD_WORD_LIST.some(word => lowercaseUsername.includes(word));
};

export default function RankingView() {
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('@userName');
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

  const handleSaveUsername = async () => {
    if (newUsername.trim().length === 0) {
      Alert.alert('오류', '유저명을 입력해주세요.');
      return;
    }

    if (!isAppropriateUsername(newUsername)) {
      Alert.alert('부적절한 유저명', '부적절한 단어가 포함되어 있습니다. 다른 유저명을 선택해주세요.');
      return;
    }

    try {
      await AsyncStorage.setItem('@userName', newUsername);
      setUsername(newUsername);
      Alert.alert('성공!', '유저 닉네임이 정상적으로 저장되었어요!!');
    } catch (error) {
      console.error('유저 닉네임 변경 실패 : ', error);
      Alert.alert('실패..', '유저 닉네임의 저장에 실패하였어요..');
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>유저 & 설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}> 사용자명 설정 </Text>
        <TextInput
          style={styles.input}
          value={newUsername}
          onChangeText={setNewUsername}
          placeholder="새로운 유저명을 입력해주세요."
          placeholderTextColor="#8e8e8e"
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveUsername}>
          <Text style={styles.buttonText}>저장하기</Text>
        </TouchableOpacity>
        <Text style={styles.currentUsername}>현재 유저명 : {username}</Text>
      </View>

      <View style={styles.section}>
        <SettingButton title={'개인정보 처리방침'} url={'https://4-rne5.notion.site/Action-1fbcffa1aad84bbea8820ded398f51d3?pvs=4'} />
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
  option: {
    backgroundColor: '#3e3e3e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Pretendard-Medium',
    color: '#d83e1b',
    fontSize: 17,
    marginLeft: 10,
  },
});
