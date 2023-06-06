// web3Onboard.ts
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule, {WalletConnectOptions} from '@web3-onboard/walletconnect'
import { init } from '@web3-onboard/react'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY;
const NETWORK_ID = Number(process.env.REACT_APP_NETWORK_ID);

const injected = injectedModule({
    custom: [],
    filter: {}
});

const wcV1InitOptions: WalletConnectOptions = {
    bridge: 'YOUR_CUSTOM_BRIDGE_SERVER',  // replace with your bridge server
    qrcodeModalOptions: {
        mobileLinks: ['metamask', 'argent', 'trust']
    },
    connectFirstChainId: true,
};

const wcV2InitOptions: WalletConnectOptions = {
    version: 2,
    projectId: 'abc123...',  // replace with your WalletConnect project ID
};

// if WalletConnect version isn't set, it will default to V1 until V1 sunset
const walletConnect = walletConnectModule(wcV2InitOptions || wcV1InitOptions);

export const web3Onboard = init({
    wallets: [injected, walletConnect],
    chains: [
        {
            id: NETWORK_ID.toString(16),
            token: 'ETH',
            label: 'Ethereum Mainnet',
            rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`
        }
    ]
});
