import React, { useCallback, useEffect, useState } from "react";
import { DestinationBridgeContext } from "../DestinationBridgeContext";
import { HomeBridgeContext } from "../HomeBridgeContext";
import { useNetworkManager } from "../NetworkManagerContext";
import {
  createApi,
  submitDeposit,
  getBridgeProposalVotes,
  VoteStatus,
} from "./SubstrateApis/ChainBridgeAPI";
import {
  IDestinationBridgeProviderProps,
  IHomeBridgeProviderProps,
  InjectedAccountType,
} from "./interfaces";

import { ApiPromise } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import { TypeRegistry } from "@polkadot/types";
import { Tokens } from "@chainsafe/web3-context/dist/context/tokensReducer";
import { BigNumber as BN } from "bignumber.js";
import { UnsubscribePromise, VoidFn } from "@polkadot/api/types";
import { utils } from "ethers";
import {
  SubstrateBridgeConfig,
  getСhainTransferFallbackConfig,
  chainbridgeConfig,
} from "../../chainbridgeConfig";
import { toFixedWithoutRounding } from "../../Utils/Helpers";
import { Fallback } from "../../Utils/Fallback";
import { GA } from "../../Utils/GA";
const ga = new GA({
  trackingId: chainbridgeConfig.ga.trackingId,
  appName: chainbridgeConfig.ga.appName,
  env: process.env.NODE_ENV,
});

