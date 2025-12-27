import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card } from '@components/ui';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { DomainsStackParamList } from '@navigation/types';
import { useDomainDetails } from '@hooks/useDomains';
import { DOMAIN_CONFIG } from '@config/domains';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type DomainDetailsRouteProp = RouteProp<DomainsStackParamList, 'DomainDetails'>;

export const DomainDetailsScreen: React.FC = () => {
  const { mode, colors, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<DomainDetailsRouteProp>();
  const { label } = route.params;
  const { getDomain, isLoading, domain } = useDomainDetails();

  useEffect(() => {
    getDomain(label);
  }, [label]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!domain) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text variant="h5" style={{ marginTop: 20 }}>Domain not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text variant="body" color={colors.primary}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>

        {/* Detail Hero Header */}
        <View style={styles.headerHero}>
          <LinearGradient
            colors={mode === 'light' ? ['#111', '#444'] : [colors.primary, '#E6B800']}
            style={styles.headerGradient}
          />
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={mode === 'light' ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text variant="body" style={{ color: mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontWeight: '700' }}>
                Manage Name
              </Text>
              <TouchableOpacity style={styles.backButton}>
                <Ionicons name="share-outline" size={20} color={mode === 'light' ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <View style={styles.domainTitleSection}>
              <Text variant="h1" style={{ color: mode === 'light' ? '#fff' : '#000', fontSize: 36, fontWeight: '800' }}>
                {label}<Text variant="h1" style={{ color: mode === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }}>.{DOMAIN_CONFIG.TLD}</Text>
              </Text>
              {domain.isWrapped && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Ionicons name="cube-outline" size={14} color={mode === 'light' ? '#fff' : '#000'} />
                  <Text variant="caption" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '800', marginLeft: 6 }}>WRAPPED NFT</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -30 }}>
          {/* Main Info Card */}
          <Card style={{ padding: 24, marginBottom: 20 }}>
            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Text variant="caption" color={colors.textSecondary}>Registrant</Text>
                <Text variant="bodySmall" style={{ fontWeight: '700', fontFamily: 'monospace' }}>
                  {domain.owner.slice(0, 6)}...{domain.owner.slice(-4)}
                </Text>
              </View>
              <View style={[styles.infoBox, { borderLeftWidth: 1, borderColor: colors.border }]}>
                <Text variant="caption" color={colors.textSecondary}>Expiry Date</Text>
                <Text variant="bodySmall" style={{ fontWeight: '700' }}>
                  {new Date(domain.expiryDate * 1000).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={[styles.resolverBox, { backgroundColor: colors.background }]}>
              <Ionicons name="git-network-outline" size={18} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text variant="caption" color={colors.textSecondary}>Active Resolver</Text>
                <Text variant="bodySmall" numberOfLines={1} style={{ fontWeight: '600' }}>{domain.resolver}</Text>
              </View>
            </View>
          </Card>

          {/* Action Grid */}
          <Text variant="h5" style={{ marginBottom: spacing.md, paddingHorizontal: 4 }}>Control Center</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem}>
              <Card style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="at-circle-outline" size={24} color="#3B82F6" />
                </View>
                <Text variant="bodySmall" style={{ fontWeight: '700', marginTop: 12 }}>Text Records</Text>
                <Text variant="caption" color={colors.textSecondary}>Socials, avatar, email</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Card style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: '#14D46B15' }]}>
                  <Ionicons name="wallet-outline" size={24} color="#14D46B" />
                </View>
                <Text variant="bodySmall" style={{ fontWeight: '700', marginTop: 12 }}>Addresses</Text>
                <Text variant="caption" color={colors.textSecondary}>Link multi-chain wallets</Text>
              </Card>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionGrid, { marginTop: 15 }]}>
            <TouchableOpacity style={styles.actionItem}>
              <Card style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="refresh-outline" size={24} color="#F59E0B" />
                </View>
                <Text variant="bodySmall" style={{ fontWeight: '700', marginTop: 12 }}>Extend</Text>
                <Text variant="caption" color={colors.textSecondary}>Renew ownership</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Card style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                  <Ionicons name="swap-horizontal-outline" size={24} color="#EF4444" />
                </View>
                <Text variant="bodySmall" style={{ fontWeight: '700', marginTop: 12 }}>Transfer</Text>
                <Text variant="caption" color={colors.textSecondary}>Send to another wallet</Text>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Advanced Section */}
          <TouchableOpacity style={{ marginTop: 25 }}>
            <Card style={{ padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: mode === 'light' ? '#000' : colors.card }}>
              <Ionicons name="options-outline" size={20} color={mode === 'light' ? '#fff' : colors.primary} />
              <Text variant="bodySmall" style={{ color: mode === 'light' ? '#fff' : '#fff', fontWeight: '700', marginLeft: 12, flex: 1 }}>Advanced Resolver Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </Card>
          </TouchableOpacity>
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainTitleSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginTop: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    paddingHorizontal: 10,
  },
  resolverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionItem: {
    flex: 1,
  },
  actionCard: {
    padding: 20,
    height: 140,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
