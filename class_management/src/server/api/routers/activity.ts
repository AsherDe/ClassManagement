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
      let whereClause = "";
      let conditions = [];
      
      if (input?.classId) {
        conditions.push(`ca.class_id = ${input.classId}`);
      }
      if (input?.status) {
        conditions.push(`ca.status = '${input.status}'`);
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      const activities = await ctx.db.$queryRaw`
        SELECT 
          ca.activity_id,
          ca.class_id,
          ca.activity_name,
          ca.activity_type,
          ca.description,
          ca.location,
          ca.start_time,
          ca.end_time,
          ca.organizer_id,
          ca.budget_amount,
          ca.actual_cost,
          ca.participant_count,
          ca.required_attendance,
          ca.status,
          ca.created_at,
          s.student_id as organizer_student_id,
          u.real_name as organizer_name
        FROM class_activities ca
        LEFT JOIN students s ON ca.organizer_id = s.student_id
        LEFT JOIN users u ON s.user_id = u.user_id
        ORDER BY ca.start_time DESC
      `;
      
      // Apply filters in JavaScript since dynamic SQL in queryRaw can be problematic
      let filteredActivities = activities as any[];
      
      if (input?.classId) {
        filteredActivities = filteredActivities.filter((activity: any) => 
          activity.class_id === input.classId
        );
      }
      
      if (input?.status) {
        filteredActivities = filteredActivities.filter((activity: any) => 
          activity.status === input.status
        );
      }
      
      return filteredActivities;
    }),

  // 根据ID获取活动详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.$queryRaw`
        SELECT 
          ca.*,
          s.student_id as organizer_student_id,
          u.real_name as organizer_name
        FROM class_activities ca
        LEFT JOIN students s ON ca.organizer_id = s.student_id
        LEFT JOIN users u ON s.user_id = u.user_id
        WHERE ca.activity_id = ${input.id}
      `;
      return (activity as any)[0] || null;
    }),

  // 获取活动参与者列表
  getParticipants: publicProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.$queryRaw`
        SELECT 
          ap.participant_id,
          ap.activity_id,
          ap.student_id,
          ap.registration_time,
          ap.attendance_status,
          ap.feedback,
          u.real_name as student_name,
          s.grade,
          s.class_number
        FROM activity_participants ap
        JOIN students s ON ap.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        WHERE ap.activity_id = ${input.activityId}
        ORDER BY ap.registration_time
      `;
      return participants;
    }),

  // 创建活动
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

  // 更新活动
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
});