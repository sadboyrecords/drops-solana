/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import type { DropSchemaType } from "@/lib/schemaValidations/DropSchema";
import { api } from "@/utils/api";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { useRouter } from "next/router";
import { cn, hashJsonToNumber } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/svg/Spinner";
import { Button } from "../ui/button";
import {
  PublicKey as Web3PublicKey,
  Transaction as Web3Transaction,
} from "@solana/web3.js";
import {
  generateSigner,
  percentAmount,
  signerIdentity,
  publicKey,
  sol,
} from "@metaplex-foundation/umi";
import type { Signer, Transaction } from "@metaplex-foundation/umi";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import {
  create,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { useSession } from "next-auth/react";
import { magic } from "@/lib/magic";
import {
  toWeb3JsLegacyTransaction,
  fromWeb3JsLegacyTransaction,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity as walletIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { env } from "@/env.mjs";

const storage = new ThirdwebStorage();

type DescriptionType = {
  PENDING: string;
  IN_PROGRESS: string;
  COMPLETED: string;
  ERROR: string;
  START: string;
};
interface Steps {
  step: string;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ERROR" | "START";
  description: DescriptionType;
  start?: () => void;
}

interface MagicSignedTransaction {
  rawTransaction: Uint8Array;
  signature: {
    signature: Uint8Array;
    publicKey: Web3PublicKey;
  }[];
}

function LaunchSteps() {
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

    // const updatedSignatures = transaction.signatures.filter(
    //   (s) => s?.signature
    // );
    // const updateTransaction = transaction;
    // updateTransaction.signatures = updatedSignatures;
    // .addSignatures(updatedSignatures)
    //
    // const signature = await connection.sendRawTransaction(
    //   transaction.serialize(),
    //   {}
    // );
    //
    //               .sendAndConfirmTransaction(tx, { commitment: "finalized" })

    return transaction;
    // return signedTransaction
  }
  const { data: session } = useSession();

  const createMagicSigner = useCallback(() => {
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
        // @ts-ignore
        const msg = await magic.solana.signMessage(message);
        return msg as Uint8Array;
      },
    };
    return signer;
  }, [session]);

  const umi = useMemo(
    () =>
      createUmi(env.NEXT_PUBLIC_RPC_HOST)
        // .use(walletIdentity(wallet))
        // .use(signerIdentity(createNoopSigner(publicKey(session?.user.walletAddress))))
        .use(mplCandyMachine()),
    []
  );
  const wallet = useWallet();
  useEffect(() => {
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

  const { query } = useRouter();
  const slug = query.slug;
  const { data: drop, refetch } = api.drop.getDraft.useQuery(
    query?.slug as string,
    {
      enabled: !!slug,
      staleTime: 1000 * 3, // 3 seconds
    }
  );

  const [mintingSteps, setMintingSteps] = useState<Steps[]>();
  const [isMinting, setIsMinting] = useState(false);
  const formSubmission = drop?.formSubmission as unknown as DropSchemaType;

  const updateMutation = api.drop.updateLaunch.useMutation();

  const uploadMetadata = async () => {
    try {
      if (!drop) {
        toast.error("Can't upload at this time");
        return;
      }
      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.METADATA_UPLOAD) {
          return {
            ...step,
            status: stepperStatus.inProgress,
          } as Steps;
        }
        return step;
      });
      setMintingSteps(newSteps);
      setIsMinting(true);

      let metaData = {
        name: formSubmission?.name,
        description: formSubmission?.description,
        symbol: formSubmission?.symbol,
        image: storage.resolveScheme(formSubmission?.imageIpfsHash),
        attributes: {
          trait_type: "Exchange",
          vales: "OpenSource NFT Marketplace",
        },
        properties: {
          files: [
            {
              uri: storage.resolveScheme(formSubmission?.imageIpfsHash),
              type: "image/png",
            },
          ],
          category: "image",
        },
      };

      if (formSubmission?.audioIpfsHash) {
        metaData = {
          ...metaData,
          properties: {
            files: [
              {
                uri: storage.resolveScheme(formSubmission?.imageIpfsHash),
                type: "image/png",
              },
              {
                uri: storage.resolveScheme(formSubmission?.audioIpfsHash),
                type: "audio/mp3",
              },
            ],
            category: "audio",
          },
        };
      }

      const url = await storage.upload(metaData, {
        uploadWithoutDirectory: true,
        uploadWithGatewayUrl: true, //to resolve urls
      });
      const jsonIpfsHash = url.split("ipfs/").pop();
      if (!jsonIpfsHash) {
        toast.error(
          "Sorry there was an issue uploading your metadata. Please try again later."
        );
        setIsMinting(false);

        return;
      }
      const str = JSON.stringify(metaData);
      const hash = await hashJsonToNumber(str);
      await updateMutation.mutateAsync({
        slug: drop.slug,
        step: "CREATE_COLLECTION",
        jsonIpfshash: "ipfs://" + jsonIpfsHash, // doing this to keep things consistent.
        metaDataHash: hash,
        isDraft: false,
      });
      await refetch();
      setIsMinting(false);
    } catch (error) {
      setIsMinting(false);

      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.METADATA_UPLOAD) {
          return {
            ...step,
            status: stepperStatus.error,
          } as Steps;
        }
        return step;
      });
      setMintingSteps(newSteps);

      toast.error(
        "Sorry there was an issue uploading your metadata. Please try again later."
      );
    }
  };

  const createCollection = async () => {
    if (!drop || !drop.jsonIpfsHash || !magic || !session) {
      toast.error("Can't create collection at this time");
      return;
    }
    if (drop.collectionAddress) {
      await updateMutation.mutateAsync({
        slug: drop.slug,
        step: "CREATE_CANDY_MACHINE",
      });

      return;
    }

    const newSteps = originalSteps?.map((step) => {
      if (step?.step === stepperKeys.CREATE_COLLECTION) {
        return {
          ...step,
          status: stepperStatus.inProgress,
        } as Steps;
      }
      return step;
    });
    setMintingSteps(newSteps);
    try {
      setIsMinting(true);

      const collectionMint = generateSigner(umi);
      const metadataUri = storage.resolveScheme(drop.jsonIpfsHash);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const builder = createNft(umi, {
        mint: collectionMint,
        authority: umi.payer, // collectionUpdateAuthority,
        name: formSubmission?.name,
        symbol: formSubmission?.symbol,
        uri: metadataUri, //drop.jsonIpfsHash,
        sellerFeeBasisPoints: percentAmount(
          Number(formSubmission.sellerFeeBasisPoints),
          2
        ), // 9.99%
        isCollection: true,
        creators: formSubmission.creatorSplits.map((creator) => ({
          address: fromWeb3JsPublicKey(new Web3PublicKey(creator.address)),
          share: Number(creator.share),
          verified: true,
        })),
      });

      const confirm = await builder.sendAndConfirm(umi, {
        confirm: { commitment: "finalized" },
        send: {
          skipPreflight: true,
        },
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (confirm?.value?.err) {
        toast.error("Sorry there was an issue creating your collection.");
        const newSteps = originalSteps?.map((step) => {
          if (step?.step === stepperKeys.CREATE_COLLECTION) {
            return {
              ...step,
              status: stepperStatus.error,
            } as Steps;
          }
          return step;
        });
        setMintingSteps(newSteps);
        setIsMinting(false);

        return;
      }
      setIsMinting(false);

      await updateMutation.mutateAsync({
        slug: drop.slug,
        step: "CREATE_CANDY_MACHINE",
        collectionAddress: collectionMint.publicKey,
      });
      await refetch();
    } catch (error) {
      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.CREATE_COLLECTION) {
          return {
            ...step,
            status: stepperStatus.error,
          } as Steps;
        }
        return step;
      });

      setMintingSteps(newSteps);
      toast.error(
        "Sorry there was an issue creating your collection. Please try again later."
      );
      setIsMinting(false);
    }
  };

  const createDrop = async () => {
    if (
      !drop?.collectionAddress ||
      !drop?.metadataHash ||
      !drop?.jsonIpfsHash
    ) {
      return;
    }
    const newSteps = originalSteps?.map((step) => {
      if (step?.step === stepperKeys.CREATE_CANDY_MACHINE) {
        return {
          ...step,
          status: stepperStatus.inProgress,
        } as Steps;
      }
      return step;
    });
    setMintingSteps(newSteps);
    try {
      setIsMinting(true);
      // with hidden settings we can modify our candy machine items
      // with config lines you can't once created
      const candyMachine = generateSigner(umi);
      const candy = await create(umi, {
        candyMachine,
        collectionMint: publicKey(drop?.collectionAddress),
        collectionUpdateAuthority: umi.payer,
        tokenStandard: 0, //TokenStandard.NonFungible
        sellerFeeBasisPoints: percentAmount(
          Number(formSubmission.sellerFeeBasisPoints),
          2
        ),
        itemsAvailable: Number(formSubmission.itemsAvailable),
        hiddenSettings: {
          hash: new Uint8Array(drop?.metadataHash),
          uri: storage.resolveScheme(drop.jsonIpfsHash),
          name: formSubmission?.name + " #$ID+1$",
        },
        guards: {
          startDate: {
            date: new Date(formSubmission.defaultGuard.startDate),
          },
          endDate: formSubmission.defaultGuard.endDate && {
            date: new Date(formSubmission.defaultGuard.endDate),
          },
          solPayment: {
            lamports: sol(Number(formSubmission.defaultGuard.price)),
            destination: fromWeb3JsPublicKey(
              new Web3PublicKey(formSubmission.defaultGuard.paymentDestination)
            ),
          },
        },
        creators: formSubmission.creatorSplits.map((c) => ({
          address: fromWeb3JsPublicKey(new Web3PublicKey(c.address)),
          percentageShare: Number(c.share),
          verified: true,
        })),
        groups: formSubmission?.guards?.map((guard) => ({
          label: guard.label,
          guards: {
            startDate: guard.startDate && {
              date: new Date(guard.startDate),
            },
            endDate: guard.endDate && {
              date: new Date(guard.endDate),
            },
            solPayment: guard.price
              ? {
                  lamports: sol(Number(guard.price)),
                  destination: fromWeb3JsPublicKey(
                    new Web3PublicKey(guard.paymentDestination)
                  ),
                }
              : null,
            mintLimit: guard.mintLimit
              ? {
                  id: 1,
                  limit: Number(guard.mintLimit),
                }
              : null,
            redeemedAmount: guard.redeemAmount
              ? {
                  maximum: Number(guard.redeemAmount),
                }
              : null,
          },
        })),
      });
      await candy.sendAndConfirm(umi);
      const candyMachineAddress = candyMachine.publicKey;
      await updateMutation.mutateAsync({
        slug: drop.slug,
        step: "SAVE_DATA",
        candyMachineAddress,
      });
      await refetch();
      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.CREATE_COLLECTION) {
          return {
            ...step,
            status: stepperStatus.completed,
          } as Steps;
        }
        return step;
      });
      setMintingSteps(newSteps);
      setIsMinting(false);
    } catch (error) {
      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.CREATE_COLLECTION) {
          return {
            ...step,
            status: stepperStatus.error,
          } as Steps;
        }
        return step;
      });

      setMintingSteps(newSteps);
      toast.error("Sorry there was an issue creating your drop.");
      setIsMinting(false);
    }
  };

  const publishDrop = async () => {
    if (!drop) {
      toast.error("Can't save your drop at this time");
      return;
    }
    setIsMinting(true);
    const newSteps = originalSteps?.map((step) => {
      if (step?.step === stepperKeys.SAVE_DATA) {
        return {
          ...step,
          status: stepperStatus.inProgress,
        } as Steps;
      }
      return step;
    });
    setMintingSteps(newSteps);

    try {
      await updateMutation.mutateAsync({
        slug: drop.slug,
        step: "LAUNCHED",
        launch: true,
        creators: formSubmission?.creatorSplits.map((split) => {
          return split.address;
        }),
      });
      await refetch();
      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.SAVE_DATA) {
          return {
            ...step,
            status: stepperStatus.completed,
          } as Steps;
        }
        return step;
      });
      setMintingSteps(newSteps);
    } catch (error) {
      const newSteps = originalSteps?.map((step) => {
        if (step?.step === stepperKeys.SAVE_DATA) {
          return {
            ...step,
            status: stepperStatus.error,
          } as Steps;
        }
        return step;
      });
      setMintingSteps(newSteps);
      setIsMinting(false);
      toast.error(
        "Sorry there was an issue creating your collection. Please try again later."
      );
    }
  };

  const stepperStatus = {
    start: "START",
    pending: "PENDING",
    inProgress: "IN_PROGRESS",
    completed: "COMPLETED",
    error: "ERROR",
  };

  const stepperKeys = {
    METADATA_UPLOAD: "METADATA_UPLOAD",
    CREATE_COLLECTION: "CREATE_COLLECTION",
    CREATE_CANDY_MACHINE: "CREATE_CANDY_MACHINE",
    INSERT_ITEMS: "INSERT_ITEMS",
    SAVE_DATA: "SAVE_DATA",
    LAUNCH: "LAUNCHED",
  };
  const originalSteps: Steps[] = [
    {
      step: stepperKeys.METADATA_UPLOAD,
      name: "Upload Metadata",
      status: "PENDING",
      description: {
        PENDING: "Upload your metadata on chain",
        IN_PROGRESS: "Uploading your metadata",
        COMPLETED: "Uploaded metadata",
        ERROR: "Couldn't upload metadata",
        START: "Time to upload your metadata ",
      },
      start: uploadMetadata,
    },
    {
      step: stepperKeys.CREATE_COLLECTION,
      status: "PENDING",
      name: "Create Collection",
      description: {
        PENDING: "Create your collection on chain",
        IN_PROGRESS: "Creating your collection on chain",
        COMPLETED: "Collection Created on chain",
        ERROR: "Couldn't create your collection",
        START: "Create your collection on chain",
      },
      start: createCollection,
    },
    {
      step: stepperKeys.CREATE_CANDY_MACHINE,
      status: "PENDING",
      name: "Create Drop",
      description: {
        PENDING: "Create Drop with Candy Machine on Solana ",
        IN_PROGRESS: "Creating your drop with Candy Machine",
        COMPLETED: "Candy Machine Created",
        ERROR: "Couldn't create your drop",
        START: "Create Drop on Solana",
      },
      start: createDrop,
    },
    {
      step: stepperKeys.SAVE_DATA,
      name: "Save Data",
      status: "PENDING",
      description: {
        PENDING: "Publish your drop",
        IN_PROGRESS: "Publishing your drop ",
        COMPLETED: "Drop Published",
        ERROR: "Couldn't publish this drop, please try again later",
        START: "Publish your drop",
      },
      start: publishDrop,
    },
  ];

  useEffect(() => {
    if (drop) {
      if (drop?.step === "METADATA_UPLOAD") {
        const newSteps = originalSteps?.map((step) => {
          if (step?.step === stepperKeys.METADATA_UPLOAD) {
            return {
              ...step,
              status: stepperStatus.start,
            } as Steps;
          }
          return step;
        });
        setMintingSteps(newSteps);
      }
      if (drop?.step === "CREATE_COLLECTION") {
        const newSteps = originalSteps?.map((step) => {
          if (step?.step === stepperKeys.METADATA_UPLOAD) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_COLLECTION) {
            return {
              ...step,
              status: stepperStatus.start,
            } as Steps;
          }
          return step;
        });
        setMintingSteps(newSteps);
      }
      if (drop.step === "CREATE_CANDY_MACHINE") {
        const newSteps = originalSteps?.map((step) => {
          if (step?.step === stepperKeys.METADATA_UPLOAD) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_COLLECTION) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_CANDY_MACHINE) {
            return {
              ...step,
              status: stepperStatus.start,
            } as Steps;
          }
          return step;
        });
        setMintingSteps(newSteps);
      }
      if (drop.step === "SAVE_DATA") {
        const newSteps = originalSteps?.map((step) => {
          if (step?.step === stepperKeys.METADATA_UPLOAD) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_COLLECTION) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_CANDY_MACHINE) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.SAVE_DATA) {
            return {
              ...step,
              status: stepperStatus.start,
            } as Steps;
          }
          return step;
        });
        setMintingSteps(newSteps);
      }
      if (drop.step === "LAUNCHED") {
        const newSteps = originalSteps?.map((step) => {
          if (step?.step === stepperKeys.METADATA_UPLOAD) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_COLLECTION) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.CREATE_CANDY_MACHINE) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          if (step?.step === stepperKeys.SAVE_DATA) {
            return {
              ...step,
              status: stepperStatus.completed,
            } as Steps;
          }
          return step;
        });
        setMintingSteps(newSteps);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drop]);

  if (!drop) return null;

  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-lg font-semibold">Launch your drop</p>
      <nav aria-label="Progress" className="mt-4">
        <ol role="list" className="overflow-hidden">
          {mintingSteps?.map((step, idx) => (
            <li
              key={step.name}
              className={cn(
                idx !== mintingSteps.length - 1 ? "pb-10" : "",
                "relative"
              )}
            >
              {step.status === "COMPLETED" ? (
                <>
                  {idx !== mintingSteps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-primary-600"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="group relative flex items-start">
                    <span className="flex h-9 items-center">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 group-hover:bg-primary-800">
                        <CheckIcon
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span className="text-sm font-medium">{step.name}</span>
                      <span className="text-sm text-gray-500">
                        {step.description[step.status]}
                      </span>
                    </span>
                  </div>
                </>
              ) : step.status === "START" ||
                step.status === "IN_PROGRESS" ||
                step.status === "ERROR" ? (
                <>
                  {idx !== mintingSteps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div
                    className="group relative flex items-start"
                    aria-current="step"
                  >
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2  bg-white ${
                          step.status === "ERROR"
                            ? "border-red-600"
                            : "border-primary-600"
                        }`}
                      >
                        {step.status === "IN_PROGRESS" ? (
                          <Spinner className="text-primary" />
                        ) : (
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              step.status === "ERROR"
                                ? "bg-red-600"
                                : "bg-primary-600"
                            } `}
                          />
                        )}
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span
                        className={`text-sm font-medium ${
                          step.status === "ERROR"
                            ? "text-red-600"
                            : "text-primary-600"
                        }`}
                      >
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {step.description[step.status]}
                      </span>
                      <Button
                        disabled={isMinting}
                        className="mt-3 items-center"
                        onClick={step.start}
                      >
                        {isMinting ? (
                          <Spinner />
                        ) : (
                          <>{step.status === "START" ? "Start" : "Retry"}</>
                        )}
                      </Button>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {idx !== mintingSteps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="group relative flex items-start">
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-gray-500">
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {step.description[step.status]}
                      </span>
                    </span>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

export default LaunchSteps;
