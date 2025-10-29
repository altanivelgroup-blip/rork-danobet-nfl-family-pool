import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { fetchNFLWeekSchedule } from "@/services/sportsdb";

const FAMILY_MEMBERS = [
  { id: "1", name: "Grandma", emoji: "👵" },
  { id: "2", name: "Dave", emoji: "👨" },
  { id: "3", name: "Grandpa", emoji: "👴" },
  { id: "4", name: "John", emoji: "👨" },
  { id: "5", name: "Nena", emoji: "👩" },
  { id: "6", name: "Zaky", emoji: "🧑" },
];

const picksStore = new Map<string, any>();

export const getLeaderboardRoute = publicProcedure
  .input(
    z.object({
      week: z.number(),
    })
  )
  .query(async ({ input }) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const tuesday = 2;
    const isAfterTuesday = dayOfWeek >= tuesday;
    
    const isUnlocked = isAfterTuesday;

    if (!isUnlocked) {
      return {
        unlocked: false,
        data: [],
      };
    }

    const games = await fetchNFLWeekSchedule(input.week, "2025-2026");
    
    const leaderboard = FAMILY_MEMBERS.map((member) => {
      const pickKey = `${member.id}_${input.week}`;
      const userPicks = picksStore.get(pickKey);
      
      let points = 0;
      
      if (userPicks && userPicks.picks) {
        games.forEach((game: any) => {
          const pick = userPicks.picks[game.id];
          if (pick && game.winner && pick === game.winner) {
            points++;
          }
        });
      }
      
      return {
        uid: member.id,
        name: member.name,
        points,
      };
    });

    leaderboard.sort((a, b) => b.points - a.points);
    
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return {
      unlocked: true,
      data: rankedLeaderboard,
    };
  });

export default getLeaderboardRoute;
