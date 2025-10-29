import { publicProcedure } from "@/backend/trpc/create-context";

const FAMILY_MEMBERS = [
  { id: "1", name: "Grandma", emoji: "👵" },
  { id: "2", name: "Dave", emoji: "👨" },
  { id: "3", name: "Grandpa", emoji: "👴" },
  { id: "4", name: "John", emoji: "👨" },
  { id: "5", name: "Nena", emoji: "👩" },
  { id: "6", name: "Zaky", emoji: "🧑" },
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
