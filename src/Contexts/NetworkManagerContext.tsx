import React, {
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  BridgeConfig,
  chainbridgeConfig,
  ChainType,
} from "../chainbridgeConfig";
import {
  EVMDestinationAdaptorProvider,
  EVMHomeAdaptorProvider,
} from "./Adaptors/EVMAdaptors";
import { IDestinationBridgeProviderProps } from "./Adaptors/interfaces";
import { SubstrateHomeAdaptorProvider } from "./Adaptors/SubstrateHomeAdaptor";
import { SubstrateDestinationAdaptorProvider } from "./Adaptors/SubstrateDestinationAdaptor";
import { DestinationBridgeContext } from "./DestinationBridgeContext";
import { HomeBridgeContext } from "./HomeBridgeContext";
import {
  AddMessageAction,
  ResetAction,
  transitMessageReducer,
} from "./Reducers/TransitMessageReducer";
import { blockchainChainIds } from "../Constants/constants";
import { Fallback } from "../Utils/Fallback";
import AnalyticsService from "../Services/Analytics";
import { Bridge } from "@chainsafe/chainbridge-contracts";
import { ApiPromise } from "@polkadot/api";

interface INetworkManagerProviderProps {
  children: React.ReactNode | React.ReactNode[];
}

export type WalletType = ChainType | "select" | "unset";

export type Vote = {
  address: string;
  signed?: "Confirmed" | "Rejected";
  order?: string;
  message?: string;
  eventType?: "Vote";
};

export type TransitMessage = {
  address: string;
  message?: string;
  proposalStatus?: number;
  order: number;
  signed?: "Confirmed" | "Rejected";
  eventType?: "Proposal" | "Vote";
};

export type TransactionStatus =
  | "Initializing Transfer"
  | "Transfer from Source"
  | "Transfer to Destination"
  | "Transfer Completed"
  | "Transfer Aborted";

interface NetworkManagerContext {
  walletType: WalletType;
  setWalletType: (walletType: WalletType) => void;

  networkId: number;
  setNetworkId: (id: number) => void;

  chainId?: number;

  homeChainConfig: BridgeConfig | undefined;
  destinationChainConfig: BridgeConfig | undefined;

  destinationChains: Array<{ chainId: number; name: string }>;
  homeChains: BridgeConfig[];
  handleSetHomeChain: (chainId: number | undefined) => void;
  setDestinationChain: (chainId: number | undefined) => void;

  transactionStatus?: TransactionStatus;
  setTransactionStatus: (message: TransactionStatus | undefined) => void;
  inTransitMessages: Array<TransitMessage>;

  setDepositVotes: (input: number) => void;
  depositVotes: number;

  setDepositNonce: (input: string | undefined) => void;
  depositNonce: string | undefined;

  tokensDispatch: Dispatch<AddMessageAction | ResetAction>;

  setHomeTransferTxHash: (input: string | undefined) => void;
  homeTransferTxHash: string | undefined;

  setTransferTxHash: (input: string | undefined) => void;
  transferTxHash: string | undefined;

  setDepositRecipient: (input: string | undefined) => void;
  depositRecipient: string | undefined;

  setDepositAmount: (input: number | undefined) => void;
  depositAmount: number | undefined;

  setFallback: (input: Fallback | undefined) => void;
  fallback: Fallback | undefined;

  setAddress: (input: string | undefined) => void;
  address: string | undefined;

  analytics: AnalyticsService;

  setDestinationBridge: (input: Bridge | undefined) => void;
  destinationBridge: Bridge | undefined;

  setApi: (input: ApiPromise | undefined) => void;
  api: ApiPromise | undefined;

  setListenerActive: (input: boolean) => void;
  listenerActive: boolean;

  setNetworkSupported: (input: boolean) => void;
  networkSupported: boolean;

  getNetworkName: (id: number) => string
}

const NetworkManagerContext = React.createContext<
  NetworkManagerContext | undefined
>(undefined);

