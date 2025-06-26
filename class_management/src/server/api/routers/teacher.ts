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
      // Use Prisma relations instead of raw SQL to ensure proper data structure
      const enrollments = await ctx.db.enrollments.findMany({
        where: {
          class_id: input.classId,
          status: "enrolled"
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  real_name: true,
                  email: true,
                  phone: true,
                }
              },
              major: {
                select: {
                  major_id: true,
                  major_name: true,
                  major_code: true,
                  department: true,
                }
              }
            }
          }
        },
        orderBy: {
          student: {
            student_id: "asc"
          }
        }
      });

      // Transform the data to match frontend expectations
      return enrollments.map(enrollment => ({
        student_id: enrollment.student.student_id,
        user: enrollment.student.user,
        major: enrollment.student.major,
        grade: enrollment.student.grade,
        class_number: enrollment.student.class_number,
        gpa: enrollment.student.gpa,
        total_credits: enrollment.student.total_credits,
        status: enrollment.student.status,
        enrolled_at: enrollment.enrolled_at,
        // Include additional fields for compatibility
        real_name: enrollment.student.user.real_name,
        major_name: enrollment.student.major?.major_name,
      }));
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
      let sqlWhereClause = "";
      if (input?.teacherId) {
        sqlWhereClause = `WHERE cl.teacher_id = '${input.teacherId}'`;
      }

      let analysis;
      if (input?.teacherId) {
        analysis = await ctx.db.$queryRaw`
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
          WHERE cl.teacher_id = ${input.teacherId}
          GROUP BY c.course_id, c.course_name
          ORDER BY avg_score DESC
        `;
      } else {
        analysis = await ctx.db.$queryRaw`
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
          GROUP BY c.course_id, c.course_name
          ORDER BY avg_score DESC
        `;
      }

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

  // 教师管理学生信息 - 查看详细信息
  getStudentDetail: publicProcedure
    .input(z.object({
      studentId: z.string(),
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 验证教师是否有权限查看该学生（教师必须教授该学生所在的课程）
      const teacherClassIds = await ctx.db.classes.findMany({
        where: { teacher_id: input.teacherId },
        select: { class_id: true }
      });

      const classIds = teacherClassIds.map(c => c.class_id);

      const studentEnrollment = await ctx.db.enrollments.findFirst({
        where: {
          student_id: input.studentId,
          class_id: { in: classIds },
          status: "enrolled"
        }
      });

      if (!studentEnrollment) {
        throw new Error("您没有权限查看该学生信息");
      }

      // 获取学生详细信息
      const student = await ctx.db.students.findUnique({
        where: { student_id: input.studentId },
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              real_name: true,
              email: true,
              phone: true,
              created_at: true,
            }
          },
          major: true,
          enrollments: {
            where: { status: "enrolled" },
            include: {
              class: {
                include: {
                  course: true,
                  teacher: {
                    include: {
                      user: true,
                    }
                  }
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
      });

      return student;
    }),

  // 教师更新学生信息（仅限部分字段）
  updateStudentInfo: publicProcedure
    .input(z.object({
      studentId: z.string(),
      teacherId: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限
      const teacherClassIds = await ctx.db.classes.findMany({
        where: { teacher_id: input.teacherId },
        select: { class_id: true }
      });

      const classIds = teacherClassIds.map(c => c.class_id);

      const studentEnrollment = await ctx.db.enrollments.findFirst({
        where: {
          student_id: input.studentId,
          class_id: { in: classIds },
          status: "enrolled"
        }
      });

      if (!studentEnrollment) {
        throw new Error("您没有权限修改该学生信息");
      }

      // 更新用户信息
      const updatedUser = await ctx.db.users.update({
        where: { user_id: (await ctx.db.students.findUnique({ where: { student_id: input.studentId } }))?.user_id },
        data: {
          email: input.email,
          phone: input.phone,
          updated_at: new Date(),
        },
      });

      // 更新学生状态
      if (input.status) {
        await ctx.db.students.update({
          where: { student_id: input.studentId },
          data: { status: input.status },
        });
      }

      return {
        success: true,
        message: "学生信息更新成功",
        user: updatedUser,
      };
    }),

  // 教师获取班级学生出勤统计
  getClassAttendanceStats: publicProcedure
    .input(z.object({
      classId: z.number(),
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 验证教师权限
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId, teacher_id: input.teacherId },
        include: { course: true }
      });

      if (!classInfo) {
        throw new Error("您没有权限查看该班级信息");
      }

      // 获取班级学生列表和出勤统计
      const students = await ctx.db.$queryRaw`
        SELECT 
          s.student_id,
          u.real_name as student_name,
          s.gpa,
          COUNT(CASE WHEN ap.attendance_status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN ap.attendance_status = 'absent' THEN 1 END) as absent_count,
          COUNT(ap.participant_id) as total_activities,
          ROUND(
            COUNT(CASE WHEN ap.attendance_status = 'present' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(ap.participant_id), 0), 1
          ) as attendance_rate
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN activity_participants ap ON s.student_id = ap.student_id
        LEFT JOIN class_activities ca ON ap.activity_id = ca.activity_id
        WHERE e.class_id = ${input.classId} AND e.status = 'enrolled'
        GROUP BY s.student_id, u.real_name, s.gpa
        ORDER BY u.real_name
      `;

      return {
        class: classInfo,
        students,
      };
    }),

  // 教师标记学生出勤状态
  markStudentAttendance: publicProcedure
    .input(z.object({
      activityId: z.number(),
      studentId: z.string(),
      teacherId: z.string(),
      attendanceStatus: z.enum(["present", "absent", "late", "excused"]),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限 - 检查活动是否属于教师的班级
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.activityId },
        include: {
          class: true
        }
      });

      if (!activity || activity.class.teacher_id !== input.teacherId) {
        throw new Error("您没有权限管理该活动");
      }

      // 更新或创建出勤记录
      const attendance = await ctx.db.activity_participants.upsert({
        where: {
          activity_id_student_id: {
            activity_id: input.activityId,
            student_id: input.studentId,
          }
        },
        update: {
          attendance_status: input.attendanceStatus,
          feedback: input.feedback,
        },
        create: {
          activity_id: input.activityId,
          student_id: input.studentId,
          attendance_status: input.attendanceStatus,
          feedback: input.feedback,
        },
      });

      return {
        success: true,
        message: "出勤状态更新成功",
        attendance,
      };
    }),

  // 教师获取学生学习表现分析
  getStudentPerformanceAnalysis: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      classId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause = input.classId ? 
        `WHERE cl.teacher_id = '${input.teacherId}' AND cl.class_id = ${input.classId}` :
        `WHERE cl.teacher_id = '${input.teacherId}'`;

      const analysis = await ctx.db.$queryRaw`
        SELECT 
          s.student_id,
          u.real_name as student_name,
          s.gpa as current_gpa,
          COUNT(DISTINCT g.grade_id) as course_count,
          ROUND(AVG(g.total_score), 2) as avg_score,
          ROUND(MIN(g.total_score), 2) as min_score,
          ROUND(MAX(g.total_score), 2) as max_score,
          COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as excellent_count,
          COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count,
          ROUND(
            COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) * 100.0 / 
            NULLIF(COUNT(g.grade_id), 0), 1
          ) as excellent_rate
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        JOIN enrollments e ON s.student_id = e.student_id
        JOIN classes cl ON e.class_id = cl.class_id
        LEFT JOIN grades g ON s.student_id = g.student_id AND g.class_id = cl.class_id
        ${whereClause}
        GROUP BY s.student_id, u.real_name, s.gpa
        ORDER BY avg_score DESC
      `;

      return {
        data: analysis,
        sql: `SELECT 
    s.student_id,
    u.real_name as student_name,
    s.gpa as current_gpa,
    COUNT(DISTINCT g.grade_id) as course_count,
    ROUND(AVG(g.total_score), 2) as avg_score,
    ROUND(MIN(g.total_score), 2) as min_score,
    ROUND(MAX(g.total_score), 2) as max_score,
    COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as excellent_count,
    COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count,
    ROUND(
        COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) * 100.0 / 
        NULLIF(COUNT(g.grade_id), 0), 1
    ) as excellent_rate
FROM students s
JOIN users u ON s.user_id = u.user_id
JOIN enrollments e ON s.student_id = e.student_id
JOIN classes cl ON e.class_id = cl.class_id
LEFT JOIN grades g ON s.student_id = g.student_id AND g.class_id = cl.class_id
${whereClause.replace('WHERE', '\nWHERE')}
GROUP BY s.student_id, u.real_name, s.gpa
ORDER BY avg_score DESC;`
      };
    }),

});