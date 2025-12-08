// src/contracts/PriceOracle.ts
import { ethers } from 'ethers';
import { BaseContract } from './BaseContract';

// src/contracts/PriceOracle.ts (updated constructor)
import { PriceOracleABI } from '../abis';

export class PriceOracle extends BaseContract {
  constructor(
    address: string,
    provider: ethers.Provider,
    signer?: ethers.Signer,
    eventQueryProvider?: ethers.Provider,
    graph?: any // SafuPadGraph type imported in BaseContract
  ) {
    super(address, PriceOracleABI, provider, signer, eventQueryProvider, graph);
  }
  /**
   * Get current MON price in USD (8 decimals) - Monad native token
   */
  async getMONPrice(): Promise<bigint> {
    return await this.contract.getMONPrice();
  }

  /**
   * Get MON price formatted as string (Monad native token)
   */
  async getMONPriceFormatted(): Promise<string> {
    const price = await this.getMONPrice();
    return ethers.formatUnits(price, 8);
  }

  /**
   * Convert USD to MON (Monad native token)
   */
  async usdToMON(usdAmount: bigint): Promise<bigint> {
    return await this.contract.usdToMON(usdAmount);
  }

  /**
   * Convert MON to USD (Monad native token)
   */
  async monToUSD(monAmount: bigint): Promise<bigint> {
    return await this.contract.monToUSD(monAmount);
  }

  /**
   * Convert USD string to MON (Monad native token)
   */
  async convertUSDToMON(usdAmountStr: string): Promise<string> {
    const usdAmount = ethers.parseUnits(usdAmountStr, 18);
    const monAmount = await this.usdToMON(usdAmount);
    return ethers.formatEther(monAmount);
  }

  /**
   * Convert MON string to USD (Monad native token)
   */
  async convertMONToUSD(monAmountStr: string): Promise<string> {
    const monAmount = ethers.parseEther(monAmountStr);
    const usdAmount = await this.monToUSD(monAmount);
    return ethers.formatUnits(usdAmount, 18);
  }

  /**
   * Get price feed address
   */
  async getPriceFeedAddress(): Promise<string> {
    return await this.contract.priceFeed();
  }
}
