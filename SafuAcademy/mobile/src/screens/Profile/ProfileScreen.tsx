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
import { LinearGradient } from 'expo-linear-gradient';

export const ProfileScreen: React.FC = () => {
  const { mode, colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { disconnect, address } = useWeb3();
  const { getStats, stats, isLoading } = useReferralStats();

  useEffect(() => {
    if (address) {
      getStats();
    }
  }, [address]);

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>

        {/* Profile Header Hero */}
        <View style={styles.headerHero}>
          <LinearGradient
            colors={mode === 'light' ? ['#111111', '#333333'] : [colors.primary, '#E6B800']}
            style={styles.headerGradient}
          />
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: mode === 'light' ? '#333' : '#000' }]}>
                <Ionicons name="person" size={50} color={mode === 'light' ? '#666' : colors.primary} />
              </View>
              <View style={[styles.rankBadge, { backgroundColor: '#14D46B' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
              </View>
            </View>

            <Text variant="h3" style={{ color: mode === 'light' ? '#fff' : '#000', marginBottom: 4 }}>
              {user?.username || 'Safu Explorer'}
            </Text>

            <TouchableOpacity style={styles.walletPill} onPress={handleCopyAddress}>
              <Text variant="caption" style={{ color: mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontWeight: '600' }}>
                {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'No wallet connected'}
              </Text>
              <Ionicons name="copy-outline" size={14} color={mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -30 }}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Points</Text>
              <Text variant="h4" style={{ fontWeight: '800' }}>{user?.totalPoints || 0}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Rank</Text>
              <Text variant="h4" style={{ fontWeight: '800' }}>#{user?.rank || '-'}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Courses</Text>
              <Text variant="h4" style={{ fontWeight: '800' }}>{user?.completedCourses || 0}</Text>
            </Card>
          </View>

          {/* Referral Section */}
          <Text variant="h5" style={{ marginBottom: spacing.md, marginTop: spacing.xl }}>Referral Program</Text>
          {stats ? (
            <Card style={{ padding: spacing.xl }}>
              <View style={styles.referralHeader}>
                <View style={[styles.tierBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text variant="caption" style={{ color: colors.primary, fontWeight: '800' }}>
                    {stats.tier.toUpperCase()} TIER
                  </Text>
                </View>
                <Text variant="h6" color={colors.success}>{parseFloat(stats.totalEarnings).toFixed(4)} BNB Earned</Text>
              </View>

              <View style={styles.referralStatsRow}>
                <View style={styles.referralStatItem}>
                  <Text variant="h4" style={{ fontWeight: '800' }}>{stats.referralCount}</Text>
                  <Text variant="caption" color={colors.textSecondary}>Invited</Text>
                </View>
                <View style={styles.referralStatItem}>
                  <Text variant="h4" style={{ fontWeight: '800' }}>{stats.percentage}%</Text>
                  <Text variant="caption" color={colors.textSecondary}>Commission</Text>
                </View>
              </View>

              {nextTier && (
                <View style={{ marginTop: spacing.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text variant="caption" style={{ fontWeight: '600' }}>Progress to {nextTier.name}</Text>
                    <Text variant="caption" color={colors.textSecondary}>{nextTier.remaining} more needed</Text>
                  </View>
                  <View style={[styles.progressBarBase, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${(stats.referralCount / (stats.referralCount + nextTier.remaining)) * 100}%`
                        }
                      ]}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity style={[styles.copyLinkButton, { backgroundColor: colors.background }]} onPress={handleCopyReferralLink}>
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>names.safuverse.com/?ref={stats.referralCode}</Text>
                <Ionicons name="share-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Ionicons name="gift-outline" size={40} color={colors.border} style={{ marginBottom: 12 }} />
              <Text variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: 20 }}>
                Join our referral program to earn rewards for every friend you invite to Safuverse.
              </Text>
              <Button title="Get Referral Link" size="small" onPress={() => { }} />
            </Card>
          )}

          {/* Menu Actions */}
          <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#F4F4F4' }]}>
                <Ionicons name="settings-outline" size={20} color="#111" />
              </View>
              <Text variant="body" style={{ flex: 1, fontWeight: '600' }}>Account Settings</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#F4F4F4' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#111" />
              </View>
              <Text variant="body" style={{ flex: 1, fontWeight: '600' }}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </TouchableOpacity>

            <Button
              title="Disconnect Wallet"
              onPress={disconnect}
              variant="outline"
              fullWidth
              style={{ marginTop: spacing.xl, borderColor: '#FF5252' }}
              textStyle={{ color: '#FF5252' }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerHero: {
    height: 300,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rankBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  referralStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  referralStatItem: {
    alignItems: 'center',
  },
  progressBarBase: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  }
});
