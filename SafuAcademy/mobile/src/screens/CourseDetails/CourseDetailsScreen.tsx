import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useCourse } from '@hooks/useCourses';
import { useRoute, RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '@navigation/types';

type CourseDetailsRouteProp = RouteProp<HomeStackParamList, 'CourseDetails'>;

export const CourseDetailsScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const route = useRoute<CourseDetailsRouteProp>();
  const { courseId } = route.params;
  const { data: course, isLoading } = useCourse(courseId);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="h5">Course not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text variant="h2" style={{ marginBottom: spacing.md }}>
          {course.title}
        </Text>

        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="body" color={colors.textSecondary}>
            {course.description}
          </Text>
        </Card>

        {course.longDescription && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text variant="h6" style={{ marginBottom: spacing.sm }}>
              About this course
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              {course.longDescription}
            </Text>
          </Card>
        )}

        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="h6" style={{ marginBottom: spacing.sm }}>
            Course Info
          </Text>
          <View style={{ marginBottom: spacing.xs }}>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Instructor: {course.instructor}
            </Text>
          </View>
          <View style={{ marginBottom: spacing.xs }}>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Level: {course.level}
            </Text>
          </View>
          <View>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Duration: {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </Text>
          </View>
        </Card>

        {course.isEnrolled ? (
          <Button title="Continue Learning" onPress={() => {}} fullWidth />
        ) : (
          <Button
            title={`Enroll (${course.enrollmentCost} points)`}
            onPress={() => {}}
            fullWidth
          />
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
