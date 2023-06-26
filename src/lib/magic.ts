import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";
import { env } from "@/env.mjs";

const createMagic = (key: string) =>
  typeof window != "undefined" &&
  new Magic(key, {
    extensions: [
      new SolanaExtension({
        rpcUrl: env.NEXT_PUBLIC_RPC_HOST,
      }),
    ],
  });

export const magic = createMagic(env.NEXT_PUBLIC_MAGIC_PK);
