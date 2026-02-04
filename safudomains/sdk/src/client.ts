import {
    createPublicClient,
    http,
    namehash,
    labelhash,
    type PublicClient,
    type WalletClient,
    type Address,
    type Hash,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import type {
    SafuDomainsConfig,
    PriceResult,
    RegisterOptions,
    PaymentConfig,
    FullPaymentProfile,
    ChainConfig,
} from './types'
import {
    CHAIN_CONFIGS,
    TLD,
    EMPTY_REFERRAL_DATA,
    EMPTY_REFERRAL_SIGNATURE,
} from './constants'
import {
    AgentPriceOracleAbi,
    AgentRegistrarControllerAbi,
    AgentPublicResolverAbi,
    NameWrapperAbi,
} from './abis'

/**
 * SafuDomains SDK Client
 *
 * Main entry point for interacting with SafuDomains v2 contracts.
 *
 * @example
 * ```typescript
 * import { SafuDomainsClient } from '@safuverse/safudomains-sdk'
 * import { createWalletClient, http } from 'viem'
 * import { base } from 'viem/chains'
 *
 * const walletClient = createWalletClient({
 *   chain: base,
 *   transport: http(),
 * })
 *
 * const sdk = new SafuDomainsClient({
 *   chainId: 8453,
 *   walletClient,
 * })
 *
 * // Check price
 * const price = await sdk.getPrice('my-trading-agent')
 *
 * // Register a name
 * await sdk.register('my-trading-agent')
 * ```
 */
export class SafuDomainsClient {
    public readonly chainId: number
    public readonly config: ChainConfig
    public readonly publicClient: PublicClient
    public walletClient?: WalletClient

    constructor(options: SafuDomainsConfig) {
        this.chainId = options.chainId
        this.walletClient = options.walletClient

        // Get chain config
        const chainConfig = CHAIN_CONFIGS[options.chainId]
        if (!chainConfig && !options.contracts) {
            throw new Error(`Unsupported chainId: ${options.chainId}. Use 8453 (Base) or 84532 (Base Sepolia)`)
        }

        // Merge custom contracts with defaults
        this.config = {
            ...chainConfig,
            ...options.contracts,
        } as ChainConfig

        // Create public client if not provided
        if (options.publicClient) {
            this.publicClient = options.publicClient
        } else {
            const chain = options.chainId === 8453 ? base : baseSepolia
            this.publicClient = createPublicClient({
                chain,
                transport: http(),
            })
        }
    }

    // ============ Pricing Functions ============

    /**
     * Get the price for a domain name
     */
    async getPrice(name: string): Promise<PriceResult> {
        const result = await this.publicClient.readContract({
            address: this.config.priceOracle,
            abi: AgentPriceOracleAbi,
            functionName: 'getPrice',
            args: [name],
        })

        return {
            priceWei: result.priceWei,
            priceUsd: result.priceUsd,
            isAgentName: result.isAgentName,
        }
    }

    /**
     * Check if a name qualifies as an agent name (10+ chars + pattern match)
     */
    async isAgentName(name: string): Promise<boolean> {
        return await this.publicClient.readContract({
            address: this.config.priceOracle,
            abi: AgentPriceOracleAbi,
            functionName: 'isAgentName',
            args: [name],
        })
    }

    /**
     * Get the number of pattern matches for a name
     */
    async getPatternMatchCount(name: string): Promise<bigint> {
        return await this.publicClient.readContract({
            address: this.config.priceOracle,
            abi: AgentPriceOracleAbi,
            functionName: 'getPatternMatchCount',
            args: [name],
        })
    }

    // ============ Registration Functions ============

    /**
     * Check if a name is available for registration
     */
    async available(name: string): Promise<boolean> {
        return await this.publicClient.readContract({
            address: this.config.registrar,
            abi: AgentRegistrarControllerAbi,
            functionName: 'available',
            args: [name],
        })
    }

    /**
     * Register a domain name
     */
    async register(name: string, options: RegisterOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()
        const price = await this.getPrice(name)

        const request = {
            name,
            owner: options.resolver ? account : account,
            secret: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hash,
            resolver: options.resolver || this.config.resolver,
            data: options.data || [],
            reverseRecord: options.reverseRecord ?? false,
            ownerControlledFuses: options.ownerControlledFuses ?? 0,
        }

        const referralData = options.referral || EMPTY_REFERRAL_DATA

        const hash = await this.walletClient.writeContract({
            address: this.config.registrar,
            abi: AgentRegistrarControllerAbi,
            functionName: 'register',
            args: [request, referralData, EMPTY_REFERRAL_SIGNATURE],
            value: price.priceWei,
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })

        return hash
    }

    /**
     * Batch register multiple domain names
     */
    async batchRegister(names: string[], options: RegisterOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()

        // Calculate total price
        let totalPrice = 0n
        for (const name of names) {
            const price = await this.getPrice(name)
            totalPrice += price.priceWei
        }

        const requests = names.map((name) => ({
            name,
            owner: account,
            secret: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hash,
            resolver: options.resolver || this.config.resolver,
            data: options.data || [],
            reverseRecord: options.reverseRecord ?? false,
            ownerControlledFuses: options.ownerControlledFuses ?? 0,
        }))

        const hash = await this.walletClient.writeContract({
            address: this.config.registrar,
            abi: AgentRegistrarControllerAbi,
            functionName: 'batchRegister',
            args: [requests],
            value: totalPrice,
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })

        return hash
    }

    // ============ Resolution Functions (x402 / ERC-8004) ============

    /**
     * Get the x402 payment endpoint for a domain
     */
    async getX402Endpoint(name: string): Promise<string> {
        const node = this.namehash(name)
        return await this.publicClient.readContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'x402Endpoint',
            args: [node],
        })
    }

    /**
     * Set the x402 payment endpoint for a domain
     */
    async setX402Endpoint(name: string, endpoint: string): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()
        const node = this.namehash(name)

        return await this.walletClient.writeContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'setX402Endpoint',
            args: [node, endpoint],
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })
    }

    /**
     * Get the payment address for a domain on a specific chain
     */
    async getPaymentAddress(name: string, chainId: number): Promise<Address> {
        const node = this.namehash(name)
        return await this.publicClient.readContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'paymentAddress',
            args: [node, BigInt(chainId)],
        })
    }

    /**
     * Set the payment address for a domain on a specific chain
     */
    async setPaymentAddress(name: string, chainId: number, addr: Address): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()
        const node = this.namehash(name)

        return await this.walletClient.writeContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'setPaymentAddress',
            args: [node, BigInt(chainId), addr],
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })
    }

    /**
     * Get supported chains for a domain
     */
    async getSupportedChains(name: string): Promise<bigint[]> {
        const node = this.namehash(name)
        const result = await this.publicClient.readContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'supportedChains',
            args: [node],
        })
        return [...result]
    }

    /**
     * Set supported chains for a domain
     */
    async setSupportedChains(name: string, chainIds: number[]): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()
        const node = this.namehash(name)

        return await this.walletClient.writeContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'setSupportedChains',
            args: [node, chainIds.map(BigInt)],
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })
    }

    /**
     * Get agent metadata URI for a domain
     */
    async getAgentMetadata(name: string): Promise<string> {
        const node = this.namehash(name)
        return await this.publicClient.readContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'agentMetadata',
            args: [node],
        })
    }

    /**
     * Set agent metadata URI for a domain
     */
    async setAgentMetadata(name: string, uri: string): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()
        const node = this.namehash(name)

        return await this.walletClient.writeContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'setAgentMetadata',
            args: [node, uri],
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })
    }

    /**
     * Check if payments are enabled for a domain
     */
    async isPaymentEnabled(name: string): Promise<boolean> {
        const node = this.namehash(name)
        return await this.publicClient.readContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'paymentEnabled',
            args: [node],
        })
    }

    /**
     * Enable or disable payments for a domain
     */
    async setPaymentEnabled(name: string, enabled: boolean): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('WalletClient required for write operations')
        }

        const [account] = await this.walletClient.getAddresses()
        const node = this.namehash(name)

        return await this.walletClient.writeContract({
            address: this.config.resolver,
            abi: AgentPublicResolverAbi,
            functionName: 'setPaymentEnabled',
            args: [node, enabled],
            account,
            chain: this.chainId === 8453 ? base : baseSepolia,
        })
    }

    /**
     * Get full payment profile for a domain
     */
    async getPaymentProfile(name: string, chainId: number): Promise<FullPaymentProfile> {
        const node = this.namehash(name)

        const [
            x402Endpoint,
            paymentAddress,
            supportedChains,
            acceptedTokens,
            agentMetadata,
            paymentEnabled,
            paymentLimits,
        ] = await Promise.all([
            this.getX402Endpoint(name),
            this.getPaymentAddress(name, chainId),
            this.getSupportedChains(name),
            this.publicClient.readContract({
                address: this.config.resolver,
                abi: AgentPublicResolverAbi,
                functionName: 'acceptedTokens',
                args: [node, BigInt(chainId)],
            }),
            this.getAgentMetadata(name),
            this.isPaymentEnabled(name),
            this.publicClient.readContract({
                address: this.config.resolver,
                abi: AgentPublicResolverAbi,
                functionName: 'paymentLimits',
                args: [node, BigInt(chainId)],
            }),
        ])

        return {
            x402Endpoint,
            paymentAddress,
            supportedChains: supportedChains.map(Number),
            acceptedTokens: [...acceptedTokens],
            agentMetadata,
            paymentEnabled,
            paymentLimits: {
                minAmount: paymentLimits[0],
                maxAmount: paymentLimits[1],
            },
        }
    }

    // ============ Utility Functions ============

    /**
     * Get the owner of a domain
     */
    async getOwner(name: string): Promise<Address> {
        const node = this.namehash(name)
        return await this.publicClient.readContract({
            address: this.config.nameWrapper,
            abi: NameWrapperAbi,
            functionName: 'ownerOf',
            args: [BigInt(node)],
        })
    }

    /**
     * Calculate the namehash for a full domain (e.g., "myname.safu")
     */
    namehash(name: string): Hash {
        const fullName = name.endsWith(`.${TLD}`) ? name : `${name}.${TLD}`
        return namehash(fullName)
    }

    /**
     * Calculate the labelhash for a label (without TLD)
     */
    labelhash(label: string): Hash {
        return labelhash(label)
    }

    /**
     * Get the full domain name with TLD
     */
    getFullName(name: string): string {
        return name.endsWith(`.${TLD}`) ? name : `${name}.${TLD}`
    }
}
