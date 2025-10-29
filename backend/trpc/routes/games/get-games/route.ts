import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const mockGames = [
  { id: "g1", homeTeam: "Miami Dolphins", awayTeam: "Buffalo Bills", kickoff: "2025-11-02T13:00:00Z" },
  { id: "g2", homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders", kickoff: "2025-11-02T13:00:00Z" },
  { id: "g3", homeTeam: "Green Bay Packers", awayTeam: "Detroit Lions", kickoff: "2025-11-02T16:25:00Z" },
  { id: "g4", homeTeam: "Dallas Cowboys", awayTeam: "Philadelphia Eagles", kickoff: "2025-11-02T16:25:00Z" },
  { id: "g5", homeTeam: "San Francisco 49ers", awayTeam: "Seattle Seahawks", kickoff: "2025-11-02T20:20:00Z" },
  { id: "g6", homeTeam: "New England Patriots", awayTeam: "New York Jets", kickoff: "2025-11-03T13:00:00Z" },
  { id: "g7", homeTeam: "Los Angeles Rams", awayTeam: "Arizona Cardinals", kickoff: "2025-11-03T16:05:00Z" },
  { id: "g8", homeTeam: "Baltimore Ravens", awayTeam: "Cincinnati Bengals", kickoff: "2025-11-03T20:15:00Z" },
];

export const getGamesRoute = publicProcedure
  .input(
    z.object({
      week: z.number(),
    })
  )
  .query(({ input }) => {
    return mockGames.map((game) => ({
      ...game,
      winner: null as string | null,
    }));
  });

export default getGamesRoute;
