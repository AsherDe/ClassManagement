import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ 
      username: z.string(),
      password: z.string() 
    }))
    .mutation(async ({ input, ctx }) => {
      // 先根据用户名查找用户
      const user = await ctx.db.users.findFirst({
        where: { 
          username: input.username
        },
        include: {
          teachers: true,
          students: {
            include: { 
              major: true 
            }
          }
        }
      });

      if (!user) {
        throw new Error("用户名或密码错误");
      }

      // 验证密码 - 直接比较明文密码（在生产环境中应该使用哈希）
      if (user.password !== input.password) {
        throw new Error("用户名或密码错误");
      }

      // 确定用户类型和对应的profile
      let profile = null;
      if (user.user_type === "teacher" && user.teachers) {
        profile = user.teachers;
      } else if (user.user_type === "student" && user.students) {
        profile = user.students;
      }

      return {
        id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.user_type,
        realName: user.real_name,
        profile: profile
      };
    }),

  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.users.findUnique({
        where: { user_id: input.userId },
        include: {
          teachers: true,
          students: {
            include: { major: true }
          }
        }
      });
    }),
});