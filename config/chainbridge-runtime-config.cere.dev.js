const cereTokenName = "CERE Network";
const cereTokenSymbol = "CERE";
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
        networkId: 80001,
        name: "Polygon Amoy",
        decimals: cereTokenDecimals,
        bridgeAddress: "0xf2686661e3297d737D7Ae709A433639151d11Ed6",
        erc20HandlerAddress: "0xCA8C0076262797f7f35E3874e7E208c9e394195E",
        rpcUrl:
            "http://rpc.ankr.com/polygon_amoy/c3f39efa809ec60e8a5f1d035689162b51c1d9eb39233314e7725556faf7f503",
        // Todo: replace to Amoy
        blockExplorer: "https://mumbai.polygonscan.com/tx",
        type: "Ethereum",
        nativeTokenSymbol: "MATIC",
        defaultGasPrice: 800,
        gasPriceSuggestionEnabled: true,
        defaultGasPriceIncreaseInPercents: 10,
        availableAsHomeNetwork: true,
        tokens: [
          {
            address: "0x8C7B1504d5E7Aa3e2E38353CFFd7526019b3cBBB",
            name: "CN",
            symbol: "CS",
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
        name: "Cere Devnet",
        decimals: cereTokenDecimals,
        rpcUrl: "wss://rpc.devnet.cere.network/ws",
        blockExplorer:
            "https://explorer.cere.network/?rpc=wss%3A%2F%2Farchive.devnet.cere.network%2Fws#/explorer/query",
        rpcFallbackUrls: ["wss://archive.devnet.cere.network/ws"],
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
        networkId: 5,
        name: "Ethereum Goerli",
        decimals: cereTokenDecimals,
        rpcUrl: "https://goerli.infura.io/v3/0aca1499facc499bb195d2d437f78603",
        blockExplorer: "https://goerli.etherscan.io/tx",
        bridgeAddress: "0xa806cA3bD88F790744462cBC34c40EDd5b8dc2Dd",
        erc20HandlerAddress: "0xf934Bfc8B5241b6C9e0DfC9A329AD687e79c5498",
        type: "Ethereum",
        nativeTokenSymbol: "ETH",
        defaultGasPrice: 400,
        availableAsHomeNetwork: true,
        tokens: [
          {
            address: "0xb8A59CEF67d12C5C75836aEfF1d97943F5A9F662",
            name: "CN",
            symbol: "CS",
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
