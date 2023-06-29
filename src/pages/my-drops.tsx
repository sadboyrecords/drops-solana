import PageHeader from "@/components/PageHeader";
import PageWarning from "@/components/PageWarning";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { api } from "@/utils/api";

function MyDropsPage() {
  const { status } = useSession();
  const { data: drops, isLoading } = api.drop.myDrops.useQuery();

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <PageWarning type="UNAUTHORIZED" />;
  }

  return (
    <>
      <PageHeader
        title="My Drops"
        subtitle="View all your drops here or create a new one"
        buttonText="Create"
        buttonLink={routes.createDrop.href}
      />
      <div className="mt-4">
        {!drops ||
          (drops.length === 0 && (
            <PageWarning
              type="INFO"
              message="You have not created any drops yet"
            />
          ))}
      </div>
    </>
  );
}

export default MyDropsPage;
