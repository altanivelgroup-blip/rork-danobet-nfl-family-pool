import { publicProcedure } from "@/backend/trpc/create-context";

const FAMILY_MEMBERS = [
  { id: "1", name: "You", emoji: "👤" },
  { id: "2", name: "Grandma", emoji: "👵" },
  { id: "3", name: "Uncle Mike", emoji: "👨" },
  { id: "4", name: "Aunt Sarah", emoji: "👩" },
  { id: "5", name: "Cousin Jake", emoji: "🧑" },
];

export const getSeasonRoute = publicProcedure.query(() => {
  const seasonStats = FAMILY_MEMBERS.map((member, index) => {
    const totalWins = 35 - index * 7;
    const totalGames = 50;
    const winRate = Math.round((totalWins / totalGames) * 100);

    return {
      uid: member.id,
      name: member.name,
      emoji: member.emoji,
      totalWins,
      totalGames,
      winRate,
    };
  });

  return seasonStats.sort((a, b) => b.totalWins - a.totalWins);
});

export default getSeasonRoute;