export const SubstrateHomeAdaptorProvider = ({
  children,
}: IHomeBridgeProviderProps) => {
  const registry = new TypeRegistry();
  const [api, setApi] = useState<ApiPromise | undefined>();
  const [isReady, setIsReady] = useState(false);
  const [accounts, setAccounts] = useState<InjectedAccountType[]>([]);

  const {
    homeChainConfig,
    setTransactionStatus,
    setDepositNonce,
    handleSetHomeChain,
    homeChains,
    depositAmount,
    setDepositAmount,
    depositRecipient,
    setDepositRecipient,
    fallback,
    address,
    setAddress,
  } = useNetworkManager();

  const [relayerThreshold, setRelayerThreshold] = useState<number | undefined>(
    undefined
  );
  const [bridgeFee, setBridgeFee] = useState<number | undefined>(undefined);

  const [selectedToken, setSelectedToken] = useState<string>("CSS");

  const [tokens, setTokens] = useState<Tokens>({});

  useEffect(() => {
    // Attempt connect on load
    handleConnect();
  });

  const [initiaising, setInitialising] = useState(false);
  useEffect(() => {
    // Once the chain ID has been set in the network context, the homechain configuration will be automatically set thus triggering this
    if (!homeChainConfig || initiaising || api) return;
    setInitialising(true);
    createApi(homeChainConfig.rpcUrl, homeChainConfig.rpcFallbackUrls)
      .then((api) => {
        setApi(api);
        setInitialising(false);
      })
      .catch(console.error);
  }, [homeChainConfig, registry, api, initiaising]);

  const getRelayerThreshold = useCallback(async () => {
    if (api) {
      const relayerThreshold = await api.query[
        (homeChainConfig as SubstrateBridgeConfig).chainbridgePalletName
      ].relayerThreshold();
      setRelayerThreshold(Number(relayerThreshold.toHuman()));
    }
  }, [api, homeChainConfig]);

  const getBridgeFee = useCallback(async () => {
    if (api) {
      const config = homeChainConfig as SubstrateBridgeConfig;

      const fee = config.bridgeFeeFunctionName
        ? new BN(
            Number(
              await api.query[config.transferPalletName][
                config.bridgeFeeFunctionName
              ]()
            )
          )
            .shiftedBy(-config.decimals)
            .toNumber()
        : config.bridgeFeeValue
        ? config.bridgeFeeValue
        : 0;

      setBridgeFee(fee);
    }
  }, [api, homeChainConfig]);

  const confirmChainID = useCallback(async () => {
    if (api) {
      const currentId = Number(
        api.consts[
          (homeChainConfig as SubstrateBridgeConfig).chainbridgePalletName
        ].chainIdentity.toHuman()
      );
      if (homeChainConfig?.chainId !== currentId) {
        const correctConfig = homeChains.find(
          (item) => item.chainId === currentId
        );
        if (correctConfig) {
          handleSetHomeChain(currentId);
        }
      }
    }
  }, [api, handleSetHomeChain, homeChainConfig, homeChains]);

  useEffect(() => {
    // For all constants & essential values like:
    // Relayer Threshold, resources IDs & Bridge Fees
    // It is recommended to collect state at this point
    if (api) {
      if (api.isConnected && homeChainConfig) {
        getRelayerThreshold();
        confirmChainID();
        getBridgeFee();
      }
    }
  }, [api, getRelayerThreshold, getBridgeFee, confirmChainID, homeChainConfig]);

  useEffect(() => {
    if (!homeChainConfig || !address) return;
    let unsubscribe: VoidFn | undefined;
    if (api) {
      api.derive.balances
        .all(address, (result) => {
          const balance = result.availableBalance.toString();
          const transferableBalance = Math.max(
            0,
            parseFloat(
              toFixedWithoutRounding(
                parseFloat(
                  utils.formatUnits(balance, homeChainConfig.decimals)
                ) -
                  (homeChainConfig as SubstrateBridgeConfig)
                    .existentialDepositPlusNetworkFee,
                homeChainConfig.decimals
              )
            )
          );
          setTokens({
            [homeChainConfig.tokens[0].symbol || "TOKEN"]: {
              decimals:
                homeChainConfig.tokens[0].decimals ?? homeChainConfig.decimals,
              balance: transferableBalance,
              balanceBN: new BN(transferableBalance),
              name: homeChainConfig.tokens[0].name,
              symbol: homeChainConfig.tokens[0].symbol,
            },
          });
        })
        .then((unsub) => {
          unsubscribe = unsub;
        })
        .catch(console.error);
    }
    return () => {
      unsubscribe && unsubscribe();
    };
  }, [api, address, homeChainConfig]);

  const handleConnect = useCallback(async () => {
    // Requests permission to inject the wallet
    if (!isReady) {
      web3Enable("Cere Bridge")
        .then(() => {
          // web3Account resolves with the injected accounts
          // or an empty array
          web3Accounts()
            .then((accounts) => {
              return accounts.map(({ address, meta }) => ({
                address,
                meta: {
                  ...meta,
                  name: `${meta.name} (${meta.source})`,
                },
              }));
            })
            .then((injectedAccounts) => {
              // This is where the correct chain configuration is set to the network context
              // Any operations before presenting the accounts to the UI or providing the config
              // to the rest of the dapp should be done here
              setAccounts(injectedAccounts);
              if (injectedAccounts.length === 1) {
                setAddress(injectedAccounts[0].address);
              }
              handleSetHomeChain(
                homeChains.find((item) => item.type === "Substrate")?.chainId
              );
            })
            .catch(console.error);
        })
        .catch(console.error);
    }
  }, [isReady, handleSetHomeChain, homeChains]);

  useEffect(() => {
    // This is a simple check
    // The reason for having a isReady is that the UI can lazy load data from this point
    api?.isReady.then(() => setIsReady(true));
  }, [api, setIsReady]);

  const selectAccount = useCallback(
    (index: number) => {
      setAddress(accounts[index].address);
    },
    [accounts]
  );

  const deposit = useCallback(
    async (
      amount: number,
      recipient: string,
      tokenAddress: string,
      destinationChainId: number
    ) => {
      if (api && address) {
        const allAccounts = await web3Accounts();
        const targetAccount = allAccounts.find(
          (item) => item.address === address
        );
        if (targetAccount) {
          const transferExtrinsic = submitDeposit(
            api,
            amount,
            recipient,
            (homeChainConfig as SubstrateBridgeConfig).chainId,
            destinationChainId
          );

          const injector = await web3FromSource(targetAccount.meta.source);
          setDepositAmount(amount);
          setDepositRecipient(recipient);
          setTransactionStatus("Initializing Transfer");
          transferExtrinsic
            .signAndSend(
              address,
              { signer: injector.signer },
              ({ status, events }) => {
                status.isInBlock &&
                  console.log(
                    `Completed at block hash #${status.isInBlock.toString()}`
                  );

                if (status.isFinalized) {
                  events.filter(({ event }) => {
                    return api.events[
                      (homeChainConfig as SubstrateBridgeConfig)
                        .chainbridgePalletName
                    ].FungibleTransfer.is(event);
                  });
                  api.query[
                    (homeChainConfig as SubstrateBridgeConfig)
                      .chainbridgePalletName
                  ]
                    .chainNonces(destinationChainId)
                    .then((response) => {
                      const depositNonce = `${response.toJSON()}`;
                      setDepositNonce(depositNonce);
                      setTransactionStatus("In Transit");
                      ga.event("transfer_intransit", {
                        address,
                        recipient: depositRecipient,
                        amount: depositAmount,
                        nonce: parseInt(depositNonce),
                      });
                    })
                    .catch((error) => {
                      console.error(error);
                    });
                } else {
                  console.log(`Current status: ${status.type}`);
                }
              }
            )
            .catch((error: any) => {
              console.log(":( transaction failed", error);
              setTransactionStatus("Transfer Aborted");
              fallback?.stop();
            });
        }
      }
    },
    [api, setDepositNonce, setTransactionStatus, address, homeChainConfig]
  );

  // Required for adaptor however not needed for substrate
  const wrapToken = async (value: number): Promise<string> => {
    return "Not implemented";
  };

  // Required for adaptor however not needed for substrate
  const unwrapToken = async (value: number): Promise<string> => {
    return "Not implemented";
  };

  return (
    <HomeBridgeContext.Provider
      value={{
        connect: handleConnect,
        disconnect: async () => {
          await api?.disconnect();
        },
        getNetworkName: () => homeChainConfig?.name || "undefined",
        bridgeFee,
        deposit,
        depositAmount,
        selectedToken,
        setDepositAmount,
        setSelectedToken,
        tokens: tokens,
        relayerThreshold,
        wrapTokenConfig: undefined, // Not implemented
        wrapper: undefined, // Not implemented
        wrapToken, // Not implemented
        unwrapToken, // Not implemented
        isReady: isReady,
        chainConfig: homeChainConfig,
        address: address,
        nativeTokenBalance: 0,
        accounts: accounts,
        selectAccount: selectAccount,
        handleCheckSupplies: undefined,
      }}
    >
      {children}
    </HomeBridgeContext.Provider>
  );
};

