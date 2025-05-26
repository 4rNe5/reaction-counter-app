import React, { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from "react-native";
import PocketBase from 'pocketbase';
import { API_URL } from "../api";
import { useFocusEffect } from '@react-navigation/native';

interface RankingItem {
  id: string;
  userName: string;
  reactionMs: number;
  created: string;
}

const RankingView: React.FC = () => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // PocketBase 인스턴스를 useMemo로 메모이제이션
  const pb = useMemo(() => new PocketBase(API_URL), []);

  const fetchRanking = useCallback(async (): Promise<void> => {
    try {
      const result = await pb.collection('reaction_records').getFullList<RankingItem>({
        sort: 'reactionMs',
      });
      setRanking(result);
    } catch (error) {
      console.error("Failed to fetch ranking:", error);
      setRanking([]);
    }
  }, [pb]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await fetchRanking();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRanking]);


  useFocusEffect(
    useCallback(() => {
      fetchRanking();
    }, [fetchRanking])
  );

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\./g, '.').replace(',', '');
  }, []);

  const renderRankingItem = useCallback(
    ({ item, index }: { item: RankingItem; index: number }) => {
      const isTopThree = index < 3;

      return (
        <View style={[styles.itemContainer, isTopThree && styles.topThree]}>
          <View style={styles.leftContent}>
            <Text style={[styles.rank, isTopThree && styles.topThreeText]}>
              {index + 1}
            </Text>
            <Text style={[styles.username, isTopThree && styles.topThreeText]}>
              {item.userName}
            </Text>
          </View>
          <View style={styles.rightContent}>
            <Text style={[styles.reactionTime, isTopThree && styles.topThreeText]}>
              {item.reactionMs} ms
            </Text>
            <Text style={styles.date}>
              {formatDate(item.created)}
            </Text>
          </View>
        </View>
      );
    },
    [formatDate]
  );

  const keyExtractor = useCallback(
    (item: RankingItem) => item.id,
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>반응속도 랭킹</Text>
      </View>

      <FlatList
        data={ranking}
        renderItem={renderRankingItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
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
            <Text style={styles.emptyText}>랭킹 데이터가 없습니다</Text>
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
  listContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingBottom: 150,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 7,
    backgroundColor: '#404040',
    borderRadius: 10,
  },
  topThree: {
    backgroundColor: '#4a4a4a',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#fff',
    fontFamily: 'NeoDunggeunmoPro',
  },
  username: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'NeoDunggeunmoPro',
  },
  reactionTime: {
    fontSize: 21,
    color: '#fff',
    fontFamily: 'NeoDunggeunmoPro',
  },
  date: {
    fontSize: 15,
    color: '#b8b8b8',
    marginTop: 5,
    fontFamily: 'NeoDunggeunmoPro',
  },
  topThreeText: {
    color: '#ffd700',
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

export default RankingView;