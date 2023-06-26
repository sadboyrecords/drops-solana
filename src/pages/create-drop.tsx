import PageHeader from "@/components/PageHeader";
import NewDropForm from "@/components/forms/NewDropForm";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import UnauthUser from "@/components/UnauthUser";

function CreateDropPage() {
  const { data: session, status } = useSession();
  return (
    <div className="flex flex-col space-y-8">
      <PageHeader
        title="New Drop"
        subtitle="Create and launch your new drop with Candy Machine v3"
      />
      {status === "loading" && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {status === "unauthenticated" && <UnauthUser />}

      {session && <NewDropForm />}
    </div>
  );
}

export default CreateDropPage;
