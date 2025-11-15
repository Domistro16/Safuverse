// src/contracts/BaseContract.ts
import { ethers } from 'ethers';
import { TxOptions, EventFilterOptions, ContractError } from '../types';
import { ERROR_MESSAGES } from '../constants';

/**
 * Base contract class with common functionality
 */
export abstract class BaseContract {
  protected contract: ethers.Contract;
  protected provider: ethers.Provider;
  protected eventQueryProvider: ethers.Provider; // Separate provider for event queries (uses Alchemy if configured)
  protected signer?: ethers.Signer;
  protected address: string;

  constructor(
    address: string,
    abi: any[],
    provider: ethers.Provider,
    signer?: ethers.Signer,
    eventQueryProvider?: ethers.Provider
  ) {
    this.address = address;
    this.provider = provider;
    this.signer = signer;
    // Use eventQueryProvider if provided, otherwise use the regular provider
    this.eventQueryProvider = eventQueryProvider || provider;

    if (signer) {
      this.contract = new ethers.Contract(address, abi, signer);
    } else {
      this.contract = new ethers.Contract(address, abi, provider);
    }
  }

  /**
   * Get contract address
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Get signer
   */
  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  /**
   * Update signer
   */
  updateSigner(signer: ethers.Signer): void {
    this.signer = signer;
    this.contract = new ethers.Contract(
      this.address,
      this.contract.interface,
      signer
    );
  }

  /**
   * Require signer to be available
   */
  protected requireSigner(): void {
    if (!this.signer) {
      throw new Error(ERROR_MESSAGES.NO_SIGNER);
    }
  }

  /**
   * Validate Ethereum address
   */
  protected validateAddress(address: string): void {
    if (!ethers.isAddress(address)) {
      throw new Error(`${ERROR_MESSAGES.INVALID_ADDRESS}: ${address}`);
    }
  }

  /**
   * Validate amount
   */
  protected validateAmount(amount: bigint): void {
    if (amount <= 0n) {
      throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
    }
  }

  /**
   * Build transaction options
   */
  protected buildTxOptions(
    options?: TxOptions,
    defaultGasLimit?: bigint
  ): TxOptions {
    const txOptions: TxOptions = {};
    
    if (options?.gasLimit) {
      txOptions.gasLimit = options.gasLimit;
    } else if (defaultGasLimit) {
      txOptions.gasLimit = defaultGasLimit;
    }
    
    if (options?.gasPrice) {
      txOptions.gasPrice = options.gasPrice;
    }
    
    if (options?.value) {
      txOptions.value = options.value;
    }
    
    if (options?.nonce !== undefined) {
      txOptions.nonce = options.nonce;
    }
    
    return txOptions;
  }

  /**
   * Handle contract errors
   */
  protected handleError(error: any): never {
    let message = ERROR_MESSAGES.CONTRACT_ERROR;
    let code: string | undefined;
    let details: any;

    if (error.reason) {
      message = error.reason;
    } else if (error.message) {
      message = error.message;
    }

    if (error.code) {
      code = error.code;
    }

    if (error.data) {
      details = error.data;
    }

    throw new ContractError(message, { code, details, original: error });
  }

  /**
   * Call contract function safely
   */
  protected async callSafely<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (errorMessage) {
        throw new ContractError(errorMessage, { original: error });
      }
      this.handleError(error);
    }
  }

  /**
   * Add event listener
   */
  protected addEventListener(
    eventName: string,
    callback: (event: any) => void,
    filter?: EventFilterOptions
  ): () => void {
    const eventFilter = this.contract.filters[eventName]?.();

    if (!eventFilter) {
      throw new Error(`Event ${eventName} not found`);
    }

    const listener = (...args: any[]) => {
      const event = args[args.length - 1];
      callback(event);
    };

    if (filter?.fromBlock || filter?.toBlock) {
      // Query past events using eventQueryProvider
      const eventContract = new ethers.Contract(
        this.address,
        this.contract.interface,
        this.eventQueryProvider
      );
      eventContract.queryFilter(
        eventFilter,
        filter.fromBlock,
        filter.toBlock
      ).then((events) => {
        events.forEach((event) => callback(event));
      });
    }

    // Listen for new events
    this.contract.on(eventFilter, listener);

    // Return cleanup function
    return () => {
      this.contract.off(eventFilter, listener);
    };
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.contract.removeAllListeners(eventName);
    } else {
      this.contract.removeAllListeners();
    }
  }

  /**
   * Get past events
   * Uses eventQueryProvider (Alchemy if configured) for better performance
   */
  async getPastEvents(
    eventName: string,
    filter?: EventFilterOptions
  ): Promise<ethers.EventLog[]> {
    const eventFilter = this.contract.filters[eventName]?.();

    if (!eventFilter) {
      throw new Error(`Event ${eventName} not found`);
    }

    // Create a contract instance using eventQueryProvider for querying events
    const eventContract = new ethers.Contract(
      this.address,
      this.contract.interface,
      this.eventQueryProvider
    );

    const events = await eventContract.queryFilter(
      eventFilter,
      filter?.fromBlock,
      filter?.toBlock
    );

    return events as ethers.EventLog[];
  }

  /**
   * Estimate gas for a contract call
   */
  protected async estimateGas(
    functionName: string,
    args: any[],
    overrides?: TxOptions
  ): Promise<bigint> {
    try {
      return await this.contract[functionName].estimateGas(...args, overrides);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Check if contract is deployed
   */
  async isDeployed(): Promise<boolean> {
    const code = await this.provider.getCode(this.address);
    return code !== '0x';
  }

  /**
   * Get contract instance (for advanced usage)
   */
  getContract(): ethers.Contract {
    return this.contract;
  }
}