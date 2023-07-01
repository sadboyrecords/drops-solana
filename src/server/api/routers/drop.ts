import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import type { DropSchemaType } from "@/lib/schemaValidations/DropSchema";

async function createUniqueSlug(
  prisma: PrismaClient,
  slug: string
): Promise<string> {
  const slugged = slug
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .replace(/ /g, "-");
  let uniqueSlug = slugged;
  let counter = 1;
  let checking = true;
  while (checking) {
    try {
      const existingDrop = await prisma.drop.findUnique({
        where: { slug: uniqueSlug },
      });
      console.log({ existingDrop });
      if (!existingDrop) {
        checking = false;
        break;
      }
    } catch (error) {
      console.log({ error });
      throw new Error(`Error finding "${uniqueSlug}"`);
    }
    uniqueSlug = `${slugged}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

export const dropRouter = createTRPCRouter({
  getDraft: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.drop.findUnique({
        where: {
          ownerWalletAddress_slug: {
            ownerWalletAddress: ctx.session.user.walletAddress,
            slug: input,
          },
        },
      });
    }),
  getDropDetails: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.drop.findUnique({
        where: {
          slug: input,
        },
      });
    }),
  myDrops: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.drop.findMany({
      where: {
        ownerWalletAddress: ctx.session.user.walletAddress,
      },
    });
  }),
  allDrops: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.drop.findMany({
      where: {
        isPublic: true,
        // defaultEndDate: {
        // }
      },
    });
  }),
  createDrop: protectedProcedure
    .input(z.custom<DropSchemaType>())
    .mutation(async ({ ctx, input }) => {
      const slug = await createUniqueSlug(ctx.prisma, input.name);
      return ctx.prisma.drop.create({
        data: {
          slug,
          dropName: input.name,
          items: Number(input.itemsAvailable),
          description: input.description,
          formSubmission: input as object,
          defaultStartDate: input.defaultGuard.startDate,
          defaultEndDate: input.defaultGuard.endDate,
          defaultPrice: Number(input.defaultGuard.price),
          imageIpfsHash: input.imageIpfsHash,
          audioIpfsHash: input.audioIpfsHash,
          owner: {
            connect: {
              walletAddress: ctx.session?.user?.walletAddress,
              //
            },
          },
        },
      });
    }),
  updateDrop: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        drop: z.custom<DropSchemaType>(),
        jsonIpfshash: z.string().optional(),
        metaDataHash: z.array(z.number()).optional(),
        step: z
          .enum([
            "METADATA_UPLOAD",
            "CREATE_COLLECTION",
            "CREATE_CANDY_MACHINE",
            "INSERT_ITEMS",
            "SAVE_DATA",
            "LAUNCHED",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = await createUniqueSlug(ctx.prisma, input.drop.name);
      const drop = input.drop;
      return ctx.prisma.drop.update({
        where: {
          ownerWalletAddress_slug: {
            ownerWalletAddress: ctx.session.user.walletAddress,
            slug: input.slug,
          },
        },
        data: {
          slug,
          dropName: drop.name,
          items: Number(drop.itemsAvailable),
          description: drop.description,
          formSubmission: drop as object,
          defaultStartDate: drop.defaultGuard.startDate,
          defaultEndDate: drop.defaultGuard.endDate,
          defaultPrice: Number(drop.defaultGuard.price),
          imageIpfsHash: drop.imageIpfsHash,
          audioIpfsHash: drop.audioIpfsHash,
          owner: {
            connect: {
              walletAddress: ctx.session?.user?.walletAddress,
            },
          },
        },
      });
    }),
  updateLaunch: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        jsonIpfshash: z.string().optional(),
        metaDataHash: z.array(z.number()).optional(),
        collectionAddress: z.string().optional(),
        candyMachineAddress: z.string().optional(),
        launch: z.boolean().optional(),
        isDraft: z.boolean().optional(),
        creators: z.array(z.string()).optional(),
        step: z
          .enum([
            "METADATA_UPLOAD",
            "CREATE_COLLECTION",
            "CREATE_CANDY_MACHINE",
            "INSERT_ITEMS",
            "SAVE_DATA",
            "LAUNCHED",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.drop.update({
        where: {
          ownerWalletAddress_slug: {
            ownerWalletAddress: ctx.session.user.walletAddress,
            slug: input.slug,
          },
        },
        data: {
          step: input.step,
          jsonIpfsHash: input.jsonIpfshash,
          metadataHash: input.metaDataHash,
          collectionAddress: input.collectionAddress,
          candyMachineId: input.candyMachineAddress,
          isDraft: input.isDraft,
          isPublished: input.launch,
          isPublic: input.launch,
          creators: {
            connectOrCreate: input.creators?.map((creator) => ({
              where: { walletAddress: creator },
              create: { walletAddress: creator },
            })),
          },
        },
      });
    }),
});
