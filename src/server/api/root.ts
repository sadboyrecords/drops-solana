import { exampleRouter } from "@/server/api/routers/example";
import { createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "./routers/users";
import { dropRouter } from "./routers/drop";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  user: userRouter,
  drop: dropRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
