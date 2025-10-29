import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const picksStore = new Map<string, any>();

export const getPicksRoute = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      week: z.number(),
    })
  )
  .query(({ input }) => {
    const key = `${input.userId}_${input.week}`;
    const data = picksStore.get(key);
    
    return data || null;
  });

export default getPicksRoute;
