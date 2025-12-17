import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';
import { ethers } from 'ethers';
import { web3Config } from '@config/web3';
import { authService } from '@services/authService';
import { useAuth } from '@hooks/useAuth';

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  provider: ethers.Provider | null;
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
  const { open, isConnected: wcIsConnected, address: wcAddress, provider: wcProvider } = useWalletConnectModal();
  const { loginAsync } = useAuth();

  useEffect(() => {
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
  }, [wcIsConnected, wcAddress, wcProvider]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      await open();

      if (wcAddress && wcProvider) {
        // Get nonce from backend
        const nonce = await authService.getNonce(wcAddress);

        // Create message to sign
        const message = `Sign this message to authenticate with SafuAcademy.\n\nNonce: ${nonce}`;

        // Sign message
        const ethersProvider = new ethers.BrowserProvider(wcProvider);
        const signer = await ethersProvider.getSigner();
        const signature = await signer.signMessage(message);

        // Verify signature and login
        await loginAsync({
          walletAddress: wcAddress,
          signature,
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      // Disconnect WalletConnect
      if (wcProvider && wcProvider.disconnect) {
        await wcProvider.disconnect();
      }

      // Logout from backend
      await authService.logout();

      setAddress(null);
      setIsConnected(false);
      setProvider(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!provider || !wcProvider) {
      throw new Error('Wallet not connected');
    }

    const ethersProvider = new ethers.BrowserProvider(wcProvider);
    const signer = await ethersProvider.getSigner();
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
        }}
      >
        {children}
      </Web3Context.Provider>
      <WalletConnectModal
        projectId={web3Config.projectId}
        providerMetadata={web3Config.metadata}
      />
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
