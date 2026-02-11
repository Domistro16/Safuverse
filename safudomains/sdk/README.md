# @safuverse/safudomains-sdk

TypeScript SDK for interacting with SafuDomains v2 contracts on Base chain.

## Installation

```bash
npm install @safuverse/safudomains-sdk viem
```

## Quick Start

```typescript
import { SafuDomainsClient } from '@safuverse/safudomains-sdk'
import { createWalletClient, http } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Create a wallet client
const account = privateKeyToAccount('0x...')
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
})

// Initialize SDK
const sdk = new SafuDomainsClient({
  chainId: 8453, // Base mainnet (84532 for testnet)
  walletClient,
})

// Check price for a name
const price = await sdk.getPrice('my-trading-agent')
console.log(price)
// { priceWei: 50000000000000n, priceUsd: 10000000000000000n, isAgentName: true }

// Check if name is available
const isAvailable = await sdk.available('my-trading-agent')

// Register a domain
const txHash = await sdk.register('my-trading-agent')
```

## Features

### Pricing

```typescript
// Get price for any name
const price = await sdk.getPrice('my-agent-bot')

// Check if name qualifies as agent name (10+ chars + pattern)
const isAgent = await sdk.isAgentName('my-trading-agent')

// Get pattern match count
const matchCount = await sdk.getPatternMatchCount('ai-task-bot-v2')
```

### Registration

```typescript
// Register single name
await sdk.register('my-agent')

// Batch register
await sdk.batchRegister(['agent-one', 'agent-two', 'agent-three'])
```

### x402 / ERC-8004 Payment Resolution

```typescript
// Get payment endpoint
const endpoint = await sdk.getX402Endpoint('my-agent')

// Set payment endpoint
await sdk.setX402Endpoint('my-agent', 'https://api.myagent.com/x402')

// Get/set payment address
const addr = await sdk.getPaymentAddress('my-agent', 8453)
await sdk.setPaymentAddress('my-agent', 8453, '0x...')

// Get/set supported chains
await sdk.setSupportedChains('my-agent', [8453, 1, 137])

// Get full payment profile
const profile = await sdk.getPaymentProfile('my-agent', 8453)
```

### Utilities

```typescript
// Get domain owner
const owner = await sdk.getOwner('my-agent')

// Calculate namehash
const node = sdk.namehash('my-agent')

// Get full name with TLD
const fullName = sdk.getFullName('my-agent') // "my-agent.id"
```

## Pricing Reference

| Length | Standard Price | Agent Price (10+ chars with pattern) |
|--------|---------------|--------------------------------------|
| 1 char | $2,000 | N/A |
| 2 chars | $1,000 | N/A |
| 3 chars | $200 | N/A |
| 4 chars | $40 | N/A |
| 5 chars | $10 | N/A |
| 6-9 chars | $5 | N/A |
| 10+ chars | $2 | $0.01 - $0.10 |

## License

MIT