export const SubstrateDestinationAdaptorProvider = ({
  children,
}: IDestinationBridgeProviderProps) => {
  const {
    depositNonce,
    homeChainConfig,
    destinationChainConfig,
    setDepositVotes,
    depositVotes,
    tokensDispatch,
    transactionStatus,
    setTransactionStatus,
    depositAmount,
    depositRecipient,
    setFallback,
    fallback,
    address,
  } = useNetworkManager();

  const [api, setApi] = useState<ApiPromise | undefined>();

  const [initiaising, setInitialising] = useState(false);
  useEffect(() => {
    // Once the chain ID has been set in the network context, the destination configuration will be automatically
    // set thus triggering this
    if (!destinationChainConfig || initiaising || api) return;
    setInitialising(true);
    createApi(
      destinationChainConfig.rpcUrl,
      destinationChainConfig.rpcFallbackUrls
    )
      .then((api) => {
        setApi(api);
        setInitialising(false);
      })
      .catch(console.error);
  }, [destinationChainConfig, api, initiaising, transactionStatus]);

  const [listenerActive, setListenerActive] = useState<
    UnsubscribePromise | undefined
  >(undefined);

  useEffect(() => {
    if (api && !listenerActive && depositNonce) {
      // Wire up event listeners
      // Subscribe to system events via storage
      const unsubscribe = api.query.system.events((events) => {
        console.log("----- Received " + events.length + " event(s): -----");
        // loop through the Vec<EventRecord>
        events.forEach((record) => {
          // extract the phase, event and the event types
          const { event, phase } = record;
          const types = event.typeDef;
          // show what we are busy with
          console.log(
            event.section +
              ":" +
              event.method +
              "::" +
              "phase=" +
              phase.toString()
          );
          console.log(event.meta.documentation.toString());
          // loop through each of the parameters, displaying the type and data
          event.data.forEach((data, index) => {
            console.log(types[index].type + ";" + data.toString());
          });

          if (
            event.section ===
              (destinationChainConfig as SubstrateBridgeConfig)
                .chainbridgePalletName &&
            event.method === "VoteFor"
          ) {
            setDepositVotes(depositVotes + 1);
            tokensDispatch({
              type: "addMessage",
              payload: {
                address: "Substrate Relayer",
                signed: "Confirmed",
                order: parseFloat(`1.${depositVotes + 1}`),
              },
            });
          }

          if (
            event.section ===
              (destinationChainConfig as SubstrateBridgeConfig)
                .chainbridgePalletName &&
            event.method === "ProposalApproved"
          ) {
            setDepositVotes(depositVotes + 1);
            setTransactionStatus("Transfer Completed");
            fallback?.stop();
            ga.event("transfer_completed", {
              address,
              recipient: depositRecipient,
              nonce: parseInt(depositNonce),
              amount: depositAmount,
            });
          }
        });
      });
      setListenerActive(unsubscribe);
    } else if (listenerActive && !depositNonce) {
      const unsubscribeCall = async () => {
        setListenerActive(undefined);
      };
      unsubscribeCall();
    }
  }, [
    api,
    depositNonce,
    depositVotes,
    destinationChainConfig,
    listenerActive,
    setDepositVotes,
    setTransactionStatus,
    tokensDispatch,
  ]);

  const initFallbackMechanism = useCallback(async (): Promise<void> => {
    const srcChainId = homeChainConfig?.chainId as number;
    const destinationChainId = destinationChainConfig?.chainId as number;
    const {
      delayMs,
      pollingMinIntervalMs,
      pollingMaxIntervalMs,
      blockTimeMs,
    } = getСhainTransferFallbackConfig(srcChainId, destinationChainId);
    const pollingIntervalMs = Math.min(
      Math.max(pollingMinIntervalMs, 3 * blockTimeMs),
      pollingMaxIntervalMs
    );
    const fallback = new Fallback(delayMs, pollingIntervalMs, async () => {
      const res = await getBridgeProposalVotes(
        api as ApiPromise,
        srcChainId,
        destinationChainId,
        depositRecipient as string,
        parseInt(depositNonce as string),
        depositAmount as number
      );
      console.log("Proposal votes status", res?.status);
      switch (res?.status) {
        case VoteStatus.APPROVED:
          console.log("Transfer completed in fallback mechanism");
          setTransactionStatus("Transfer Completed");
          fallback.stop();
          ga.event("fallback_transfer_completed", {
            address: address,
            recipient: depositRecipient,
            nonce: parseInt(depositNonce as string),
            amount: depositAmount,
          });
          return false;
        case VoteStatus.REJECTED:
          console.log("Transfer aborted in fallback mechanism");
          setTransactionStatus("Transfer Aborted");
          fallback.stop();
          ga.event("fallback_transfer_aborted", {
            address: address,
            recipient: depositRecipient,
            nonce: parseInt(depositNonce as string),
            amount: depositAmount,
          });
          return false;
        default:
          return true;
      }
    });
    fallback.start();
    setFallback(fallback);
  }, [
    api,
    homeChainConfig,
    destinationChainConfig,
    depositRecipient,
    depositNonce,
    depositAmount,
  ]);

  useEffect(() => {
    console.log({ transactionStatus }); // ToDo: check why get transaction status update several times on the same status
    if (transactionStatus === "In Transit" && api && !fallback?.started())
      initFallbackMechanism();
  }, [transactionStatus, api, fallback]);

  return (
    <DestinationBridgeContext.Provider
      value={{
        disconnect: async () => {
          await api?.disconnect();
        },
      }}
    >
      {children}
    </DestinationBridgeContext.Provider>
  );
};
