export const web3AuthOptions = {
  clientId: import.meta.env.CLIENT_ID || import.meta.env.VITE_CLIENT_ID,
  web3AuthNetwork: "sapphire_devnet",
  defaultChainId: '0x61',
  uiConfig: {
    mode: 'dark',
    defaultLanguage: 'en',
    theme: {
      primary: '#768729',
    },
  },
  walletServicesConfig: {
    confirmationStrategy: "modal",
    modalZIndex: 99999,
    enableKeyExport: false,
    whiteLabel: {
      showWidgetButton: true,
      buttonPosition: "bottom-right",
      hideNftDisplay: false,
      hideTokenDisplay: false,
      hideTransfers: false,
      hideTopup: false,
      hideReceive: false,
      hideSwap: false,
      hideShowAllTokens: false,
      hideWalletConnect: false,
      defaultPortfolio: 'token',
    },
  },
}