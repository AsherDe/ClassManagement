import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const courseRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      courseType: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.courseType) where.course_type = input.courseType;

      return await ctx.db.courses.findMany({
        where,
        include: {
          classes: {
            include: {
              teacher: {
                include: {
                  user: true,
                }
              }
            }
          }
        },
        orderBy: { course_name: "asc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.courses.findUnique({
        where: { course_id: input.id },
        include: {
          classes: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      username: true,
                    }
                  }
                }
              }
            }
          }
        }
      });
    }),

  create: publicProcedure
    .input(z.object({
      course_code: z.string().min(1),
      course_name: z.string().min(1),
      credits: z.number().min(0),
      course_type: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.courses.create({
        data: {
          course_code: input.course_code,
          course_name: input.course_name,
          credits: input.credits,
          course_type: input.course_type,
          description: input.description,
        }
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      course_name: z.string().min(1).optional(),
      credits: z.number().min(0).optional(),
      course_type: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      return await ctx.db.courses.update({
        where: { course_id: id },
        data: updateData
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.courses.delete({
        where: { course_id: input.id }
      });
    }),
});