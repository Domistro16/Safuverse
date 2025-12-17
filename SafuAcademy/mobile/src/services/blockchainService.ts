import { ethers } from 'ethers';
import { SAFUACADEMY_CONTRACT_ADDRESS, RPC_URL } from '@config/constants';

// SafuAcademy Contract ABI (simplified - add more functions as needed)
const CONTRACT_ABI = [
  'function getCourses() view returns (tuple(uint256 id, string title, string description, address instructor, uint256 enrollmentCost, uint256 completionPoints, bool isActive)[])',
  'function getCourse(uint256 courseId, address user) view returns (tuple(uint256 id, string title, string description, address instructor, uint256 enrollmentCost, uint256 completionPoints, bool isActive, bool isEnrolled, uint256 progress))',
  'function enroll(uint256 courseId) payable',
  'function updateCourseProgress(uint256 courseId, uint256 progress)',
  'function getUserPoints(address user) view returns (uint256)',
  'function completedCourses(address user, uint256 courseId) view returns (bool)',
  'event CourseEnrolled(address indexed user, uint256 indexed courseId)',
  'event CourseCompleted(address indexed user, uint256 indexed courseId)',
  'event ProgressUpdated(address indexed user, uint256 indexed courseId, uint256 progress)',
];

export class BlockchainService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(
      SAFUACADEMY_CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.provider
    );
  }

  /**
   * Get contract with signer for write operations
   */
  private getContractWithSigner(signer: ethers.Signer): ethers.Contract {
    return this.contract.connect(signer);
  }

  /**
   * Get all courses from blockchain
   */
  async getCourses(): Promise<any[]> {
    try {
      const courses = await this.contract.getCourses();
      return courses;
    } catch (error) {
      console.error('Error getting courses from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get single course with user enrollment status
   */
  async getCourse(courseId: string, userAddress: string): Promise<any> {
    try {
      const course = await this.contract.getCourse(courseId, userAddress);
      return course;
    } catch (error) {
      console.error('Error getting course from blockchain:', error);
      throw error;
    }
  }

  /**
   * Enroll in a course
   */
  async enrollInCourse(courseId: string, signer: ethers.Signer, enrollmentCost: string): Promise<ethers.TransactionReceipt | null> {
    try {
      const contractWithSigner = this.getContractWithSigner(signer);
      const tx = await contractWithSigner.enroll(courseId, {
        value: ethers.parseEther(enrollmentCost),
      });
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  /**
   * Update course progress on blockchain
   */
  async updateCourseProgress(
    courseId: string,
    progress: number,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const contractWithSigner = this.getContractWithSigner(signer);
      const tx = await contractWithSigner.updateCourseProgress(courseId, progress);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }

  /**
   * Get user's total points
   */
  async getUserPoints(userAddress: string): Promise<number> {
    try {
      const points = await this.contract.getUserPoints(userAddress);
      return Number(points);
    } catch (error) {
      console.error('Error getting user points:', error);
      throw error;
    }
  }

  /**
   * Check if user completed a course
   */
  async isCourseCompleted(userAddress: string, courseId: string): Promise<boolean> {
    try {
      const completed = await this.contract.completedCourses(userAddress, courseId);
      return completed;
    } catch (error) {
      console.error('Error checking course completion:', error);
      throw error;
    }
  }

  /**
   * Listen to contract events
   */
  onCourseEnrolled(callback: (user: string, courseId: string) => void) {
    this.contract.on('CourseEnrolled', callback);
  }

  onCourseCompleted(callback: (user: string, courseId: string) => void) {
    this.contract.on('CourseCompleted', callback);
  }

  onProgressUpdated(callback: (user: string, courseId: string, progress: number) => void) {
    this.contract.on('ProgressUpdated', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}

export const blockchainService = new BlockchainService();
