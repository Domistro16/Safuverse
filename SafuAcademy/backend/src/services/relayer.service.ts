import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { PrismaClient, TxStatus, TxType } from '@prisma/client';
import { config } from '../config/index.js';

const LEVEL3_COURSE_ABI = [
    'function enroll(uint256 _id, address _user) external',
    'function updateCourseProgress(uint256 _courseId, uint8 _progress, address _user, uint256 _points) external',
    'function isUserEnrolled(address _user, uint256 _courseId) external view returns (bool)',
    'function hasCompletedCourse(address _user, uint256 _courseId) external view returns (bool)',
    'function getUserPoints(address _user) external view returns (uint256)',
    'function getRelayer() external view returns (address)',
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
                    error: `Relayer balance too low: ${ethers.formatEther(balance)} BNB`,
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
            return 0n;
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

    async updateCourseProgress(
        userId: string,
        userAddress: string,
        courseId: number,
        progress: number,
        points: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            // Validate progress is 100
            if (progress !== 100) {
                return { success: false, error: 'Progress must be 100 to sync on-chain' };
            }

            // Check if already completed on-chain
            const hasCompleted = await this.hasCompletedCourse(userAddress, courseId);
            if (hasCompleted) {
                return { success: true, txHash: 'already-completed' };
            }

            // Send transaction
            const tx = await this.contract.updateCourseProgress(
                courseId,
                progress,
                userAddress,
                points
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
            console.error('Progress update transaction failed:', errorMessage);

            return { success: false, error: errorMessage };
        }
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
