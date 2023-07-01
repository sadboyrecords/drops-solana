/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import slugify from "slugify";
import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PublicKey } from "@metaplex-foundation/umi";
import type { GuardGroup } from "@/hooks/types";
import type {
  CandyMachine,
  DefaultGuardSet,
} from "@metaplex-foundation/mpl-candy-machine";
import { safeFetchMintCounterFromSeeds } from "@metaplex-foundation/mpl-candy-machine";
import { amountToNumber } from "@metaplex-foundation/umi";
import type { Umi } from "@metaplex-foundation/umi";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertToSlug = (text: string) => {
  return slugify(text, {
    // replacement: "-",
    // remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
  });
};

export const hashJsonToNumber = (json: string): Promise<number[]> => {
  const jsonStr = JSON.stringify(json);
  const data = new TextEncoder().encode(jsonStr);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return new Promise(async (resolve) => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    resolve(hashArray);
  });
};

export const parseGuardGroup = async ({
  guards: guardsInput,
  userBalance,
  candyMachine,
  umi,
  candyGuardKey,
}: {
  guards: DefaultGuardSet;
  userBalance?: number;
  candyMachine: CandyMachine;
  candyGuardKey: PublicKey;
  umi: Umi;
}): Promise<GuardGroup> => {
  const guardsParsed: GuardGroup = {};
  guardsParsed.isEligible = true;
  guardsParsed.eligibleReason = [];

  // Check for start date
  if (guardsInput.startDate) {
    // @ts-ignore
    const date = new Date(Number(guardsInput.startDate?.value?.date) * 1000);
    guardsParsed.startTime = date;
    guardsParsed.hasStarted = date < new Date();
    if (date > new Date()) {
      guardsParsed.isEligible = false;
      guardsParsed.eligibleReason?.push("This sale hasn't started yet");
      guardsParsed.hasStarted = false;
    }
  }

  // Check for end date
  if (guardsInput.endDate) {
    guardsParsed.endTime = new Date(
      // @ts-ignore
      Number(guardsInput.endDate?.value.date) * 1000
    );
    guardsParsed.hasEnded = guardsParsed.endTime < new Date();
    if (guardsParsed.endTime < new Date()) {
      guardsParsed.isEligible = false;
      guardsParsed.eligibleReason?.push("This sale has ended");
      guardsParsed.hasEnded = true;
    }
  }

  // Check for mint limit
  // @ts-ignore
  if (guardsInput.mintLimit.value) {
    guardsParsed.mintLimit = {
      // @ts-ignore
      id: guardsInput.mintLimit.value.id,
      // @ts-ignore
      limit: guardsInput.mintLimit.value.limit,
    };
    const mintCounter = await safeFetchMintCounterFromSeeds(umi, {
      // @ts-ignore
      id: guardsInput.mintLimit.value.id,
      candyMachine: candyMachine.publicKey,
      candyGuard: candyGuardKey,
      user: umi.payer.publicKey,
    });
    console.log("mc", mintCounter);
    if (mintCounter) guardsParsed.totalMintedByUser = Number(mintCounter.count);
    if (
      mintCounter &&
      // @ts-ignore
      mintCounter.count >= guardsInput?.mintLimit.value.limit
    ) {
      guardsParsed.isEligible = false;
      guardsParsed.eligibleReason?.push(" You have reached the mint limit");
    }
  }

  // Check for redeemed list
  // @ts-ignore
  if (guardsInput.redeemedAmount.value) {
    // @ts-ignore
    const redeemLimit = Number(guardsInput.redeemedAmount.value.maximum);
    guardsParsed.redeemLimit = redeemLimit;
    if (Number(candyMachine.itemsRedeemed) > redeemLimit) {
      guardsParsed.isEligible = false;
      guardsParsed.eligibleReason?.push("The maximin amount has been redeemed");
    }
  }

  // Check for payment guards
  // @ts-ignore
  if (guardsInput.solPayment.value) {
    // @ts-ignore
    const amount = amountToNumber(guardsInput.solPayment.value.lamports);
    if (!userBalance) {
      guardsParsed.isEligible = false;
      guardsParsed.eligibleReason?.push("You need to sign in");
    }
    if (userBalance && amount > userBalance) {
      guardsParsed.isEligible = false;
      guardsParsed.eligibleReason?.push("You don't have enough SOL");
    }
    console.log({ guardsInput });
    guardsParsed.payment = {
      sol: {
        // @ts-ignore
        amount: amountToNumber(guardsInput.solPayment.value.lamports),
        // @ts-ignore
        destination: guardsInput.solPayment.value.destination,
        decimals: 9,
        // amount: guardsInput.solPayment.amount.basisPoints.toNumber(),
        // decimals: guardsInput.solPayment.amount.currency.decimals,
      },
    };
  }

  return guardsParsed;
};
