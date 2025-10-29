import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { getNFLGames, getCurrentNFLWeek } from "@/services/sportsdb";

interface NFLGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  winner: "home" | "away" | null;
}

export default function NFLScheduleTest() {
  const [games, setGames] = useState<NFLGame[]>([]);
  const [week] = useState(getCurrentNFLWeek());

  useEffect(() => {
    async function load() {
      const result = await getNFLGames(week);
      console.log("🏈 NFL Week", week, "Games:", result);
      setGames(result);
    }
    load();
  }, [week]);

  return (
    <ScrollView style={{ flex: 1, padding: 20, paddingTop: 60 }} contentInsetAdjustmentBehavior="automatic">
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        NFL Week {week} Schedule
      </Text>

      {games.length === 0 && <Text>Loading games...</Text>}

      {games.map((g) => (
        <View
          key={g.id}
          style={{
            marginVertical: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>
            {g.awayTeam} @ {g.homeTeam}
          </Text>
          <Text>{g.kickoff}</Text>
          {g.winner && (
            <Text style={{ color: "green" }}>
              Winner: {g.winner === "home" ? g.homeTeam : g.awayTeam}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
