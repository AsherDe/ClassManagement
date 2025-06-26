import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const studentRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      majorId: z.number().optional(),
      grade: z.number().optional(),
      classNumber: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.majorId) where.major_id = input.majorId;
      if (input?.grade) where.grade = input.grade;
      if (input?.classNumber) where.class_number = input.classNumber;
      if (input?.status) where.status = input.status;

      return await ctx.db.students.findMany({
        where,
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
          major: true,
          enrollments: {
            include: {
              class: {
                include: {
                  course: true,
                }
              }
            }
          }
        },
        orderBy: { enrollment_date: "desc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.students.findUnique({
        where: { student_id: input.studentId },
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
    }),

  create: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(6),
      email: z.string().email(),
      phone: z.string().optional(),
      name: z.string().min(1),
      student_id: z.string().min(1),
      gender: z.string().optional(),
      birth_date: z.date().optional(),
      id_card: z.string().optional(),
      class_id: z.number().optional(),
      enrollment_date: z.date(),
      home_address: z.string().optional(),
      emergency_contact: z.string().optional(),
      emergency_phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = input.password; // Simplified for demo - in production use proper hashing
      
      // 创建用户账号
      const user = await ctx.db.users.create({
        data: {
          username: input.username,
          password: hashedPassword,
          email: input.email,
          phone: input.phone,
          user_type: "student",
          real_name: input.name,
        },
      });

      // 创建学生档案
      const student = await ctx.db.students.create({
        data: {
          user_id: user.user_id,
          student_id: input.student_id,
          major_id: null,
          grade: 1,
          class_number: 1,
          enrollment_date: input.enrollment_date,
        },
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              phone: true,
              real_name: true,
            }
          }
        }
      });


      return student;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      name: z.string().min(1).optional(),
      gender: z.string().optional(),
      birth_date: z.date().optional(),
      id_card: z.string().optional(),
      class_id: z.number().optional(),
      home_address: z.string().optional(),
      emergency_contact: z.string().optional(),
      emergency_phone: z.string().optional(),
      status: z.enum(["enrolled", "suspended", "graduated", "dropped"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, email, phone, ...studentData } = input;
      
      // 获取当前学生信息
      const currentStudent = await ctx.db.students.findUnique({
        where: { student_id: id.toString() },
        select: { major_id: true }
      });

      // 更新用户信息
      if (email || phone) {
        const studentInfo = await ctx.db.students.findUnique({
          where: { student_id: id.toString() },
          select: { user_id: true }
        });
        
        if (studentInfo) {
          await ctx.db.users.update({
            where: { user_id: studentInfo.user_id },
            data: {
              email,
              phone,
              updated_at: new Date(),
            },
          });
        }
      }

      // 更新学生信息 - limited to fields that exist in the schema
      const student = await ctx.db.students.update({
        where: { student_id: id.toString() },
        data: {
          // Only include fields that exist in the students model
          status: studentData.status,
        },
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              phone: true,
              real_name: true,
            }
          }
        }
      });


      return student;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 获取学生信息
      const student = await ctx.db.students.findUnique({
        where: { student_id: input.id.toString() },
        select: { major_id: true }
      });

      // 删除学生档案
      await ctx.db.students.delete({
        where: { student_id: input.id.toString() }
      });

      // Note: User deletion will be handled by cascade delete in the database

      return { success: true };
    }),

  getByClass: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
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
                  email: true,
                  phone: true,
                  real_name: true,
                }
              }
            }
          }
        },
        orderBy: { student_id: "asc" },
      });
      
      return enrollments.map(e => e.student);
    }),

  resetPassword: publicProcedure
    .input(z.object({
      id: z.number(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      // In production, use proper password hashing
      // For now, use plain text for demonstration
      const hashedPassword = input.newPassword;
      
      return await ctx.db.users.update({
        where: { user_id: input.id },
        data: {
          password: hashedPassword,
          updated_at: new Date(),
        },
      });
    }),
});