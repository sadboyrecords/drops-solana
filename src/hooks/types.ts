import {
  type Metadata,
  type MintLimitGuardSettings,
  type Pda,
} from "@metaplex-foundation/js";
import { type AccountInfo, type PublicKey } from "@solana/web3.js";

export type MintLimitLogics = {
  settings: MintLimitGuardSettings;
  pda?: Pda;
  accountInfo?: AccountInfo<Buffer>;
  // mintCounter?: MintCounterBorsh; //MintCounter;
};

export type Token = {
  mint: PublicKey;
  balance: number;
  decimals: number;
};
export type TokenPayment$Gate = {
  mint: PublicKey;
  amount: number;
  symbol?: string;
  decimals: number;
};

export type GuardGroup = {
  // address: PublicKey;
  startTime?: Date;
  endTime?: Date;
  payment?: {
    sol?: {
      amount: number;
      decimals: number;
      destination?: PublicKey;
    };
    token?: TokenPayment$Gate;
    nfts?: Metadata[];
    requiredCollection?: PublicKey;
  };
  burn?: {
    token?: TokenPayment$Gate;
    nfts?: Metadata[];
    requiredCollection?: PublicKey;
  };
  gate?: {
    token?: TokenPayment$Gate;
    nfts?: Metadata[];
    requiredCollection?: PublicKey;
  };
  // payments?: PaymentGuard[];
  mintLimit?: {
    id: number;
    limit: number;
  }; //MintLimitLogics;
  redeemLimit?: number;
  allowed?: PublicKey[];
  allowList?: Uint8Array;
  gatekeeperNetwork?: PublicKey;
  isEligible?: boolean;
  eligibleReason?: string[];
  hasEnded?: boolean;
  hasStarted?: boolean;
  totalMintedByUser?: number;
};
