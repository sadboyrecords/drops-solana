import PageHeader from "@/components/PageHeader";
import { navLinks } from "@/lib/constants";

function MyDropsPage() {
  return (
    <>
      <PageHeader
        title="My Drops"
        subtitle="View all your drops here or create a new one"
        buttonText="Create"
        buttonLink={navLinks.createDrop.href}
      />
    </>
  );
}

export default MyDropsPage;
