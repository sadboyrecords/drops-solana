import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import PageWarning from "@/components/PageWarning";
import { Skeleton } from "@/components/ui/skeleton";
import DropDetails from "@/components/drop/DropDetails";

export default function DropDetailsPage() {
  const { query } = useRouter();
  const slug = query.slug;
  const { data: drop, isLoading } = api.drop.getDropDetails.useQuery(
    query?.slug as string,
    {
      enabled: !!slug,
      staleTime: 1000 * 3, // 3 seconds
    }
  );
  console.log({ drop });
  return (
    <>
      {!isLoading && !drop && <PageWarning type="NOT_FOUND" />}
      {isLoading && (
        <div className="flex flex-col gap-6">
          {PageHeader.loader}
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}
      {drop && <DropDetails />}
    </>
  );
}
