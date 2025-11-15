// src/SafuPadSDK.ts
import { ethers } from 'ethers';
import { LaunchpadManager } from './contracts/LaunchpadManager';
import { BondingCurveDEX } from './contracts/BondingCurveDEX';
import { TokenFactory } from './contracts/TokenFactory';
import { PriceOracle } from './contracts/PriceOracle';
import { LPFeeHarvester } from './contracts/LPFeeHarvester';
import { NetworkConfig, SDKConfig } from './types';
import { NETWORKS, DEFAULT_CONFIG } from './constants';

/**
 * SafuPad SDK - Main entry point for interacting with SafuPad contracts
 *
 * @example
 * ```typescript
 * import { SafuPadSDK } from '@safupad/sdk';
 *
 * const sdk = new SafuPadSDK({
 *   network: 'bsc',
 *   provider: window.ethereum,
 * });
 *
 * await sdk.initialize();
 *
 * // Create a launch
 * const tx = await sdk.launchpad.createLaunch({
 *   name: 'MyToken',
 *   symbol: 'MTK',
 *   totalSupply: 1000000000,
 *   raiseTargetUSD: '50000',
 *   raiseMaxUSD: '100000',
 *   vestingDuration: 90,
 *   metadata: {...},
 *   projectInfoFiWallet: '0x...',
 *   burnLP: false
 * });
 * ```
 */
export class SafuPadSDK {
  private provider: ethers.Provider;
  private eventQueryProvider: ethers.Provider; // Separate provider for event queries (uses Alchemy if configured)
  private signer?: ethers.Signer;
  private config: SDKConfig;
  private networkConfig: NetworkConfig;

  // Contract instances
  public launchpad: LaunchpadManager;
  public bondingDex: BondingCurveDEX;
  public tokenFactory: TokenFactory;
  public priceOracle: PriceOracle;
  public lpHarvester: LPFeeHarvester;

  private initialized: boolean = false;

  /**
   * Create a new SafuPad SDK instance
   *
   * @param config - SDK configuration
   */
  constructor(config: Partial<SDKConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Get network configuration
    if (typeof this.config.network === 'string') {
      this.networkConfig = NETWORKS[this.config.network];
      if (!this.networkConfig) {
        throw new Error(`Unsupported network: ${this.config.network}`);
      }
    } else {
      this.networkConfig = this.config.network!;
    }
 
    // Setup provider
    if (this.config.provider) {
      if (typeof this.config.provider === 'string') {
        this.provider = new ethers.JsonRpcProvider(this.config.provider);
      } else if ('request' in this.config.provider) {
        // Browser wallet provider (e.g., MetaMask)
        this.provider = new ethers.BrowserProvider(this.config.provider as any);
      } else {
        this.provider = this.config.provider as ethers.Provider;
      }
    } else {
      this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
    }

    // Setup signer if private key provided
    if (this.config.privateKey) {
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
    }

    // Setup event query provider (uses Alchemy if API key provided, otherwise uses regular provider)
    if (this.config.alchemyApiKey && this.networkConfig.alchemyRpcUrlTemplate) {
      const alchemyUrl = this.networkConfig.alchemyRpcUrlTemplate.replace(
        '{apiKey}',
        this.config.alchemyApiKey
      );
      this.eventQueryProvider = new ethers.JsonRpcProvider(alchemyUrl);
    } else {
      // Use the same provider for event queries if no Alchemy key provided
      this.eventQueryProvider = this.provider;
    }

    // Initialize contract instances
    this.launchpad = new LaunchpadManager(
      this.networkConfig.contracts.launchpadManager,
      this.provider,
      this.signer,
      this.eventQueryProvider
    );

    this.bondingDex = new BondingCurveDEX(
      this.networkConfig.contracts.bondingCurveDEX,
      this.provider,
      this.signer,
      this.eventQueryProvider
    );

    this.tokenFactory = new TokenFactory(
      this.networkConfig.contracts.tokenFactory,
      this.provider,
      this.signer,
      this.eventQueryProvider
    );

    this.priceOracle = new PriceOracle(
      this.networkConfig.contracts.priceOracle,
      this.provider,
      this.signer,
      this.eventQueryProvider
    );

    this.lpHarvester = new LPFeeHarvester(
      this.networkConfig.contracts.lpFeeHarvester,
      this.provider,
      this.signer,
      this.eventQueryProvider
    );
  }

