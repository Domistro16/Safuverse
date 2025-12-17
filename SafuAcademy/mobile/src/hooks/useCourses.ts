import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService, CoursesQueryParams } from '@services/courseService';
import { Course } from '@types/index';

export const COURSE_KEYS = {
  all: ['courses'] as const,
  lists: () => [...COURSE_KEYS.all, 'list'] as const,
  list: (filters?: CoursesQueryParams) => [...COURSE_KEYS.lists(), filters] as const,
  details: () => [...COURSE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...COURSE_KEYS.details(), id] as const,
  progress: (id: string) => [...COURSE_KEYS.detail(id), 'progress'] as const,
  featured: () => [...COURSE_KEYS.all, 'featured'] as const,
};

export const useCourses = (params?: CoursesQueryParams) => {
  return useQuery({
    queryKey: COURSE_KEYS.list(params),
    queryFn: () => courseService.getCourses(params),
  });
};

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: COURSE_KEYS.detail(courseId),
    queryFn: () => courseService.getCourse(courseId),
    enabled: !!courseId,
  });
};

export const useCourseProgress = (courseId: string) => {
  return useQuery({
    queryKey: COURSE_KEYS.progress(courseId),
    queryFn: () => courseService.getCourseProgress(courseId),
    enabled: !!courseId,
  });
};

export const useFeaturedCourses = (limit: number = 3) => {
  return useQuery({
    queryKey: COURSE_KEYS.featured(),
    queryFn: () => courseService.getFeaturedCourses(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.enrollInCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.lists() });
    },
  });
};

export const useSyncCourseProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.syncCourseProgress(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.progress(courseId) });
    },
  });
};

export const useSearchCourses = () => {
  return useMutation({
    mutationFn: (query: string) => courseService.searchCourses(query),
  });
};
