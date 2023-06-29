import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { routes } from "@/lib/constants";

interface DropCardProps {
  name: string;
  image: string;
  price?: number;
  slug: string;
  audio?: string;
  published?: boolean;
  showBadge?: boolean;
  ownerAddress: string;
}

function DropCard({
  name,
  image,
  price,
  slug,
  audio,
  published,
  showBadge,
  ownerAddress,
}: DropCardProps): JSX.Element {
  return (
    <Link
      href={routes.dropDetails(slug).href}
      className="flex flex-col space-y-4 rounded-lg bg-white p-4"
    >
      <div className="relative aspect-1">
        <Image
          src={image || "/images/placeholder.jpeg"}
          alt="NFT Image"
          fill
          className=" rounded-xl object-cover"
          //   aspect-1 h-full w-full
          // height={100}
          // width={100}
        />
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <p className="text-lg font-bold"> {name} </p>
          {showBadge && (
            <Badge variant="secondary">
              {published ? "Published" : "draft"}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center  gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-white">
              {ownerAddress.slice(0, 2)}
            </div>

            <p className="text-sm text-gray-600">
              {ownerAddress &&
                `${ownerAddress?.slice(0, 3)}...${ownerAddress.slice(-2)}`}
            </p>
          </div>
          <p className="text-sm text-gray-500">{price} SOL </p>
        </div>
        {audio && (
          <div className="">
            <audio src={audio} controls className="mt-4 w-full" />
          </div>
        )}
      </div>
    </Link>
  );
}

export default DropCard;
