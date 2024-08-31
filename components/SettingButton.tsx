import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Linking, StyleSheet, Text, TouchableOpacity } from "react-native";
import React from "react";

type SettingButtonProps = {
  title: string;
  url: string;
};

export default function SettingButton({ title, url }: SettingButtonProps) {

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <TouchableOpacity style={styles.option} onPress={() => handleOpenLink(url)}>
      <FontAwesome6 size={24} name="fire-flame-simple" color={'#d83e1b'} />
      <Text style={styles.optionText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    color: '#ea411b',
    fontSize: 17,
    marginLeft: 10,
  },
});