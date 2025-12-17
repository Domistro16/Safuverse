import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList, CoursesStackParamList } from './types';
import { HomeScreen } from '@screens/Home/HomeScreen';
import { CoursesScreen } from '@screens/Courses/CoursesScreen';
import { CourseDetailsScreen } from '@screens/CourseDetails/CourseDetailsScreen';
import { useTheme } from '@theme/ThemeContext';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CoursesStack = createNativeStackNavigator<CoursesStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="CourseDetails"
        component={CourseDetailsScreen}
        options={{ title: 'Course Details' }}
      />
    </HomeStack.Navigator>
  );
};

export const CoursesStackNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <CoursesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <CoursesStack.Screen
        name="CoursesList"
        component={CoursesScreen}
        options={{ headerShown: false }}
      />
      <CoursesStack.Screen
        name="CourseDetails"
        component={CourseDetailsScreen}
        options={{ title: 'Course Details' }}
      />
    </CoursesStack.Navigator>
  );
};
