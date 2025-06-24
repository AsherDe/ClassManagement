import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      userType: z.enum(["admin", "teacher", "student"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.userType) where.user_type = input.userType;

      return await ctx.db.users.findMany({
        where,
        include: {
          students: {
            include: {
              major: true,
            }
          },
          teachers: true,
        },
        orderBy: { created_at: "desc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.users.findUnique({
        where: { user_id: input.id },
        include: {
          students: {
            include: {
              major: true,
              enrollments: {
                include: {
                  class: {
                    include: {
                      course: true,
                      teacher: {
                        include: {
                          user: true,
                        }
                      },
                    }
                  }
                }
              },
              grades: {
                include: {
                  class: {
                    include: {
                      course: true,
                    }
                  }
                }
              }
            }
          },
          teachers: {
            include: {
              classes: {
                include: {
                  course: true,
                }
              }
            }
          }
        }
      });
    }),

  create: publicProcedure
    .input(z.object({
      username: z.string().min(1).max(50),
      password: z.string().min(6).max(100).default("shzu123456"),
      userType: z.enum(["admin", "teacher", "student"]),
      realName: z.string().min(1).max(50),
      email: z.string().email().max(100).optional(),
      phone: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.users.create({
        data: {
          username: input.username,
          password: input.password,
          user_type: input.userType,
          real_name: input.realName,
          email: input.email,
          phone: input.phone,
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      username: z.string().min(1).max(50).optional(),
      password: z.string().min(6).max(100).optional(),
      userType: z.enum(["admin", "teacher", "student"]).optional(),
      realName: z.string().min(1).max(50).optional(),
      email: z.string().email().max(100).optional(),
      phone: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      return await ctx.db.users.update({
        where: { user_id: id },
        data: {
          ...updateData,
          user_type: updateData.userType,
          real_name: updateData.realName,
          updated_at: new Date(),
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.users.delete({
        where: { user_id: input.id }
      });
    }),

  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.users.findUnique({
        where: { username: input.username },
        include: {
          students: true,
          teachers: true,
        }
      });

      if (!user || user.password !== input.password) {
        throw new Error("Invalid username or password");
      }

      return {
        user_id: user.user_id,
        username: user.username,
        user_type: user.user_type,
        real_name: user.real_name,
        email: user.email,
        phone: user.phone,
        student: user.students,
        teacher: user.teachers,
      };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      id: z.number(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.users.update({
        where: { user_id: input.id },
        data: {
          password: input.newPassword,
          updated_at: new Date(),
        },
      });
    }),
});