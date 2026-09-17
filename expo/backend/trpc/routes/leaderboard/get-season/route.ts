import { publicProcedure } from "@/backend/trpc/create-context";
import { picksStore } from "@/backend/trpc/routes/picks/submit-picks/route";
import { fetchNFLWeekSchedule } from "@/services/sportsdb";

const FAMILY_MEMBERS = [
  { id: "1", name: "Grandma", emoji: "👵" },
  { id: "2", name: "Dave", emoji: "👨" },
  { id: "3", name: "Grandpa", emoji: "👴" },
  { id: "4", name: "John", emoji: "👨" },
  { id: "5", name: "Nena", emoji: "👩" },
  { id: "6", name: "Zaky", emoji: "🧑" },
  { id: "7", name: "Robert", emoji: "🧑" },
  { id: "8", name: "Rd", emoji: "🧑" },
  { id: "9", name: "Dakota", emoji: "🧑" },
  { id: "10", name: "Harley", emoji: "🧑" },
];

export const getSeasonRoute = publicProcedure.query(async () => {
  const MAX_WEEKS = 18;
  
  const seasonStats = await Promise.all(
    FAMILY_MEMBERS.map(async (member) => {
      let totalWins = 0;
      let totalGames = 0;

      for (let week = 1; week <= MAX_WEEKS; week++) {
        try {
          const games = await fetchNFLWeekSchedule(week, "2026");
          const pickKey = `${member.id}_${week}`;
          const userPicks = picksStore.get(pickKey);

          if (userPicks && userPicks.picks) {
            games.forEach((game: any) => {
              if (game.winner) {
                totalGames++;
                const pick = userPicks.picks[game.id];
                if (pick && pick === game.winner) {
                  totalWins++;
                }
              }
            });
          }
        } catch (error) {
          console.log(`Error fetching week ${week} for ${member.name}:`, error);
        }
      }

      const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

      return {
        uid: member.id,
        name: member.name,
        emoji: member.emoji,
        totalWins,
        totalGames,
        winRate,
      };
    })
  );

  seasonStats.sort((a, b) => {
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins;
    }
    return b.winRate - a.winRate;
  });

  return seasonStats;
});

export default getSeasonRoute;
