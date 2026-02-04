# CLAUDE.md - SafuDomains v2 Agent-First Implementation Guide

## Project Overview

This is the **Safuverse** monorepo containing multiple projects:
- **safudomains/** - Domain name registration system (like ENS) - PRIMARY FOCUS
- **SafuAcademy/** - Education platform
- **SafuAgents/** - AI agents platform
- **SafuPad/** - Launchpad platform
- **SafuLanding/** - Landing pages
- **Safucard/** - NFT card system
- **safupadsdk/** - SDK for SafuPad

## SafuDomains v2 - Agent-First Upgrade

We are implementing a major upgrade to SafuDomains, pivoting from the current ENS-like model to an **agent-first** domain registration system.

### Why This Change

With the rise of AI agents (Claude, GPT, autonomous bots), the traditional ENS model breaks down:
- One person can have thousands of agents
- Annual renewals at $5-640/year per name is unsustainable
- Agents need predictable, one-time costs

### Key Changes

| Current | New |
|---------|-----|
| Annual + Lifetime options | **Lifetime only** |
| Duration-based pricing | One-time flat fee |
| `renew()` functions | Remove all renewal logic |
| BNB/CAKE/USD1 payment | **ETH + USDC on Base** |
| 5 price tiers | Agent-aware tiered pricing |
| Commit-reveal required | Optional for agent names |
| BNB Chain deployment | **Base chain deployment** |

---

## New Pricing Model (Lifetime Only)

| Length | Price (USD) |
|--------|-------------|
| 1 character | $2,000 |
| 2 characters | $500 |
| 3 characters | $50 |
| 4 characters | $40 |
| 5 characters | $10 |
| 6-9 characters | $1-$9 (scale linearly) |
| 10+ characters | $1 |
| **Agent names** | **$0.01 - $0.05** |

---

## Agent Name Detection Rules (CRITICAL)

A name qualifies for ultra-low agent pricing ($0.01-$0.05) if ALL of these are true:

### Rule 1: Minimum Length
- Must be >= 14 characters (excluding .safu)

### Rule 2: Must Match At Least ONE Pattern Category

**Category A - Suffixes (ends with):**
```
-(agent|bot|ai|llm|gpt|model|tutor|edu|credential|synthesia|donna)$
```
Examples: `personal-learning-agent.safu`, `crypto-trading-bot.safu`

**Category B - Versioning/Timestamps (ends with):**
```
-(v|version)[0-9]+$
-v[0-9]{1,4}$
-[0-9]{4}-[0-9]{2}-[0-9]{2}$  (YYYY-MM-DD)
-[0-9]{8,14}$  (unix timestamp or date string)
-epoch[0-9]+$
```
Examples: `tutor-agent-v42.safu`, `ai-edu-20260204.safu`

**Category C - UUID/Randomized (contains):**
```
[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$  (UUID v4)
[0-9a-fA-F]{32,64}$  (raw hex strings)
```
Plus entropy check: >= 80% of chars are [0-9a-f-]
Examples: `agent-7f3a9b2c-1d4e-4f2a-8b6c-9e1234567890.safu`

**Category D - Prefixes (starts with):**
```
^(agent|bot|ai|llm|gpt|edu|task|swarm|safu-agent|donna|sys|fleet)-
```
Examples: `agent-portfolio-manager.safu`, `fleet-coordinator-alpha.safu`

**Category E - Functional Descriptors (contains):**
```
-(task|analyzer|issuer|generator|synthesizer|clone|fork|academy|pad|course|learn|teach|safu|verse)-
```
Examples: `crypto-analyzer-v2-prod.safu`, `course-generator-bot.safu`

### Rule 3: No Disqualifying Human Words
Name cannot START with these common human vanity words:
```
^(best|pro|cool|elite|prime|vip|king|queen|legend|god|master|ninja|wizard|crypto|defi|nft|moon|diamond|alpha|sigma|chad)
```

### Rule 4: Entropy Check (for UUID category)
If matching UUID/hex pattern, require >= 80% of characters to be [0-9a-f-]

---

## Agent Price Calculation

Within the $0.01-$0.05 range, price based on:

```
Base: $0.05
- Length bonus: -$0.001 per char over 14 (max -$0.02)
- Entropy bonus: -$0.01 if >80% hex chars
- Multi-pattern bonus: -$0.01 if matches 2+ categories
Minimum: $0.01
```

---

## Contracts to Implement

### New Files to Create

```
safudomains/contracts/agent-registrar/
├── AgentPriceOracle.sol          # Pattern matching and pricing
├── AgentRegistrarController.sol   # Registration without renewals
├── interfaces/
│   └── IAgentRegistrar.sol       # Interface definitions
└── resolvers/
    ├── PaymentResolver.sol       # x402/ERC-8004 support
    └── AgentPublicResolver.sol   # Combined resolver
```

### AgentPriceOracle.sol - Core Functions

```solidity
function price(string calldata name) external view returns (
    uint256 priceWei,
    uint256 priceUsd,
    bool isAgentName
);

function isAgentName(string calldata name) external view returns (bool);

// Internal pattern matching
function _matchesSuffixPattern(string calldata name) internal pure returns (bool);
function _matchesVersionPattern(string calldata name) internal pure returns (bool);
function _matchesUUIDPattern(string calldata name) internal pure returns (bool);
function _matchesPrefixPattern(string calldata name) internal pure returns (bool);
function _matchesFunctionalPattern(string calldata name) internal pure returns (bool);
function _hasDisqualifyingWord(string calldata name) internal pure returns (bool);
function _calculateEntropy(string calldata name) internal pure returns (uint256);
```

### AgentRegistrarController.sol - Core Functions

```solidity
// Simplified controller - NO renewals
function register(RegisterRequest calldata req) external payable;
function registerWithUSDC(RegisterRequest calldata req) external;
function batchRegister(RegisterRequest[] calldata requests) external payable;

// Optional commit-reveal
function commit(bytes32 commitment) external;
bool public agentModeEnabled; // Skip commit-reveal for agent names
```

### PaymentResolver.sol - Core Functions

```solidity
// x402 protocol support
function x402Endpoint(bytes32 node) external view returns (string memory);
function setX402Endpoint(bytes32 node, string calldata endpoint) external;

// ERC-8004 agent payments
function paymentAddress(bytes32 node, uint256 chainId) external view returns (address);
function setPaymentAddress(bytes32 node, uint256 chainId, address addr) external;
function agentMetadata(bytes32 node) external view returns (string memory);
function setAgentMetadata(bytes32 node, string calldata uri) external;
function paymentEnabled(bytes32 node) external view returns (bool);
function supportedChains(bytes32 node) external view returns (uint256[] memory);
```

---

## Chain Configuration

**Deploy on Base (not BNB Chain)**

| Network | Chain ID |
|---------|----------|
| Base Mainnet | 8453 |
| Base Sepolia | 84532 |

**Key Addresses on Base:**
- Chainlink ETH/USD: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

---

## Existing Contracts to Keep (Copy Unchanged)

- `registry/ENSRegistry.sol`
- `wrapper/NameWrapper.sol`
- `ethregistrar/BaseRegistrarImplementation.sol`
- `reverseRegistrar/ReverseRegistrar.sol`

---

## Test Cases

### Should Be Agent Names ($0.01-$0.05)
```javascript
"personal-learning-agent"  // suffix pattern
"tutor-agent-v42"          // version pattern
"agent-7f3a9b2c-1d4e-4f2a-8b6c-9e1234567890"  // UUID pattern
"fleet-coordinator-alpha-v2"  // prefix + version
"crypto-analyzer-v2-prod"  // functional pattern
```

### Should NOT Be Agent Names (Standard Pricing)
```javascript
"agent"          // too short (<14 chars)
"besttrader-agent"  // starts with disqualifying word
"mycoolagent"    // no hyphen separators, no pattern match
"alice"          // standard human name
```

---

## Commands

```bash
# Navigate to safudomains
cd safudomains

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-base.ts --network baseSepolia

# Verify on Basescan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Implementation Order

1. **AgentPriceOracle** - Pattern matching and pricing logic
2. **AgentRegistrarController** - Registration without renewals
3. **PaymentResolver** - x402/ERC-8004 support
4. **AgentPublicResolver** - Combined resolver
5. **Deployment scripts** - Base chain config
6. **Tests** - Comprehensive test coverage

---

## Success Criteria

- [ ] Agent names (>= 14 chars + pattern) get $0.01-$0.05 pricing
- [ ] No renewal functions - lifetime only
- [ ] Batch registration works for 10+ names in one tx
- [ ] x402 and ERC-8004 resolver records work
- [ ] Deploys successfully on Base Sepolia
- [ ] All tests pass
- [ ] Gas optimized for batch registrations

---

## Additional Context

- **x402 Protocol**: https://x402.org - HTTP 402 payment flows with crypto
- **ERC-8004**: Agent payment standard (started on ETH, extended to Base)
- This is for the Safuverse ecosystem which includes SafuAcademy (education), SafuPad (launchpad), and SafuAgents (AI agents)

---

## Existing Code Reference

Key existing files in `safudomains/contracts/`:

```
ethregistrar/
├── ETHRegistrarController.sol  # Current registration controller
├── StablePriceOracle.sol       # Current pricing logic
├── TokenPriceOracle.sol        # Multi-token pricing
├── BaseRegistrarImplementation.sol
└── BulkRenewal.sol             # To be removed/ignored

resolvers/
├── PublicResolver.sol          # Name resolution
└── profiles/                   # Various resolver profiles

wrapper/
└── NameWrapper.sol             # ERC-1155 wrapped names

registry/
└── ENSRegistry.sol             # Core registry
```

---

## Development Notes

- The codebase uses Hardhat with TypeScript (`.cts` extension)
- Current hardhat config: `safudomains/hardhat.config.cts`
- Tests are in `safudomains/test/`
- Deployment scripts in `safudomains/deploy/`
