// User Types
export interface User {
  id: string;
  walletAddress: string;
  totalPoints: number;
  isAdmin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Course Types
export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CourseCategory {
  DEFI = 'DeFi',
  NFT = 'NFT',
  SECURITY = 'Security',
  DEVELOPMENT = 'Development',
  BLOCKCHAIN = 'Blockchain',
  TRADING = 'Trading',
}

export interface Course {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  instructor: string;
  category: CourseCategory;
  level: CourseLevel;
  thumbnailUrl?: string;
  duration: number;
  objectives: string[];
  prerequisites: string[];
  completionPoints: number;
  minPointsToAccess: number;
  enrollmentCost: number;
  isPublished: boolean;
  onChainSynced: boolean;
  lessons?: Lesson[];
  enrollmentCount?: number;
  _count?: {
    lessons: number;
  };
  isEnrolled?: boolean;
  progress?: number;
}

// Lesson Types
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  videoStorageKey: string;
  videoDuration: number;
  watchPoints: number;
  quiz?: Quiz;
  isWatched?: boolean;
  watchProgress?: number;
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  passingScore: number;
  passPoints: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: number[];
  scorePercent: number;
  isPassed: boolean;
  attemptNumber: number;
  createdAt: Date;
}

// Progress Types
export interface UserCourse {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  pointsSpent: number;
  progressPercent: number;
  isCompleted: boolean;
  onChainSynced: boolean;
  enrollTxHash?: string;
}

export interface UserLesson {
  userId: string;
  lessonId: string;
  watchProgressPercent: number;
  isWatched: boolean;
  watchPointsAwarded: boolean;
  lastWatchedAt: Date;
}

// Certificate Types
export interface Certificate {
  courseId: string;
  courseName: string;
  completedAt: Date;
  certificateUrl?: string;
  onChainVerified: boolean;
  progress: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Video Types
export interface VideoMetadata {
  url: string;
  duration: number;
  language?: string;
  quality?: string;
}

// Points Types
export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'EARN' | 'SPEND';
  description: string;
  courseId?: string;
  lessonId?: string;
  createdAt: Date;
}

// Stats Types
export interface UserStats {
  totalPoints: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  certificatesEarned: number;
}
