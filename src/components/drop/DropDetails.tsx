import { api } from "@/utils/api";
import { useRouter } from "next/router";
import TitleContent from "@/components/TitleContent";
import type { DropSchemaType } from "@/lib/schemaValidations/DropSchema";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import dayjs from "dayjs";

const storage = new ThirdwebStorage();

function DropDetails() {
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
      </div>
    </div>
  );
}

export default DropDetails;
