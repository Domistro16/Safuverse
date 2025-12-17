import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { VideoPlayer } from '@components/common/VideoPlayer';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';
import { lessonService } from '@services/lessonService';
import { Lesson, UserLesson } from '@types/index';

type LessonViewRouteProp = RouteProp<HomeStackParamList, 'LessonView'>;
type LessonViewNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'LessonView'>;

export const LessonViewScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const route = useRoute<LessonViewRouteProp>();
  const navigation = useNavigation<LessonViewNavigationProp>();
  const { lessonId, courseId } = route.params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setIsLoading(true);

      // Start lesson
      const progressData = await lessonService.startLesson(lessonId);
      setProgress(progressData);

      // Get lesson details
      const lessonData = await lessonService.getLesson(lessonId);
      setLesson(lessonData);

      // Get video URL
      const videoData = await lessonService.getVideoUrl(lessonId);
      setVideoUrl(videoData.url);
    } catch (error) {
      console.error('Error loading lesson:', error);
      Alert.alert('Error', 'Failed to load lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (progressPercent: number) => {
    if (!isUpdatingProgress) {
      try {
        setIsUpdatingProgress(true);
        await lessonService.updateProgress(lessonId, {
          watchProgressPercent: progressPercent * 100,
        });
      } catch (error) {
        console.error('Error updating progress:', error);
      } finally {
        setIsUpdatingProgress(false);
      }
    }
  };

  const handleWatchComplete = async () => {
    try {
      await lessonService.completeLesson(lessonId);
      Alert.alert('Lesson Complete', 'Congratulations! You have completed this lesson.', [
        {
          text: 'Take Quiz',
          onPress: () => navigation.navigate('Quiz', { lessonId, courseId }),
        },
        {
          text: 'Continue',
          style: 'cancel',
        },
      ]);
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleTakeQuiz = () => {
    if (lesson?.quiz) {
      navigation.navigate('Quiz', { lessonId, courseId });
    } else {
      Alert.alert('No Quiz', 'This lesson does not have a quiz.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !videoUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="h5">Lesson not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Video Player */}
        <VideoPlayer
          videoUrl={videoUrl}
          onProgressUpdate={handleProgressUpdate}
          onWatchComplete={handleWatchComplete}
          initialProgress={(progress?.watchProgressPercent || 0) / 100}
        />

        {/* Lesson Info */}
        <View style={{ padding: spacing.md }}>
          <Text variant="h4" style={{ marginBottom: spacing.sm }}>
            {lesson.title}
          </Text>

          {lesson.description && (
            <Card style={{ marginBottom: spacing.md }}>
              <Text variant="body" color={colors.textSecondary}>
                {lesson.description}
              </Text>
            </Card>
          )}

          {/* Quiz Button */}
          {lesson.quiz && (
            <Button
              title="Take Quiz"
              onPress={handleTakeQuiz}
              fullWidth
              style={{ marginBottom: spacing.md }}
            />
          )}

          {/* Progress Info */}
          <Card>
            <Text variant="h6" style={{ marginBottom: spacing.sm }}>
              Your Progress
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text variant="caption" color={colors.textSecondary}>
                  Watch Progress
                </Text>
                <Text variant="h5" color={colors.primary}>
                  {Math.round(progress?.watchProgressPercent || 0)}%
                </Text>
              </View>
              <View>
                <Text variant="caption" color={colors.textSecondary}>
                  Status
                </Text>
                <Text
                  variant="h6"
                  color={progress?.isWatched ? colors.success : colors.textSecondary}
                >
                  {progress?.isWatched ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
