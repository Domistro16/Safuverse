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
    <TouchableOpacity onPress={() => onPress(course.id)} activeOpacity={0.85}>
      <Card padding={0} style={{ marginBottom: spacing.lg, overflow: 'hidden' }}>
        {/* Thumbnail */}
        {course.thumbnailUrl && (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={{
              width: '100%',
              height: 200,
              // No need to set specific radius here as Card has overflow: hidden
            }}
            resizeMode="cover"
          />
        )}

        <View style={{ padding: spacing.lg }}>
          {/* Category and Level */}
          <View style={{ flexDirection: 'row', marginBottom: spacing.md, alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 99,
                marginRight: spacing.sm,
              }}
            >
              <Text variant="caption" style={{ color: colors.background, fontWeight: '700', fontSize: 11 }}>
                {course.category.toUpperCase()}
              </Text>
            </View>
            <Text variant="caption" style={{ color: colors.textSecondary, fontWeight: '600' }}>
              • {levelInfo.label}
            </Text>
          </View>

          {/* Title */}
          <Text variant="h5" style={{ marginBottom: spacing.xs, fontWeight: '700' }} numberOfLines={2}>
            {course.title}
          </Text>

          {/* Description */}
          <Text
            variant="bodySmall"
            color={colors.textSecondary}
            style={{ marginBottom: spacing.lg, lineHeight: 20 }}
            numberOfLines={2}
          >
            {course.description}
          </Text>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="layers-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text variant="caption" color={colors.textSecondary}>
                {course._count?.lessons || 0} Lessons
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text variant="caption" color={colors.textSecondary}>
                {Math.floor(course.duration / 60)}h {course.duration % 60}m
              </Text>
            </View>

            {course.isEnrolled && (
              <View
                style={{
                  backgroundColor: colors.success + '15',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 99,
                }}
              >
                <Text variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
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
