import Head from "next/head";
import { api } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import DropCard from "@/components/drop/DropCard";
import PageHeader from "@/components/PageHeader";
import PageWarning from "@/components/PageWarning";
import { ThirdwebStorage } from "@thirdweb-dev/storage";

const storage = new ThirdwebStorage();

export default function Home() {
  const { data: drops, isLoading } = api.drop.allDrops.useQuery();

  if (isLoading) {
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
    <>
      <Head>
        <title>Candymachine Demo </title>
        <meta name="description" content="Candy Machine v3 " />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageHeader
        title="All Drops"
        subtitle="View all your drops created by the community"
      />
      <div className="mt-4">
        {!drops ||
          (drops.length === 0 && (
            <PageWarning type="INFO" message="No one has created a drop yet." />
          ))}

        {drops && drops.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                slug={drop.slug}
                image={storage.resolveScheme(drop.imageIpfsHash)}
                name={drop.dropName}
                price={drop.defaultPrice || undefined}
                audio={
                  (drop.audioIpfsHash &&
                    storage.resolveScheme(drop.audioIpfsHash)) ||
                  undefined
                }
                published={!drop.isDraft}
                ownerAddress={drop.ownerWalletAddress}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
