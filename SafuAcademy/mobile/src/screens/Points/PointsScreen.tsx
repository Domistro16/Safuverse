import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card } from '@components/ui';
import { useAuth } from '@hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

export const PointsScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text variant="h2" style={{ marginBottom: spacing.lg }}>
          Points Dashboard
        </Text>

        {/* Total Points Card */}
        <Card padding={0} style={{ marginBottom: spacing.lg, overflow: 'hidden' }}>
          <LinearGradient
            colors={[colors.primary, '#ffaa00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: spacing.xl }}
          >
            <Text variant="label" style={{ color: '#000', marginBottom: spacing.xs }}>
              Total Points
            </Text>
            <Text variant="h1" style={{ color: '#000' }}>
              {user?.totalPoints || 0}
            </Text>
          </LinearGradient>
        </Card>

        {/* How to Earn Points */}
        <Text variant="h5" style={{ marginBottom: spacing.md }}>
          How to Earn Points
        </Text>

        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text variant="h6" style={{ flex: 1 }}>
              Complete Lessons
            </Text>
            <Text variant="h6" color={colors.primary}>
              +50
            </Text>
          </View>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Watch lessons to completion to earn points
          </Text>
        </Card>

        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text variant="h6" style={{ flex: 1 }}>
              Pass Quizzes
            </Text>
            <Text variant="h6" color={colors.primary}>
              +100
            </Text>
          </View>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Score above the passing grade on lesson quizzes
          </Text>
        </Card>

        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text variant="h6" style={{ flex: 1 }}>
              Earn Certificates
            </Text>
            <Text variant="h6" color={colors.primary}>
              +500
            </Text>
          </View>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Complete all course requirements to earn certificates
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
