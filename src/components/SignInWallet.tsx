require("@solana/wallet-adapter-react-ui/styles.css");
import { useWallet } from "@solana/wallet-adapter-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Button } from "./ui/button";
import base58 from "bs58";
import React from "react";
import { magic } from "@/lib/magic";
import { SigninMessage } from "@/lib/SignMessage";
import { getCsrfToken, signIn, useSession, signOut } from "next-auth/react";
import { api } from "@/utils/api";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { selectAuthModal, open, close } from "@/slices/appSlice";
import { useSelector, useDispatch } from "react-redux";
import Spinner from "@/components/svg/Spinner";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const GenericModal = dynamic(() => import("@/components/GenericModal"), {
  ssr: false,
});
const DynamicAuthMethods = dynamic(
  () => import("@/components/DynamicAuthMethods"),
  {
    ssr: false,
  }
);

export default function SignInWallet() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { publicKey, signMessage, disconnect, connected } = useWallet();

  const dispatch = useDispatch();

  const authModal = useSelector(selectAuthModal);

  const { data: session, status } = useSession();
  const loading = status === "loading";

  api.user.myProfile.useQuery(undefined, {
    enabled: !!session,
    staleTime: 1000 * 10,
  });

  const handleSignIn = React.useCallback(async () => {
    if (!publicKey) {
      dispatch(open());
      return;
    }
    try {
      const csrf = await getCsrfToken();

      if (!csrf || !publicKey || !signMessage) {
        console.log("NO CSRF OR PUBLIC KEY OR SIGN MESSAGE");
        return;
      }

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey.toBase58(),
        statement:
          " We need your signature to confirm you own this wallet. Sign your wallet to log into NiftyTunes. ",
        nonce: csrf,
      });
      const data = new TextEncoder().encode(message.prepare());

      const signature = await signMessage(data);
      const signatureBase58 = base58.encode(signature);
      const res = await signIn("solana-auth", {
        message: JSON.stringify(message),
        signature: signatureBase58,
        redirect: false,
        callbackUrl: window.location.href,
      });
      dispatch(close());
      if (!res) {
        console.log("NO RES");
        await disconnect();
      }
    } catch (error) {
      console.log({ error });
      toast.error("Failed to sign in. Please try again.");
      await disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connected,
    // disconnect,
    publicKey,
    // session,
    // setVisible,
    // signMessage,
    // status,
    // visible,
  ]);

  React.useEffect(() => {
    if (status === "loading") return;
    if (connected && status === "unauthenticated") {
      void handleSignIn();
    }
  }, [connected, handleSignIn, status]);

  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    void disconnect();
    await signOut();
    if (magic) await magic.user.logout();
    setLoggingOut(false);

    return;
  };

  return (
    <>
      <GenericModal
        closeModal={() => dispatch(close())}
        title="Log In/Sign Up"
        isOpen={authModal}
      >
        <DynamicAuthMethods />
      </GenericModal>
      {!session && !loading && (
        <button
          type="button"
          onClick={() => dispatch(open())}
          className="relative inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign In
        </button>
      )}
      {session && (
        <Menu as="div" className="relative ml-3">
          <div>
            <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <span className="sr-only">Open user menu</span>
              <Button variant="outline">
                {session?.user?.walletAddress &&
                  `${session?.user?.walletAddress?.slice(
                    0,
                    3
                  )}...${session?.user?.walletAddress.slice(-2)}`}
              </Button>
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100" : "",
                      "block px-4 py-2 text-sm text-gray-700"
                    )}
                  >
                    Your Profile
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100" : "",
                      "block px-4 py-2 text-sm text-gray-700"
                    )}
                  >
                    Settings
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <div
                    onClick={() => void handleLogout()}
                    className={classNames(
                      active ? "bg-gray-100" : "",
                      "block cursor-pointer px-4 py-2 text-sm text-gray-700"
                    )}
                  >
                    {loggingOut ? <Spinner /> : "Sign Out"}
                  </div>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </>
  );
}
