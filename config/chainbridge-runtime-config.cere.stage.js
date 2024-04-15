const cereTokenName = "Testnet Cere";
const cereTokenSymbol = "TST_CERE";
const cereTokenDecimals = 10;

window.__RUNTIME_CONFIG__ = {
  CHAINBRIDGE: {
    ga: {
      trackingId: "G-EVYKNM010Y",
      appName: "chainbridge-ui",
    },
    chains: [
      {
        chainId: 2,
        networkId: 80002,
        name: "Polygon Amoy",
        decimals: cereTokenDecimals,
        bridgeAddress: "0xD134be2c9d23a5e1d7b632633dDD832066D39dE8",
        erc20HandlerAddress: "0x4bF13AF921eb468F6B0Fc19f9b41a2Fd7769D99C",
        rpcUrl: "https://rpc.ankr.com/polygon_amoy/c3f39efa809ec60e8a5f1d035689162b51c1d9eb39233314e7725556faf7f503",
        blockExplorer: "https://www.oklink.com/amoy/tx",
        type: "Ethereum",
        nativeTokenSymbol: "MATIC",
        defaultGasPrice: 800,
        gasPriceSuggestionEnabled: true,
        defaultGasPriceIncreaseInPercents: 10,
        availableAsHomeNetwork: true,
        tokens: [
          {
            address: "0x6A077176E22c05a9607A32cdc9fE23Dd6db2A9Ca",
            name: "Testnet CERE",
            symbol: "TST_CERE",
            imageUri: "CEREIcon",
            resourceId:
                "0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00",
            decimals: cereTokenDecimals,
            isDoubleApproval: false,
          },
        ],
        transferFallback: [
          {
            chainId: 1,
            delayMs: 4 * 60 * 1000,
            blockTimeMs: 6000,
            pollingMinIntervalMs: 15000,
            pollingMaxIntervalMs: 30000,
          },
        ],
      },
      {
        chainId: 1,
        networkId: 2,
        name: "Cere Testnet",
        decimals: cereTokenDecimals,
        rpcUrl: "wss://rpc.testnet.cere.network/ws",
        blockExplorer:
            "https://explorer.cere.network/?rpc=wss%3A%2F%2Farchive.testnet.cere.network%2Fws#/explorer/query",
        rpcFallbackUrls: ["wss://archive.testnet.cere.network/ws"],
        type: "Substrate",
        nativeTokenSymbol: "CERE",
        availableAsHomeNetwork: true,
        chainbridgePalletName: "chainBridge",
        bridgeFeeValue: 0,
        transferPalletName: "erc20",
        transferFunctionName: "transferNative",
        typesFileName: "bridgeTypes.json",
        existentialDepositPlusNetworkFee: "1.03",
        bridgeAccountId: "5EYCAe5g7bGpFHagwe26HiRHdHdE3hobrwV6hq1UD2BPAiZb",
        tokens: [
          {
            address: "cere-native",
            name: cereTokenName,
            symbol: cereTokenSymbol,
            imageUri: "CEREIcon",
            resourceId:
                "0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00",
            decimals: cereTokenDecimals,
          },
        ],
        transferFallback: [
          {
            chainId: 2,
            delayMs: 3 * 60 * 1000,
            blockTimeMs: 3000,
            pollingMinIntervalMs: 15000,
            pollingMaxIntervalMs: 30000,
          },
        ],
      },
      {
        chainId: 0,
        networkId: 11155111,
        name: "Ethereum Sepolia",
        decimals: cereTokenDecimals,
        rpcUrl: "https://rpc.ankr.com/ethereum_sepolia/c3f39efa809ec60e8a5f1d035689162b51c1d9eb39233314e7725556faf7f503",
        blockExplorer: "https://sepolia.etherscan.io/tx",
        bridgeAddress: "0x120B0ba52DC11acA91E8d679eF127815Af0920CD",
        erc20HandlerAddress: "0x6A077176E22c05a9607A32cdc9fE23Dd6db2A9Ca",
        type: "Ethereum",
        nativeTokenSymbol: "ETH",
        defaultGasPrice: 400,
        availableAsHomeNetwork: true,
        tokens: [
          {
            address: "0x244A84580B96C49BDf552E18613227eF30951b04",
            name: cereTokenName,
            symbol: cereTokenSymbol,
            imageUri: "CEREIcon",
            resourceId:
                "0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00",
            decimals: cereTokenDecimals,
            isDoubleApproval: false,
          },
        ],
        transferFallback: [
          {
            chainId: 1,
            delayMs: 6 * 60 * 1000,
            blockTimeMs: 6000,
            pollingMinIntervalMs: 15000,
            pollingMaxIntervalMs: 30000,
          },
        ],
      },
    ],
  },
};
