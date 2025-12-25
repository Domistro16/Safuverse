import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Enum values matching Prisma schema
const TxStatus = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
} as const;

const TxType = {
    ENROLL: 'ENROLL',
    PROGRESS_UPDATE: 'PROGRESS_UPDATE',
} as const;

// Updated ABI to match Level3Course.sol contract
const LEVEL3_COURSE_ABI = [
    // Relayer Functions
    'function enroll(uint256 _courseId, address _user) external',
    'function completeCourse(uint256 _courseId, address _user, uint256 _totalPoints) external',
    // Owner Functions
    'function createCourse(string _title, string _description, string _longDescription, string _instructor, string[] _objectives, string[] _prerequisites, string _category, string _level, string _thumbnailUrl, string _duration, uint256 _totalLessons, uint256 _minPointsToAccess, uint256 _enrollmentCost) external returns (uint256)',
    'function updateCourse(uint256 _courseId, string _title, string _description, string _longDescription, string _instructor, string[] _objectives, string[] _prerequisites, string _category, string _level, string _thumbnailUrl, string _duration, uint256 _totalLessons, uint256 _minPointsToAccess, uint256 _enrollmentCost) external',
    'function deleteCourse(uint256 _courseId) external',
    // View Functions
    'function isUserEnrolled(address _user, uint256 _courseId) external view returns (bool)',
    'function hasCompletedCourse(address _user, uint256 _courseId) external view returns (bool)',
    'function getUserPoints(address _user) external view returns (uint256)',
    'function getRelayer() external view returns (address)',
    'function getCourseRequirements(uint256 _courseId) external view returns (uint256 minPointsToAccess, uint256 enrollmentCost)',
    'function canUserEnroll(address _user, uint256 _courseId) external view returns (bool canEnroll, uint256 userPoints, uint256 minPointsToAccess, uint256 enrollmentCost, bool meetsAccessRequirement, bool meetsCostRequirement, bool alreadyEnrolled, bool alreadyCompleted)',
    // Events
    'event CourseCreated(uint256 indexed courseId, string title, string level, uint256 minPointsToAccess, uint256 enrollmentCost)',
];

export class RelayerService {
    private provider: JsonRpcProvider;
    private wallet: Wallet;
    private ownerWallet: Wallet;
    private contract: Contract;
    private ownerContract: Contract;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.provider = new JsonRpcProvider(config.rpcUrl, config.chainId);

