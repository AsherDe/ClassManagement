import { authRouter } from "~/server/api/routers/auth";
import { userRouter } from "~/server/api/routers/user";
import { classRouter } from "~/server/api/routers/class";
import { gradeRouter } from "~/server/api/routers/grade";
import { postRouter } from "~/server/api/routers/post";
import { studentRouter } from "~/server/api/routers/student";
import { courseRouter } from "~/server/api/routers/course";
import { activityRouter } from "~/server/api/routers/activity";
import { adminRouter } from "~/server/api/routers/admin";
import { teacherRouter } from "~/server/api/routers/teacher";
import { studentInfoRouter } from "~/server/api/routers/student-info";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  class: classRouter,
  grade: gradeRouter,
  post: postRouter,
  student: studentRouter,
  course: courseRouter,
  activity: activityRouter,
  admin: adminRouter,
  teacher: teacherRouter,
  studentInfo: studentInfoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
