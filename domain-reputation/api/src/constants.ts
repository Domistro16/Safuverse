export const CONFIG = {
  // Base Mainnet
  CHAIN_ID: 8453,

  // Contracts — NexID deployment addresses
  DOMAIN_REGISTRY: "0xB5f3F983368e993b5f42D1dd659e4dC36fa5C494",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",

  // ERC-4337 v0.7 (for agents)
  ENTRYPOINT: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  SIMPLE_ACCOUNT_FACTORY: "0x594D8baAc764A91113E5AAC91DAcFDf9eeF066C8",

  // Circle Paymaster (supports both EOA via EIP-7702 and AA)
  CIRCLE_PAYMASTER: "0x6C973eBe80dCD8660841D4356bf15c32460271C9",

  // Goldsky subgraph URL — update project ID after deployment
  GOLDSKY_SUBGRAPH_URL:
    process.env.GOLDSKY_SUBGRAPH_URL ||
    "https://api.goldsky.com/api/public/project_xxx/subgraphs/domain-reputation/1.0.0/gn",

  // Reputation tiers
  TIERS: {
    BRONZE: { min: 0, max: 39 },
    SILVER: { min: 40, max: 69 },
    GOLD: { min: 70, max: 89 },
    PLATINUM: { min: 90, max: 100 },
  },

  // Owner types
  OWNER_TYPES: {
    HUMAN: "HUMAN" as const,
    AGENT: "AGENT" as const,
  },

  // API
  PORT: parseInt(process.env.PORT || "3001", 10),
} as const;
