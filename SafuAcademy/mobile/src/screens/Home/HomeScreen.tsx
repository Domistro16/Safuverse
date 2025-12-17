import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text } from '@components/ui';
import { CourseCard } from '@components/common/CourseCard';
import { useFeaturedCourses } from '@hooks/useCourses';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { data: featuredCourses, isLoading } = useFeaturedCourses();

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetails', { courseId });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="h2" style={{ marginBottom: spacing.xs }}>
            Welcome to SafuAcademy
          </Text>
          <Text variant="body" color={colors.textSecondary}>
            Learn Web3 & Blockchain with interactive courses
          </Text>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text variant="h3" color={colors.primary}>
              100+
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Hours
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="h3" color={colors.primary}>
              15+
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Courses
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="h3" color={colors.primary}>
              20k+
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Students
            </Text>
          </View>
        </View>

        {/* Featured Courses */}
        <Text variant="h4" style={{ marginBottom: spacing.md }}>
          Featured Courses
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          featuredCourses?.map((course) => (
            <CourseCard key={course.id} course={course} onPress={handleCoursePress} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
