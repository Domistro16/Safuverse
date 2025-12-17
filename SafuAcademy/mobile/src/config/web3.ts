import { CHAIN_ID, RPC_URL, CHAIN_NAME, EXPLORER_URL, WALLET_CONNECT_PROJECT_ID } from './constants';

export const bscChain = {
  id: CHAIN_ID,
  name: CHAIN_NAME,
  network: 'bsc',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: EXPLORER_URL },
  },
  testnet: false,
};

export const web3Config = {
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [bscChain],
  metadata: {
    name: 'SafuAcademy',
    description: 'Learn Web3 & Blockchain',
    url: 'https://safuacademy.com',
    icons: ['https://safuacademy.com/icon.png'],
  },
};
