import React, { useState } from "react";
import { init, ErrorBoundary, showReportDialog } from "@sentry/react";
import { ThemeSwitcher } from "@chainsafe/common-theme";
import {
  CssBaseline,
  Router,
  ToasterProvider,
} from "@chainsafe/common-components";

import ChainbridgeRoutes from "./Components/Routes";
import { lightTheme } from "./Themes/LightTheme";
import { ChainbridgeProvider } from "./Contexts/ChainbridgeContext";
import AppWrapper from "./Layouts/AppWrapper";
import { NetworkManagerProvider } from "./Contexts/NetworkManagerContext";
import { chainbridgeConfig } from "./chainbridgeConfig";
import { Web3OnboardProvider } from '@web3-onboard/react'
import "@chainsafe/common-theme/dist/font-faces.css";
import { localStorageVars, blockchainChainIds } from "./Constants/constants";
import { web3Onboard } from "./web3-onboard";

const { UNHANDLED_REJECTION, ONBOARD_SELECTED_WALLET } = localStorageVars;

if (
  process.env.NODE_ENV === "production" &&
  process.env.REACT_APP_SENTRY_DSN_URL &&
  process.env.REACT_APP_SENTRY_RELEASE
) {
  init({
    dsn: process.env.REACT_APP_SENTRY_DSN_URL,
    environment: process.env.REACT_APP_ENV,
    release: process.env.REACT_APP_SENTRY_RELEASE,
  });
  console.log("Sentry logging is initialized");
}

window.addEventListener("unhandledrejection", function(promiseRejectionEvent) { 
  console.error(promiseRejectionEvent);
  // This is a workaround for Ethereum networks uncaught exception bug https://github.com/blocknative/web3-onboard/issues/728#issuecomment-1252122571
  if (promiseRejectionEvent.reason.message 
      === "Cannot read properties of undefined (reading 'description')") {
    localStorage.setItem(UNHANDLED_REJECTION, 'yes');
    window.location.reload();
  }
});

const App: React.FC<{}> = () => {
  const {
    __RUNTIME_CONFIG__: {
      UI: { wrapTokenPage = false } = {},
      CHAINBRIDGE: { chains },
    },
  } = window;
  
  const wallet = localStorage.getItem(ONBOARD_SELECTED_WALLET);
  const walletConfigString = wallet && localStorage.getItem(wallet.toLowerCase());
  const walletConfig = walletConfigString && JSON.parse(walletConfigString);
  const walletNetworkSupported = chainbridgeConfig.chains.find(chain => chain.networkId === walletConfig?.chainId);
  const ethNetworkId = chainbridgeConfig.chains.find(chain => chain.chainId === blockchainChainIds.ETHEREUM)?.networkId as number;
  const [networkId, setNetworkId] = useState<number>((walletNetworkSupported && walletConfig?.chainId) || ethNetworkId);
  
  const rpc: {
    [key:number]: string,
  } = {};

  chainbridgeConfig.chains.forEach(chain => {
    if (chain.type === 'Ethereum') {
      rpc[chain.networkId as number] = chain.rpcUrl;
    }
  });

  return (
    <ErrorBoundary
      fallback={({ error, componentStack, eventId, resetError }) => (
        <div>
          <p>
            An error occurred and has been logged. If you would like to provide
            additional info to help us debug and resolve the issue, click the
            "Provide Additional Details" button
          </p>
          <p>{error?.message.toString()}</p>
          <p>{componentStack}</p>
          <p>{eventId}</p>
          <button onClick={() => showReportDialog({ eventId: eventId || "" })}>
            Provide Additional Details
          </button>
          <button onClick={resetError}>Reset error</button>
        </div>
      )}
      onReset={() => window.location.reload()}
    >
      <ThemeSwitcher themes={{ light: lightTheme }}>
        <CssBaseline />
        <ToasterProvider autoDismiss>
          <Web3OnboardProvider
            web3Onboard={web3Onboard}
          >
            <NetworkManagerProvider>
              <ChainbridgeProvider chains={chains}>
                <Router>
                  <AppWrapper wrapTokenPage={wrapTokenPage}>
                    <ChainbridgeRoutes wrapTokenPage={wrapTokenPage} />
                  </AppWrapper>
                </Router>
              </ChainbridgeProvider>
            </NetworkManagerProvider>
          </Web3OnboardProvider>
        </ToasterProvider>
      </ThemeSwitcher>
    </ErrorBoundary>
  );
};

export default App;
