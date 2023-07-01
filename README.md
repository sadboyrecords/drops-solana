# Candy Machine v3 with UMI

This project is not fully production ready yet. This project uses Candy Machine v3 with Umi library. This project is a reference UI to implement Metaplex Candy Machine V3 on the frontend with the new UMI Library. Some packages are still in alpha therefore I would not recommend using them in a production environment.

## What we used

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Magic Link](https://magic.link/)
- [CandyMachine v3]()
- [Thirdweb Storage](https://portal.thirdweb.com/typescript/storage)
- [Shadcn/ui](https://ui.shadcn.com)
- [Radix-ui](https://www.radix-ui.com)

### Implemented features

- [x] Responsive UI
- [x] Email Authentication + minting w/ Magic Link
- [x] Session Management w/ Next Auth
- [x] Candy Machine creation via UI
- [ ] Candy Machine creation form validation
- [x] Basic audio player
- [x] Single Mint UI
- [x] Countdown Timer
- [x] Preview Minted NFTs
- [x] Supported Guards (WIP)
  - [x] Start Date
  - [x] End Date
  - [x] Sol Payment
  - [x] Mint Limit
  - [x] Redeemed Amount
  - [ ] Token Payment
  - [ ] Bot Tax
  - [ ] Token Burn
  - [ ] Token Gate
  - [ ] NFT Payment
  - [ ] NFT Burn
  - [ ] NFT Gate
  - [ ] Address Gate
  - [ ] Allow List
  - [ ] Gatekeeper
- [ ] Multi Mint
- [ ] Purchased NFT Preview
- [ ] User profile + wallet balance preview

## Things to note

### Magic Link

Magic only provides an Eth address as the public address. We need to convert it to Solana address. In the event you want your app to be multi chain and enable your users to keep the same account across chains, here is an example of what you can do in your `auth.ts` file to use the same public address across chains.

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

### Preview

![Desktop preview](https://github.com/sadboyrecords/drops-solana/blob/main/public/screenshots/collection-details.png)

### Env Variables

You will need the following environment variables to run this project. You can create a `.env.local` file in the root of the project and add the following variables.

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- NEXT_PUBLIC_MAGIC_PK
- MAGIC_SK
- NEXT_PUBLIC_RPC_HOST
- NEXT_PUBLIC_SOLANA_NETWORK

## Collaborating

Feel free to submit a pull request to the main branch if you would like to collaborate on this repo.

## Feedback/Support

If you have any feedback or need support, please submit an issue through [Github Issues](https://github.com/sadboyrecords/drops-solana/issues).
