import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReactionResult {
  time: number;
  date: string;
}

const STORAGE_KEY = '@reaction_results';

interface ResultListViewProps {
  onBack: () => void;
}

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

  useEffect(() => {
    loadResults();
  }, []);

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
      <Text style={styles.titleFont}>내 기록보기</Text>
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
    fontSize: 42,
    marginBottom: 30,
    textAlign: 'center',
    marginTop: 100,
  },

  msText: {
    fontSize: 22,
  },

  resultList: {
    width: '100%',
    paddingVertical: 10,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
    padding: 15,
    backgroundColor: '#404040',
    borderRadius: 8,
  },
  resultItemTime: {
    fontSize: 17,
    fontFamily: 'NeoDunggeunmoPro',
    color: '#ffffff',
  },
  resultItemDate: {
    fontSize: 14,
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