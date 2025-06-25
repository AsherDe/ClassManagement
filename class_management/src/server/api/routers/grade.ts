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

  // 创建成绩记录（教师录入）- 支持upsert
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
      // 使用 upsert 来处理已存在的记录
      return await ctx.db.grades.upsert({
        where: {
          student_id_class_id: {
            student_id: input.studentId,
            class_id: input.classId,
          }
        },
        update: {
          regular_score: input.regularScore,
          midterm_score: input.midtermScore,
          final_score: input.finalScore,
          recorded_by: input.recordedBy,
          recorded_at: new Date(),
        },
        create: {
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

  // 教师专用：计算并更新总分和等级
  calculateAndUpdateGrades: publicProcedure
    .input(z.object({
      classId: z.number(),
      teacherId: z.string(),
      regularWeight: z.number().min(0).max(1).default(0.3),
      midtermWeight: z.number().min(0).max(1).default(0.3),
      finalWeight: z.number().min(0).max(1).default(0.4),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId, teacher_id: input.teacherId },
      });

      if (!classInfo) {
        throw new Error("您没有权限操作该班级成绩");
      }

      // 获取班级所有成绩记录
      const grades = await ctx.db.grades.findMany({
        where: { class_id: input.classId },
      });

      const updatedGrades = [];

      for (const grade of grades) {
        const regular = Number(grade.regular_score) || 0;
        const midterm = Number(grade.midterm_score) || 0;
        const final = Number(grade.final_score) || 0;

        // 计算总分
        const totalScore = regular * input.regularWeight + 
                          midterm * input.midtermWeight + 
                          final * input.finalWeight;

        // 计算等级和GPA点数
        let letterGrade = 'F';
        let gpaPoints = 0;

        if (totalScore >= 97) {
          letterGrade = 'A+';
          gpaPoints = 4.0;
        } else if (totalScore >= 93) {
          letterGrade = 'A';
          gpaPoints = 4.0;
        } else if (totalScore >= 90) {
          letterGrade = 'A-';
          gpaPoints = 3.7;
        } else if (totalScore >= 87) {
          letterGrade = 'B+';
          gpaPoints = 3.3;
        } else if (totalScore >= 83) {
          letterGrade = 'B';
          gpaPoints = 3.0;
        } else if (totalScore >= 80) {
          letterGrade = 'B-';
          gpaPoints = 2.7;
        } else if (totalScore >= 77) {
          letterGrade = 'C+';
          gpaPoints = 2.3;
        } else if (totalScore >= 73) {
          letterGrade = 'C';
          gpaPoints = 2.0;
        } else if (totalScore >= 70) {
          letterGrade = 'C-';
          gpaPoints = 1.7;
        } else if (totalScore >= 67) {
          letterGrade = 'D+';
          gpaPoints = 1.3;
        } else if (totalScore >= 65) {
          letterGrade = 'D';
          gpaPoints = 1.0;
        } else if (totalScore >= 60) {
          letterGrade = 'D-';
          gpaPoints = 0.7;
        }

        // 更新成绩记录
        const updatedGrade = await ctx.db.grades.update({
          where: { grade_id: grade.grade_id },
          data: {
            total_score: Math.round(totalScore * 100) / 100,
            letter_grade: letterGrade,
            gpa_points: gpaPoints,
            recorded_at: new Date(),
          },
        });

        updatedGrades.push(updatedGrade);
      }

      return {
        success: true,
        message: `成功更新 ${updatedGrades.length} 条成绩记录`,
        updatedCount: updatedGrades.length,
      };
    }),

  // 教师专用：批量录入或更新成绩
  batchUpsertByTeacher: publicProcedure
    .input(z.object({
      classId: z.number(),
      teacherId: z.string(),
      grades: z.array(z.object({
        studentId: z.string(),
        regularScore: z.number().min(0).max(100).optional(),
        midtermScore: z.number().min(0).max(100).optional(),
        finalScore: z.number().min(0).max(100).optional(),
      })),
      autoCalculate: z.boolean().default(true),
      regularWeight: z.number().min(0).max(1).default(0.3),
      midtermWeight: z.number().min(0).max(1).default(0.3),
      finalWeight: z.number().min(0).max(1).default(0.4),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId, teacher_id: input.teacherId },
      });

      if (!classInfo) {
        throw new Error("您没有权限操作该班级成绩");
      }

      const results = [];

      for (const gradeData of input.grades) {
        let totalScore: number | undefined;
        let letterGrade: string | undefined;
        let gpaPoints: number | undefined;

        // 如果开启自动计算
        if (input.autoCalculate) {
          const regular = gradeData.regularScore || 0;
          const midterm = gradeData.midtermScore || 0;
          const final = gradeData.finalScore || 0;

          totalScore = regular * input.regularWeight + 
                      midterm * input.midtermWeight + 
                      final * input.finalWeight;

          // 计算等级和GPA
          if (totalScore >= 97) {
            letterGrade = 'A+';
            gpaPoints = 4.0;
          } else if (totalScore >= 93) {
            letterGrade = 'A';
            gpaPoints = 4.0;
          } else if (totalScore >= 90) {
            letterGrade = 'A-';
            gpaPoints = 3.7;
          } else if (totalScore >= 87) {
            letterGrade = 'B+';
            gpaPoints = 3.3;
          } else if (totalScore >= 83) {
            letterGrade = 'B';
            gpaPoints = 3.0;
          } else if (totalScore >= 80) {
            letterGrade = 'B-';
            gpaPoints = 2.7;
          } else if (totalScore >= 77) {
            letterGrade = 'C+';
            gpaPoints = 2.3;
          } else if (totalScore >= 73) {
            letterGrade = 'C';
            gpaPoints = 2.0;
          } else if (totalScore >= 70) {
            letterGrade = 'C-';
            gpaPoints = 1.7;
          } else if (totalScore >= 67) {
            letterGrade = 'D+';
            gpaPoints = 1.3;
          } else if (totalScore >= 65) {
            letterGrade = 'D';
            gpaPoints = 1.0;
          } else if (totalScore >= 60) {
            letterGrade = 'D-';
            gpaPoints = 0.7;
          } else {
            letterGrade = 'F';
            gpaPoints = 0;
          }
        }

        // 使用upsert操作
        const grade = await ctx.db.grades.upsert({
          where: {
            student_id_class_id: {
              student_id: gradeData.studentId,
              class_id: input.classId,
            }
          },
          update: {
            regular_score: gradeData.regularScore,
            midterm_score: gradeData.midtermScore,
            final_score: gradeData.finalScore,
            total_score: totalScore,
            letter_grade: letterGrade,
            gpa_points: gpaPoints,
            recorded_by: input.teacherId,
            recorded_at: new Date(),
          },
          create: {
            student_id: gradeData.studentId,
            class_id: input.classId,
            regular_score: gradeData.regularScore,
            midterm_score: gradeData.midtermScore,
            final_score: gradeData.finalScore,
            total_score: totalScore,
            letter_grade: letterGrade,
            gpa_points: gpaPoints,
            recorded_by: input.teacherId,
          },
        });

        results.push(grade);
      }

      return {
        success: true,
        message: `成功处理 ${results.length} 条成绩记录`,
        grades: results,
      };
    }),

  // 教师专用：查询班级成绩详情
  getClassGradesByTeacher: publicProcedure
    .input(z.object({
      classId: z.number(),
      teacherId: z.string(),
      includeStatistics: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      // 验证教师权限
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId, teacher_id: input.teacherId },
        include: { course: true }
      });

      if (!classInfo) {
        throw new Error("您没有权限查看该班级成绩");
      }

      // 获取成绩数据
      const grades = await ctx.db.grades.findMany({
        where: { class_id: input.classId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  real_name: true,
                }
              },
              major: true,
            }
          }
        },
        orderBy: [
          { total_score: "desc" },
          { student_id: "asc" }
        ]
      });

      let statistics = null;

      if (input.includeStatistics && grades.length > 0) {
        const scores = grades.map(g => Number(g.total_score || 0)).filter(s => s > 0);
        const total = grades.length;
        const sum = scores.reduce((a, b) => a + b, 0);
        const average = scores.length > 0 ? sum / scores.length : 0;
        const highest = scores.length > 0 ? Math.max(...scores) : 0;
        const lowest = scores.length > 0 ? Math.min(...scores) : 0;
        const passCount = scores.filter(score => score >= 60).length;
        const passRate = scores.length > 0 ? (passCount / scores.length) * 100 : 0;
        const excellentCount = grades.filter(g => ['A+', 'A'].includes(g.letter_grade || '')).length;
        const excellentRate = (excellentCount / total) * 100;

        statistics = {
          total,
          average: Math.round(average * 100) / 100,
          highest,
          lowest,
          passRate: Math.round(passRate * 100) / 100,
          excellentRate: Math.round(excellentRate * 100) / 100,
        };
      }

      return {
        class: classInfo,
        grades,
        statistics,
      };
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