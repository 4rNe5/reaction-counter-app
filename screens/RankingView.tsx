import PocketBase from 'pocketbase';
import { StyleSheet, View } from "react-native";
import { API_URL } from "../api";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';

export default function RankingView() {

  const pb = new PocketBase(API_URL);
  const [ranking, setRanking] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchRanking = async () => {
        try {
          const ranking = await pb.collection('reaction_records').getFullList({
            sort: '-reactionMs',
          }).then((res) => {
            console.log(res);
            // @ts-ignore
            setRanking(res);
          });
        } catch (error) {
          console.error("Failed to fetch ranking:", error);
        }
      };

      fetchRanking();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Render your ranking data here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#232323',
  },
});
