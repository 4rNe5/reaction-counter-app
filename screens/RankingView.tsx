import React, { useCallback } from 'react';
import { StyleSheet, View, Text, FlatList } from "react-native";
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
  const [ranking, setRanking] = React.useState<RankingItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchRanking = async () => {
        try {
          const result = await pb.collection('reaction_records').getFullList({
            sort: 'reactionMs',
          });
          setRanking(result);
        } catch (error) {
          console.error("Failed to fetch ranking:", error);
        }
      };

      fetchRanking();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 9); // Convert to Korean time
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
      <FlatList
        data={ranking}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232323',
    paddingTop: 80,
  },
  listContainer: {
    padding: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  topThree: {
    backgroundColor: '#4a4a4a',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#fff',
  },
  username: {
    fontSize: 16,
    color: '#fff',
  },
  reactionTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 5,
  },
  topThreeText: {
    color: '#ffd700',
  },
});