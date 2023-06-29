import React from "react";
import { Bridge, BridgeFactory } from "@chainsafe/chainbridge-contracts";
import { useConnectWallet, useSetChain } from "@web3-onboard/react";
import { BigNumber, utils, ethers} from "ethers";
import { useCallback, useEffect, useState } from "react";
import {
  chainbridgeConfig,
  EvmBridgeConfig,
  SubstrateBridgeConfig,
  TokenConfig,
} from "../../../chainbridgeConfig";
import { Erc20DetailedFactory } from "../../../Contracts/Erc20DetailedFactory";
import { Weth } from "../../../Contracts/Weth";
import { WethFactory } from "../../../Contracts/WethFactory";
import { useNetworkManager } from "../../NetworkManagerContext";
import { IHomeBridgeProviderProps } from "../interfaces";
import { HomeBridgeContext } from "../../HomeBridgeContext";
import { parseUnits } from "ethers/lib/utils";
import { decodeAddress } from "@polkadot/util-crypto";
import { getPriceCompatibility } from "./helpers";
import { hasTokenSupplies } from "../SubstrateApis/ChainBridgeAPI";
import { ApiPromise } from "@polkadot/api";
import { localStorageVars } from "../../../Constants/constants";
const { ONBOARD_SELECTED_WALLET } = localStorageVars;

