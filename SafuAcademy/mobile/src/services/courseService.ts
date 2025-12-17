import { apiClient } from './api';
import { Course, UserCourse, ApiResponse, PaginatedResponse } from '@types/index';

export interface CoursesQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  search?: string;
}

export const courseService = {
  /**
   * Get all courses with optional filters
   */
  async getCourses(params?: CoursesQueryParams): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/api/courses', {
      params,
    });
    return response.data || [];
  },

  /**
   * Get a single course by ID
   */
  async getCourse(courseId: string): Promise<Course> {
    const response = await apiClient.get<ApiResponse<Course>>(`/api/courses/${courseId}`);
    if (!response.data) {
      throw new Error('Course not found');
    }
    return response.data;
  },

  /**
   * Enroll in a course
   */
  async enrollInCourse(courseId: string): Promise<UserCourse> {
    const response = await apiClient.post<ApiResponse<UserCourse>>(
      `/api/courses/${courseId}/enroll`
    );
    if (!response.data) {
      throw new Error('Failed to enroll in course');
    }
    return response.data;
  },

  /**
   * Get user's progress for a course
   */
  async getCourseProgress(courseId: string): Promise<UserCourse> {
    const response = await apiClient.get<ApiResponse<UserCourse>>(
      `/api/courses/${courseId}/progress`
    );
    if (!response.data) {
      throw new Error('Failed to get course progress');
    }
    return response.data;
  },

  /**
   * Sync course progress with blockchain
   */
  async syncCourseProgress(courseId: string): Promise<void> {
    await apiClient.post(`/api/courses/${courseId}/sync`);
  },

  /**
   * Get featured courses
   */
  async getFeaturedCourses(limit: number = 3): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/api/courses', {
      params: { limit, featured: true },
    });
    return response.data || [];
  },

  /**
   * Search courses
   */
  async searchCourses(query: string): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/api/courses', {
      params: { search: query },
    });
    return response.data || [];
  },
};
