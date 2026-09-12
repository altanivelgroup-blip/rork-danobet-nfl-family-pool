import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { fetchNFLWeekSchedule } from "@/services/sportsdb";

export const getGamesRoute = publicProcedure
  .input(
    z.object({
      week: z.number(),
    })
  )
  .query(async ({ input }) => {
    console.log(`🏈 Fetching games for week ${input.week}`);
    const games = await fetchNFLWeekSchedule(input.week, "2026");
    return games;
  });

export default getGamesRoute;
