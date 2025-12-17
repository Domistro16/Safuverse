import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useAuth } from '@hooks/useAuth';
import { useWeb3 } from '@/contexts/Web3Context';
import { useReferralStats } from '@hooks/useDomains';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { REFERRAL_TIERS } from '@config/domains';

export const ProfileScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { disconnect, address } = useWeb3();
  const { getStats, stats, isLoading } = useReferralStats();

  useEffect(() => {
    if (address) {
      getStats();
    }
  }, [address]);

  const handleCopyReferralLink = async () => {
    if (stats?.referralCode) {
      const link = `https://names.safuverse.com/?ref=${stats.referralCode}`;
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied!', 'Referral link copied to clipboard');
    }
  };

  const getNextTier = () => {
    if (!stats) return null;
    if (stats.tier === 'default') {
      return { name: 'Silver', remaining: REFERRAL_TIERS.SILVER.minReferrals - stats.referralCount };
    } else if (stats.tier === 'silver') {
      return { name: 'Gold', remaining: REFERRAL_TIERS.GOLD.minReferrals - stats.referralCount };
    }
    return null;
  };

  const nextTier = getNextTier();

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
          <Text variant="body" numberOfLines={1} style={{ fontFamily: 'monospace' }}>
            {address || user?.walletAddress || 'Not connected'}
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

        {/* Referral Card */}
        {stats && (
          <Card style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <Ionicons name="gift" size={24} color={colors.primary} />
              <Text variant="h6" style={{ marginLeft: spacing.sm }}>
                Referral Program
              </Text>
            </View>

            {/* Tier Badge */}
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                backgroundColor: `${colors.primary}20`,
                borderRadius: borderRadius.md,
                marginBottom: spacing.md,
              }}
            >
              <Text variant="label" color={colors.primary} style={{ fontWeight: '600' }}>
                {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)} Tier
              </Text>
            </View>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="h4" color={colors.primary}>
                  {stats.referralCount}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Referrals
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="h4" color={colors.success}>
                  {parseFloat(stats.totalEarnings).toFixed(4)}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  BNB Earned
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="h4" color={colors.primary}>
                  {stats.percentage}%
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Commission
                </Text>
              </View>
            </View>

            {/* Progress to Next Tier */}
            {nextTier && (
              <View style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text variant="caption" color={colors.textSecondary}>
                    Progress to {nextTier.name}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {nextTier.remaining} more referrals
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.border,
                    borderRadius: borderRadius.sm,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${(stats.referralCount / (stats.referralCount + nextTier.remaining)) * 100}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Referral Link */}
            {stats.referralCode && (
              <TouchableOpacity
                onPress={handleCopyReferralLink}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.sm,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.md,
                }}
              >
                <Text variant="caption" style={{ flex: 1, fontFamily: 'monospace' }} numberOfLines={1}>
                  names.safuverse.com/?ref={stats.referralCode}
                </Text>
                <Ionicons name="copy-outline" size={20} color={colors.primary} style={{ marginLeft: spacing.sm }} />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Logout */}
        <Button title="Disconnect Wallet" onPress={disconnect} variant="outline" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
