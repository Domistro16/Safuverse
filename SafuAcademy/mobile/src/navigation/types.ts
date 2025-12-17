import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator (Auth + Main App)
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CoursesTab: NavigatorScreenParams<CoursesStackParamList>;
  DomainsTab: NavigatorScreenParams<DomainsStackParamList>;
  PointsTab: undefined;
  ProfileTab: undefined;
};

// Home Stack Navigator
export type HomeStackParamList = {
  Home: undefined;
  CourseDetails: { courseId: string };
  LessonView: { lessonId: string; courseId: string };
  Quiz: { lessonId: string; courseId: string };
};

// Courses Stack Navigator
export type CoursesStackParamList = {
  CoursesList: undefined;
  CourseDetails: { courseId: string };
  LessonView: { lessonId: string; courseId: string };
  Quiz: { lessonId: string; courseId: string };
};

// Domains Stack Navigator
export type DomainsStackParamList = {
  DomainSearch: undefined;
  DomainRegistration: { label: string };
  MyDomains: undefined;
  DomainDetails: { label: string };
};
