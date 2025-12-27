import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { ethers } from 'ethers';
import { web3Config } from '@config/web3';
import { authService } from '@services/authService';
import { useAuth } from '@hooks/useAuth';
import { WalletSelectModal } from '@components/WalletSelectModal';

// Only import WalletConnect on native platforms
let WalletConnectModal: any;
let useWalletConnectModal: any;

if (Platform.OS !== 'web') {
  const WC = require('@walletconnect/modal-react-native');
  WalletConnectModal = WC.WalletConnectModal;
  useWalletConnectModal = WC.useWalletConnectModal;
}

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  provider: ethers.Provider | null;
  showWalletModal: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  // Only use WalletConnect on native platforms
  const walletConnectHook = Platform.OS !== 'web' && useWalletConnectModal ? useWalletConnectModal() : null;
  const { loginAsync } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web, check for window.ethereum (MetaMask, etc.)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const checkConnection = async () => {
          try {
            const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await ethersProvider.listAccounts();
            if (accounts.length > 0) {
              setAddress(accounts[0].address);
              setIsConnected(true);
              setProvider(ethersProvider);
            }
          } catch (error) {
            console.log('Not connected to web3 wallet');
          }
        };
        checkConnection();
      }
    } else if (walletConnectHook) {
      // On native, use WalletConnect
      const { isConnected: wcIsConnected, address: wcAddress, provider: wcProvider } = walletConnectHook;
      if (wcIsConnected && wcAddress) {
        setAddress(wcAddress);
        setIsConnected(true);

        // Create ethers provider
        if (wcProvider) {
          const ethersProvider = new ethers.BrowserProvider(wcProvider);
          setProvider(ethersProvider);
        }
      } else {
        setAddress(null);
        setIsConnected(false);
        setProvider(null);
      }
    }
  }, [walletConnectHook]);

  const showWalletModal = useCallback(() => {
    setWalletModalVisible(true);
  }, []);

  const hideWalletModal = useCallback(() => {
    setWalletModalVisible(false);
    setConnectingWallet(null);
  }, []);

  // Helper to get specific wallet provider when multiple wallets are installed
  const getWalletProvider = (walletId: string) => {
    const ethereum = (window as any).ethereum;

    if (!ethereum) return null;

    // Check if there are multiple providers (EIP-5749)
    const providers = ethereum.providers || [ethereum];

    console.log('Available providers:', providers.map((p: any) => ({
      isMetaMask: p.isMetaMask,
      isTrustWallet: p.isTrustWallet,
      isCoinbaseWallet: p.isCoinbaseWallet,
    })));

    for (const provider of providers) {
      if (walletId === 'metamask' && provider.isMetaMask && !provider.isTrustWallet) {
        return provider;
      }
      if (walletId === 'trustwallet' && provider.isTrustWallet) {
        return provider;
      }
      if (walletId === 'coinbase' && provider.isCoinbaseWallet) {
        return provider;
      }
    }

    // Fallback to default
    return ethereum;
  };

  const connectWithMetaMask = async (walletId: string = 'metamask') => {
    if (typeof window === 'undefined') {
      throw new Error('Window not available');
    }

    // Get the specific provider for the selected wallet
    const ethereum = getWalletProvider(walletId);

    if (!ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet extension');
    }

    console.log('Using provider for:', walletId, {
      isMetaMask: ethereum.isMetaMask,
      isTrustWallet: ethereum.isTrustWallet,
    });

    let accounts: string[] = [];

    try {
      // First check if already connected
      accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('Existing accounts:', accounts);

      // If no accounts, request connection
      if (!accounts || accounts.length === 0) {
        console.log('No existing accounts, requesting...');
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Requested accounts:', accounts);
      }
    } catch (requestError: any) {
      console.error('Wallet connection error:', requestError);

      if (requestError.code === 4001) {
        throw new Error('User rejected the connection request');
      }

      throw new Error(`Wallet connection failed: ${requestError.message || 'Please try unlocking your wallet'}`);
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please make sure your wallet is unlocked and has at least one account.');
    }

    const walletAddress = accounts[0];
    console.log('Connected to wallet:', walletAddress);

    // Create ethers provider for signing
    const ethersProvider = new ethers.BrowserProvider(ethereum);
    const signer = await ethersProvider.getSigner();

    // Get nonce and message from backend
    const nonceResponse = await authService.getNonce(walletAddress);
    const { message } = nonceResponse;

    // Sign the message from the backend
    const signature = await signer.signMessage(message);

    // Verify signature and login
    await loginAsync({
      walletAddress,
      signature,
      message,
    });

    setAddress(walletAddress);
    setIsConnected(true);
    setProvider(ethersProvider);
  };

  const connectWithWalletConnect = async () => {
    if (!walletConnectHook) {
      throw new Error('WalletConnect not available');
    }

    await walletConnectHook.open();

    if (walletConnectHook.address && walletConnectHook.provider) {
      // Get nonce and message from backend
      const nonceResponse = await authService.getNonce(walletConnectHook.address);
      const { message } = nonceResponse;

      // Sign message
      const ethersProvider = new ethers.BrowserProvider(walletConnectHook.provider);
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(message);

      // Verify signature and login
      await loginAsync({
        walletAddress: walletConnectHook.address,
        signature,
        message,
      });
    }
  };

  const handleSelectWallet = async (walletId: string) => {
    try {
      setIsConnecting(true);
      setConnectingWallet(walletId);

      switch (walletId) {
        case 'metamask':
          await connectWithMetaMask('metamask');
          break;
        case 'walletconnect':
          await connectWithWalletConnect();
          break;
        case 'coinbase':
          await connectWithMetaMask('coinbase');
          break;
        case 'trustwallet':
          await connectWithMetaMask('trustwallet');
          break;
        default:
          // Try with the default provider
          await connectWithMetaMask(walletId);
      }

      hideWalletModal();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  // Legacy connect function - now shows modal
  const connect = async () => {
    showWalletModal();
  };

  const disconnect = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Just clear state (can't actually disconnect MetaMask programmatically)
        setAddress(null);
        setIsConnected(false);
        setProvider(null);
      } else if (walletConnectHook?.provider) {
        // Native: Disconnect WalletConnect
        if (walletConnectHook.provider.disconnect) {
          await walletConnectHook.provider.disconnect();
        }

        setAddress(null);
        setIsConnected(false);
        setProvider(null);
      }

      // Logout from backend
      await authService.logout();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!provider) {
      throw new Error('Wallet not connected');
    }

    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  };

  return (
    <>
      <Web3Context.Provider
        value={{
          address,
          isConnected,
          isConnecting,
          connect,
          disconnect,
          signMessage,
          provider,
          showWalletModal,
        }}
      >
        {children}
      </Web3Context.Provider>

      {/* Wallet Selection Modal */}
      <WalletSelectModal
        visible={walletModalVisible}
        onClose={hideWalletModal}
        onSelectWallet={handleSelectWallet}
        isConnecting={isConnecting}
        connectingWallet={connectingWallet}
      />

      {/* WalletConnect Modal for native */}
      {Platform.OS !== 'web' && WalletConnectModal && (
        <WalletConnectModal
          projectId={web3Config.projectId}
          providerMetadata={web3Config.metadata}
        />
      )}
    </>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
