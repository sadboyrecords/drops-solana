import { env } from "@/env.mjs";

export const authProviderNames = {
  magic: "magic-link",
  solana: "solana-auth",
};

export const routes = {
  home: {
    label: "Home",
    href: "/",
  },
  myDrops: {
    label: "My Drops",
    href: "/my-drops",
  },
  liveDrops: {
    label: "Drops",
    href: "/live-drops",
  },
  createDrop: {
    label: "New Drop",
    href: "/create-drop",
  },
  dropDetails: (slug: string) => ({
    label: `Drop Draft`,
    href: `/drop/details/${slug}`,
  }),
  draftDrops: (slug: string) => ({
    label: `Drop Draft}`,
    href: `/drop/draft/${slug}`,
  }),
  editDrop: (slug: string) => ({
    label: `Drop Draft}`,
    href: `/drop/edit/${slug}`,
  }),
};

export const solscanUrls = (address: string) => {
  return {
    tokenDetails: `https://solscan.io/token/${address}${
      env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : ""
    }`,
    transactionDetails: `https://solscan.io/tx/${address}${
      env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : ""
    }`,
  };
};