const NetworkManagerProvider = ({ children }: INetworkManagerProviderProps) => {
  const [walletType, setWalletType] = useState<WalletType>("unset");

  const [networkId, setNetworkId] = useState(0);

  const [homeChainConfig, setHomeChainConfig] = useState<
    BridgeConfig | undefined
  >();
  const [homeChains, setHomeChains] = useState<BridgeConfig[]>([]);
  const [destinationChainConfig, setDestinationChain] = useState<
    BridgeConfig | undefined
  >();
  const [destinationChains, setDestinationChains] = useState<BridgeConfig[]>(
    []
  );

  const [homeTransferTxHash, setHomeTransferTxHash] = useState<
    string | undefined
  >();
  const [transferTxHash, setTransferTxHash] = useState<string | undefined>();
  const [transactionStatus, setTransactionStatus] = useState<
    TransactionStatus | undefined
  >(undefined);
  const [depositNonce, setDepositNonce] = useState<string | undefined>(
    undefined
  );
  const [depositVotes, setDepositVotes] = useState<number>(0);
  const [inTransitMessages, tokensDispatch] = useReducer(
    transitMessageReducer,
    []
  );
  const [depositRecipient, setDepositRecipient] = useState<string | undefined>(
    undefined
  );
  const [depositAmount, setDepositAmount] = useState<number | undefined>(
    undefined
  );

  const [fallback, setFallback] = useState<Fallback | undefined>(undefined);

  const [address, setAddress] = useState<string | undefined>(undefined);

  const [analytics] = useState(
    new AnalyticsService({
      ga: {
        trackingId: chainbridgeConfig.ga.trackingId,
        appName: chainbridgeConfig.ga.appName,
        env: process.env.REACT_APP_ENV as string,
      },
    })
  );

  const [destinationBridge, setDestinationBridge] = useState<
    Bridge | undefined
  >(undefined);

  const [api, setApi] = useState<ApiPromise | undefined>();

  const [listenerActive, setListenerActive] = useState(false);

  const [ networkSupported, setNetworkSupported ] = useState(false);

  const handleSetHomeChain = useCallback(
    (chainId: number | undefined) => {
      if (!chainId && chainId !== 0) {
        setHomeChainConfig(undefined);
        return;
      }
      const chain = homeChains.find(
        (c) => c.chainId === chainId && c.availableAsHomeNetwork
      );

      const fetchDestinationChainIds = (homeChainId: number) => {
        switch (homeChainId) {
          case blockchainChainIds.POLYGON:
          case blockchainChainIds.ETHEREUM:
            return [blockchainChainIds.CERE];
          case blockchainChainIds.CERE:
            return [blockchainChainIds.POLYGON];
          default:
            return [];
        }
      };

      if (chain) {
        const destinationChainIds = fetchDestinationChainIds(chain.chainId);
        setHomeChainConfig(chain);
        setDestinationChains(
          chainbridgeConfig.chains.filter((bridgeConfig: BridgeConfig) =>
            destinationChainIds?.includes(bridgeConfig.chainId)
          )
        );

        setDestinationChain(
          chainbridgeConfig.chains.find((bridgeConfig: BridgeConfig) =>
            destinationChainIds?.includes(bridgeConfig.chainId)
          )
        );
      }
    },
    [homeChains, setHomeChainConfig]
  );

  useEffect(() => {
    if (walletType !== "unset") {
      if (walletType === "select") {
        setHomeChains(chainbridgeConfig.chains);
      } else {
        setHomeChains(
          chainbridgeConfig.chains.filter(
            (bridgeConfig: BridgeConfig) => bridgeConfig.type === walletType
          )
        );
      }
    } else {
      setHomeChains([]);
    }
  }, [walletType]);

  const handleSetDestination = useCallback(
    (chainId: number | undefined) => {
      if (chainId === undefined) {
        setDestinationChain(undefined);
      } else if (homeChainConfig && !depositNonce) {
        const chain = destinationChains.find((c) => c.chainId === chainId);
        if (!chain) {
          throw new Error("Invalid destination chain selected");
        }
        setDestinationChain(chain);
      } else {
        throw new Error("Home chain not selected");
      }
    },
    [depositNonce, destinationChains, homeChainConfig]
  );

  const DestinationProvider = ({
    children,
  }: IDestinationBridgeProviderProps) => {
    if (destinationChainConfig?.type === "Ethereum") {
      return (
        <EVMDestinationAdaptorProvider>
          {children}
        </EVMDestinationAdaptorProvider>
      );
    } else if (destinationChainConfig?.type === "Substrate") {
      return (
        <SubstrateDestinationAdaptorProvider>
          {children}
        </SubstrateDestinationAdaptorProvider>
      );
    } else {
      // todo: understand why we need this part
      return (
        <DestinationBridgeContext.Provider
          value={{
            disconnect: async () => {}, addresses: [],
          }}
        >
          {children}
        </DestinationBridgeContext.Provider>
      );
    }
  };

  const getNetworkName = (id: number) => {
    switch (id) {
      case 1:
        return "Ethereum Mainnet";
      case 2:
        return "Cere Mainnet (Testnet)";
      case 3:
        return "Ethereum Ropsten";
      case 4:
        return "Ethereum Rinkeby";
      case 5:
        return "Ethereum Goerli";
      case 6:
        return "Kotti";
      case 42:
        return "Ethereum Kovan";
      case 61:
        return "Ethereum Classic - Mainnet";
      case 42220:
        return "CELO - Mainnet";
      case 44787:
        return "CELO - Alfajores Testnet";
      case 62320:
        return "CELO - Baklava Testnet";
      case 1749641142:
        return "Besu";
      case 137:
        return "Polygon Mainnet";
      case 80001:
        return "Polygon Mumbai";
      default:
        return "Other";
    }
  }

  return (
    <NetworkManagerContext.Provider
      value={{
        chainId: homeChainConfig?.chainId,
        networkId,
        setNetworkId,
        homeChainConfig,
        setWalletType,
        walletType,
        homeChains: homeChains,
        destinationChains,
        inTransitMessages,
        handleSetHomeChain,
        setDestinationChain: handleSetDestination,
        destinationChainConfig,
        transactionStatus,
        setTransactionStatus,
        depositNonce,
        depositVotes,
        setDepositNonce,
        setDepositVotes,
        tokensDispatch,
        homeTransferTxHash,
        setHomeTransferTxHash,
        setTransferTxHash,
        transferTxHash,
        depositRecipient,
        setDepositRecipient,
        depositAmount,
        setDepositAmount,
        fallback,
        setFallback,
        address,
        setAddress,
        analytics,
        destinationBridge,
        setDestinationBridge,
        api,
        setApi,
        listenerActive,
        setListenerActive,
        networkSupported,
        setNetworkSupported,
        getNetworkName
      }}
    >
      {walletType === "Ethereum" ? (
        <EVMHomeAdaptorProvider>
          <DestinationProvider>{children}</DestinationProvider>
        </EVMHomeAdaptorProvider>
      ) : walletType === "Substrate" ? (
        <SubstrateHomeAdaptorProvider>
          <DestinationProvider>{children}</DestinationProvider>
        </SubstrateHomeAdaptorProvider>
      ) : (
        <HomeBridgeContext.Provider
          value={{
            connect: async () => undefined,
            disconnect: async () => {},
            isReady: false,
            selectedToken: "",
            deposit: async (
              amount: number,
              recipient: string,
              tokenAddress: string,
              destinationChainId: number
            ) => undefined,
            setDepositAmount: () => undefined,
            tokens: {},
            setSelectedToken: (input: string) => undefined,
            address: undefined,
            bridgeFee: undefined,
            chainConfig: undefined,
            depositAmount: undefined,
            nativeTokenBalance: undefined,
            relayerThreshold: undefined,
            wrapTokenConfig: undefined,
            wrapper: undefined,
            wrapToken: async (value: number) => "",
            unwrapToken: async (value: number) => "",
          }}
        >
          <DestinationProvider>{children}</DestinationProvider>
        </HomeBridgeContext.Provider>
      )}
    </NetworkManagerContext.Provider>
  );
};

const useNetworkManager = () => {
  const context = useContext(NetworkManagerContext);
  if (context === undefined) {
    throw new Error(
      "useNetworkManager must be called within a HomeNetworkProvider"
    );
  }
  return context;
};

export { NetworkManagerProvider, useNetworkManager };