        try {
            const hasAddress = config.level3CourseAddress && config.level3CourseAddress.startsWith('0x');
            if (config.relayerPrivateKey && hasAddress) {
                this.wallet = new Wallet(config.relayerPrivateKey, this.provider);
                this.contract = new Contract(
                    config.level3CourseAddress,
                    LEVEL3_COURSE_ABI,
                    this.wallet
                );
            }

            if (config.ownerPrivateKey && hasAddress) {
                this.ownerWallet = new Wallet(config.ownerPrivateKey, this.provider);
                this.ownerContract = new Contract(
                    config.level3CourseAddress,
                    LEVEL3_COURSE_ABI,
                    this.ownerWallet
                );
            }
        } catch (error) {
            console.error('Error initializing RelayerService wallets:', error);
        }
    }

    async getRelayerAddress(): Promise<string> {
        return this.wallet.address;
    }

    async getContractRelayer(): Promise<string | null> {
        if (!this.contract) return null;
        return await this.contract.getRelayer();
    }

    async verifyRelayerSetup(): Promise<{ valid: boolean; error?: string }> {
        try {
            const walletAddress = this.wallet.address;
            const contractRelayer = await this.getContractRelayer();

            if (walletAddress.toLowerCase() !== contractRelayer.toLowerCase()) {
                return {
                    valid: false,
                    error: `Wallet address ${walletAddress} does not match contract relayer ${contractRelayer}`,
                };
            }

            const balance = await this.provider.getBalance(walletAddress);
            const minBalance = ethers.parseEther('0.01');

            if (balance < minBalance) {
                return {
                    valid: false,
                    error: `Relayer balance too low: ${ethers.formatEther(balance)}`,
                };
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: `Failed to verify relayer: ${(error as Error).message}`,
            };
        }
    }

    async isUserEnrolled(userAddress: string, courseId: number): Promise<boolean> {
        if (!this.contract) return false;
        try {
            return await this.contract.isUserEnrolled(userAddress, courseId);
        } catch (error) {
            console.error('Error checking enrollment:', error);
            return false;
        }
    }

    async hasCompletedCourse(userAddress: string, courseId: number): Promise<boolean> {
        try {
            return await this.contract.hasCompletedCourse(userAddress, courseId);
        } catch (error) {
            console.error('Error checking completion:', error);
            return false;
        }
    }

    async getUserPoints(userAddress: string): Promise<bigint> {
        if (!this.contract) return BigInt(0);
        try {
            return await this.contract.getUserPoints(userAddress);
        } catch (error) {
            console.error('Error getting user points:', error);
            return BigInt(0);
        }
    }

    async canUserEnroll(userAddress: string, courseId: number): Promise<{
        canEnroll: boolean;
        userPoints: bigint;
        requiredPoints: bigint;
        hasEnoughPoints: boolean;
        alreadyEnrolled: boolean;
        alreadyCompleted: boolean;
    }> {
        if (!this.contract) {
            return {
                canEnroll: false,
                userPoints: BigInt(0),
                requiredPoints: BigInt(0),
                hasEnoughPoints: false,
                alreadyEnrolled: false,
                alreadyCompleted: false,
            };
        }
        try {
            const result = await this.contract.canUserEnroll(userAddress, courseId);
            return {
                canEnroll: result.canEnroll,
                userPoints: result.userPoints,
                requiredPoints: result.minPointsToAccess,
                hasEnoughPoints: result.meetsAccessRequirement && result.meetsCostRequirement,
                alreadyEnrolled: result.alreadyEnrolled,
                alreadyCompleted: result.alreadyCompleted,
            };
        } catch (error) {
            console.error('Error checking enrollment eligibility:', error);
            return {
                canEnroll: false,
                userPoints: BigInt(0),
                requiredPoints: BigInt(0),
                hasEnoughPoints: false,
                alreadyEnrolled: false,
                alreadyCompleted: false,
            };
        }
    }

    // ============ RELAYER ACTIONS ============

    async enrollUser(
        userId: string,
        userAddress: string,
        courseId: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        if (!this.contract) {
            return { success: false, error: 'Relayer contract not initialized' };
        }
        try {
            const isEnrolled = await this.isUserEnrolled(userAddress, courseId);
            if (isEnrolled) {
                return { success: true, txHash: 'already-enrolled' };
            }

            const tx = await this.contract.enroll(courseId, userAddress);

            await this.prisma.blockchainTx.create({
                data: {
                    txHash: tx.hash,
                    type: TxType.ENROLL,
                    userId,
                    courseId,
                    status: TxStatus.PENDING,
                },
            });

            const receipt = await tx.wait();

            await this.prisma.blockchainTx.update({
                where: { txHash: tx.hash },
                data: {
                    status: TxStatus.SUCCESS,
                    gasUsed: receipt?.gasUsed?.toString(),
                },
            });

            return { success: true, txHash: tx.hash };
        } catch (error) {
            const errorMessage = (error as Error).message;
            console.error('Enrollment transaction failed:', errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    async completeCourse(
        userId: string,
        userAddress: string,
        courseId: number,
        totalPoints: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            const hasCompleted = await this.hasCompletedCourse(userAddress, courseId);
            if (hasCompleted) {
                return { success: true, txHash: 'already-completed' };
            }

            const tx = await this.contract.completeCourse(courseId, userAddress, totalPoints);

            await this.prisma.blockchainTx.create({
                data: {
                    txHash: tx.hash,
                    type: TxType.PROGRESS_UPDATE,
                    userId,
                    courseId,
                    status: TxStatus.PENDING,
                },
            });

            const receipt = await tx.wait();

            await this.prisma.blockchainTx.update({
                where: { txHash: tx.hash },
                data: {
                    status: TxStatus.SUCCESS,
                    gasUsed: receipt?.gasUsed?.toString(),
                },
            });

            return { success: true, txHash: tx.hash };
        } catch (error) {
            const errorMessage = (error as Error).message;
            console.error('Complete course transaction failed:', errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    // ============ OWNER ACTIONS ============

    async createCourseOnChain(data: {
        title: string;
        description: string;
        longDescription: string;
        instructor: string;
        objectives: string[];
        prerequisites: string[];
        category: string;
        level: string;
        thumbnailUrl: string;
        duration: string;
        totalLessons: number;
        minPointsToAccess: number;
        enrollmentCost: number;
    }): Promise<{ success: boolean; courseId?: number; txHash?: string; error?: string }> {
        try {
            const tx = await this.ownerContract.createCourse(
                data.title,
                data.description,
                data.longDescription,
                data.instructor,
                data.objectives,
                data.prerequisites,
                data.category,
                data.level,
                data.thumbnailUrl,
                data.duration,
                data.totalLessons,
                data.minPointsToAccess,
                data.enrollmentCost
            );

            const receipt = await tx.wait();

            // Parse CourseCreated event to get courseId
            let courseId: number | undefined;

            for (const log of receipt.logs) {
                try {
                    const parsed = this.ownerContract.interface.parseLog(log);
                    if (parsed && parsed.name === 'CourseCreated') {
                        courseId = Number(parsed.args.courseId);
                        break;
                    }
                } catch {
                    // Not our event
                }
            }

            if (courseId === undefined) {
                throw new Error('CourseCreated event not found in transaction receipt');
            }

            return { success: true, courseId, txHash: tx.hash };
        } catch (error) {
            console.error('Create course transaction failed:', error);
            return { success: false, error: (error as Error).message };
        }
    }

    async updateCourseOnChain(
        courseId: number,
        data: {
            title: string;
            description: string;
            longDescription: string;
            instructor: string;
            objectives: string[];
            prerequisites: string[];
            category: string;
            level: string;
            thumbnailUrl: string;
            duration: string;
            totalLessons: number;
            minPointsToAccess: number;
            enrollmentCost: number;
        }
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            const tx = await this.ownerContract.updateCourse(
                courseId,
                data.title,
                data.description,
                data.longDescription,
                data.instructor,
                data.objectives,
                data.prerequisites,
                data.category,
                data.level,
                data.thumbnailUrl,
                data.duration,
                data.totalLessons,
                data.minPointsToAccess,
                data.enrollmentCost
            );

            await tx.wait();
            return { success: true, txHash: tx.hash };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    async deleteCourseOnChain(courseId: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            const tx = await this.ownerContract.deleteCourse(courseId);
            await tx.wait();
            return { success: true, txHash: tx.hash };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }
}
