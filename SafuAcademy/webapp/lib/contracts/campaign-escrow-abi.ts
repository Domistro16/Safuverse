/**
 * ABI for the CampaignEscrow contract — claim-related functions only.
 * Used by the relayer service and frontend for gasless reward claims.
 */
export const CAMPAIGN_ESCROW_ABI = [
    // ── Claim functions ──
    'function claimReward(uint256 escrowId, uint256 amount, bytes32[] merkleProof) external',
    'function claimRewardFor(uint256 escrowId, address claimer, uint256 amount, bytes32[] merkleProof, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',

    // ── Admin (owner) ──
    'function setClaimRoot(uint256 escrowId, bytes32 _merkleRoot) external',
    'function closeCampaign(uint256 escrowId) external',
    'function createCampaign(uint256 _partnerCampaignId, address _sponsor, uint256 _endTimestamp) external returns (uint256)',
    'function fundCampaign(uint256 escrowId, uint256 amount) external',
    'function distribute(uint256 escrowId, address[] recipients, uint256[] amounts) external',
    'function withdrawRemaining(uint256 escrowId) external',

    // ── View functions ──
    'function hasClaimed(uint256 escrowId, address user) view returns (bool)',
    'function hasReceivedReward(uint256, address) view returns (bool)',
    'function remainingBalance(uint256 escrowId) view returns (uint256)',
    'function getCampaign(uint256 escrowId) view returns (tuple(uint256 partnerCampaignId, address sponsor, uint256 totalFunded, uint256 totalDistributed, uint256 endTimestamp, bool isClosed))',
    'function claimRoots(uint256) view returns (bytes32)',
    'function numCampaigns() view returns (uint256)',
    'function domainSeparator() view returns (bytes32)',

    // ── Constants ──
    'function CLAIM_TYPEHASH() view returns (bytes32)',
] as const;

/**
 * EIP-712 type definitions for gasless claim signatures.
 * The user signs this typed data in their wallet (no gas needed),
 * then the relayer submits it on-chain via claimRewardFor().
 */
export const CLAIM_REWARD_TYPES = {
    ClaimReward: [
        { name: 'escrowId', type: 'uint256' },
        { name: 'claimer', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
} as const;

/**
 * Build the EIP-712 domain for signature construction.
 * Must match the contract's EIP712 constructor args: name="CampaignEscrow", version="1"
 */
export function buildClaimDomain(escrowContractAddress: string, chainId: number) {
    return {
        name: 'CampaignEscrow',
        version: '1',
        chainId,
        verifyingContract: escrowContractAddress as `0x${string}`,
    };
}
