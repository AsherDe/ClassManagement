import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const classRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      courseId: z.number().optional(),
      teacherId: z.string().optional(),
      semester: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.courseId) where.course_id = input.courseId;
      if (input?.teacherId) where.teacher_id = input.teacherId;
      if (input?.semester) where.semester = input.semester;

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

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.classes.findUnique({
        where: { class_id: input.id },
        include: {
          course: true,
          teacher: {
            include: {
              user: true,
            }
          },
          enrollments: {
            include: {
              student: {
                include: {
                  user: true,
                  major: true,
                }
              }
            }
          },
          grades: {
            include: {
              student: {
                include: {
                  user: true,
                }
              }
            }
          }
        }
      });
    }),

  create: publicProcedure
    .input(z.object({
      courseId: z.number(),
      teacherId: z.string().optional(),
      className: z.string().min(1),
      semester: z.string().min(1),
      maxStudents: z.number().default(50),
      classTime: z.string().optional(),
      classroom: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.classes.create({
        data: {
          course_id: input.courseId,
          teacher_id: input.teacherId,
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
          teacher: {
            include: {
              user: true,
            }
          }
        }
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      teacherId: z.string().optional(),
      className: z.string().optional(),
      semester: z.string().optional(),
      maxStudents: z.number().optional(),
      classTime: z.string().optional(),
      classroom: z.string().optional(),
      status: z.enum(["active", "finished", "cancelled"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      return await ctx.db.classes.update({
        where: { class_id: id },
        data: {
          teacher_id: updateData.teacherId,
          class_name: updateData.className,
          semester: updateData.semester,
          max_students: updateData.maxStudents,
          class_time: updateData.classTime,
          classroom: updateData.classroom,
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
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if there are any enrollments
      const enrollmentCount = await ctx.db.enrollments.count({
        where: { class_id: input.id }
      });

      if (enrollmentCount > 0) {
        throw new Error("Cannot delete class with enrolled students");
      }

      return await ctx.db.classes.delete({
        where: { class_id: input.id }
      });
    }),

  getEnrollments: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.enrollments.findMany({
        where: { class_id: input.classId },
        include: {
          student: {
            include: {
              user: true,
              major: true,
            }
          }
        },
        orderBy: { enrolled_at: "desc" },
      });
    }),

  enrollStudent: publicProcedure
    .input(z.object({
      classId: z.number(),
      studentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.enrollments.create({
        data: {
          class_id: input.classId,
          student_id: input.studentId,
          status: "enrolled",
        },
        include: {
          student: {
            include: {
              user: true,
            }
          },
          class: {
            include: {
              course: true,
            }
          }
        }
      });
    }),

  dropStudent: publicProcedure
    .input(z.object({
      classId: z.number(),
      studentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.enrollments.updateMany({
        where: {
          class_id: input.classId,
          student_id: input.studentId,
        },
        data: {
          status: "dropped",
        }
      });
    }),

  getStudents: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.enrollments.findMany({
        where: { class_id: input.classId },
        include: {
          student: {
            include: {
              user: true,
              major: true,
            }
          }
        },
        orderBy: { enrolled_at: "desc" },
      });
    }),
});