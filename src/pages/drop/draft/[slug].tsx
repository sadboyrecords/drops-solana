import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { routes } from "@/lib/constants";
import PageWarning from "@/components/PageWarning";
import DropDetails from "@/components/drop/DropDetails";
import { Skeleton } from "@/components/ui/skeleton";
import LaunchSteps from "@/components/drop/LaunchSteps";

export default function DropDraftPage() {
  const { query } = useRouter();
  const slug = query.slug;
  const { data: drop, isLoading } = api.drop.getDraft.useQuery(
    query?.slug as string,
    {
      enabled: !!slug,
      staleTime: 1000 * 3, // 3 seconds
    }
  );

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
      {drop && (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={`${drop.dropName}`}
            subtitle=""
            buttonText="Edit"
            buttonLink={
              drop.isDraft ? routes.editDrop(slug as string).href : undefined
            }
          />
          <DropDetails />
          <LaunchSteps />
        </div>
      )}
    </>
  );
}
