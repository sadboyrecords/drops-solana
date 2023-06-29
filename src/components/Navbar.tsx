import { Disclosure } from "@headlessui/react";
import SignInWallet from "@/components/SignInWallet";
import Link from "next/link";
import { routes } from "@/lib/constants";

export default function Navbar() {
  // const
  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({}) => (
        <>
          <div className="mx-auto max-w-7xl px-4  sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <Link href="/" className="flex flex-shrink-0 items-center">
                  LG
                </Link>
                <div className=" ml-6 flex space-x-8">
                  <Link
                    href={routes.myDrops.href}
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    {routes.myDrops.label}
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SignInWallet />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
}
