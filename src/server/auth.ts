/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { GetServerSidePropsContext } from "next";
import type { NextAuthOptions, DefaultSession } from "next-auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/server/db";
import type { NextApiRequest } from "next";
import CredentialsProvider from "next-auth/providers/credentials";
import { SigninMessage } from "@/lib/SignMessage";
import { getCsrfToken } from "next-auth/react";
import { authProviderNames } from "@/lib/constants";
import { env } from "@/env.mjs";
import { Magic, WalletType } from "@magic-sdk/admin";

const magic: Magic = new Magic(env.MAGIC_SK);

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      walletAddress: string;
      provider?: string;
      magicSolanaAddress?: string;
    } & DefaultSession["user"];
  }
}

export function authOptions(req: NextApiRequest): NextAuthOptions {
  const providers = [
    CredentialsProvider({
      id: authProviderNames.solana,
      name: "Solana",
      type: "credentials",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
      },
      async authorize(credentials) {
        try {
          const signinMessage = new SigninMessage(
            JSON.parse(credentials?.message || "{}")
          );

          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL || "");

          if (signinMessage.domain !== nextAuthUrl.host) {
            return null;
          }

          const csrfToken = await getCsrfToken({
            req: { headers: req.headers },
          });
          if (signinMessage.nonce !== csrfToken) {
            return null;
          }

          const validationResult = signinMessage.validate(
            credentials?.signature || ""
          );

          if (!validationResult)
            throw new Error("Could not validate the signed message");

          return {
            id: signinMessage.publicKey,
            walletAddress: signinMessage.publicKey,
          };
        } catch (e) {
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: authProviderNames.magic,
      name: "Magic Link",
      type: "credentials",
      credentials: {
        didToken: { label: "DID Token", type: "text" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.didToken) return null;
          magic.token.validate(credentials?.didToken || "");
          const metadata = await magic.users.getMetadataByToken(
            credentials?.didToken || ""
          );
          const walletData = await magic.users.getMetadataByTokenAndWallet(
            credentials?.didToken || "",
            WalletType.SOLANA
          );

          const solanaAddress = walletData.wallets?.find(
            // @ts-ignore This is a typscript issue from magic
            (wallet) => wallet.wallet_type === WalletType.SOLANA
            // @ts-ignore
          )?.public_address as string;
          const data = {
            id: solanaAddress, //metadata.publicAddress as string,
            walletAddress: solanaAddress, // metadata.publicAddress as string,
            email: metadata.email as string | null | undefined,
            wallets: metadata.wallets,
            phoneNumber: metadata.phoneNumber as string | null | undefined,
            provider: authProviderNames.magic,
            issuer: metadata.issuer,
            // magicSolanaAddress: solanaAddress,
          };
          console.log({ data });
          return data;
        } catch (e) {
          return null;
        }
      },
    }),

    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ];
  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth?.includes("signin");
  if (isDefaultSigninPage) {
    providers.pop();
  }

  return {
    callbacks: {
      jwt: ({ token, user }) => {
        user && (token.user = user);
        return token;
      },
      session: ({ session, token }) => {
        session = {
          ...session,
          user: {
            // @ts-ignore
            ...token?.user,
          },
        };
        return session;
      },
    },
    adapter: PrismaAdapter(prisma),
    providers,
    debug: true,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
  };
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  const options = authOptions(ctx.req as NextApiRequest);
  return getServerSession(ctx.req, ctx.res, options);
};
