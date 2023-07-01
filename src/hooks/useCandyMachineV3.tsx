/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Transaction as Web3Transaction } from "@solana/web3.js";
import type { PublicKey as Web3PublicKey } from "@solana/web3.js";
import {
  generateSigner,
  signerIdentity,
  publicKey,
  amountToNumber,
  transactionBuilder,
  some,
} from "@metaplex-foundation/umi";
import type { Signer, Transaction } from "@metaplex-foundation/umi";
import {
  fetchDigitalAsset,
  fetchJsonMetadata,
  fetchAllDigitalAssetByOwner,
} from "@metaplex-foundation/mpl-token-metadata";
import type { DigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import {
  mplCandyMachine,
  fetchCandyMachine,
  fetchCandyGuard,
  mintV2,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { useSession } from "next-auth/react";
import { magic } from "@/lib/magic";
import {
  toWeb3JsLegacyTransaction,
  fromWeb3JsLegacyTransaction,
} from "@metaplex-foundation/umi-web3js-adapters";
import { useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity as walletIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { env } from "@/env.mjs";
import React, { useCallback } from "react";
import type { CandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import type { JsonMetadata } from "@metaplex-foundation/js";
import { type GuardGroup } from "./types";
import { parseGuardGroup } from "@/lib/utils";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";

interface MagicSignedTransaction {
  rawTransaction: Uint8Array;
  signature: {
    signature: Uint8Array;
    publicKey: Web3PublicKey;
  }[];
}
interface hookProps {
  candyMachineId: string;
}
export default function useCandyMachineV3({ candyMachineId }: hookProps) {
  const { data: session } = useSession();

  async function signTransactionMagic(
    tx: Web3Transaction
  ): Promise<Web3Transaction> {
    if (!magic) return tx;

    const serializeConfig = {
      requireAllSignatures: false,
      verifySignatures: true,
    };

    const signedTransaction = (await magic.solana.signTransaction(
      tx,
      serializeConfig
    )) as MagicSignedTransaction;

    const transaction = Web3Transaction.from(signedTransaction?.rawTransaction);

    // add missing signers from original transaction to the newly created one
    const missingSigners = transaction.signatures
      .filter((s) => !s?.signature)
      .map((s) => s.publicKey);
    missingSigners.forEach((publicKey) => {
      const signature = tx?.signatures.find((s) => {
        return publicKey.equals(s.publicKey);
      });

      if (signature?.signature)
        transaction.addSignature(publicKey, signature?.signature);
    });
    return transaction;
  }

  const createMagicSigner = React.useCallback(() => {
    if (!magic || !session) return;
    const signer: Signer = {
      publicKey: publicKey(session?.user.walletAddress),
      signTransaction: async (transaction: Transaction) => {
        const tx = toWeb3JsLegacyTransaction(transaction);
        const signedTransaction = await signTransactionMagic(tx);
        return fromWeb3JsLegacyTransaction(signedTransaction);
      },
      signAllTransactions: async (transactions: Transaction[]) => {
        const txs = transactions.map((tx) => toWeb3JsLegacyTransaction(tx));
        const signedTransactions = await Promise.all(
          txs.map((tx) => signTransactionMagic(tx))
        );
        return signedTransactions.map((tx) => fromWeb3JsLegacyTransaction(tx));
      },
      signMessage: async (message: Uint8Array) => {
        const msg =
          magic && ((await magic.solana.signMessage(message)) as Uint8Array);
        return msg as Uint8Array;
      },
    };
    return signer;
  }, [session]);

  const umi = React.useMemo(
    () => createUmi(env.NEXT_PUBLIC_RPC_HOST).use(mplCandyMachine()),
    []
  );
  const wallet = useWallet();
  React.useEffect(() => {
    if (session?.user.walletAddress) {
      if (session?.user.walletAddress === wallet.publicKey?.toBase58()) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        umi.use(walletIdentity(wallet));
      } else {
        const signer = createMagicSigner();
        if (signer) umi.use(signerIdentity(signer));
      }
    }
  }, [createMagicSigner, session?.user.walletAddress, umi, wallet]);

  const [status, setStatus] = React.useState({
    candyMachine: false,
    guardGroups: false,
    minting: false,
  });

  const [candyMachine, setCandyMachine] = React.useState<CandyMachine>();
  const [collection, setCollection] = React.useState<{
    data: DigitalAsset;
    metadata: JsonMetadata;
  }>();
  const [parsedGuards, setParsedGuards] =
    React.useState<{ label: string; guards: GuardGroup }[]>();
  const [balance, setBalance] = React.useState<number>();
  // const [nftHoldings, setNftHoldings] = React.useState<DigitalAsset[]>([]);

  const fetchCandyMachineData = React.useCallback(async () => {
    return await fetchCandyMachine(umi, publicKey(candyMachineId));
  }, [candyMachineId, umi]);

  const refresh = React.useCallback(async () => {
    setStatus((x) => ({ ...x, candyMachine: true }));
    const cm = await fetchCandyMachineData();
    const candyGuard = await fetchCandyGuard(umi, cm.mintAuthority);

    const dg = await fetchDigitalAsset(umi, cm.collectionMint);
    const metadata = await fetchJsonMetadata(umi, dg.metadata.uri);
    console.log({ candyGuard, dg, metadata, cm });
    // console.log({
    //   items: cm.items,
    //   loaded: cm.itemsLoaded,
    //   available: cm.data.itemsAvailable.toString(),
    // });
    setCandyMachine(cm);
    setCollection({
      data: dg,
      metadata,
    });

    setStatus((x) => ({ ...x, candyMachine: false }));

    // setItems({
    //   available: cm.items,
    //   remaining: cm.itemsRemaining.toNumber(),
    //   redeemed: cm.itemsMinted.toNumber(),
    // });
    // await fetchCandyMachine()
    //   .then((cndy) => {
    //     setCandyMachine(cndy);
    //     setItems({
    //       available: cndy.itemsAvailable.toNumber(),
    //       remaining: cndy.itemsRemaining.toNumber(),
    //       redeemed: cndy.itemsMinted.toNumber(),
    //     });

    //     return cndy;
    //   })
    //   .catch((e) => console.error("Error while fetching candy machine", e))
    //   .finally(() => setStatus((x) => ({ ...x, candyMachine: false })));
  }, [fetchCandyMachineData, umi]);

  const handleUser = useCallback(async () => {
    if (session?.user.walletAddress) {
      const balance = await umi.rpc.getBalance(
        publicKey(session?.user.walletAddress)
      );
      const amountNumber = amountToNumber(balance);
      setBalance(amountNumber);

      const nftsOwned = await fetchAllDigitalAssetByOwner(
        umi,
        publicKey(session?.user.walletAddress)
      );
      // console.log({ nftsOwned });

      // setNftHoldings(nftsOwned);
      return {
        balance: amountNumber,
        nftsOwned,
      };
    }
  }, [umi, session?.user.walletAddress]);

  const handleParseGuards = useCallback(async () => {
    if (!candyMachine) return;
    const userInfo = await handleUser();
    const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

    const defaultGuard = await parseGuardGroup({
      guards: candyGuard.guards,
      userBalance: userInfo?.balance,
      candyMachine,
      candyGuardKey: candyGuard.publicKey,
      umi,
    });

    const allGuards = await Promise.all(
      candyGuard.groups
        .filter((g) => {
          let entry = false;
          Object.entries(g.guards).forEach(([, value]) => {
            if (value.__option === "Some") entry = true;
          });
          return entry;
        })
        .map(async (g) => ({
          label: g.label,
          guards: await parseGuardGroup({
            guards: g.guards,
            userBalance: userInfo?.balance,
            candyMachine,
            candyGuardKey: candyGuard.publicKey,
            umi,
          }),
        }))
    );
    allGuards.unshift({ label: "default", guards: defaultGuard });
    setParsedGuards(allGuards);
    return allGuards;
  }, [candyMachine, handleUser, umi]);

  React.useEffect(() => {
    if (!candyMachineId) return;

    refresh().catch((e) => console.error("Error while refreshing", e));
  }, [candyMachineId, refresh]);

  // React.useEffect(() => {
  //   void handleUser();
  // }, [handleUser, session?.user.walletAddress]);

  React.useEffect(() => {
    void handleParseGuards();
  }, [handleParseGuards, umi, session?.user.walletAddress]);

  const mint = React.useCallback(
    async ({ label, guard }: { label: string; guard: GuardGroup }) => {
      if (!candyMachine) return;
      setStatus((x) => ({ ...x, minting: true }));
      const group = label === "default" ? undefined : label;
      const mintArgs = {
        mintLimit: guard?.mintLimit ? some({ id: guard.mintLimit.id }) : null,
      };
      console.log({ label, guard, group, mintArgs, candyMachine });
      const nftMint = generateSigner(umi);
      const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);
      const g = candyGuard.groups.find((g) => g.label === label);

      console.log({ g });
      const tx = await transactionBuilder()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
        .add(setComputeUnitLimit(umi, { units: 800_000 }))
        .add(
          mintV2(umi, {
            candyMachine: candyMachine.publicKey,
            nftMint,
            collectionMint: candyMachine.collectionMint, // collectionInfo.publicKey,
            collectionUpdateAuthority: candyMachine.authority, // collectionInfo.metadata.updateAuthority,
            group: label === "default" ? undefined : label,
            mintArgs: {
              mintLimit: guard?.mintLimit
                ? some({ id: guard.mintLimit.id })
                : null,
              solPayment: guard?.payment?.sol
                ? {
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    destination: g?.guards.solPayment?.value?.destination,
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    value: g?.guards.solPayment?.value,
                  }
                : null,
            },
            tokenStandard: candyMachine.tokenStandard,
            candyGuard: candyGuard.publicKey,
          })
        )
        .sendAndConfirm(umi);
      setStatus((x) => ({ ...x, minting: false }));
      await handleUser();
      await handleParseGuards();
      return {
        nftAddress: nftMint.publicKey,
        signature: tx.signature,
      };
    },
    [candyMachine, umi, handleUser, handleParseGuards]
  );

  return {
    umi,
    candyMachine,
    collection,
    parsedGuards,
    status,
    balance,
    refresh,
    mint,
  };
}
