import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button, Input } from '@components/ui';
import { useDomainAvailability, useDomainPrice, useRecentSearches } from '@hooks/useDomains';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DomainsStackParamList } from '@navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { DomainStatus } from '@types/domain';
import { DOMAIN_CONFIG } from '@config/domains';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type DomainSearchNavigationProp = NativeStackNavigationProp<DomainsStackParamList, 'DomainSearch'>;

export const DomainSearchScreen: React.FC = () => {
  const { mode, colors, spacing, borderRadius } = useTheme();
  const navigation = useNavigation<DomainSearchNavigationProp>();
  const [searchInput, setSearchInput] = useState('');
  const [searchedDomain, setSearchedDomain] = useState('');
  const { checkAvailability, isChecking, status } = useDomainAvailability();
  const { getPrice, price } = useDomainPrice();
  const { searches, loadSearches, saveSearch } = useRecentSearches();

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    const label = searchInput.toLowerCase().trim();
    setSearchedDomain(label);

    const domainStatus = await checkAvailability(label);
    await saveSearch(label);

    if (domainStatus === DomainStatus.AVAILABLE) {
      await getPrice(label, 1);
    }
  };

  const handleRegister = () => {
    if (searchedDomain && status === DomainStatus.AVAILABLE) {
      navigation.navigate('DomainRegistration', { label: searchedDomain });
    }
  };

  const handleViewDomain = () => {
    if (searchedDomain && status === DomainStatus.REGISTERED) {
      navigation.navigate('DomainDetails', { label: searchedDomain });
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case DomainStatus.AVAILABLE:
        return colors.success;
      case DomainStatus.REGISTERED:
        return colors.error;
      case DomainStatus.TOO_SHORT:
      case DomainStatus.INVALID:
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case DomainStatus.AVAILABLE:
        return '✓ This name is available';
      case DomainStatus.REGISTERED:
        return '✗ Already registered';
      case DomainStatus.TOO_SHORT:
        return `⚠ Minimum ${DOMAIN_CONFIG.MIN_NAME_LENGTH} characters required`;
      case DomainStatus.INVALID:
        return '⚠ Use only letters, numbers and hyphens';
      default:
        return '';
    }
  };

  const renderCurrentSearchResult = () => {
    if (!searchedDomain || isChecking) return null;

    const isAvailable = status === DomainStatus.AVAILABLE;

    return (
      <Card style={[styles.resultCard, { borderColor: isAvailable ? colors.success + '40' : colors.border }]}>
        <View style={styles.resultHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="h3" style={{ fontWeight: '800', letterSpacing: -0.5 }}>
              {searchedDomain}<Text variant="h3" style={{ color: colors.textSecondary }}>.{DOMAIN_CONFIG.TLD}</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text variant="bodySmall" style={{ color: getStatusColor(), fontWeight: '600' }}>{getStatusMessage()}</Text>
            </View>
          </View>

          <Ionicons
            name={isAvailable ? "checkmark-circle" : "close-circle"}
            size={40}
            color={getStatusColor() + '20'}
            style={{ position: 'absolute', right: 0, top: -10 }}
          />
        </View>

        {isAvailable && price && (
          <View style={[styles.priceContainer, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={colors.textSecondary}>Starting Price</Text>
              <Text variant="h4" style={{ fontWeight: '800', color: colors.primary }}>{parseFloat(price.bnb).toFixed(4)} BNB</Text>
              <Text variant="caption" color={colors.textSecondary}>≈ ${price.usd} USD / year</Text>
            </View>
            <Button
              title="Register"
              onPress={handleRegister}
              style={{ width: 100 }}
              size="medium"
            />
          </View>
        )}

        {status === DomainStatus.REGISTERED && (
          <Button
            title="View Details"
            onPress={handleViewDomain}
            variant="outline"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Gradient Backdrop */}
      <LinearGradient
        colors={mode === 'light' ? ['#FFFFFF', '#F8F8F7'] : ['#040409', '#0A0A1F']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={mode === 'light' ? ['#111', '#444'] : ['#FFFB00', '#E6E200']}
            style={[styles.heroBackground, { height: 320 }]}
          />
          <SafeAreaView style={styles.heroContent}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="finger-print" size={16} color={mode === 'light' ? '#fff' : '#000'} />
              <Text variant="caption" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '700', marginLeft: 6 }}>SAFU PROTOCOL</Text>
            </View>

            <Text variant="h1" style={[styles.heroTitle, { color: mode === 'light' ? '#fff' : '#000' }]}>
              Find Your <Text variant="h1" style={{ fontStyle: 'italic', fontWeight: '400', fontFamily: 'serif' }}>Web3 Identity</Text>
            </Text>

            <View style={styles.searchContainer}>
              <Card style={styles.searchCard}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <Input
                    placeholder="Search name"
                    value={searchInput}
                    onChangeText={setSearchInput}
                    onSubmitEditing={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                    inputStyle={{ borderWidth: 0, backgroundColor: 'transparent', height: 48 }}
                  />
                  <Text variant="h6" color={colors.textSecondary} style={{ marginRight: 10 }}>.{DOMAIN_CONFIG.TLD}</Text>
                  {isChecking ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <TouchableOpacity onPress={handleSearch} disabled={!searchInput.trim()}>
                      <View style={[styles.searchButton, { backgroundColor: mode === 'light' ? colors.primary : '#000' }]}>
                        <Ionicons name="arrow-forward" size={20} color={mode === 'light' ? '#fff' : colors.primary} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            </View>
          </SafeAreaView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Result Area */}
          {renderCurrentSearchResult()}

          {/* Recent Searches */}
          {searches.length > 0 && !searchedDomain && (
            <View style={{ marginTop: spacing.md }}>
              <Text variant="h6" style={{ marginBottom: spacing.md, paddingHorizontal: 4 }}>Recently Seen</Text>
              <View style={styles.recentGrid}>
                {searches.slice(0, 4).map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSearchInput(search);
                      handleSearch();
                    }}
                    style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text variant="bodySmall" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {search}.{DOMAIN_CONFIG.TLD}
                    </Text>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Why SafuDomains? Features */}
          <Text variant="h5" style={{ marginBottom: spacing.lg, marginTop: spacing.xl, paddingHorizontal: 4 }}>Platform Benefits</Text>
          <View style={styles.featuresRow}>
            <Card style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#3B82F6" />
              </View>
              <Text variant="h6" style={{ marginTop: 12, marginBottom: 4 }}>Universal Identity</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>One name for all crypto addresses.</Text>
            </Card>

            <Card style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: '#14D46B15' }]}>
                <Ionicons name="school" size={22} color="#14D46B" />
              </View>
              <Text variant="h6" style={{ marginTop: 12, marginBottom: 4 }}>Academy Plus</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>Unlock premium courses & rewards.</Text>
            </Card>
          </View>

          <Card style={[styles.featureCard, { width: '100%', marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="gift" size={22} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text variant="h6">Referral Commission</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>Earn up to 30% of registration fees from friends.</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    height: 380,
    marginBottom: 20,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroContent: {
    paddingHorizontal: 25,
    paddingTop: 40,
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 40,
  },
  searchContainer: {
    width: '100%',
    position: 'absolute',
    bottom: -15,
  },
  searchCard: {
    borderRadius: 99,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    marginBottom: 25,
    borderWidth: 1.5,
    padding: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 10,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    minWidth: (width - 60) / 2,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 15,
  },
  featureCard: {
    flex: 1,
    padding: 20,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
