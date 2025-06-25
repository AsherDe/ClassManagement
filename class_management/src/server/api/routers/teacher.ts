import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const teacherRouter = createTRPCRouter({
  // 教师查看自己教授的课程
  getTeacherCourses: publicProcedure
    .input(z.object({
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 使用原始SQL查询，模拟v_teacher_courses视图
      const courses = await ctx.db.$queryRaw`
        SELECT 
          t.teacher_id,
          u.real_name as teacher_name,
          c.course_code,
          c.course_name,
          cl.class_name,
          cl.semester,
          cl.current_students,
          cl.max_students,
          cl.class_time,
          cl.classroom,
          cl.class_id
        FROM teachers t
        JOIN users u ON t.user_id = u.user_id
        JOIN classes cl ON t.teacher_id = cl.teacher_id
        JOIN courses c ON cl.course_id = c.course_id
        WHERE t.teacher_id = ${input.teacherId}
        ORDER BY c.course_code
      `;

      return courses;
    }),

  // 教师查看课程班级的学生
  getClassStudents: publicProcedure
    .input(z.object({
      classId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const students = await ctx.db.$queryRaw`
        SELECT 
          s.student_id,
          u.real_name,
          m.major_name,
          s.grade,
          s.class_number,
          s.gpa,
          e.enrolled_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN majors m ON s.major_id = m.major_id
        WHERE e.class_id = ${input.classId}
        ORDER BY s.student_id
      `;

      return students;
    }),

  // 教师查询班级成绩
  getClassGrades: publicProcedure
    .input(z.object({
      classId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const grades = await ctx.db.$queryRaw`
        SELECT 
          g.student_id,
          u.real_name as student_name,
          c.course_name,
          g.regular_score,
          g.midterm_score,
          g.final_score,
          g.total_score,
          g.letter_grade,
          g.gpa_points,
          g.grade_id
        FROM grades g
        JOIN students s ON g.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        JOIN classes cl ON g.class_id = cl.class_id
        JOIN courses c ON cl.course_id = c.course_id
        WHERE g.class_id = ${input.classId}
        ORDER BY g.total_score DESC
      `;

      return grades;
    }),

  // 教师录入或更新成绩
  upsertGrade: publicProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.number(),
      regularScore: z.number().min(0).max(100).optional(),
      midtermScore: z.number().min(0).max(100).optional(),
      finalScore: z.number().min(0).max(100).optional(),
      recordedBy: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 先检查是否已存在该学生的成绩记录
      const existingGrade = await ctx.db.grades.findUnique({
        where: {
          student_id_class_id: {
            student_id: input.studentId,
            class_id: input.classId,
          }
        }
      });

      if (existingGrade) {
        // 更新现有成绩
        return await ctx.db.grades.update({
          where: {
            student_id_class_id: {
              student_id: input.studentId,
              class_id: input.classId,
            }
          },
          data: {
            regular_score: input.regularScore,
            midterm_score: input.midtermScore,
            final_score: input.finalScore,
            recorded_by: input.recordedBy,
            recorded_at: new Date(),
          },
        });
      } else {
        // 创建新成绩记录
        return await ctx.db.grades.create({
          data: {
            student_id: input.studentId,
            class_id: input.classId,
            regular_score: input.regularScore,
            midterm_score: input.midtermScore,
            final_score: input.finalScore,
            recorded_by: input.recordedBy,
          },
        });
      }
    }),

  // 教师工作量统计
  getTeacherWorkload: publicProcedure
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

      return workload;
    }),

  // 课程成绩分析
  getCourseGradeAnalysis: publicProcedure
    .input(z.object({
      teacherId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let whereClause = "";
      let sqlWhereClause = "";
      if (input?.teacherId) {
        whereClause = `WHERE cl.teacher_id = '${input.teacherId}'`;
        sqlWhereClause = `WHERE cl.teacher_id = '${input.teacherId}'`;
      }

      const analysis = await ctx.db.$queryRaw`
        SELECT 
          c.course_name,
          COUNT(g.grade_id) as student_count,
          ROUND(AVG(g.total_score), 2) as avg_score,
          ROUND(MIN(g.total_score), 2) as min_score,
          ROUND(MAX(g.total_score), 2) as max_score,
          COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as excellent_count,
          COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count,
          ROUND(
            COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) * 100.0 / COUNT(g.grade_id), 
            1
          ) as excellent_rate
        FROM courses c
        JOIN classes cl ON c.course_id = cl.course_id
        JOIN grades g ON cl.class_id = g.class_id
        ${whereClause ? `WHERE cl.teacher_id = ${input.teacherId}` : ''}
        GROUP BY c.course_id, c.course_name
        ORDER BY avg_score DESC
      `;

      return {
        data: analysis,
        sql: `SELECT 
    c.course_name,
    COUNT(g.grade_id) as student_count,
    ROUND(AVG(g.total_score), 2) as avg_score,
    ROUND(MIN(g.total_score), 2) as min_score,
    ROUND(MAX(g.total_score), 2) as max_score,
    COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as excellent_count,
    COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count,
    ROUND(
        COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) * 100.0 / COUNT(g.grade_id), 
        1
    ) as excellent_rate
FROM courses c
JOIN classes cl ON c.course_id = cl.course_id
JOIN grades g ON cl.class_id = g.class_id${sqlWhereClause ? '\n' + sqlWhereClause : ''}
GROUP BY c.course_id, c.course_name
ORDER BY avg_score DESC;`
      };
    }),

  // 各专业学生平均GPA排名（复杂查询）
  getMajorGpaRanking: publicProcedure
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

      return {
        data: ranking,
        sql: `SELECT 
    m.major_name,
    COUNT(s.student_id) as student_count,
    ROUND(AVG(s.gpa), 2) as avg_gpa,
    ROUND(AVG(s.total_credits), 1) as avg_credits,
    ROW_NUMBER() OVER (ORDER BY AVG(s.gpa) DESC) as ranking
FROM majors m
LEFT JOIN students s ON m.major_id = s.major_id
GROUP BY m.major_id, m.major_name
ORDER BY avg_gpa DESC;`
      };
    }),
});