import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  // 管理员查询用户列表
  getAllUsers: publicProcedure
    .input(z.object({
      userType: z.enum(["admin", "teacher", "student"]).optional(),
      orderBy: z.enum(["user_type", "username", "created_at"]).default("user_type"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.userType) {
        where.user_type = input.userType;
      }

      const orderBy: Record<string, string> = {};
      if (input?.orderBy === "user_type") {
        orderBy.user_type = "asc";
      } else if (input?.orderBy === "username") {
        orderBy.username = "asc";
      } else {
        orderBy.created_at = "desc";
      }

      return await ctx.db.users.findMany({
        where,
        select: {
          user_id: true,
          username: true,
          user_type: true,
          real_name: true,
          email: true,
          phone: true,
          created_at: true,
          updated_at: true,
        },
        orderBy,
      });
    }),

  // 管理员重置用户密码
  resetUserPassword: publicProcedure
    .input(z.object({
      username: z.string(),
      newPassword: z.string().min(6).default("newpassword123"),
    }))
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.users.update({
        where: { username: input.username },
        data: {
          password: input.newPassword,
          updated_at: new Date(),
        },
        select: {
          username: true,
          real_name: true,
          password: true,
          updated_at: true,
        }
      });

      return {
        success: true,
        message: `用户 ${updatedUser.username} 的密码已重置`,
        user: updatedUser,
      };
    }),

  // 查看密码重置结果
  getUserByUsername: publicProcedure
    .input(z.object({
      username: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.users.findUnique({
        where: { username: input.username },
        select: {
          username: true,
          real_name: true,
          password: true,
          updated_at: true,
          user_type: true,
          email: true,
          phone: true,
        }
      });
    }),

  // 获取系统统计信息
  getSystemStats: publicProcedure
    .query(async ({ ctx }) => {
      const [userCount, studentCount, teacherCount, courseCount, classCount, gradeCount] = await Promise.all([
        ctx.db.users.count(),
        ctx.db.students.count(),
        ctx.db.teachers.count(),
        ctx.db.courses.count(),
        ctx.db.classes.count(),
        ctx.db.grades.count(),
      ]);

      const userTypeStats = await ctx.db.users.groupBy({
        by: ['user_type'],
        _count: {
          user_id: true,
        },
      });

      return {
        totalUsers: userCount,
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalCourses: courseCount,
        totalClasses: classCount,
        totalGrades: gradeCount,
        userTypeDistribution: userTypeStats.reduce((acc, stat) => {
          acc[stat.user_type] = stat._count.user_id;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  // 教师工作量统计（复杂查询）
  getTeacherWorkloadStats: publicProcedure
    .query(async ({ ctx }) => {
      const workload = await ctx.db.$queryRaw`
        SELECT 
          t.teacher_id,
          u.real_name as teacher_name,
          t.title,
          COUNT(DISTINCT cl.class_id) as class_count,
          SUM(cl.current_students) as total_students,
          SUM(c.credits) as total_credits,
          ROUND(AVG(cl.current_students), 1) as avg_class_size
        FROM teachers t
        JOIN users u ON t.user_id = u.user_id
        LEFT JOIN classes cl ON t.teacher_id = cl.teacher_id
        LEFT JOIN courses c ON cl.course_id = c.course_id
        GROUP BY t.teacher_id, u.real_name, t.title
        ORDER BY total_students DESC
      `;

      return {
        data: workload,
        sql: `SELECT 
    t.teacher_id,
    u.real_name as teacher_name,
    t.title,
    COUNT(DISTINCT cl.class_id) as class_count,
    SUM(cl.current_students) as total_students,
    SUM(c.credits) as total_credits,
    ROUND(AVG(cl.current_students), 1) as avg_class_size
FROM teachers t
JOIN users u ON t.user_id = u.user_id
LEFT JOIN classes cl ON t.teacher_id = cl.teacher_id
LEFT JOIN courses c ON cl.course_id = c.course_id
GROUP BY t.teacher_id, u.real_name, t.title
ORDER BY total_students DESC;`
      };
    }),
});