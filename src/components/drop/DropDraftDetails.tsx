import { api } from "@/utils/api";
import { useRouter } from "next/router";
import TitleContent from "@/components/TitleContent";
import type { DropSchemaType } from "@/lib/schemaValidations/DropSchema";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import dayjs from "dayjs";

const storage = new ThirdwebStorage();

function DropDraftDetails() {
  const { query } = useRouter();
  const slug = query.slug;
  const { data: drop } = api.drop.getDraft.useQuery(query?.slug as string, {
    enabled: !!slug,
    staleTime: 1000 * 3, // 3 seconds
  });

  if (!drop) return null;

  const formSubmission = drop.formSubmission as unknown as DropSchemaType;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-4">
        <p className="text-lg font-semibold">Basic Information</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TitleContent title="Drop Name" content={drop?.dropName} />
          <TitleContent title="Symbol" content={formSubmission?.symbol} />
          <TitleContent
            title="Royalties"
            content={formSubmission?.sellerFeeBasisPoints + "%"}
          />
          <TitleContent
            title="Total NFTs"
            content={formSubmission?.itemsAvailable}
          />
          <div className="col-span-2">
            <TitleContent
              title="Description"
              content={formSubmission?.description}
            />
          </div>
          <div>
            {drop?.imageIpfsHash && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storage.resolveScheme(drop.imageIpfsHash)}
                className="mt-2 h-32 w-32 rounded-lg"
                alt="nft image"
              />
            )}
          </div>
          {drop.audioIpfsHash && (
            <audio
              controls
              src={storage.resolveScheme(drop.audioIpfsHash)}
              // alt=""
              className="h-[3.75rem] w-[12.5rem]"
            />
          )}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <p className="text-lg font-semibold">Creator Splits</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formSubmission?.creatorSplits.map((split) => (
            <TitleContent
              key={split.address}
              title="Creator"
              content={split.address + " (" + split.share + "%)"}
            />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <p className="text-lg font-semibold">Default Settings</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TitleContent
            title="Price"
            content={formSubmission.defaultGuard?.price + " SOL"}
          />
          <TitleContent
            title="Destination"
            content={formSubmission.defaultGuard.paymentDestination}
          />
          <TitleContent
            title="Start Date"
            content={dayjs(formSubmission.defaultGuard.startDate).format(
              "MMM DD, YYYY hh:mm A"
            )}
          />
          <TitleContent
            title="End Date"
            content={
              formSubmission.defaultGuard.endDate
                ? dayjs(formSubmission.defaultGuard.endDate).format(
                    "MMM DD, YYYY hh:mm A"
                  )
                : "N/A"
            }
          />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <p className="text-lg font-semibold">Guards</p>
        {formSubmission?.guards?.length === 0 && (
          <p className=" text-sm text-gray-500">No guards added yet.</p>
        )}

        {formSubmission?.guards?.map((guard) => (
          <div
            key={guard.label}
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <TitleContent title="Label" content={guard.label} />
            <TitleContent title="Price" content={guard?.price + " SOL"} />
            <div className="col-span-1 sm:col-span-2">
              <TitleContent
                title="Payment Destination"
                content={guard.paymentDestination}
              />
            </div>
            <TitleContent
              title="Start Date"
              content={
                guard.startDate
                  ? dayjs(guard.startDate).format("MMM DD, YYYY hh:mm A")
                  : "N/A"
              }
            />
            <TitleContent
              title="End Date"
              content={
                guard.endDate
                  ? dayjs(guard.endDate).format("MMM DD, YYYY hh:mm A")
                  : "N/A"
              }
            />
            <TitleContent title="Mint Limit" content={guard.mintLimit} />
            <TitleContent title="Redeem Amount" content={guard.redeemAmount} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DropDraftDetails;
