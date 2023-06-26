import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import Layout from "@/components/Layout";
import type { Session } from "next-auth";
import type { AppType } from "next/app";
import { api } from "@/utils/api";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import dynamic from "next/dynamic";

const Web3Provider = dynamic(
  () => import("@/components/providers/WalletProvider"),
  {
    ssr: false,
  }
);

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Web3Provider>
        <Provider store={store}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </Provider>
      </Web3Provider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
