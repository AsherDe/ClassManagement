import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const gradeRouter = createTRPCRouter({
  // 获取所有成绩
  getAll: publicProcedure
    .input(z.object({
      classId: z.number().optional(),
      studentId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.studentId) where.student_id = input.studentId;
      if (input?.classId) where.class_id = input.classId;

      return await ctx.db.grades.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  real_name: true,
                }
              }
            }
          },
          class: {
            include: {
              course: true,
            }
          }
        },
        orderBy: { recorded_at: "desc" },
      });
    }),

  // 根据ID获取成绩
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.grades.findUnique({
        where: { grade_id: input.id },
        include: {
          student: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  real_name: true,
                }
              }
            }
          },
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
      });
    }),

  // 创建成绩记录（教师录入）
  create: publicProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.number(),
      regularScore: z.number().min(0).max(100).optional(),
      midtermScore: z.number().min(0).max(100).optional(),
      finalScore: z.number().min(0).max(100).optional(),
      recordedBy: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.grades.create({
        data: {
          student_id: input.studentId,
          class_id: input.classId,
          regular_score: input.regularScore,
          midterm_score: input.midtermScore,
          final_score: input.finalScore,
          recorded_by: input.recordedBy,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  real_name: true,
                }
              }
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

  // 更新成绩记录
  update: publicProcedure
    .input(z.object({
      gradeId: z.number(),
      regularScore: z.number().min(0).max(100).optional(),
      midtermScore: z.number().min(0).max(100).optional(),
      finalScore: z.number().min(0).max(100).optional(),
      recordedBy: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { gradeId, recordedBy, ...scoreData } = input;
      
      return await ctx.db.grades.update({
        where: { grade_id: gradeId },
        data: {
          ...scoreData,
          recorded_by: recordedBy,
          recorded_at: new Date(),
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  real_name: true,
                }
              }
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

  // 删除成绩记录
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.grades.delete({
        where: { grade_id: input.id }
      });
    }),

  // 根据学生ID获取成绩
  getByStudent: publicProcedure
    .input(z.object({ 
      studentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.grades.findMany({
        where: { student_id: input.studentId },
        include: {
          class: {
            include: {
              course: true,
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
        orderBy: { recorded_at: "desc" }
      });
    }),

  // 根据班级获取成绩
  getByClass: publicProcedure
    .input(z.object({ 
      classId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.grades.findMany({
        where: { class_id: input.classId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  real_name: true,
                }
              }
            }
          },
          class: {
            include: {
              course: true,
            }
          }
        },
        orderBy: [
          { total_score: "desc" },
          { student_id: "asc" }
        ]
      });
    }),

  // 教师批量提交成绩
  batchUpsert: publicProcedure
    .input(z.object({
      grades: z.array(z.object({
        studentId: z.string(),
        classId: z.number(),
        regularScore: z.number().min(0).max(100).optional(),
        midtermScore: z.number().min(0).max(100).optional(),
        finalScore: z.number().min(0).max(100).optional(),
      })),
      recordedBy: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const gradeInput of input.grades) {
        // 检查是否已存在成绩记录
        const existingGrade = await ctx.db.grades.findUnique({
          where: {
            student_id_class_id: {
              student_id: gradeInput.studentId,
              class_id: gradeInput.classId,
            }
          }
        });

        if (existingGrade) {
          // 更新现有记录
          const updatedGrade = await ctx.db.grades.update({
            where: {
              student_id_class_id: {
                student_id: gradeInput.studentId,
                class_id: gradeInput.classId,
              }
            },
            data: {
              regular_score: gradeInput.regularScore,
              midterm_score: gradeInput.midtermScore,
              final_score: gradeInput.finalScore,
              recorded_by: input.recordedBy,
              recorded_at: new Date(),
            },
          });
          results.push(updatedGrade);
        } else {
          // 创建新记录
          const newGrade = await ctx.db.grades.create({
            data: {
              student_id: gradeInput.studentId,
              class_id: gradeInput.classId,
              regular_score: gradeInput.regularScore,
              midterm_score: gradeInput.midtermScore,
              final_score: gradeInput.finalScore,
              recorded_by: input.recordedBy,
            },
          });
          results.push(newGrade);
        }
      }

      return results;
    }),

  // 获取成绩统计
  getStatistics: publicProcedure
    .input(z.object({
      classId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input.classId) where.class_id = input.classId;

      const grades = await ctx.db.grades.findMany({
        where,
        select: {
          total_score: true,
          letter_grade: true,
        }
      });

      if (grades.length === 0) {
        return {
          total: 0,
          average: 0,
          highest: 0,
          lowest: 0,
          passRate: 0,
          excellentRate: 0,
        };
      }

      const scores = grades.map(g => Number(g.total_score || 0)).filter(s => s > 0);
      const total = grades.length;
      const sum = scores.reduce((a, b) => a + b, 0);
      const average = scores.length > 0 ? sum / scores.length : 0;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;
      const passCount = scores.filter(score => score >= 60).length;
      const passRate = (passCount / scores.length) * 100;
      const excellentCount = grades.filter(g => ['A+', 'A'].includes(g.letter_grade || '')).length;
      const excellentRate = (excellentCount / total) * 100;

      return {
        total,
        average: Math.round(average * 100) / 100,
        highest,
        lowest,
        passRate: Math.round(passRate * 100) / 100,
        excellentRate: Math.round(excellentRate * 100) / 100,
      };
    }),
});