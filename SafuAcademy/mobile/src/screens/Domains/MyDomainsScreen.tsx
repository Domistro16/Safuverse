import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card } from '@components/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DomainsStackParamList } from '@navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { DOMAIN_CONFIG } from '@config/domains';
import { LinearGradient } from 'expo-linear-gradient';

type MyDomainsNavigationProp = NativeStackNavigationProp<DomainsStackParamList, 'MyDomains'>;

export const MyDomainsScreen: React.FC = () => {
  const { mode, colors, spacing, borderRadius } = useTheme();
  const navigation = useNavigation<MyDomainsNavigationProp>();

  // Placeholder - in production, fetch user's domains from blockchain
  const domains = [
    { label: 'safu', expiryDate: Date.now() + 31536000000, isWrapped: true },
    { label: 'crypto', expiryDate: Date.now() + 1515200000, isWrapped: false },
  ];

  const handleDomainPress = (label: string) => {
    navigation.navigate('DomainDetails', { label });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>

        {/* Header Hero */}
        <View style={styles.headerHero}>
          <LinearGradient
            colors={mode === 'light' ? ['#111', '#333'] : [colors.primary, '#E6B800']}
            style={styles.headerGradient}
          />
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={mode === 'light' ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text variant="h3" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '800' }}>
                My Domains
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text variant="h4" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '800' }}>{domains.length}</Text>
                <Text variant="caption" style={{ color: mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontWeight: '600' }}>Total Names</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
              <View style={styles.statItem}>
                <Text variant="h4" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '800' }}>1</Text>
                <Text variant="caption" style={{ color: mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontWeight: '600' }}>Primary Set</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -30 }}>
          {domains.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.border + '30' }]}>
                <Ionicons name="globe-outline" size={40} color={colors.textSecondary} />
              </View>
              <Text variant="h6" style={{ marginTop: 20 }}>No domains found</Text>
              <Text variant="bodySmall" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8, marginBottom: 20 }}>
                You haven't registered any .{DOMAIN_CONFIG.TLD} domains yet.
              </Text>
              <TouchableOpacity
                style={[styles.searchPill, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('DomainSearch')}
              >
                <Text variant="bodySmall" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '700' }}>Search Now</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {domains.map((domain, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleDomainPress(domain.label)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.domainCard}>
                    <View style={styles.domainInfo}>
                      <View style={[styles.domainAvatar, { backgroundColor: mode === 'light' ? '#F4F4F4' : '#1A1A1E' }]}>
                        <Ionicons name="at-outline" size={24} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text variant="h6" style={{ fontWeight: '700' }}>
                          {domain.label}<Text variant="h6" color={colors.textSecondary}>.{DOMAIN_CONFIG.TLD}</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                          <Text variant="caption" color={colors.textSecondary}>
                            Exp: {new Date(domain.expiryDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {domain.isWrapped && (
                        <View style={[styles.wrappedBadge, { backgroundColor: colors.success + '15' }]}>
                          <Text variant="caption" style={{ color: colors.success, fontSize: 10, fontWeight: '800' }}>WRAPPED</Text>
                        </View>
                      )}

                      <Ionicons name="chevron-forward" size={18} color={colors.border} style={{ marginLeft: 10 }} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tips Section */}
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="h5" style={{ marginBottom: spacing.md, paddingHorizontal: 4 }}>Did you know?</Text>
            <Card style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row' }}>
                <Ionicons name="bulb-outline" size={24} color={colors.primary} />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: '700', marginBottom: 4 }}>Wrap your domain</Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Wrapped domains can be traded on NFT marketplaces and support advanced sub-domain management.
                  </Text>
                </View>
              </View>
            </Card>
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
    height: 260,
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPill: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  domainCard: {
    padding: 18,
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrappedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  }
});