export const EVMHomeAdaptorProvider = ({
  children,
}: IHomeBridgeProviderProps) => {
  const [
    {
      wallet, // the wallet that has been connected or null if not yet connected
      connecting // boolean indicating if connection is in progress,
    },
    connect, // function to call to initiate user to connect wallet
    disconnect, // function to call with wallet<DisconnectOptions> to disconnect wallet
    updateBalances, // function to be called with an optional array of wallet addresses connected through Onboard to update balance or empty/no params to update all connected wallets
    setWalletModules, // function to be called with an array of wallet modules to conditionally allow connection of wallet types i.e. setWalletModules([ledger, trezor, injected])
    setPrimaryWallet // function that can set the primary wallet and/or primary account within that wallet. The wallet that is set needs to be passed in for the first parameter and if you would like to set the primary account, the address of that account also needs to be passed in
  ] = useConnectWallet();

  const [
    {
      chains, // the list of chains that web3-onboard was initialized with
      connectedChain, // the current chain the user's wallet is connected to
      settingChain // boolean indicating if the chain is in the process of being set
    },
    setChain // function to call to initiate user to switch chains in their wallet
  ] = useSetChain();

  // Tokens are records of the address and token information for the currently selected chain.
  const [tokens, setTokens] = useState<Record<TokenConfig["address"], TokenConfig>>({});

  const [ethBalance, setEthBalance] = useState(0);

  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();

  // State for wallet readiness status. Initially false.
  const [isReady, setIsReady] = useState(false);

  // State for the connected wallet address. Initially undefined.
  const [address, updateAddress] = useState<string>();

  // Network is an id of current chain.
  const [network, setNetwork] = useState<number>();

  const fetchGasPrice = useCallback(async () => {
    if (!provider) return null;
    try {
      const fetchedGasPrice = await provider.getGasPrice();
      return Number(fetchedGasPrice);
    } catch (err) {
      console.error(err);
    }
  }, [provider]);

  useEffect(() => {
    if (wallet?.provider) {
      // if using ethers v6 this is:
      // ethersProvider = new ethers.BrowserProvider(wallet.provider, 'any')
      setProvider(new ethers.providers.Web3Provider(wallet.provider, 'any'))
    } else {
      setProvider(undefined);
    }
  }, [wallet]);

  // Setup eth balance.
  useEffect(() => {
    // Active account is always the first in wallet.
    const ethBalanceInWallet = wallet?.accounts?.[0]?.balance?.ETH;

    if (ethBalanceInWallet) {
      setEthBalance(Number(ethBalanceInWallet));
    }
  }, [wallet]);

  useEffect(() => {
    setIsReady(Boolean(wallet) && !connecting);
  }, [wallet, connecting]);

  useEffect(() => {
    updateAddress(wallet?.accounts[0].address);
  }, [wallet]);

  useEffect(() => {
    setNetwork(Number(connectedChain?.id));
  }, [connectedChain]);

  const disconnectWallet = () => {
    if (wallet) {
      disconnect(wallet);
    }
  };

  const {
    homeChainConfig,
    destinationChainConfig,
    setTransactionStatus,
    setDepositNonce,
    handleSetHomeChain,
    homeChains,
    networkId,
    setNetworkId,
    setWalletType,
    depositAmount,
    setDepositAmount,
    setDepositRecipient,
    fallback,
    analytics,
    setAddress,
    setHomeTransferTxHash,
    api,
    networkSupported,
    setNetworkSupported,
    walletType
  } = useNetworkManager();

  const [homeBridge, setHomeBridge] = useState<Bridge | undefined>(undefined);
  const [relayerThreshold, setRelayerThreshold] = useState<number | undefined>(
    undefined
  );
  const [bridgeFee, setBridgeFee] = useState<number | undefined>();

  const [selectedToken, setSelectedToken] = useState<string>("");

  // Contracts
  const [wrapper, setWrapper] = useState<Weth | undefined>(undefined);
  const [wrapTokenConfig, setWrapperConfig] = useState<TokenConfig | undefined>(
    undefined
  );
  const [initialising, setInitialising] = useState(false);
  const [walletSelected, setWalletSelected] = useState(false);
  const [account, setAccount] = useState<string | undefined>();

  const checkWallet = useCallback(async () => {
    try {
      if (wallet) {
        if (homeChainConfig && network && isReady && provider) {
          const signer = provider.getSigner();
          if (!signer) {
            console.log("No signer");
            setInitialising(false);
            return;
          }

          const bridge = BridgeFactory.connect(
            (homeChainConfig as EvmBridgeConfig).bridgeAddress,
            signer
          );
          setHomeBridge(bridge);

          const wrapperToken = homeChainConfig.tokens.find(
            (token) => token.isNativeWrappedToken
          );

          if (!wrapperToken) {
            setWrapperConfig(undefined);
            setWrapper(undefined);
          } else {
            setWrapperConfig(wrapperToken);
            const connectedWeth = WethFactory.connect(
              wrapperToken.address,
              signer
            );
            setWrapper(connectedWeth);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialising(false);
      return Boolean(wallet);
    }
  }, [wallet, homeChainConfig, isReady, network, provider]);

  useEffect(() => {
    if (network) {
      const chain = chainbridgeConfig.chains.find((chain) => chain.networkId === network);
      setNetworkId(network);
      const supported = !!chainbridgeConfig.chains.find(chain => chain.networkId === network);
      setNetworkSupported(supported);
      if (!!network && !supported) {
        disconnectWallet();
        setWalletType("unset");
      }
      if (chain) {
        // `setTokens` maps over the chain tokens. For each token, it checks if it exists in the wallet.
        // If it does, it uses the wallet's balance. If it doesn't, it sets balance as "0".
        // The function constructs an object where each key is a token address and its value is the token details and balance.
        setTokens(chain.tokens.reduce((acc, currentToken) => {
          const matchingTokenInWallet = wallet?.accounts[0]?.secondaryTokens?.find(
              (walletToken) => walletToken.name === currentToken.symbol
          );

          return {
            ...acc,
            [currentToken.address]: {
              ...currentToken,
              balance: matchingTokenInWallet
                  ? matchingTokenInWallet.balance
                  : "0", // set a default value for balance if the token is not found in the wallet
            },
          };
        }, {}));
        handleSetHomeChain(chain.chainId);
      } else {
        setTokens({});
      }
    }
  }, [handleSetHomeChain, homeChains, network, setNetworkId]);

  useEffect(() => {
    if (initialising || homeBridge) return;
    console.log("Starting init");
    setInitialising(true);

    wallet?.provider?.on("error", (err: any) => {
      console.error("Wallet provider error:", err);
    });

    // On the first connect to a blockchain this event doesn't happen
    wallet?.provider?.on("chainChanged", (newNetworkId: number) => {
      console.log("Chain changed:", { networkId, newNetworkId });
      if (newNetworkId === networkId) return;
      setNetworkId(
        newNetworkId.toString().substring(0, 2) === '0x'
        ? parseInt(newNetworkId.toString(), 16)
        : newNetworkId
      );
      if (isReady && networkSupported) window.location.reload();
    });

    wallet?.provider?.on("accountsChanged", (accounts: string[])=> {
      console.log("Accounts changed:", { walletSelected, account, accounts });
      const walletChanged = walletSelected && account && account !== accounts[0];
      if (walletChanged) setWalletType("unset");
      setAccount(accounts[0].toLowerCase())
    });

    if (walletType === "Ethereum") {
      connect().then(() => {
        checkWallet();
      });
    }
  }, [
    checkWallet,
    initialising,
    homeChainConfig,
    isReady,
    provider,
    network,
    networkId,
    setNetworkId,
    homeBridge,
    walletSelected,
    setWalletType,
    account,
    networkSupported,
    wallet,
    walletType
  ]);

  useEffect(() => {
    const getRelayerThreshold = async () => {
      if (homeBridge) {
        //TODO: https://cerenetwork.atlassian.net/browse/CBI-1124
        // const threshold = BigNumber.from(
        //   await homeBridge._relayerThreshold()
        // ).toNumber();
        const threshold = 2;
        setRelayerThreshold(threshold);
      }
    };
    const getBridgeFee = async () => {
      if (homeBridge) {
        const bridgeFee = Number(utils.formatEther(await homeBridge._fee()));
        setBridgeFee(bridgeFee);
      }
    };
    getRelayerThreshold();
    getBridgeFee();
  }, [homeBridge]);

  const handleConnect = useCallback(async () => {
   await connect();
  }, [connect]);

  const handleCheckSupplies = useCallback(
    async (amount: number) => {
      if (destinationChainConfig?.type === "Substrate") {
        return await hasTokenSupplies(
          api as ApiPromise,
          (destinationChainConfig as SubstrateBridgeConfig).bridgeAccountId,
          amount,
          destinationChainConfig.decimals
        );
      } else {
        console.warn(
          `Liquidity check is skipping. The destination chain type ${destinationChainConfig?.type} is unknown. Please check it.`
        );
        return true;
      }
    },
    [destinationChainConfig, api]
  );

  const deposit = useCallback(
    async (
      amount: number,
      recipient: string,
      tokenAddress: string,
      destinationChainId: number
    ) => {
      if (!homeChainConfig || !homeBridge) {
        console.error("Home bridge contract is not instantiated");
        return;
      }
      const signer = provider?.getSigner();
      if (!address || !signer) {
        console.log("No signer");
        return;
      }

      const destinationChain = chainbridgeConfig.chains.find(
        (c) => c.chainId === destinationChainId
      );
      if (destinationChain?.type === "Substrate") {
        recipient = `0x${Buffer.from(decodeAddress(recipient)).toString(
          "hex"
        )}`;
      }
      const token = homeChainConfig.tokens.find(
        (token) => token.address === tokenAddress
      );

      if (!token) {
        console.log("Invalid token selected");
        return;
      }
      setAddress(address);
      setTransactionStatus("Initializing Transfer");
      setDepositRecipient(recipient);
      setDepositAmount(amount);
      setSelectedToken(tokenAddress);
      analytics.trackTransferInitializingEvent({
        address,
        recipient,
        amount: depositAmount as number,
      });

      const erc20 = Erc20DetailedFactory.connect(tokenAddress, signer);
      const erc20Decimals = tokens[tokenAddress].decimals;

      const data =
        "0x" +
        utils
          .hexZeroPad(
            // TODO Wire up dynamic token decimals
            BigNumber.from(
              utils.parseUnits(amount.toString(), erc20Decimals)
            ).toHexString(),
            32
          )
          .substr(2) + // Deposit Amount (32 bytes)
        utils
          .hexZeroPad(utils.hexlify((recipient.length - 2) / 2), 32)
          .substr(2) + // len(recipientAddress) (32 bytes)
        recipient.substr(2); // recipientAddress (?? bytes)

      try {
        const gasPrice = await fetchGasPrice();

        if (!gasPrice) {
          throw new Error('Failed to fetch gas price');
        }

        const gasPriceCompatibility = await getPriceCompatibility(
          provider,
          homeChainConfig,
          gasPrice
        );

        const currentAllowance = await erc20.allowance(
          address,
          (homeChainConfig as EvmBridgeConfig).erc20HandlerAddress
        );
        console.log(
          "🚀  currentAllowance",
          utils.formatUnits(currentAllowance, erc20Decimals)
        );
        if (
          Number(utils.formatUnits(currentAllowance, erc20Decimals)) < amount
        ) {
          if (
            Number(utils.formatUnits(currentAllowance, erc20Decimals)) > 0 &&
            token.isDoubleApproval
          ) {
            //We need to reset the user's allowance to 0 before we give them a new allowance
            //TODO Should we alert the user this is happening here?
            await (
              await erc20.approve(
                (homeChainConfig as EvmBridgeConfig).erc20HandlerAddress,
                BigNumber.from(utils.parseUnits("0", erc20Decimals)),
                {
                  gasPrice: gasPriceCompatibility,
                }
              )
            ).wait(1);
          }
          await (
            await erc20.approve(
              (homeChainConfig as EvmBridgeConfig).erc20HandlerAddress,
              BigNumber.from(
                utils.parseUnits(amount.toString(), erc20Decimals)
              ),
              {
                gasPrice: gasPriceCompatibility,
              }
            )
          ).wait(1);
        }
        homeBridge.once(
          homeBridge.filters.Deposit(
            destinationChainId,
            token.resourceId,
            null
          ),
          (destChainId, resourceId, depositNonce, tx) => {
            setHomeTransferTxHash(tx.transactionHash);
            const nonce = depositNonce.toString();
            setDepositNonce(nonce ? nonce : undefined);
            setTransactionStatus("Transfer to Destination");
            analytics.trackTransferToDestinationEvent({
              address,
              recipient,
              nonce: parseInt(depositNonce),
              amount: depositAmount as number,
            });
          }
        );

        const res = await homeBridge.deposit(
          destinationChainId,
          token.resourceId,
          data,
          {
            gasPrice: gasPriceCompatibility,
            value: utils.parseUnits((bridgeFee || 0).toString(), 18),
          }
        );
        setTransactionStatus("Transfer from Source");
        await res.wait();

        analytics.trackTransferFromSourceEvent({
          address,
          recipient,
          amount: depositAmount as number,
        });

        return Promise.resolve();
      } catch (error) {
        console.error(error);
        setTransactionStatus("Transfer Aborted");
        setSelectedToken(tokenAddress);
        fallback?.stop();
        analytics.trackTransferAbortedEvent({
          address,
          recipient,
          amount: depositAmount as number,
        });
      }
    },
    [
      homeBridge,
      address,
      bridgeFee,
      homeChainConfig,
      provider,
      setDepositNonce,
      setTransactionStatus,
      tokens,
    ]
  );

  const wrapToken = async (value: number): Promise<string> => {
    if (!wrapTokenConfig || !wrapper?.deposit || !homeChainConfig)
      return "not ready";

    try {
      const gasPrice = await fetchGasPrice();

      if (!gasPrice) {
        throw new Error('Failed to fetch gas price');
      }

      const gasPriceCompatibility = await getPriceCompatibility(
        provider,
        homeChainConfig,
        gasPrice
      );

      const tx = await wrapper.deposit({
        value: parseUnits(`${value}`, homeChainConfig.decimals),
        gasPrice: gasPriceCompatibility,
      });

      await tx?.wait();
      if (tx?.hash) {
        return tx?.hash;
      } else {
        return "";
      }
    } catch (error) {
      console.error(error);
      return "";
    }
  };

  const unwrapToken = async (value: number): Promise<string> => {
    if (!wrapTokenConfig || !wrapper?.withdraw || !homeChainConfig)
      return "not ready";

    try {
      const gasPrice = await fetchGasPrice();

      if (!gasPrice) {
        throw new Error('Failed to fetch gas price');
      }

      const gasPriceCompatibility = await getPriceCompatibility(
        provider,
        homeChainConfig,
        gasPrice
      );

      const tx = await wrapper.deposit({
        value: parseUnits(`${value}`, homeChainConfig.decimals),
        gasPrice: gasPriceCompatibility,
      });

      await tx?.wait();
      if (tx?.hash) {
        return tx?.hash;
      } else {
        return "";
      }
    } catch (error) {
      console.error(error);
      return "";
    }
  };
  return (
    <HomeBridgeContext.Provider
      value={{
        connect: handleConnect,
        disconnect: async () => {
          disconnectWallet()
          setWalletType("unset");
        },
        bridgeFee,
        deposit,
        depositAmount,
        selectedToken,
        setDepositAmount,
        setSelectedToken,
        tokens,
        relayerThreshold,
        wrapTokenConfig,
        wrapper,
        wrapToken,
        unwrapToken,
        isReady,
        chainConfig: homeChainConfig,
        address,
        nativeTokenBalance: ethBalance,
        handleCheckSupplies,
      }}
    >
      {children}
    </HomeBridgeContext.Provider>
  );
};
