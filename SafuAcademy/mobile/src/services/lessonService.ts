import { apiClient } from './api';
import { Lesson, UserLesson, Quiz, QuizAttempt, ApiResponse } from '@types/index';

export interface VideoUrlResponse {
  url: string;
  duration: number;
}

export interface LessonProgressUpdate {
  watchProgressPercent: number;
}

export interface QuizSubmission {
  answers: number[];
}

export const lessonService = {
  /**
   * Get lesson details
   */
  async getLesson(lessonId: string): Promise<Lesson> {
    const response = await apiClient.get<ApiResponse<Lesson>>(`/api/lessons/${lessonId}`);
    if (!response.data) {
      throw new Error('Lesson not found');
    }
    return response.data;
  },

  /**
   * Start a lesson
   */
  async startLesson(lessonId: string): Promise<UserLesson> {
    const response = await apiClient.post<ApiResponse<UserLesson>>(
      `/api/lessons/${lessonId}/start`
    );
    if (!response.data) {
      throw new Error('Failed to start lesson');
    }
    return response.data;
  },

  /**
   * Mark lesson as complete
   */
  async completeLesson(lessonId: string): Promise<UserLesson> {
    const response = await apiClient.post<ApiResponse<UserLesson>>(
      `/api/lessons/${lessonId}/complete`
    );
    if (!response.data) {
      throw new Error('Failed to complete lesson');
    }
    return response.data;
  },

  /**
   * Update lesson progress
   */
  async updateProgress(
    lessonId: string,
    progress: LessonProgressUpdate
  ): Promise<UserLesson> {
    const response = await apiClient.post<ApiResponse<UserLesson>>(
      `/api/lessons/${lessonId}/progress`,
      progress
    );
    if (!response.data) {
      throw new Error('Failed to update progress');
    }
    return response.data;
  },

  /**
   * Get lesson progress
   */
  async getProgress(lessonId: string): Promise<UserLesson> {
    const response = await apiClient.get<ApiResponse<UserLesson>>(
      `/api/lessons/${lessonId}/progress`
    );
    if (!response.data) {
      throw new Error('Failed to get progress');
    }
    return response.data;
  },

  /**
   * Get video URL for a lesson
   */
  async getVideoUrl(lessonId: string): Promise<VideoUrlResponse> {
    const response = await apiClient.get<ApiResponse<VideoUrlResponse>>(
      `/api/lessons/${lessonId}/video`
    );
    if (!response.data) {
      throw new Error('Failed to get video URL');
    }
    return response.data;
  },

  /**
   * Get quiz for a lesson
   */
  async getQuiz(lessonId: string): Promise<Quiz> {
    const response = await apiClient.get<ApiResponse<Quiz>>(`/api/lessons/${lessonId}/quiz`);
    if (!response.data) {
      throw new Error('Quiz not found');
    }
    return response.data;
  },

  /**
   * Submit quiz answers
   */
  async submitQuiz(lessonId: string, answers: number[]): Promise<QuizAttempt> {
    const response = await apiClient.post<ApiResponse<QuizAttempt>>(
      `/api/lessons/${lessonId}/quiz/submit`,
      { answers }
    );
    if (!response.data) {
      throw new Error('Failed to submit quiz');
    }
    return response.data;
  },
};
