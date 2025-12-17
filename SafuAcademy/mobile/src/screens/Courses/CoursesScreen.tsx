import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Input } from '@components/ui';
import { CourseCard } from '@components/common/CourseCard';
import { useCourses } from '@hooks/useCourses';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CoursesStackParamList } from '@navigation/types';

type CoursesScreenNavigationProp = NativeStackNavigationProp<
  CoursesStackParamList,
  'CoursesList'
>;

export const CoursesScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<CoursesScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: courses, isLoading } = useCourses();

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetails', { courseId });
  };

  const filteredCourses = courses?.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.md }}>
        <Text variant="h2" style={{ marginBottom: spacing.md }}>
          All Courses
        </Text>

        {/* Search */}
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: spacing.md }}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            filteredCourses?.map((course) => (
              <CourseCard key={course.id} course={course} onPress={handleCoursePress} />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
