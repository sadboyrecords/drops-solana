import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  myProfile: protectedProcedure.query(({ ctx }) => {
    // console.log({ session: ctx.session });
    if (!ctx.session || !ctx.session.user.walletAddress) {
      throw new Error("No wallet address found in session");
    }
    return ctx.prisma.user.upsert({
      where: { walletAddress: ctx.session.user.walletAddress },
      update: {
        email: ctx.session.user.email,
      },
      create: {
        walletAddress: ctx.session.user.walletAddress,
        email: ctx.session.user.email,
        magicSolanaAddress: ctx.session.user.magicSolanaAddress,
      },
    });
  }),
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user) {
      throw new Error("No wallets provided");
    }
    const users = await ctx.prisma.user.findMany({
      where: {
        walletAddress: {
          in: ctx.session.user.walletAddress,
        },
      },
    });
    return users;
  }),
});
