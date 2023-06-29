import PageHeader from "@/components/PageHeader";
import NewDropForm from "@/components/forms/NewDropForm";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import PageWarning from "@/components/PageWarning";

function CreateDropPage() {
  const { data: session, status } = useSession();
  console.log(session);

  if (status === "loading") {
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
    <div className="flex flex-col space-y-8">
      <PageHeader
        title="New Drop"
        subtitle="Create and launch your new drop with Candy Machine v3"
      />

      {session && <NewDropForm />}
    </div>
  );
}

export default CreateDropPage;
