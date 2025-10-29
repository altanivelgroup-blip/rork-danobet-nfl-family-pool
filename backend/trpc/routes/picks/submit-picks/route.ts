import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export const picksStore = new Map<string, any>();

export const submitPicksRoute = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      week: z.number(),
      picks: z.record(z.string(), z.enum(["home", "away"])),
    })
  )
  .mutation(({ input }) => {
    const key = `${input.userId}_${input.week}`;
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
