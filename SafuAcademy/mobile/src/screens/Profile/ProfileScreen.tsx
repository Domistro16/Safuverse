import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useAuth } from '@hooks/useAuth';

export const ProfileScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text variant="h2" style={{ marginBottom: spacing.lg }}>
          Profile
        </Text>

        {/* Wallet Info */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Wallet Address
          </Text>
          <Text variant="body" numberOfLines={1}>
            {user?.walletAddress || 'Not connected'}
          </Text>
        </Card>

        {/* Points */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="label" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Total Points
          </Text>
          <Text variant="h3" color={colors.primary}>
            {user?.totalPoints || 0}
          </Text>
        </Card>

        {/* Stats */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="h6" style={{ marginBottom: spacing.md }}>
            Your Stats
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text variant="h4" color={colors.primary}>
                0
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Enrolled Courses
              </Text>
            </View>
            <View>
              <Text variant="h4" color={colors.success}>
                0
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Completed
              </Text>
            </View>
          </View>
        </Card>

        {/* Logout */}
        <Button title="Disconnect Wallet" onPress={logout} variant="outline" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
