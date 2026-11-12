import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { fetchWeekGames } from "@/services/espnClient";
import { assertWeeklyPicksOpen } from "@/utils/weeklyPickDeadline";

export const picksStore = new Map<string, any>();

export const submitPicksRoute = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      week: z.number().int().min(1).max(18),
      picks: z.record(z.string(), z.enum(["home", "away"])),
    })
  )
  .mutation(async ({ input }) => {
    const key = `${input.userId}_${input.week}`;
    const rejectDuplicate = () => {
      if (picksStore.has(key)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "These weekly picks have already been submitted and cannot be changed." });
      }
    };
    rejectDuplicate();
    const games = await fetchWeekGames(input.week);
    try {
      assertWeeklyPicksOpen(games, input.picks);
    } catch (error) {
      throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Weekly picks are closed." });
    }
    // No await between this check and the write: concurrent requests cannot overwrite.
    rejectDuplicate();
    const data = {
      week: input.week,
      picks: input.picks,
      timestamp: new Date().toISOString(),
      locked: true,
    };
    
    picksStore.set(key, data);
    
    console.log("Picks submitted:", key, data);
    
    return { success: true, data };
  });

export default submitPicksRoute;
