// src/contracts/TokenFactory.ts
import { ethers } from 'ethers';
import { BaseContract } from './BaseContract';
import { TokenMetadata, TokenInfo } from '../types';

// src/contracts/TokenFactory.ts (updated constructor)
import { TokenFactoryABI } from '../abis';

export class TokenFactory extends BaseContract {
  constructor(
    address: string,
    provider: ethers.Provider,
    signer?: ethers.Signer,
    eventQueryProvider?: ethers.Provider
  ) {
    super(address, TokenFactoryABI, provider, signer, eventQueryProvider);
  }
  /**
   * Get total number of tokens created
   */
  async getTotalTokens(): Promise<number> {
    const total = await this.contract.getTotalTokens();
    return Number(total);
  }

  /**
   * Get token at index
   */
  async getTokenAtIndex(index: number): Promise<string> {
    return await this.contract.getTokenAtIndex(index);
  }

  /**
   * Get all tokens created by an address
   */
  async getCreatorTokens(creator: string): Promise<string[]> {
    this.validateAddress(creator);
    return await this.contract.getCreatorTokens(creator);
  }

  /**
   * Compute vanity address for a token
   */
  async computeAddress(
    name: string,
    symbol: string,
    totalSupply: number,
    decimals: number,
    owner: string,
    metadata: TokenMetadata,
    salt: string
  ): Promise<string> {
    this.validateAddress(owner);

    const metadataArray = [
      metadata.logoURI,
      metadata.description,
      metadata.website,
      metadata.twitter,
      metadata.telegram,
      metadata.discord,
    ];

    return await this.contract.computeAddress(
      name,
      symbol,
      totalSupply,
      decimals,
      owner,
      metadataArray,
      salt
    );
  }

  /**
   * Get token information (requires ERC20 interface)
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    this.validateAddress(tokenAddress);

    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function getMetadata() view returns (tuple(string,string,string,string,string,string))',
      ],
      this.provider
    );

    const [name, symbol, decimals, totalSupply, metadata] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply(),
      tokenContract.getMetadata(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      metadata: {
        logoURI: metadata[0],
        description: metadata[1],
        website: metadata[2],
        twitter: metadata[3],
        telegram: metadata[4],
        discord: metadata[5],
      },
    };
  }
}
