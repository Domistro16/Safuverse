import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/types';
import { lessonService } from '@services/lessonService';
import { Quiz, QuizAttempt } from '@types/index';
import { TouchableOpacity } from 'react-native-gesture-handler';

type QuizRouteProp = RouteProp<HomeStackParamList, 'Quiz'>;
type QuizNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Quiz'>;

export const QuizScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const route = useRoute<QuizRouteProp>();
  const navigation = useNavigation<QuizNavigationProp>();
  const { lessonId, courseId } = route.params;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      const quizData = await lessonService.getQuiz(lessonId);
      setQuiz(quizData);
      setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (selectedAnswers.some((answer) => answer === -1)) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const attemptResult = await lessonService.submitQuiz(lessonId, selectedAnswers);
      setResult(attemptResult);

      // Show result alert
      const passed = attemptResult.isPassed;
      Alert.alert(
        passed ? 'Congratulations! 🎉' : 'Try Again',
        passed
          ? `You passed with ${Math.round(attemptResult.scorePercent)}%! You earned ${quiz?.passPoints} points.`
          : `You scored ${Math.round(attemptResult.scorePercent)}%. You need ${quiz?.passingScore}% to pass.`,
        [
          {
            text: passed ? 'Continue' : 'Retry',
            onPress: () => {
              if (passed) {
                navigation.goBack();
              } else {
                setResult(null);
                setSelectedAnswers(new Array(quiz?.questions.length || 0).fill(-1));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  if (!quiz) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="h5">Quiz not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show results if submitted
  if (result) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <Card style={{ marginBottom: spacing.lg, alignItems: 'center', padding: spacing.xl }}>
            <Text variant="h1" color={result.isPassed ? colors.success : colors.error}>
              {Math.round(result.scorePercent)}%
            </Text>
            <Text variant="h5" style={{ marginTop: spacing.sm }}>
              {result.isPassed ? 'Passed!' : 'Not Passed'}
            </Text>
            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
              Passing score: {quiz.passingScore}%
            </Text>
          </Card>

          {/* Show answers with explanations */}
          {quiz.questions.map((question, qIndex) => {
            const userAnswer = selectedAnswers[qIndex];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <Card key={qIndex} style={{ marginBottom: spacing.md }}>
                <Text variant="h6" style={{ marginBottom: spacing.sm }}>
                  Question {qIndex + 1}
                </Text>
                <Text variant="body" style={{ marginBottom: spacing.md }}>
                  {question.question}
                </Text>

                {question.options.map((option, oIndex) => {
                  const isUserAnswer = oIndex === userAnswer;
                  const isCorrectAnswer = oIndex === question.correctAnswer;

                  return (
                    <View
                      key={oIndex}
                      style={{
                        padding: spacing.sm,
                        marginBottom: spacing.xs,
                        borderRadius: borderRadius.md,
                        backgroundColor: isCorrectAnswer
                          ? `${colors.success}20`
                          : isUserAnswer
                          ? `${colors.error}20`
                          : colors.backgroundSecondary,
                        borderWidth: 1,
                        borderColor: isCorrectAnswer
                          ? colors.success
                          : isUserAnswer
                          ? colors.error
                          : colors.border,
                      }}
                    >
                      <Text
                        variant="body"
                        color={
                          isCorrectAnswer ? colors.success : isUserAnswer ? colors.error : colors.text
                        }
                      >
                        {option} {isCorrectAnswer && '✓'} {isUserAnswer && !isCorrect && '✗'}
                      </Text>
                    </View>
                  );
                })}

                {question.explanation && (
                  <View
                    style={{
                      marginTop: spacing.sm,
                      padding: spacing.sm,
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text variant="caption" color={colors.textSecondary}>
                      {question.explanation}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}

          <Button
            title={result.isPassed ? 'Continue' : 'Retry Quiz'}
            onPress={() => {
              if (result.isPassed) {
                navigation.goBack();
              } else {
                setResult(null);
                setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
              }
            }}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show quiz questions
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="h5" style={{ marginBottom: spacing.xs }}>
            Quiz
          </Text>
          <Text variant="body" color={colors.textSecondary}>
            Answer all questions to pass. Passing score: {quiz.passingScore}%
          </Text>
        </Card>

        {quiz.questions.map((question, qIndex) => (
          <Card key={qIndex} style={{ marginBottom: spacing.md }}>
            <Text variant="h6" style={{ marginBottom: spacing.sm }}>
              Question {qIndex + 1}
            </Text>
            <Text variant="body" style={{ marginBottom: spacing.md }}>
              {question.question}
            </Text>

            {question.options.map((option, oIndex) => (
              <TouchableOpacity
                key={oIndex}
                onPress={() => handleSelectAnswer(qIndex, oIndex)}
                style={{
                  padding: spacing.md,
                  marginBottom: spacing.xs,
                  borderRadius: borderRadius.md,
                  backgroundColor:
                    selectedAnswers[qIndex] === oIndex
                      ? `${colors.primary}20`
                      : colors.backgroundSecondary,
                  borderWidth: 2,
                  borderColor:
                    selectedAnswers[qIndex] === oIndex ? colors.primary : colors.border,
                }}
              >
                <Text
                  variant="body"
                  color={selectedAnswers[qIndex] === oIndex ? colors.primary : colors.text}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        ))}

        <Button
          title="Submit Quiz"
          onPress={handleSubmit}
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || selectedAnswers.some((answer) => answer === -1)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
