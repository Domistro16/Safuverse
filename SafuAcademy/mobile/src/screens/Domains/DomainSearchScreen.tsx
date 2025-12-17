import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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

type DomainSearchNavigationProp = NativeStackNavigationProp<DomainsStackParamList, 'DomainSearch'>;

export const DomainSearchScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
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
        return '✓ Available';
      case DomainStatus.REGISTERED:
        return '✗ Already registered';
      case DomainStatus.TOO_SHORT:
        return `⚠ Too short (min ${DOMAIN_CONFIG.MIN_NAME_LENGTH} characters)`;
      case DomainStatus.INVALID:
        return '⚠ Invalid characters (use a-z, 0-9, -)';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text variant="h2" style={{ marginBottom: spacing.xs }}>
            SafuDomains
          </Text>
          <Text variant="body" color={colors.textSecondary}>
            Your Web3 identity on BSC
          </Text>
        </View>

        {/* Search Box */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="h6" style={{ marginBottom: spacing.md }}>
            Search for your domain
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Input
                placeholder="Enter domain name"
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text variant="h6" color={colors.textSecondary}>
              .{DOMAIN_CONFIG.TLD}
            </Text>
          </View>

          <Button
            title="Search"
            onPress={handleSearch}
            fullWidth
            style={{ marginTop: spacing.md }}
            loading={isChecking}
            disabled={isChecking || !searchInput.trim()}
          />
        </Card>

        {/* Search Result */}
        {searchedDomain && !isChecking && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <Text variant="h5" style={{ flex: 1 }}>
                {searchedDomain}.{DOMAIN_CONFIG.TLD}
              </Text>
              <Ionicons
                name={
                  status === DomainStatus.AVAILABLE
                    ? 'checkmark-circle'
                    : status === DomainStatus.REGISTERED
                    ? 'close-circle'
                    : 'alert-circle'
                }
                size={28}
                color={getStatusColor()}
              />
            </View>

            <Text variant="body" color={getStatusColor()} style={{ marginBottom: spacing.md }}>
              {getStatusMessage()}
            </Text>

            {status === DomainStatus.AVAILABLE && price && (
              <>
                <View
                  style={{
                    padding: spacing.md,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: borderRadius.md,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text variant="caption" color={colors.textSecondary}>
                    Starting price (1 year)
                  </Text>
                  <Text variant="h4" color={colors.primary} style={{ marginTop: spacing.xs }}>
                    {parseFloat(price.bnb).toFixed(4)} BNB
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    ≈ ${price.usd} USD
                  </Text>
                </View>

                <Button title="Register Domain" onPress={handleRegister} fullWidth />
              </>
            )}

            {status === DomainStatus.REGISTERED && (
              <Button
                title="View Domain Details"
                onPress={handleViewDomain}
                variant="outline"
                fullWidth
              />
            )}
          </Card>
        )}

        {/* Recent Searches */}
        {searches.length > 0 && (
          <Card>
            <Text variant="h6" style={{ marginBottom: spacing.md }}>
              Recent Searches
            </Text>
            {searches.map((search, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSearchInput(search);
                  handleSearch();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.md,
                }}
              >
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>
                  {search}.{DOMAIN_CONFIG.TLD}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Features */}
        <View style={{ marginTop: spacing.xl }}>
          <Text variant="h5" style={{ marginBottom: spacing.md }}>
            Why SafuDomains?
          </Text>

          <Card style={{ marginBottom: spacing.md }}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            <Text variant="h6" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
              Web3 Identity
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              One domain for all your crypto addresses and Web3 profiles
            </Text>
          </Card>

          <Card style={{ marginBottom: spacing.md }}>
            <Ionicons name="school" size={32} color={colors.primary} />
            <Text variant="h6" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
              Academy Access
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Use your domain to access SafuAcademy courses and earn certificates
            </Text>
          </Card>

          <Card>
            <Ionicons name="gift" size={32} color={colors.primary} />
            <Text variant="h6" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
              Referral Rewards
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Earn up to 30% commission by referring friends
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
