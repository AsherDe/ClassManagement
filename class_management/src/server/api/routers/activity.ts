import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const activityRouter = createTRPCRouter({
  // 获取活动列表
  getAll: publicProcedure
    .input(z.object({
      classId: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Use Prisma relations for consistent data structure
      const where: Record<string, unknown> = {};
      
      if (input?.classId) {
        where.class_id = input.classId;
      }
      if (input?.status) {
        where.status = input.status;
      }

      const activities = await ctx.db.class_activities.findMany({
        where,
        orderBy: { start_time: "desc" },
      });
      
      return activities;
    }),

  // 根据ID获取活动详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.id },
      });
      
      return activity;
    }),

  // 获取活动参与者列表
  getParticipants: publicProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.activity_participants.findMany({
        where: { activity_id: input.activityId },
        orderBy: { registration_time: "asc" }
      });
      
      return participants;
    }),

  // 教师创建班级活动
  createByTeacher: publicProcedure
    .input(z.object({
      classId: z.number(),
      teacherId: z.string(),
      activityName: z.string().min(1).max(200),
      activityType: z.enum(["lecture", "seminar", "workshop", "field_trip", "competition", "social", "sports", "cultural", "volunteer", "other"]),
      description: z.string().optional(),
      location: z.string().max(200).optional(),
      startTime: z.date(),
      endTime: z.date().optional(),
      organizerId: z.string().optional(),
      budgetAmount: z.number().min(0).default(0),
      requiredAttendance: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限
      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: input.classId, teacher_id: input.teacherId },
        include: { course: true }
      });

      if (!classInfo) {
        throw new Error("您没有权限在该班级创建活动");
      }

      // 验证时间合理性
      if (input.endTime && new Date(input.endTime).getTime() <= new Date(input.startTime).getTime()) {
        throw new Error("结束时间必须晚于开始时间");
      }

      // 如果指定了组织者，验证学生是否在该班级
      if (input.organizerId) {
        const studentInClass = await ctx.db.enrollments.findFirst({
          where: {
            student_id: input.organizerId,
            class_id: input.classId,
            status: "enrolled"
          }
        });

        if (!studentInClass) {
          throw new Error("指定的组织者不在该班级中");
        }
      }

      const activity = await ctx.db.class_activities.create({
        data: {
          class_id: input.classId,
          activity_name: input.activityName,
          activity_type: input.activityType,
          description: input.description,
          location: input.location,
          start_time: input.startTime,
          end_time: input.endTime,
          organizer_id: input.organizerId,
          budget_amount: input.budgetAmount,
          required_attendance: input.requiredAttendance,
          status: 'planned',
          participant_count: 0,
          actual_cost: 0,
        },
      });

      return {
        success: true,
        message: `班级活动 ${activity.activity_name} 创建成功`,
        activity,
      };
    }),

  // 创建活动（通用接口保留）
  create: publicProcedure
    .input(z.object({
      classId: z.number(),
      activityName: z.string(),
      activityType: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.date(),
      endTime: z.date().optional(),
      organizerId: z.string().optional(),
      budgetAmount: z.number().default(0),
      requiredAttendance: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.class_activities.create({
        data: {
          class_id: input.classId,
          activity_name: input.activityName,
          activity_type: input.activityType,
          description: input.description,
          location: input.location,
          start_time: input.startTime,
          end_time: input.endTime,
          organizer_id: input.organizerId,
          budget_amount: input.budgetAmount,
          required_attendance: input.requiredAttendance,
          status: 'planned',
        },
      });
      return result;
    }),

  // 教师更新班级活动
  updateByTeacher: publicProcedure
    .input(z.object({
      activityId: z.number(),
      teacherId: z.string(),
      activityName: z.string().min(1).max(200).optional(),
      activityType: z.enum(["lecture", "seminar", "workshop", "field_trip", "competition", "social", "sports", "cultural", "volunteer", "other"]).optional(),
      description: z.string().optional(),
      location: z.string().max(200).optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      budgetAmount: z.number().min(0).optional(),
      actualCost: z.number().min(0).optional(),
      status: z.enum(["planned", "ongoing", "completed", "cancelled"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.activityId },
        select: {
          activity_id: true,
          class_id: true,
          activity_name: true,
          status: true,
          start_time: true,
          end_time: true,
        }
      });

      if (!activity) {
        throw new Error("活动不存在");
      }

      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: activity.class_id, teacher_id: input.teacherId },
      });

      if (!classInfo) {
        throw new Error("您没有权限修改该活动");
      }

      // 验证时间合理性
      const startTime = input.startTime || activity.start_time;
      const endTime = input.endTime || activity.end_time;
      
      if (endTime && endTime <= startTime) {
        throw new Error("结束时间必须晚于开始时间");
      }

      // 如果活动已完成，限制某些字段的修改
      if (activity.status === 'completed' && input.status !== 'completed') {
        if (input.startTime || input.endTime || input.budgetAmount) {
          throw new Error("已完成的活动不能修改时间和预算信息");
        }
      }

      const { activityId, teacherId, ...updateData } = input;

      const updatedActivity = await ctx.db.class_activities.update({
        where: { activity_id: input.activityId },
        data: {
          ...(updateData.activityName && { activity_name: updateData.activityName }),
          ...(updateData.activityType && { activity_type: updateData.activityType }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.location !== undefined && { location: updateData.location }),
          ...(updateData.startTime && { start_time: updateData.startTime }),
          ...(updateData.endTime !== undefined && { end_time: updateData.endTime }),
          ...(updateData.budgetAmount !== undefined && { budget_amount: updateData.budgetAmount }),
          ...(updateData.actualCost !== undefined && { actual_cost: updateData.actualCost }),
          ...(updateData.status && { status: updateData.status }),
          updated_at: new Date(),
        },
        select: {
          activity_id: true,
          class_id: true,
          activity_name: true,
          status: true,
          start_time: true,
          end_time: true,
          updated_at: true,
        }
      });

      return {
        success: true,
        message: `活动 ${updatedActivity.activity_name} 更新成功`,
        activity: updatedActivity,
      };
    }),

  // 教师删除班级活动
  deleteByTeacher: publicProcedure
    .input(z.object({
      activityId: z.number(),
      teacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证教师权限
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.activityId },
        select: {
          activity_id: true,
          class_id: true,
          activity_name: true,
          status: true,
          start_time: true,
          end_time: true,
        }
      });

      if (!activity) {
        throw new Error("活动不存在");
      }

      const classInfo = await ctx.db.classes.findUnique({
        where: { class_id: activity.class_id, teacher_id: input.teacherId },
      });

      if (!classInfo) {
        throw new Error("您没有权限删除该活动");
      }

      // 检查活动状态，如果正在进行或已完成，不允许删除
      if (activity.status === 'ongoing') {
        throw new Error("正在进行的活动不能删除");
      }

      if (activity.status === 'completed') {
        const participantCount = await ctx.db.activity_participants.count({
          where: { activity_id: input.activityId }
        });
        if (participantCount > 0) {
          throw new Error("已完成且有参与者的活动不能删除，建议改为取消状态");
        }
      }

      // 先删除相关的参与者记录（由于设置了级联删除，这一步可能不需要）
      await ctx.db.activity_participants.deleteMany({
        where: { activity_id: input.activityId }
      });

      // 删除活动
      await ctx.db.class_activities.delete({
        where: { activity_id: input.activityId }
      });

      return {
        success: true,
        message: `活动 ${activity.activity_name} 删除成功`,
      };
    }),

  // 教师获取班级活动列表
  getActivitiesByTeacher: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      classId: z.number().optional(),
      status: z.enum(["planned", "ongoing", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // 获取教师的班级列表
      const teacherClasses = await ctx.db.classes.findMany({
        where: { teacher_id: input.teacherId },
        select: { class_id: true }
      });

      const classIds = teacherClasses.map(c => c.class_id);

      if (classIds.length === 0) {
        return [];
      }

      const where: Record<string, unknown> = {
        class_id: { in: classIds }
      };

      if (input.classId) {
        where.class_id = input.classId;
      }

      if (input.status) {
        where.status = input.status;
      }

      const activities = await ctx.db.class_activities.findMany({
        where,
        orderBy: { start_time: "desc" },
      });

      return activities;
    }),

  // 更新活动（通用接口保留）
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      activityName: z.string().optional(),
      activityType: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      budgetAmount: z.number().optional(),
      actualCost: z.number().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      // 使用 Prisma 的类型安全更新而不是原始 SQL
      const result = await ctx.db.class_activities.update({
        where: { activity_id: id },
        data: {
          ...(updateData.activityName && { activity_name: updateData.activityName }),
          ...(updateData.activityType && { activity_type: updateData.activityType }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.location !== undefined && { location: updateData.location }),
          ...(updateData.startTime && { start_time: updateData.startTime }),
          ...(updateData.endTime && { end_time: updateData.endTime }),
          ...(updateData.budgetAmount !== undefined && { budget_amount: updateData.budgetAmount }),
          ...(updateData.actualCost !== undefined && { actual_cost: updateData.actualCost }),
          ...(updateData.status && { status: updateData.status }),
          updated_at: new Date(),
        },
      });
      
      return result;
    }),

  // 删除活动
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$queryRaw`
        DELETE FROM class_activities WHERE activity_id = ${input.id}
      `;
      return { success: true };
    }),

  // 获取教师相关的活动统计
  getTeacherActivityStats: publicProcedure
    .input(z.object({ teacherId: z.string() }))
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.$queryRaw`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN ca.status = 'planned' THEN 1 END) as planned_count,
          COUNT(CASE WHEN ca.status = 'ongoing' THEN 1 END) as ongoing_count,
          COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN ca.status = 'cancelled' THEN 1 END) as cancelled_count,
          COALESCE(SUM(ca.budget_amount), 0) as total_budget,
          COALESCE(SUM(ca.actual_cost), 0) as total_cost
        FROM class_activities ca
        JOIN classes cl ON ca.class_id = cl.class_id
        WHERE cl.teacher_id = ${input.teacherId}
      `;
      return (stats as any)[0];
    }),

  // 学生查看可参与的活动列表
  getActivitiesForStudent: publicProcedure
    .input(z.object({
      studentId: z.string(),
      status: z.enum(["planned", "ongoing", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // 获取学生选课的班级ID列表
      const studentEnrollments = await ctx.db.enrollments.findMany({
        where: { 
          student_id: input.studentId,
          status: "enrolled"
        },
        select: { class_id: true }
      });

      const classIds = studentEnrollments.map(e => e.class_id);

      if (classIds.length === 0) {
        return [];
      }

      const where: Record<string, unknown> = {
        class_id: { in: classIds }
      };

      if (input.status) {
        where.status = input.status;
      }

      const activities = await ctx.db.class_activities.findMany({
        where,
        orderBy: { start_time: "desc" },
      });

      return activities;
    }),

  // 学生报名参加活动
  registerForActivity: publicProcedure
    .input(z.object({
      activityId: z.number(),
      studentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证活动是否存在且可报名
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.activityId },
        select: {
          activity_id: true,
          class_id: true,
          status: true,
        }
      });

      if (!activity) {
        throw new Error("活动不存在");
      }

      if (activity.status === 'cancelled') {
        throw new Error("活动已取消，无法报名");
      }

      if (activity.status === 'completed') {
        throw new Error("活动已结束，无法报名");
      }

      // 验证学生是否在该活动的班级中
      const studentInClass = await ctx.db.enrollments.findFirst({
        where: {
          student_id: input.studentId,
          class_id: activity.class_id,
          status: "enrolled"
        }
      });

      if (!studentInClass) {
        throw new Error("您不在该活动的班级中，无法报名");
      }

      // 检查是否已经报名
      const existingRegistration = await ctx.db.activity_participants.findFirst({
        where: {
          activity_id: input.activityId,
          student_id: input.studentId,
        }
      });

      if (existingRegistration) {
        throw new Error("您已经报名参加了该活动");
      }

      // 创建报名记录
      const participation = await ctx.db.activity_participants.create({
        data: {
          activity_id: input.activityId,
          student_id: input.studentId,
          registration_time: new Date(),
          attendance_status: 'registered',
        },
      });

      // 更新活动参与人数
      await ctx.db.class_activities.update({
        where: { activity_id: input.activityId },
        data: {
          participant_count: {
            increment: 1
          }
        }
      });

      return {
        success: true,
        message: "报名成功",
        participation,
      };
    }),

  // 学生取消报名
  unregisterFromActivity: publicProcedure
    .input(z.object({
      activityId: z.number(),
      studentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证活动是否存在
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.activityId },
      });

      if (!activity) {
        throw new Error("活动不存在");
      }

      if (activity.status === 'ongoing') {
        throw new Error("活动正在进行中，无法取消报名");
      }

      if (activity.status === 'completed') {
        throw new Error("活动已结束，无法取消报名");
      }

      // 查找报名记录
      const participation = await ctx.db.activity_participants.findFirst({
        where: {
          activity_id: input.activityId,
          student_id: input.studentId,
        }
      });

      if (!participation) {
        throw new Error("您没有报名参加该活动");
      }

      if (participation.attendance_status === 'attended') {
        throw new Error("您已签到参加活动，无法取消报名");
      }

      // 删除报名记录
      await ctx.db.activity_participants.delete({
        where: {
          participant_id: participation.participant_id
        }
      });

      // 更新活动参与人数
      await ctx.db.class_activities.update({
        where: { activity_id: input.activityId },
        data: {
          participant_count: {
            decrement: 1
          }
        }
      });

      return {
        success: true,
        message: "取消报名成功",
      };
    }),

  // 学生签到活动
  checkInActivity: publicProcedure
    .input(z.object({
      activityId: z.number(),
      studentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证活动是否存在且正在进行
      const activity = await ctx.db.class_activities.findUnique({
        where: { activity_id: input.activityId },
      });

      if (!activity) {
        throw new Error("活动不存在");
      }

      if (activity.status !== 'ongoing') {
        throw new Error("活动尚未开始或已结束，无法签到");
      }

      // 查找报名记录
      const participation = await ctx.db.activity_participants.findFirst({
        where: {
          activity_id: input.activityId,
          student_id: input.studentId,
        }
      });

      if (!participation) {
        throw new Error("您没有报名参加该活动，无法签到");
      }

      if (participation.attendance_status === 'attended') {
        throw new Error("您已经签到过了");
      }

      // 更新签到状态
      const updatedParticipation = await ctx.db.activity_participants.update({
        where: {
          participant_id: participation.participant_id
        },
        data: {
          attendance_status: 'attended',
        }
      });

      return {
        success: true,
        message: "签到成功",
        participation: updatedParticipation,
      };
    }),

  // 学生提交活动反馈
  submitActivityFeedback: publicProcedure
    .input(z.object({
      activityId: z.number(),
      studentId: z.string(),
      feedback: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      // 查找参与记录
      const participation = await ctx.db.activity_participants.findFirst({
        where: {
          activity_id: input.activityId,
          student_id: input.studentId,
        }
      });

      if (!participation) {
        throw new Error("您没有参加该活动，无法提交反馈");
      }

      if (participation.attendance_status !== 'attended') {
        throw new Error("您没有签到参加活动，无法提交反馈");
      }

      // 更新反馈
      const updatedParticipation = await ctx.db.activity_participants.update({
        where: {
          participant_id: participation.participant_id
        },
        data: {
          feedback: input.feedback,
        }
      });

      return {
        success: true,
        message: "反馈提交成功",
        participation: updatedParticipation,
      };
    }),

  // 学生查看参与的活动记录
  getStudentActivityHistory: publicProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const participations = await ctx.db.activity_participants.findMany({
        where: {
          student_id: input.studentId,
        },
        include: {
          activity: {
            include: {
              class: {
                include: {
                  course: true
                }
              }
            }
          }
        },
        orderBy: {
          registration_time: "desc"
        }
      });

      return participations;
    }),
});