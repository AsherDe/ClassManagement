import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Placeholder post router - not used in current schema
export const postRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async () => {
      return [];
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      author_id: z.number(),
      post_type: z.string().optional(),
      class_id: z.number().optional(),
    }))
    .mutation(async () => {
      return { id: 1, message: "Not implemented" };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async () => {
      return { message: "Not implemented" };
    }),
});