  /**
   * Initialize the SDK and verify connections
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Verify network
    const network = await this.provider.getNetwork();
    if (Number(network.chainId) !== this.networkConfig.chainId) {
      throw new Error(
        `Network mismatch: expected ${this.networkConfig.chainId}, got ${network.chainId}`
      );
    }

    // Get signer if using browser wallet
    if (!this.signer && 'request' in this.config.provider!) {
      const browserProvider = this.provider as ethers.BrowserProvider;
      this.signer = await browserProvider.getSigner();

      // Update contract signers
      this.launchpad.updateSigner(this.signer);
      this.bondingDex.updateSigner(this.signer);
      this.tokenFactory.updateSigner(this.signer);
      this.priceOracle.updateSigner(this.signer);
      this.lpHarvester.updateSigner(this.signer);
    }
    this.initialized = true;

    
  }

  /**
   * Connect a wallet (useful for browser environments)
   */
  async connect(): Promise<string> {
    if (!('request' in this.config.provider!)) {
      throw new Error('No browser wallet provider available');
    }

    const browserProvider = this.provider as ethers.BrowserProvider;
    await browserProvider.send('eth_requestAccounts', []);

    this.signer = await browserProvider.getSigner();
    const address = await this.signer.getAddress();

    // Update all contract signers
    this.launchpad.updateSigner(this.signer);
    this.bondingDex.updateSigner(this.signer);
    this.tokenFactory.updateSigner(this.signer);
    this.priceOracle.updateSigner(this.signer);
    this.lpHarvester.updateSigner(this.signer);

    return address;
  }

  /**
   * Get the current connected address
   */
  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available');
    }
    return this.signer.getAddress();
  }

  /**
   * Get the current BNB balance
   */
  async getBalance(address?: string): Promise<string> {
    const addr = address || (await this.getAddress());
    const balance = await this.provider.getBalance(addr);
    return ethers.formatEther(balance);
  }

  /**
   * Get network information
   */
  getNetworkInfo(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Get event query provider (uses Alchemy if configured)
   */
  getEventQueryProvider(): ethers.Provider {
    return this.eventQueryProvider;
  }

  /**
   * Get signer
   */
  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  /**
   * Update signer (useful when switching accounts)
   */
  updateSigner(signer: ethers.Signer): void {
    this.signer = signer;
    this.launchpad.updateSigner(signer);
    this.bondingDex.updateSigner(signer);
    this.tokenFactory.updateSigner(signer);
    this.priceOracle.updateSigner(signer);
    this.lpHarvester.updateSigner(signer);
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.signer = undefined;
    this.initialized = false;
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<string> {
    const gas = await this.provider.estimateGas(tx);
    return gas.toString();
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Format BNB amount
   */
  formatBNB(amount: bigint | string): string {
    return ethers.formatEther(amount);
  }

  /**
   * Parse BNB amount
   */
  parseBNB(amount: string): bigint {
    return ethers.parseEther(amount);
  }

  /**
   * Format token amount with decimals
   */
  formatToken(amount: bigint | string, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * Parse token amount with decimals
   */
  parseToken(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }

  /**
   * Get block explorer URL for address
   */
  getExplorerUrl(type: 'address' | 'tx', value: string): string {
    return `${this.networkConfig.explorerUrl}/${type}/${value}`;
  }

  /**
   * Create a new SDK instance with a different signer
   */
  withSigner(signer: ethers.Signer): SafuPadSDK {
    const newSdk = new SafuPadSDK({
      ...this.config,
      privateKey: undefined,
    });

    newSdk.updateSigner(signer);
    newSdk.initialized = this.initialized;

    return newSdk;
  }

  /**
   * Get SDK version
   */
  static getVersion(): string {
    return '1.0.0';
  }
}

export default SafuPadSDK;
