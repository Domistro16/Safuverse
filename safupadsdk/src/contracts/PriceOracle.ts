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
   * Get current BNB price in USD (8 decimals) - BSC native token
   */
  async getBNBPrice(): Promise<bigint> {
    return await this.contract.getBNBPrice();
  }

  /**
   * Get BNB price formatted as string (BSC native token)
   */
  async getBNBPriceFormatted(): Promise<string> {
    const price = await this.getBNBPrice();
    return ethers.formatUnits(price, 8);
  }

  /**
   * Convert USD to BNB (BSC native token)
   */
  async usdToBNB(usdAmount: bigint): Promise<bigint> {
    return await this.contract.usdToBNB(usdAmount);
  }

  /**
   * Convert BNB to USD (BSC native token)
   */
  async bnbToUSD(bnbAmount: bigint): Promise<bigint> {
    return await this.contract.bnbToUSD(bnbAmount);
  }

  /**
   * Convert USD string to BNB (BSC native token)
   */
  async convertUSDToBNB(usdAmountStr: string): Promise<string> {
    const usdAmount = ethers.parseUnits(usdAmountStr, 18);
    const bnbAmount = await this.usdToBNB(usdAmount);
    return ethers.formatEther(bnbAmount);
  }

  /**
   * Convert BNB string to USD (BSC native token)
   */
  async convertBNBToUSD(bnbAmountStr: string): Promise<string> {
    const bnbAmount = ethers.parseEther(bnbAmountStr);
    const usdAmount = await this.bnbToUSD(bnbAmount);
    return ethers.formatUnits(usdAmount, 18);
  }

  /**
   * Get price feed address
   */
  async getPriceFeedAddress(): Promise<string> {
    return await this.contract.priceFeed();
  }
}
