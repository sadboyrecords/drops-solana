# Drops on Solana

This project provides basic minimal functionality to show you how you can create your own drops & music player on Solana

## What we used

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Magic Link](https://magic.link/)
- [CandyMachine v3]()

## Getting Started

## Things to note

Magic only provides Eth address as the public address. We need to convert it to Solana address. If you want users to keep the same account across chains, you can use the following code to convert the Eth address to Solana address.

```js
   const data = {
    id: metadata.publicAddress as string,
    walletAddress: metadata.publicAddress as string,
    email: metadata.email as string | null | undefined,
    wallets: metadata.wallets,
    phoneNumber: metadata.phoneNumber as string | null | undefined,
    provider: authProviderNames.magic,
    issuer: metadata.issuer,
    magicSolanaAddress: solanaAddress,
    };
```

### Prerequisites

## Features

Reference UI to implement Metaplex Candy Machine V3 on frontend.

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](**https**://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

things that can be improved

- additional date validation
