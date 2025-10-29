import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const mockLeaderboard = [
  { rank: 1, name: "Grandma Rose", points: 7, uid: "user1" },
  { rank: 2, name: "Uncle Mike", points: 6, uid: "user2" },
  { rank: 3, name: "Cousin Sarah", points: 6, uid: "user3" },
  { rank: 4, name: "Dad", points: 5, uid: "user4" },
  { rank: 5, name: "Mom", points: 5, uid: "user5" },
];

export const getLeaderboardRoute = publicProcedure
  .input(
    z.object({
      week: z.number(),
    })
  )
  .query(({ input }) => {
    const now = new Date();
    const tuesday = new Date();
    tuesday.setDate(tuesday.getDate() + ((9 - tuesday.getDay()) % 7));
    tuesday.setHours(9, 0, 0, 0);

    const isUnlocked = now >= tuesday;

    return {
      unlocked: isUnlocked,
      data: isUnlocked ? mockLeaderboard : [],
    };
  });

export default getLeaderboardRoute;
