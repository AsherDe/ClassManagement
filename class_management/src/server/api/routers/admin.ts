import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  // 管理员创建用户
  createUser: publicProcedure
    .input(z.object({
      username: z.string().min(1).max(50),
      password: z.string().min(6).max(100).default("shzu123456"),
      userType: z.enum(["admin", "teacher", "student"]),
      realName: z.string().min(1).max(50),
      email: z.string().email().max(100).optional(),
      phone: z.string().max(20).optional(),
      // 学生特有字段
      studentId: z.string().optional(),
      majorId: z.number().optional(),
      grade: z.number().optional(),
      classNumber: z.number().optional(),
      // 教师特有字段
      teacherId: z.string().optional(),
      title: z.string().optional(),
      department: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 创建用户
      const user = await ctx.db.users.create({
        data: {
          username: input.username,
          password: input.password,
          user_type: input.userType,
          real_name: input.realName,
          email: input.email,
          phone: input.phone,
        },
      });

      // 根据用户类型创建对应的详细信息
      if (input.userType === "student" && input.studentId) {
        await ctx.db.students.create({
          data: {
            student_id: input.studentId,
            user_id: user.user_id,
            major_id: input.majorId,
            grade: input.grade || new Date().getFullYear(),
            class_number: input.classNumber || 1,
          },
        });
      } else if (input.userType === "teacher" && input.teacherId) {
        await ctx.db.teachers.create({
          data: {
            teacher_id: input.teacherId,
            user_id: user.user_id,
            title: input.title,
            department: input.department || "计算机科学与技术学院",
          },
        });
      }

      return {
        success: true,
        message: `用户 ${user.username} 创建成功`,
        user,
      };
    }),

  // 管理员删除用户
  deleteUser: publicProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 检查用户是否存在
      const user = await ctx.db.users.findUnique({
        where: { user_id: input.userId },
        include: {
          students: true,
          teachers: true,
        }
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 检查是否可以删除（避免删除有数据关联的用户）
      if (user.user_type === "student" && user.students) {
        const enrollmentCount = await ctx.db.enrollments.count({
          where: { student_id: user.students.student_id }
        });
        
        if (enrollmentCount > 0) {
          throw new Error("无法删除有选课记录的学生用户");
        }
      }

      if (user.user_type === "teacher" && user.teachers) {
        const classCount = await ctx.db.classes.count({
          where: { teacher_id: user.teachers.teacher_id }
        });
        
        if (classCount > 0) {
          throw new Error("无法删除有授课记录的教师用户");
        }
      }

      // 由于设置了级联删除，删除用户会自动删除相关的学生或教师记录
      await ctx.db.users.delete({
        where: { user_id: input.userId }
      });

      return {
        success: true,
        message: `用户 ${user.username} 删除成功`,
      };
    }),

  // 管理员创建班级并分配老师
  createClassWithTeacher: publicProcedure
    .input(z.object({
      courseId: z.number(),
      teacherId: z.string().optional(), // 改为可选，允许创建未分配教师的班级
      className: z.string().min(1),
      semester: z.string().min(1),
      maxStudents: z.number().default(50),
      classTime: z.string().optional(),
      classroom: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证课程是否存在
      const course = await ctx.db.courses.findUnique({
        where: { course_id: input.courseId }
      });

      if (!course) {
        throw new Error("指定的课程不存在");
      }

      // 如果指定了教师，验证教师是否存在
      let teacher = null;
      if (input.teacherId) {
        teacher = await ctx.db.teachers.findUnique({
          where: { teacher_id: input.teacherId },
          include: { user: true }
        });

        if (!teacher) {
          throw new Error("指定的教师不存在");
        }
      }

      // 创建班级
      const newClass = await ctx.db.classes.create({
        data: {
          course_id: input.courseId,
          teacher_id: input.teacherId || null, // 可以为null
          class_name: input.className,
          semester: input.semester,
          max_students: input.maxStudents,
          class_time: input.classTime,
          classroom: input.classroom,
          current_students: 0,
          status: "active",
        },
        include: {
          course: true,
          teacher: teacher ? {
            include: {
              user: true,
            }
          } : false
        }
      });

      const message = teacher 
        ? `班级 ${newClass.class_name} 创建成功，已分配给教师 ${teacher.user.real_name}`
        : `班级 ${newClass.class_name} 创建成功，未分配教师`;

      return {
        success: true,
        message,
        class: newClass,
      };
    }),

  // 管理员批量分配学生到班级
  assignStudentsToClass: publicProcedure
    .input(z.object({
      classId: z.number(),
      studentIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证班级是否存在
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId },
        include: { course: true }
      });

      if (!classInfo) {
        throw new Error("指定的班级不存在");
      }

      // 验证学生是否存在
      const students = await ctx.db.students.findMany({
        where: { student_id: { in: input.studentIds } },
        include: { user: true }
      });

      if (students.length !== input.studentIds.length) {
        throw new Error("部分学生不存在");
      }

      // 检查班级容量
      const currentEnrollments = await ctx.db.enrollments.count({
        where: { class_id: input.classId, status: "enrolled" }
      });

      if (currentEnrollments + input.studentIds.length > classInfo.max_students) {
        throw new Error(`班级容量不足，当前 ${currentEnrollments} 人，最大容量 ${classInfo.max_students} 人`);
      }

      // 批量创建选课记录
      const enrollments = await Promise.all(
        input.studentIds.map(studentId =>
          ctx.db.enrollments.upsert({
            where: {
              student_id_class_id: {
                student_id: studentId,
                class_id: input.classId,
              }
            },
            update: {
              status: "enrolled",
            },
            create: {
              student_id: studentId,
              class_id: input.classId,
              status: "enrolled",
            },
          })
        )
      );

      // 更新班级当前学生数
      await ctx.db.classes.update({
        where: { class_id: input.classId },
        data: { current_students: currentEnrollments + enrollments.length }
      });

      return {
        success: true,
        message: `成功将 ${enrollments.length} 名学生分配到班级 ${classInfo.class_name}`,
        enrollments,
      };
    }),

  // 管理员移除学生从班级
  removeStudentsFromClass: publicProcedure
    .input(z.object({
      classId: z.number(),
      studentIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证班级是否存在
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId }
      });

      if (!classInfo) {
        throw new Error("指定的班级不存在");
      }

      // 更新选课状态为dropped
      const result = await ctx.db.enrollments.updateMany({
        where: {
          class_id: input.classId,
          student_id: { in: input.studentIds },
        },
        data: {
          status: "dropped",
        }
      });

      // 更新班级当前学生数
      const currentEnrollments = await ctx.db.enrollments.count({
        where: { class_id: input.classId, status: "enrolled" }
      });

      await ctx.db.classes.update({
        where: { class_id: input.classId },
        data: { current_students: currentEnrollments }
      });

      return {
        success: true,
        message: `成功从班级移除 ${result.count} 名学生`,
      };
    }),

  // 管理员重新分配班级教师
  reassignClassTeacher: publicProcedure
    .input(z.object({
      classId: z.number(),
      newTeacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证新教师是否存在
      const teacher = await ctx.db.teachers.findUnique({
        where: { teacher_id: input.newTeacherId },
        include: { user: true }
      });

      if (!teacher) {
        throw new Error("指定的教师不存在");
      }

      // 更新班级教师
      const updatedClass = await ctx.db.classes.update({
        where: { class_id: input.classId },
        data: { teacher_id: input.newTeacherId },
        include: {
          course: true,
          teacher: {
            include: {
              user: true,
            }
          }
        }
      });

      return {
        success: true,
        message: `班级 ${updatedClass.class_name} 已重新分配给教师 ${teacher.user.real_name}`,
        class: updatedClass,
      };
    }),

  // 管理员创建课程
  createCourse: publicProcedure
    .input(z.object({
      courseCode: z.string().min(1).max(20),
      courseName: z.string().min(1).max(100),
      credits: z.number().min(1).max(10),
      courseType: z.enum(["required", "optional", "elective"]).default("required"),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 检查课程代码是否已存在
      const existingCourse = await ctx.db.courses.findUnique({
        where: { course_code: input.courseCode }
      });

      if (existingCourse) {
        throw new Error("课程代码已存在");
      }

      const course = await ctx.db.courses.create({
        data: {
          course_code: input.courseCode,
          course_name: input.courseName,
          credits: input.credits,
          course_type: input.courseType,
          description: input.description,
        },
      });

      return {
        success: true,
        message: `课程 ${course.course_name} 创建成功`,
        course,
      };
    }),

  // 管理员更新课程信息
  updateCourse: publicProcedure
    .input(z.object({
      courseId: z.number(),
      courseName: z.string().min(1).max(100).optional(),
      credits: z.number().min(1).max(10).optional(),
      courseType: z.enum(["required", "optional", "elective"]).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { courseId, ...updateData } = input;

      const course = await ctx.db.courses.update({
        where: { course_id: courseId },
        data: {
          course_name: updateData.courseName,
          credits: updateData.credits,
          course_type: updateData.courseType,
          description: updateData.description,
        },
      });

      return {
        success: true,
        message: `课程 ${course.course_name} 更新成功`,
        course,
      };
    }),

  // 管理员删除课程
  deleteCourse: publicProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 检查是否有班级在使用此课程
      const classCount = await ctx.db.classes.count({
        where: { course_id: input.courseId }
      });

      if (classCount > 0) {
        throw new Error("无法删除有班级使用的课程");
      }

      const course = await ctx.db.courses.delete({
        where: { course_id: input.courseId }
      });

      return {
        success: true,
        message: `课程 ${course.course_name} 删除成功`,
      };
    }),

  // 管理员修改班级课程安排
  updateClassSchedule: publicProcedure
    .input(z.object({
      classId: z.number(),
      classTime: z.string().optional(),
      classroom: z.string().optional(),
      semester: z.string().optional(),
      maxStudents: z.number().optional(),
      status: z.enum(["active", "finished", "cancelled"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { classId, ...updateData } = input;

      // 如果更新最大学生数，需要检查当前学生数
      if (updateData.maxStudents) {
        const classInfo = await ctx.db.classes.findUnique({
          where: { class_id: classId },
          select: { current_students: true }
        });

        if (classInfo && classInfo.current_students > updateData.maxStudents) {
          throw new Error(`无法设置最大学生数为 ${updateData.maxStudents}，当前已有 ${classInfo.current_students} 名学生`);
        }
      }

      const updatedClass = await ctx.db.classes.update({
        where: { class_id: classId },
        data: {
          class_time: updateData.classTime,
          classroom: updateData.classroom,
          semester: updateData.semester,
          max_students: updateData.maxStudents,
          status: updateData.status,
        },
        include: {
          course: true,
          teacher: {
            include: {
              user: true,
            }
          }
        }
      });

      return {
        success: true,
        message: `班级 ${updatedClass.class_name} 课程安排更新成功`,
        class: updatedClass,
      };
    }),

  // 管理员获取所有课程列表
  getAllCourses: publicProcedure
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
        orderBy: { course_code: "asc" },
      });
    }),

  // 管理员获取所有班级列表
  getAllClasses: publicProcedure
    .input(z.object({
      semester: z.string().optional(),
      status: z.string().optional(),
      teacherId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.semester) where.semester = input.semester;
      if (input?.status) where.status = input.status;
      if (input?.teacherId) where.teacher_id = input.teacherId;

      return await ctx.db.classes.findMany({
        where,
        include: {
          course: true,
          teacher: {
            include: {
              user: true,
            }
          },
          enrollments: {
            where: { status: "enrolled" },
            include: {
              student: {
                include: {
                  user: true,
                }
              }
            }
          }
        },
        orderBy: { class_name: "asc" },
      });
    }),

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
          // 包含教师和学生的详细信息
          teachers: input?.userType === "teacher" ? {
            select: {
              teacher_id: true,
              title: true,
              department: true,
            }
          } : false,
          students: input?.userType === "student" ? {
            select: {
              student_id: true,
              grade: true,
              class_number: true,
              major: {
                select: {
                  major_name: true,
                }
              }
            }
          } : false,
        },
        orderBy,
      });
    }),

  // 管理员获取所有教师列表（专用于班级创建）
  getAllTeachers: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.teachers.findMany({
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              real_name: true,
              email: true,
              phone: true,
            }
          }
        },
        orderBy: {
          user: {
            real_name: "asc"
          }
        }
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