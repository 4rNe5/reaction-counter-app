import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface ReactionResult {
  time: number;
  date: string;
}

const STORAGE_KEY = '@reaction_results';

export default function MyRecordView() {
  const [results, setResults] = useState<ReactionResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadResults = async () => {
    try {
      const resultsString = await AsyncStorage.getItem(STORAGE_KEY);
      if (resultsString) {
        setResults(JSON.parse(resultsString));
      }
    } catch (error) {
      console.error('Failed to load results', error);
    }
  };

  // Use useFocusEffect to reload the data whenever the view is focused
  useFocusEffect(
    React.useCallback(() => {
      loadResults();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadResults().then(() => setRefreshing(false));
  }, []);

  const renderItem = ({ item }: { item: ReactionResult }) => (
    <View style={styles.resultItem}>
      <Text style={styles.resultItemTime}>{<Text style={styles.msText}>{item.time}</Text>} ms</Text>
      <Text style={styles.resultItemDate}>{new Date(item.date).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleFont}>내 측정기록 보기</Text>
      </View>
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.date}
        style={styles.resultList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232323',
    padding: 20,
  },
  titleFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 38,
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 100,
  },
  msText: {
    fontSize: 24,
    color: '#ffffff',
  },
  titleContainer: {
    marginRight: 'auto',
    marginLeft: 5,
  },
  resultList: {
    width: '100%',
    paddingVertical: 10,
    marginBottom: 90,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
    padding: 15,
    backgroundColor: '#404040',
    borderRadius: 10,
  },
  resultItemTime: {
    fontSize: 18,
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
  },
  resultItemDate: {
    fontSize: 15,
    fontFamily: 'NeoDunggeunmoPro',
    color: '#b8b8b8',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#c34023',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro',
  },
});
