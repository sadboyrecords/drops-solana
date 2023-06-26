import Navbar from "@/components/Navbar";
export interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <>
      <Navbar />
      <div className="py-10">
        <main>
          <div className="mx-auto max-w-7xl  px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default Layout;
