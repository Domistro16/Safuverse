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

// Updated ABI to match new smart contract with point-gating
const LEVEL3_COURSE_ABI = [
    'function enroll(uint256 _courseId, address _user) external',
    'function completeCourse(uint256 _courseId, address _user, uint256 _totalPoints) external',
    'function isUserEnrolled(address _user, uint256 _courseId) external view returns (bool)',
    'function hasCompletedCourse(address _user, uint256 _courseId) external view returns (bool)',
    'function getUserPoints(address _user) external view returns (uint256)',
    'function getRelayer() external view returns (address)',
    'function getCourseRequiredPoints(uint256 _courseId) external view returns (uint256)',
    'function canUserEnroll(address _user, uint256 _courseId) external view returns (bool canEnroll, uint256 userPoints, uint256 requiredPoints, bool hasEnoughPoints, bool alreadyEnrolled, bool alreadyCompleted)',
];

export class RelayerService {
    private provider: JsonRpcProvider;
    private wallet: Wallet;
    private contract: Contract;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.provider = new JsonRpcProvider(config.rpcUrl, config.chainId);
        this.wallet = new Wallet(config.relayerPrivateKey, this.provider);
        this.contract = new Contract(
            config.level3CourseAddress,
            LEVEL3_COURSE_ABI,
            this.wallet
        );
    }

    async getRelayerAddress(): Promise<string> {
        return this.wallet.address;
    }

    async getContractRelayer(): Promise<string> {
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
        try {
            return await this.contract.getUserPoints(userAddress);
        } catch (error) {
            console.error('Error getting user points:', error);
            return BigInt(0);
        }
    }

    async getCourseRequiredPoints(courseId: number): Promise<bigint> {
        try {
            return await this.contract.getCourseRequiredPoints(courseId);
        } catch (error) {
            console.error('Error getting required points:', error);
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
        try {
            const result = await this.contract.canUserEnroll(userAddress, courseId);
            return {
                canEnroll: result.canEnroll,
                userPoints: result.userPoints,
                requiredPoints: result.requiredPoints,
                hasEnoughPoints: result.hasEnoughPoints,
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

    async enrollUser(
        userId: string,
        userAddress: string,
        courseId: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            // Check if already enrolled on-chain
            const isEnrolled = await this.isUserEnrolled(userAddress, courseId);
            if (isEnrolled) {
                return { success: true, txHash: 'already-enrolled' };
            }

            // Send transaction
            const tx = await this.contract.enroll(courseId, userAddress);

            // Record transaction as pending
            await this.prisma.blockchainTx.create({
                data: {
                    txHash: tx.hash,
                    type: TxType.ENROLL,
                    userId,
                    courseId,
                    status: TxStatus.PENDING,
                },
            });

            // Wait for confirmation
            const receipt = await tx.wait();

            // Update transaction status
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

    /**
     * Complete a course on-chain (called when progress = 100%)
     * Uses new completeCourse() function instead of updateCourseProgress()
     */
    async completeCourse(
        userId: string,
        userAddress: string,
        courseId: number,
        totalPoints: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            // Check if already completed on-chain
            const hasCompleted = await this.hasCompletedCourse(userAddress, courseId);
            if (hasCompleted) {
                return { success: true, txHash: 'already-completed' };
            }

            // Send transaction
            const tx = await this.contract.completeCourse(
                courseId,
                userAddress,
                totalPoints
            );

            // Record transaction as pending
            await this.prisma.blockchainTx.create({
                data: {
                    txHash: tx.hash,
                    type: TxType.PROGRESS_UPDATE,
                    userId,
                    courseId,
                    status: TxStatus.PENDING,
                },
            });

            // Wait for confirmation
            const receipt = await tx.wait();

            // Update transaction status
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

    /**
     * @deprecated Use completeCourse() instead
     * Kept for backwards compatibility with existing code
     */
    async updateCourseProgress(
        userId: string,
        userAddress: string,
        courseId: number,
        progress: number,
        points: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        if (progress !== 100) {
            return { success: false, error: 'Progress must be 100 to sync on-chain' };
        }
        return this.completeCourse(userId, userAddress, courseId, points);
    }

    async retryFailedTransactions(): Promise<void> {
        const failedTxs = await this.prisma.blockchainTx.findMany({
            where: { status: TxStatus.FAILED },
            include: { user: true },
            take: 10,
        });

        for (const tx of failedTxs) {
            console.log(`Retrying transaction ${tx.id} for user ${tx.userId}`);

            if (tx.type === TxType.ENROLL) {
                await this.enrollUser(tx.userId, tx.user.walletAddress, tx.courseId);
            } else if (tx.type === TxType.PROGRESS_UPDATE) {
                const userCourse = await this.prisma.userCourse.findUnique({
                    where: {
                        userId_courseId: {
                            userId: tx.userId,
                            courseId: tx.courseId,
                        },
                    },
                });

                if (userCourse && userCourse.progress === 100) {
                    await this.updateCourseProgress(
                        tx.userId,
                        tx.user.walletAddress,
                        tx.courseId,
                        100,
                        userCourse.pointsEarned
                    );
                }
            }
        }
    }
}
