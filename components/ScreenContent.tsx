import { StyleSheet, Text, View } from 'react-native';

import EditScreenInfo from './EditScreenInfo';

export const ScreenContent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>로딩중입니다...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#404040',
  },
  separator: {
    backgroundColor: '#d1d5db',
    height: 1,
    marginVertical: 30,
    width: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
