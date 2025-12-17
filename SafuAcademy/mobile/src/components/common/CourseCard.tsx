import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card } from '@components/ui/Card';
import { Text } from '@components/ui/Text';
import { Course, CourseLevel } from '@types/index';
import { COURSE_LEVELS } from '@config/constants';

interface CourseCardProps {
  course: Course;
  onPress: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  const { colors, spacing, borderRadius } = useTheme();

  const levelInfo = COURSE_LEVELS[course.level as CourseLevel];

  return (
    <TouchableOpacity onPress={() => onPress(course.id)} activeOpacity={0.8}>
      <Card padding={0} style={{ marginBottom: spacing.md }}>
        {/* Thumbnail */}
        {course.thumbnailUrl && (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={{
              width: '100%',
              height: 180,
              borderTopLeftRadius: borderRadius.lg,
              borderTopRightRadius: borderRadius.lg,
            }}
            resizeMode="cover"
          />
        )}

        <View style={{ padding: spacing.md }}>
          {/* Category and Level */}
          <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: borderRadius.sm,
                marginRight: spacing.xs,
              }}
            >
              <Text variant="caption" style={{ color: '#000', fontWeight: '600' }}>
                {course.category}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: `${levelInfo.color}20`,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: borderRadius.sm,
              }}
            >
              <Text variant="caption" style={{ color: levelInfo.color, fontWeight: '600' }}>
                {levelInfo.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text variant="h6" style={{ marginBottom: spacing.xs }} numberOfLines={2}>
            {course.title}
          </Text>

          {/* Description */}
          <Text
            variant="bodySmall"
            color={colors.textSecondary}
            style={{ marginBottom: spacing.md }}
            numberOfLines={2}
          >
            {course.description}
          </Text>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" color={colors.textSecondary}>
              {course._count?.lessons || 0} Lessons
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </Text>
            {course.isEnrolled && (
              <View
                style={{
                  backgroundColor: colors.success,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
                  Enrolled
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
