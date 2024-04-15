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
        networkId: 80002,
        name: "Polygon Amoy",
        decimals: cereTokenDecimals,
        bridgeAddress: "0x0086e7687F7326A3b77857F2870e185EC0EA5126",
        erc20HandlerAddress: "0x310E5834F95964EAe7098D3dA9CD26c17cd83137",
        rpcUrl:
            "https://rpc.ankr.com/polygon_amoy/c3f39efa809ec60e8a5f1d035689162b51c1d9eb39233314e7725556faf7f503",
        blockExplorer: "https://www.oklink.com/amoy/tx",
        type: "Ethereum",
        nativeTokenSymbol: "MATIC",
        defaultGasPrice: 800,
        gasPriceSuggestionEnabled: true,
        defaultGasPriceIncreaseInPercents: 10,
        availableAsHomeNetwork: true,
        tokens: [
          {
            address: "0xA8Dcf93a639E3A3834892DEE2E8f07270e7E58F7",
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
        name: "Cere Qanet",
        decimals: cereTokenDecimals,
        rpcUrl: "wss://rpc.qanet.cere.network/ws",
        blockExplorer:
            "https://explorer.cere.network/?rpc=wss%3A%2F%2Farchive.qanet.cere.network%2Fws#/explorer/query",
        rpcFallbackUrls: ["wss://archive.qanet.cere.network/ws"],
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
        bridgeAddress: "0x310E5834F95964EAe7098D3dA9CD26c17cd83137",
        erc20HandlerAddress: "0x56F464e1b2592b4B73CE2FcAe8e5de921A276167",
        type: "Ethereum",
        nativeTokenSymbol: "ETH",
        defaultGasPrice: 400,
        availableAsHomeNetwork: true,
        tokens: [
          {
            address: "0x0086e7687F7326A3b77857F2870e185EC0EA5126",
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
