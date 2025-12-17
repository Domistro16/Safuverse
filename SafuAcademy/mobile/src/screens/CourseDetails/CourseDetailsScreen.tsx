import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useCourse, useEnrollInCourse } from '@hooks/useCourses';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';
import { Ionicons } from '@expo/vector-icons';

type CourseDetailsRouteProp = RouteProp<HomeStackParamList, 'CourseDetails'>;
type CourseDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CourseDetails'>;

export const CourseDetailsScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const route = useRoute<CourseDetailsRouteProp>();
  const navigation = useNavigation<CourseDetailsNavigationProp>();
  const { courseId } = route.params;
  const { data: course, isLoading } = useCourse(courseId);
  const enrollMutation = useEnrollInCourse();
  const [isEnrolling, setIsEnrolling] = useState(false);

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

        {/* Lessons List */}
        {course.isEnrolled && course.lessons && course.lessons.length > 0 && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text variant="h6" style={{ marginBottom: spacing.md }}>
              Lessons ({course.lessons.length})
            </Text>
            {course.lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                onPress={() => navigation.navigate('LessonView', { lessonId: lesson.id, courseId })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.md,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: lesson.isWatched ? colors.success : colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  {lesson.isWatched ? (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  ) : (
                    <Text variant="bodySmall" style={{ color: '#000', fontWeight: '600' }}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" numberOfLines={1}>
                    {lesson.title}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {Math.floor(lesson.videoDuration / 60)} min
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Enroll Button */}
        {course.isEnrolled ? (
          course.lessons && course.lessons.length > 0 && (
            <Button
              title="Start First Lesson"
              onPress={() =>
                navigation.navigate('LessonView', {
                  lessonId: course.lessons[0].id,
                  courseId,
                })
              }
              fullWidth
            />
          )
        ) : (
          <Button
            title={`Enroll (${course.enrollmentCost} points)`}
            onPress={async () => {
              try {
                setIsEnrolling(true);
                await enrollMutation.mutateAsync(courseId);
                Alert.alert('Success', 'You have successfully enrolled in this course!');
              } catch (error) {
                console.error('Enrollment error:', error);
                Alert.alert('Error', 'Failed to enroll in course. Please try again.');
              } finally {
                setIsEnrolling(false);
              }
            }}
            loading={isEnrolling}
            disabled={isEnrolling}
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
