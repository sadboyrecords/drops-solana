import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import NewDropForm from "@/components/forms/NewDropForm";
import PageWarning from "@/components/PageWarning";

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

  if (!isLoading && !drop) {
    return <PageWarning type="UNAUTHORIZED" />;
  }

  if (drop && !drop.isDraft) {
    return (
      <PageWarning
        type="INFO"
        message="This drop has been launched or is in the process of being launched and cannot be edited anymore."
      />
    );
  }

  return (
    <>
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
            title={`Edit ${drop.dropName}`}
            subtitle=""
            buttonText="Edit"
          />
          <NewDropForm />
        </div>
      )}
    </>
  );
}
