import * as z from "zod";
// import { PublicKey } from "@solana/web3.js";

// const isValidWalletAddress = (address: string) => {
//   try {
//     new PublicKey(address);
//     return true;
//   } catch (error) {
//     // return false;
//     throw new Error("Invalid wallet address");
//   }
// };
export const dropSchema = z.object({
  name: z.string().min(1, "Drop name is required"),
  description: z.string().min(1, "Drop description is required"),
  symbol: z
    .string()
    .min(1, "Drop symbol is required")
    .max(9, "You cannot have more than 9 characters"),
  sellerFeeBasisPoints: z.string().min(0.1, "Drop royalties is required"), // secondary sales
  itemsAvailable: z
    .string()
    .min(
      1,
      "You must provide the number of items you would like to be available"
    ),
  dropImage: z.custom<File>(),
  audioFile: z.custom<File>().optional(),
  creatorSplits: z.array(
    z.object({
      address: z.string().min(1, "You must provide a wallet address"),
      share: z.string().min(1, "You must provide a share"),
    })
  ),
  defaultGuard: z.object({
    price: z.string().min(1, "Drop price is required"),
    // paymentDestination: z.custom((value) => {
    //   isValidWalletAddress(value as string);
    //   return value as string;
    // }),
    paymentDestination: z.string(),
    startDate: z.date(),
    endDate: z
      .date()
      .min(new Date(), "End date must be in the future")
      .optional(),
    startTime: z.string().default("12:00"),
    endTime: z.string().optional().default("12:00"),
  }),
  guards: z
    .array(
      z.object({
        label: z
          .string()
          .min(1, "Guard label is required")
          .max(6, "Guard label must be less than 6 characters"), //can't be more than 6 characters
        price: z.string().min(1, "Drop price is required"),
        paymentDestination: z
          .string()
          .min(1, "You must provide the wallet all sales will go to"),
        startDate: z.date().optional(),
        endDate: z
          .date()
          .min(new Date(), "End date must be in the future")
          .optional(),
        startTime: z.string().optional().default("12:00"),
        endTime: z.string().optional().default("12:00"),
        mintLimit: z
          .string()
          .min(
            1,
            "Mint Limit must be greater than 0. If you want to allow unlimited mints, leave this field blank."
          )
          .optional(),
        redeemAmount: z
          .string()
          .min(
            1,
            "Redeem Amount must be greater than 0. If you want to allow unlimited redeems, leave this field blank."
          )
          .optional(),
        allowList: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

export interface DropSchemaType
  extends Omit<Omit<z.infer<typeof dropSchema>, "dropImage">, "audioFile"> {
  imageIpfsHash: string;
  audioIpfsHash?: string;
}
