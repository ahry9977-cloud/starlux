import { router, publicProcedure } from "./trpc";

export const systemRouter = router({
  ping: publicProcedure.query(() => ({ ok: true })),
});
