// web3Onboard.ts
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule, {WalletConnectOptions} from '@web3-onboard/walletconnect'
import { init } from '@web3-onboard/react'
import { chainbridgeConfig } from './chainbridgeConfig';

const injected = injectedModule({
    custom: [],
    filter: {}
});

const wcV1InitOptions: WalletConnectOptions = {
    bridge: 'https://bridge.walletconnect.org',
    qrcodeModalOptions: {
        mobileLinks: ['metamask', 'argent', 'trust']
    },
    connectFirstChainId: true,
};

const wcV2InitOptions: WalletConnectOptions = {
    version: 2,
    projectId: '38473bbcaa1f5860ed436c8b60cb3e94',
};

// if WalletConnect version isn't set, it will default to V1 until V1 sunset
const walletConnect = walletConnectModule(wcV2InitOptions || wcV1InitOptions);

const ethChains = chainbridgeConfig.chains
    .filter(chain => chain.type === "Ethereum")
    .map(({ networkId, rpcUrl, nativeTokenSymbol, name}) => ({
        id: Number(networkId),
        token: nativeTokenSymbol,
        label: name,
        rpcUrl,
    }));

export const web3Onboard = init({
    wallets: [injected, walletConnect],
    chains: ethChains,
});
