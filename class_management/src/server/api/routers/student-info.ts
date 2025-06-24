import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const studentInfoRouter = createTRPCRouter({
  // 学生查看个人信息
  getStudentInfo: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const studentInfo = await ctx.db.$queryRaw`
        SELECT 
          s.student_id,
          u.real_name,
          u.email,
          u.phone,
          m.major_name,
          s.grade,
          s.class_number,
          s.gpa,
          s.total_credits,
          s.status
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN majors m ON s.major_id = m.major_id
        WHERE s.student_id = ${input.studentId}
      `;

      return (studentInfo as any)[0] || null;
    }),

  // 学生查看自己的课程信息
  getStudentCourses: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const courses = await ctx.db.$queryRaw`
        SELECT 
          c.course_code,
          c.course_name,
          c.credits,
          c.course_type,
          cl.class_name,
          cl.semester,
          cl.class_time,
          cl.classroom,
          u.real_name as teacher_name,
          e.enrolled_at
        FROM enrollments e
        JOIN classes cl ON e.class_id = cl.class_id
        JOIN courses c ON cl.course_id = c.course_id
        LEFT JOIN teachers t ON cl.teacher_id = t.teacher_id
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE e.student_id = ${input.studentId}
        ORDER BY c.course_code
      `;

      return courses as any;
    }),

  // 学生查询个人成绩
  getStudentGrades: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const grades = await ctx.db.$queryRaw`
        SELECT 
          c.course_code,
          c.course_name,
          c.credits,
          cl.semester,
          g.regular_score,
          g.midterm_score,
          g.final_score,
          g.total_score,
          g.letter_grade,
          g.gpa_points
        FROM grades g
        JOIN classes cl ON g.class_id = cl.class_id
        JOIN courses c ON cl.course_id = c.course_id
        WHERE g.student_id = ${input.studentId}
        ORDER BY cl.semester, c.course_code
      `;

      return grades as any;
    }),

  // 学生GPA统计
  getStudentGPAStats: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.$queryRaw`
        SELECT 
          s.student_id,
          u.real_name,
          m.major_name,
          s.gpa,
          s.total_credits,
          CASE 
            WHEN s.gpa >= 3.70 THEN '优秀'
            WHEN s.gpa >= 3.00 THEN '良好'
            WHEN s.gpa >= 2.30 THEN '中等'
            WHEN s.gpa >= 2.00 THEN '及格'
            ELSE '不及格'
          END as gpa_level
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN majors m ON s.major_id = m.major_id
        WHERE s.student_id = ${input.studentId}
      `;

      return (stats as any)[0] || null;
    }),

  // 获取所有学生GPA排名
  getAllStudentsGPARanking: publicProcedure
    .query(async ({ ctx }) => {
      const ranking = await ctx.db.$queryRaw`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY s.gpa DESC) as ranking,
          s.student_id,
          u.real_name,
          m.major_name,
          s.gpa,
          s.total_credits,
          CASE 
            WHEN s.gpa >= 3.70 THEN '优秀'
            WHEN s.gpa >= 3.00 THEN '良好'
            WHEN s.gpa >= 2.30 THEN '中等'
            WHEN s.gpa >= 2.00 THEN '及格'
            ELSE '不及格'
          END as gpa_level
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN majors m ON s.major_id = m.major_id
        ORDER BY s.gpa DESC, s.total_credits DESC
      `;

      return ranking as any;
    }),

  // 各专业学生平均GPA排名
  getMajorGPARanking: publicProcedure
    .query(async ({ ctx }) => {
      const ranking = await ctx.db.$queryRaw`
        SELECT 
          m.major_name,
          COUNT(s.student_id) as student_count,
          ROUND(AVG(s.gpa), 2) as avg_gpa,
          ROUND(AVG(s.total_credits), 1) as avg_credits,
          ROW_NUMBER() OVER (ORDER BY AVG(s.gpa) DESC) as ranking
        FROM majors m
        LEFT JOIN students s ON m.major_id = s.major_id
        GROUP BY m.major_id, m.major_name
        ORDER BY avg_gpa DESC
      `;

      return ranking as any;
    }),

  // 学生同班同学信息
  getClassmates: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 首先获取该学生的基本信息
      const currentStudent = await ctx.db.students.findUnique({
        where: { student_id: input.studentId },
        select: { grade: true, class_number: true, major_id: true }
      });

      if (!currentStudent) {
        return [];
      }

      // 查找同年级同班的学生
      const classmates = await ctx.db.students.findMany({
        where: {
          grade: currentStudent.grade,
          class_number: currentStudent.class_number,
          major_id: currentStudent.major_id,
          student_id: {
            not: input.studentId // 排除自己
          }
        },
        include: {
          user: {
            select: {
              real_name: true,
              username: true,
              phone: true,
              email: true,
            }
          },
          major: {
            select: {
              major_name: true,
            }
          }
        },
        orderBy: {
          student_id: 'asc'
        }
      });

      return classmates as any;
    }),
});