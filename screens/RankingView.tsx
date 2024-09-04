import React, { useCallback, useState } from 'react';
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

export default function RankingView() {
  const pb = new PocketBase(API_URL);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    try {
      const result = await pb.collection('reaction_records').getFullList({
        sort: 'reactionMs',
      });
      // @ts-ignore
      setRanking(result);
    } catch (error) {
      console.error("Failed to fetch ranking:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRanking();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRanking().then(() => setRefreshing(false));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours()); // Convert to Korean time
    return date.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\./g, '.').replace(',', '');
  };

  const renderItem = ({ item, index }: { item: RankingItem; index: number }) => (
    <View style={[styles.itemContainer, index < 3 && styles.topThree]}>
      <View style={styles.leftContent}>
        <Text style={[styles.rank, index < 3 && styles.topThreeText]}>{index + 1}</Text>
        <Text style={[styles.username, index < 3 && styles.topThreeText]}>{item.userName}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.reactionTime, index < 3 && styles.topThreeText]}>{item.reactionMs} ms</Text>
        <Text style={styles.date}>{formatDate(item.created)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleFont}>반응속도 랭킹</Text>
      </View>
      <FlatList
        data={ranking}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
    padding: 10,
  },
  titleFont: {
    fontFamily: 'NeoDunggeunmoPro',
    color: '#d3d3d3',
    fontSize: 38,
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 110,
  },
  msText: {
    fontSize: 24,
    color: '#ffffff',
  },
  titleContainer: {
    marginRight: 'auto',
    marginLeft: 15, // MyRecordView와 동일하게 수정
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
});