import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const activityRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      classId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Return empty array since activities table doesn't exist in new schema
      return [];
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return null;
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      classId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Placeholder - return dummy data
      return {
        id: 1,
        title: input.title,
        description: input.description,
        classId: input.classId,
      };
    }),
});