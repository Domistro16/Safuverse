// Stub module for @walletconnect/modal-react-native on web
// This module is only used on native platforms, so we export empty stubs for web

export const WalletConnectModal = () => null;

export const useWalletConnectModal = () => ({
    isConnected: false,
    address: null,
    provider: null,
    open: async () => {
        console.warn('WalletConnect is not available on web. Use MetaMask or another browser extension wallet.');
    },
});

export default {
    WalletConnectModal,
    useWalletConnectModal,
};
