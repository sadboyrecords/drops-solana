import { api } from "@/utils/api";
import { useRouter } from "next/router";
import TitleContent from "@/components/TitleContent";
import useCandyMachineV3 from "@/hooks/useCandyMachineV3";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import SolIcon from "@/components/icons/SolIcon";
import { Button } from "@/components/ui/button";
import { amountToNumber } from "@metaplex-foundation/umi";
import dynamic from "next/dynamic";
import { GenericDialog } from "../GenericDialog";
import { useState } from "react";
import { solscanUrls } from "@/lib/constants";
import { toast } from "react-toastify";
import { type GuardGroup } from "@/hooks/types";
import { Progress } from "../ui/progress";
import Countdown, { zeroPad } from "react-countdown";

const CopyAddress = dynamic(() => import("@/components/CopyAddress"), {
  ssr: false,
});

const renderer = ({
  days,
  hours,
  minutes,
  seconds,
  completed,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}) => {
  if (completed) {
    // Render a complete state
    return "";
  } else {
    // Render a countdown
    return (
      <div className="flex space-x-1">
        <p className="countdown-timer">{zeroPad(days)} </p>
        <p className="countdown-timer">{zeroPad(hours)} </p>
        <p className="countdown-timer">{zeroPad(minutes)} </p>
        <p className="countdown-timer">{zeroPad(seconds)} </p>
      </div>
    );
  }
};

function DropDetails() {
  const { query } = useRouter();
  const slug = query.slug;
  const { data: drop } = api.drop.getDropDetails.useQuery(
    query?.slug as string,
    {
      enabled: !!slug,
      staleTime: 1000 * 3, // 3 seconds
    }
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    nft: string;
    // tx: string;
  }>();

  const { candyMachine, collection, parsedGuards, mint } = useCandyMachineV3({
    candyMachineId: drop?.candyMachineId || "",
  });

  const handleMint = async (label: string, guard: GuardGroup) => {
    const toastId = toast.loading("Minting");

    try {
      const addy = await mint({ label, guard });
      console.log({ addy });
      toast.update(toastId, {
        render: "Minted successfully",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      setPurchaseDetails({
        nft: addy?.nftAddress.toString() || "",
        // tx: addy?.signature || "",
      });
      setIsModalOpen(true);
      return;
    } catch (error) {
      console.log({ error });
      toast.update(toastId, {
        render: "There was an error minting",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  if (!drop) return null;

  if (!candyMachine || !collection) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GenericDialog
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        title="Congrats"
        description="You have successfully purchased your NFT"
      >
        <p>
          Click{" "}
          <a
            className="text-primary-500"
            href={solscanUrls(purchaseDetails?.nft || "").tokenDetails}
            target="_blank"
          >
            here
          </a>{" "}
          to view your nft.
        </p>
        {/* <p>
          Click{" "}
          <a
            className="text-primary-500"
            href={solscanUrls(purchaseDetails?.tx || "").transactionDetails}
            target="_blank"
          >
            here
          </a>{" "}
          to view your transaction details.
        </p> */}
      </GenericDialog>
      <div className="grid grid-cols-1 place-content-center justify-between gap-4 rounded-2xl bg-white px-4 py-10 md:grid-cols-2 md:py-16">
        <div className="order-2 flex w-full justify-center md:order-1">
          <div className=" flex  max-w-sm flex-1 flex-col  gap-8 ">
            <div className="space-y-2">
              <p className="text-4xl font-semibold">
                {/* {collection.metadata.name} */}
                Collection Name
              </p>
              <TitleContent title="Description" content={drop.description} />
            </div>

            <div className="flex justify-between gap-3">
              <TitleContent
                title="Total Items"
                content={candyMachine.data.itemsAvailable.toString()}
              />
              <TitleContent
                title="Symbol"
                content={collection.metadata.symbol}
              />
              <TitleContent
                title="Royallties"
                content={
                  amountToNumber(
                    candyMachine.data.sellerFeeBasisPoints
                  ).toString() + "%"
                }
              />
            </div>
            <div>
              <p className="font-medium"> Creators </p>
              <div className="flex flex-col space-y-2">
                {candyMachine.data.creators.map((c) => (
                  <CopyAddress key={c.address} address={c.address} />
                ))}
              </div>
            </div>
            {collection.metadata.properties?.files &&
              collection.metadata.properties?.files?.find((f) =>
                f.type?.includes("audio")
              )?.uri && (
                <div>
                  <audio
                    src={
                      collection.metadata.properties?.files?.find((f) =>
                        f.type?.includes("audio")
                      )?.uri
                    }
                    controls
                  />
                </div>
              )}

            {parsedGuards && parsedGuards?.length > 0 && (
              <div className="flex w-full flex-col  gap-6">
                {parsedGuards?.map((guard) => (
                  <div
                    key={guard.label}
                    className="rounded-lg border border-gray-300 p-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Badge className=" bg-gray-200 uppercase text-gray-700">
                          {guard.label}
                        </Badge>
                      </div>
                      {guard.guards.hasEnded && (
                        <p className="text-xs text-gray-500">ENDED</p>
                      )}
                      {guard.guards.startTime && !guard.guards.hasStarted && (
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-slate-600">Starts in: </p>
                          <Countdown
                            date={guard.guards.startTime}
                            renderer={renderer}
                          />
                        </div>
                      )}
                      {guard.guards.endTime && guard.guards.hasStarted && (
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-slate-600">Ends in: </p>
                          <Countdown
                            date={guard.guards.endTime}
                            renderer={renderer}
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex  w-full items-center justify-between gap-3 ">
                      <div className="flex flex-col items-start">
                        {guard.guards.payment?.sol && (
                          <div className="flex items-center ">
                            <SolIcon className="h-3 w-3" />
                            <span className="ml-1 text-sm text-gray-600">
                              {guard.guards.payment.sol.amount} SOL
                            </span>
                          </div>
                        )}
                        <div>
                          {guard.guards.mintLimit && (
                            <p className="text-xs text-gray-500">
                              {guard.guards.mintLimit.limit} per wallet{" "}
                              {guard.guards.totalMintedByUser &&
                                "(You have minted " +
                                  guard.guards.totalMintedByUser.toString() +
                                  ")"}
                            </p>
                          )}
                          {guard.guards.redeemLimit && (
                            <p className="text-xs text-gray-500">
                              Max amount: {guard.guards.redeemLimit}
                            </p>
                          )}
                        </div>
                      </div>
                      {!guard.guards.hasEnded && guard.guards.hasStarted && (
                        <Button
                          disabled={
                            guard.guards.hasEnded || !guard.guards.hasStarted
                          }
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void handleMint(guard.label, guard.guards)
                          }
                        >
                          Mint
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* w-80 md:w-[30rem] */}
        <div className="order-1 flex w-full flex-col  gap-4 md:order-2 md:mx-0">
          <div className="relative aspect-1 max-w-md ">
            <Image
              src={collection.metadata.image || "/images/placeholder.jpeg"}
              alt="NFT Image"
              fill
              className=" rounded-xl object-cover"
            />
          </div>
          <div className="max-w-md">
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">
                Total Minted (
                {(Number(candyMachine.itemsRedeemed) /
                  Number(candyMachine.data.itemsAvailable)) *
                  100}
                % )
              </p>
              <p className="text-sm text-gray-400">
                {Number(candyMachine.itemsRedeemed)}/
                {Number(candyMachine.data.itemsAvailable)}
              </p>
            </div>
            <Progress
              value={
                (Number(candyMachine.itemsRedeemed) /
                  Number(candyMachine.data.itemsAvailable)) *
                100
              }
              className="h-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DropDetails;
