import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface ReactionResult {
  time: number;
  date: string;
}

const STORAGE_KEY = '@reaction_results';

const MyRecordView: React.FC = () => {
  const [results, setResults] = useState<ReactionResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadResults = useCallback(async (): Promise<void> => {
    try {
      const resultsString = await AsyncStorage.getItem(STORAGE_KEY);
      setResults(resultsString ? JSON.parse(resultsString) : []);
    } catch (error) {
      console.error('Failed to load results:', error);
      setResults([]);
    }
  }, []);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await loadResults();
    } finally {
      setRefreshing(false);
    }
  }, [loadResults]);

  // 화면이 포커스될 때마다 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadResults();
    }, [loadResults])
  );

  const renderResultItem = useCallback(
    ({ item }: { item: ReactionResult }) => (
      <View style={styles.resultItem}>
        <Text style={styles.resultItemTime}>
          <Text style={styles.msText}>{item.time}</Text> ms
        </Text>
        <Text style={styles.resultItemDate}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: ReactionResult, index: number) => `${item.date}-${index}`,
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>내 측정기록 보기</Text>
      </View>

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={keyExtractor}
        style={styles.resultList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#d3d3d3"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>측정 기록이 없습니다</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232323',
    padding: 20,
  },
  titleContainer: {
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginTop: 100,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 38,
    textAlign: 'center',
  },
  resultList: {
    flex: 1,
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
  msText: {
    fontSize: 24,
    color: '#ffffff',
  },
  resultItemDate: {
    fontSize: 15,
    fontFamily: 'NeoDunggeunmoPro',
    color: '#b8b8b8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#b8b8b8',
    fontSize: 18,
  },
});

export default MyRecordView;