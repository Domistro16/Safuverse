// types/index.ts

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail: string;
  previewVideo?: string;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessonsCount: number;
  modulesCount: number;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  isFeatured: boolean;
  isNew: boolean;
  topics: string[];
  skills: string[];
  whatYouLearn: WhatYouLearnItem[];
  requirements: string[];
  instructor: Instructor;
  modules: Module[];
  reviews: Review[];
  faqs: FAQ[];
  lastUpdated: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  duration: string;
  lessons: Lesson[];
  order: number;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description?: string;
  duration: string;
  videoUrl: string;
  thumbnail?: string;
  isFree: boolean;
  isCompleted: boolean;
  hasQuiz: boolean;
  quiz?: Quiz;
  resources: Resource[];
  order: number;
  content?: string; // Rich text content
  nextLesson?: { slug: string; title: string };
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  attempts: number;
  rewards: {
    xp: number;
    tokens?: number;
  };
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'code';
  question: string;
  code?: string; // For code-based questions
  options: Option[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface Option {
  id: string;
  text: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  yearsExperience: number;
  projectsBuilt: number;
  studentsCount: number;
  rating: number;
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
    title?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'code' | 'link' | 'file';
  url: string;
  size?: string;
}

export interface WhatYouLearnItem {
  icon: string;
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

// User Progress
export interface UserProgress {
  courseId: string;
  completedLessons: string[];
  currentLesson: string;
  quizScores: Record<string, number>;
  xpEarned: number;
  tokensEarned: number;
  certificateId?: string;
  startedAt: string;
  lastAccessedAt: string;
  progress: number; // percentage
}

// Framer Motion Animation Variants
export interface AnimationVariants {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  whileHover?: Record<string, any>;
  whileInView?: Record<string, any>;
  transition?: Record<string, any>;
  viewport?: Record<string, any>;
}

// Component Props Types
export interface CourseCardProps {
  course: Course;
}

export interface ModuleAccordionProps {
  module: Module;
  index: number;
  defaultOpen?: boolean;
}

export interface LessonItemProps {
  lesson: Lesson;
  isActive: boolean;
  courseSlug: string;
}

export interface QuizPageProps {
  quiz: Quiz;
  course: Course;
  lesson: Lesson;
}

export interface TestimonialCardProps {
  testimonial: Review;
}

export interface InstructorCardProps {
  instructor: Instructor;
}
