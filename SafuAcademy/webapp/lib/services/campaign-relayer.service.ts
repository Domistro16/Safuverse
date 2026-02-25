import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { config } from '../config';

/**
 * Minimal ABIs for the NexIDCampaigns and PartnerCampaigns contracts.
 * Only includes functions actually called by the backend relayer.
 */
const NEXID_CAMPAIGNS_ABI = [
    'function enroll(uint256 _campaignId, address _user) external',
    'function completeCampaign(uint256 _campaignId, address _user) external',
    'function isEnrolled(address, uint256) view returns (bool)',
    'function hasCompleted(address, uint256) view returns (bool)',
    'function getParticipantCount(uint256 _campaignId) view returns (uint256)',
];

const PARTNER_CAMPAIGNS_ABI = [
    'function enroll(uint256 _campaignId, address _user) external',
    'function completeCampaign(uint256 _campaignId, address _user) external',
    'function addPoints(uint256 _campaignId, address _user, uint256 _points) external',
    'function batchAddPoints(uint256 _campaignId, address[] _users, uint256[] _points) external',
    'function isEnrolled(address, uint256) view returns (bool)',
    'function hasCompleted(address, uint256) view returns (bool)',
    'function campaignPoints(uint256, address) view returns (uint256)',
    'function getParticipantCount(uint256 _campaignId) view returns (uint256)',
];

type ContractType = 'NEXID_CAMPAIGNS' | 'PARTNER_CAMPAIGNS';

export class CampaignRelayerService {
    private provider: JsonRpcProvider;
    private relayerWallet?: Wallet;
    private nexidContract?: Contract;
    private partnerContract?: Contract;

    constructor() {
        this.provider = new JsonRpcProvider(config.rpcUrl, config.chainId);

        if (!config.relayerPrivateKey) return;

        this.relayerWallet = new Wallet(config.relayerPrivateKey, this.provider);

        if (config.nexidCampaignsAddress?.startsWith('0x')) {
            this.nexidContract = new Contract(
                config.nexidCampaignsAddress,
                NEXID_CAMPAIGNS_ABI,
                this.relayerWallet
            );
        }

        if (config.partnerCampaignsAddress?.startsWith('0x')) {
            this.partnerContract = new Contract(
                config.partnerCampaignsAddress,
                PARTNER_CAMPAIGNS_ABI,
                this.relayerWallet
            );
        }
    }

    private getContract(contractType: ContractType): Contract | null {
        return contractType === 'NEXID_CAMPAIGNS'
            ? this.nexidContract ?? null
            : this.partnerContract ?? null;
    }

    /**
     * Enroll a user on-chain for a campaign.
     * The enroll() function on both contracts is open (not relayer-only).
     */
    async enrollUser(
        contractType: ContractType,
        onChainCampaignId: number,
        userAddress: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        const contract = this.getContract(contractType);
        if (!contract) {
            return { success: false, error: `${contractType} contract not configured` };
        }

        try {
            // Check if already enrolled on-chain
            const enrolled = await contract.isEnrolled(userAddress, onChainCampaignId);
            if (enrolled) {
                return { success: true, txHash: 'already-enrolled-onchain' };
            }

            // Check if already completed on-chain
            const completed = await contract.hasCompleted(userAddress, onChainCampaignId);
            if (completed) {
                return { success: true, txHash: 'already-completed-onchain' };
            }

            const tx = await contract.enroll(onChainCampaignId, userAddress);
            const receipt = await tx.wait();

            return { success: true, txHash: receipt.hash };
        } catch (error) {
            console.error(`CampaignRelayer enrollUser error (${contractType}):`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Mark a campaign as completed on-chain (relayer-only function).
     */
    async completeCampaign(
        contractType: ContractType,
        onChainCampaignId: number,
        userAddress: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        const contract = this.getContract(contractType);
        if (!contract) {
            return { success: false, error: `${contractType} contract not configured` };
        }

        try {
            const completed = await contract.hasCompleted(userAddress, onChainCampaignId);
            if (completed) {
                return { success: true, txHash: 'already-completed-onchain' };
            }

            const tx = await contract.completeCampaign(onChainCampaignId, userAddress);
            const receipt = await tx.wait();

            return { success: true, txHash: receipt.hash };
        } catch (error) {
            console.error(`CampaignRelayer completeCampaign error (${contractType}):`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Batch-award points to multiple users for a PartnerCampaigns campaign.
     * Only applies to PARTNER_CAMPAIGNS (NexID has no points).
     *
     * @param onChainCampaignId  The campaign ID on the PartnerCampaigns contract
     * @param users              Array of wallet addresses
     * @param points             Array of point deltas to add (same length as users)
     */
    async batchAddPoints(
        onChainCampaignId: number,
        users: string[],
        points: bigint[]
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        if (!this.partnerContract) {
            return { success: false, error: 'PARTNER_CAMPAIGNS contract not configured' };
        }
        if (users.length === 0) {
            return { success: true, txHash: 'no-users' };
        }
        if (users.length !== points.length) {
            return { success: false, error: 'users and points arrays must have same length' };
        }

        try {
            const tx = await this.partnerContract.batchAddPoints(
                onChainCampaignId,
                users,
                points
            );
            const receipt = await tx.wait();

            return { success: true, txHash: receipt.hash };
        } catch (error) {
            console.error('CampaignRelayer batchAddPoints error:', error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Read a user's current on-chain points for a partner campaign.
     */
    async getOnChainPoints(
        onChainCampaignId: number,
        userAddress: string
    ): Promise<bigint> {
        if (!this.partnerContract) return 0n;
        try {
            return await this.partnerContract.campaignPoints(onChainCampaignId, userAddress);
        } catch {
            return 0n;
        }
    }

    /**
     * Check if the relayer contracts are configured.
     */
    isConfigured(contractType: ContractType): boolean {
        return this.getContract(contractType) !== null;
    }
}

/** Singleton instance */
let _instance: CampaignRelayerService | null = null;

export function getCampaignRelayer(): CampaignRelayerService {
    if (!_instance) {
        _instance = new CampaignRelayerService();
    }
    return _instance;
}
