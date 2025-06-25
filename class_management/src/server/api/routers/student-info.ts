import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const studentInfoRouter = createTRPCRouter({
  // 学生查看个人详细信息
  getStudentInfo: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
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
              updated_at: true,
            }
          },
          major: {
            select: {
              major_id: true,
              major_name: true,
              major_code: true,
              department: true,
            }
          },
          enrollments: {
            where: { status: "enrolled" },
            include: {
              class: {
                include: {
                  course: {
                    select: {
                      course_id: true,
                      course_name: true,
                      course_code: true,
                      credits: true,
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
                  course: {
                    select: {
                      course_name: true,
                      course_code: true,
                      credits: true,
                    }
                  }
                }
              }
            }
          }
        }
      });

      return student;
    }),

  // 学生更新个人可修改信息
  updateStudentInfo: publicProcedure
    .input(z.object({
      studentId: z.string(),
      email: z.string().email().optional(),
      phone: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证学生是否存在
      const student = await ctx.db.students.findUnique({
        where: { student_id: input.studentId },
        include: { user: true }
      });

      if (!student) {
        throw new Error("学生信息不存在");
      }

      // 更新用户信息
      const updatedUser = await ctx.db.users.update({
        where: { user_id: student.user_id },
        data: {
          email: input.email,
          phone: input.phone,
          updated_at: new Date(),
        },
        select: {
          user_id: true,
          username: true,
          real_name: true,
          email: true,
          phone: true,
          updated_at: true,
        }
      });

      return {
        success: true,
        message: "个人信息更新成功",
        user: updatedUser,
      };
    }),

  // 学生修改密码
  changePassword: publicProcedure
    .input(z.object({
      studentId: z.string(),
      currentPassword: z.string(),
      newPassword: z.string().min(6).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证学生信息和当前密码
      const student = await ctx.db.students.findUnique({
        where: { student_id: input.studentId },
        include: { user: true }
      });

      if (!student) {
        throw new Error("学生信息不存在");
      }

      if (student.user.password !== input.currentPassword) {
        throw new Error("当前密码不正确");
      }

      // 更新密码
      await ctx.db.users.update({
        where: { user_id: student.user_id },
        data: {
          password: input.newPassword,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: "密码修改成功",
      };
    }),

  // 学生查看自己的课程信息
  getStudentCourses: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const enrollments = await ctx.db.enrollments.findMany({
        where: { 
          student_id: input.studentId,
          status: "enrolled"
        },
        include: {
          class: {
            include: {
              course: {
                select: {
                  course_id: true,
                  course_code: true,
                  course_name: true,
                  credits: true,
                  course_type: true,
                }
              },
              teacher: {
                include: {
                  user: {
                    select: {
                      real_name: true,
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          class: {
            course: {
              course_code: "asc"
            }
          }
        }
      });

      return enrollments.map(enrollment => ({
        course_code: enrollment.class.course.course_code,
        course_name: enrollment.class.course.course_name,
        credits: enrollment.class.course.credits,
        course_type: enrollment.class.course.course_type,
        class_name: enrollment.class.class_name,
        semester: enrollment.class.semester,
        class_time: enrollment.class.class_time,
        classroom: enrollment.class.classroom,
        teacher_name: enrollment.class.teacher?.user?.real_name || "未分配",
        enrolled_at: enrollment.enrolled_at,
      }));
    }),

  // 学生查询个人成绩
  getStudentGrades: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const grades = await ctx.db.grades.findMany({
        where: { student_id: input.studentId },
        include: {
          class: {
            include: {
              course: {
                select: {
                  course_id: true,
                  course_code: true,
                  course_name: true,
                  credits: true,
                }
              }
            }
          }
        },
        orderBy: [
          { class: { semester: "asc" } },
          { class: { course: { course_code: "asc" } } }
        ]
      });

      return grades.map(grade => ({
        course_code: grade.class.course.course_code,
        course_name: grade.class.course.course_name,
        credits: grade.class.course.credits,
        semester: grade.class.semester,
        regular_score: grade.regular_score,
        midterm_score: grade.midterm_score,
        final_score: grade.final_score,
        total_score: grade.total_score,
        letter_grade: grade.letter_grade,
        gpa_points: grade.gpa_points,
        grade_id: grade.grade_id,
        recorded_at: grade.recorded_at,
      }));
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

  // 学生查看同班同学信息（增强版）
  getClassmates: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 获取该学生所选的课程班级
      const studentEnrollments = await ctx.db.enrollments.findMany({
        where: { 
          student_id: input.studentId,
          status: "enrolled"
        },
        include: {
          class: {
            include: {
              course: {
                select: {
                  course_id: true,
                  course_name: true,
                  course_code: true,
                }
              }
            }
          }
        }
      });

      if (studentEnrollments.length === 0) {
        return { classmates: [], classmatesByClass: [] };
      }

      const classIds = studentEnrollments.map(e => e.class_id);

      // 获取所有在同一课程班级的学生
      const allClassmates = await ctx.db.enrollments.findMany({
        where: {
          class_id: { in: classIds },
          student_id: { not: input.studentId },
          status: "enrolled"
        },
        include: {
          student: {
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
                  major_code: true,
                }
              }
            }
          },
          class: {
            include: {
              course: {
                select: {
                  course_name: true,
                  course_code: true,
                }
              }
            }
          }
        }
      });

      // 按课程分组同学信息
      const classmatesByClass = studentEnrollments.map(enrollment => {
        const courseClassmates = allClassmates.filter(
          classmate => classmate.class_id === enrollment.class_id
        );

        return {
          class: enrollment.class,
          classmates: courseClassmates.map(cm => ({
            student_id: cm.student.student_id,
            real_name: cm.student.user.real_name,
            username: cm.student.user.username,
            phone: cm.student.user.phone,
            email: cm.student.user.email,
            major_name: cm.student.major?.major_name,
            major_code: cm.student.major?.major_code,
            grade: cm.student.grade,
            class_number: cm.student.class_number,
            gpa: cm.student.gpa,
          }))
        };
      });

      // 获取所有同学的去重列表
      const uniqueClassmates = Array.from(
        new Map(
          allClassmates.map(cm => [
            cm.student.student_id,
            {
              student_id: cm.student.student_id,
              real_name: cm.student.user.real_name,
              username: cm.student.user.username,
              phone: cm.student.user.phone,
              email: cm.student.user.email,
              major_name: cm.student.major?.major_name,
              major_code: cm.student.major?.major_code,
              grade: cm.student.grade,
              class_number: cm.student.class_number,
              gpa: cm.student.gpa,
              shared_classes: allClassmates
                .filter(ac => ac.student.student_id === cm.student.student_id)
                .map(ac => ({
                  course_name: ac.class.course.course_name,
                  course_code: ac.class.course.course_code,
                  class_name: ac.class.class_name,
                }))
            }
          ])
        ).values()
      ).sort((a, b) => a.real_name.localeCompare(b.real_name));

      return {
        classmates: uniqueClassmates,
        classmatesByClass,
        totalClassmates: uniqueClassmates.length,
        sharedCourses: studentEnrollments.length,
      };
    }),

  // 学生查看同专业同年级学生
  getMajorClassmates: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 获取该学生的基本信息
      const currentStudent = await ctx.db.students.findUnique({
        where: { student_id: input.studentId },
        select: { grade: true, class_number: true, major_id: true }
      });

      if (!currentStudent) {
        return [];
      }

      // 查找同专业同年级的学生
      const majorClassmates = await ctx.db.students.findMany({
        where: {
          grade: currentStudent.grade,
          major_id: currentStudent.major_id,
          student_id: {
            not: input.studentId
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
              major_code: true,
            }
          }
        },
        orderBy: [
          { class_number: 'asc' },
          { student_id: 'asc' }
        ]
      });

      // 按班级分组
      const classmatesByClassNumber = majorClassmates.reduce((acc, student) => {
        const classKey = student.class_number;
        if (!acc[classKey]) {
          acc[classKey] = [];
        }
        acc[classKey].push({
          student_id: student.student_id,
          real_name: student.user.real_name,
          username: student.user.username,
          phone: student.user.phone,
          email: student.user.email,
          grade: student.grade,
          class_number: student.class_number,
          gpa: student.gpa,
          is_same_class: student.class_number === currentStudent.class_number,
        });
        return acc;
      }, {} as Record<number, any[]>);

      return {
        majorClassmates,
        classmatesByClassNumber,
        totalMajorClassmates: majorClassmates.length,
        currentStudent: {
          grade: currentStudent.grade,
          class_number: currentStudent.class_number,
        }
      };
    }),
});