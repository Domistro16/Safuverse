import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card } from '@components/ui';
import { useRoute, RouteProp } from '@react-navigation/native';
import { DomainsStackParamList } from '@navigation/types';
import { useDomainDetails } from '@hooks/useDomains';
import { DOMAIN_CONFIG, TEXT_RECORD_KEYS } from '@config/domains';
import { Ionicons } from '@expo/vector-icons';

type DomainDetailsRouteProp = RouteProp<DomainsStackParamList, 'DomainDetails'>;

export const DomainDetailsScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const route = useRoute<DomainDetailsRouteProp>();
  const { label } = route.params;
  const { getDomain, isLoading, domain } = useDomainDetails();

  useEffect(() => {
    getDomain(label);
  }, [label]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!domain) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="h5">Domain not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {/* Domain Name */}
        <Card style={{ marginBottom: spacing.lg, alignItems: 'center', padding: spacing.xl }}>
          <Text variant="h3" color={colors.primary}>
            {label}.{DOMAIN_CONFIG.TLD}
          </Text>
          {domain.isWrapped && (
            <View
              style={{
                marginTop: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: 4,
                backgroundColor: `${colors.success}20`,
                borderRadius: 12,
              }}
            >
              <Text variant="caption" color={colors.success} style={{ fontWeight: '600' }}>
                Wrapped NFT
              </Text>
            </View>
          )}
        </Card>

        {/* Owner Info */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="h6" style={{ marginBottom: spacing.md }}>
            Owner Information
          </Text>

          <View style={{ marginBottom: spacing.sm }}>
            <Text variant="caption" color={colors.textSecondary}>
              Owner
            </Text>
            <Text variant="bodySmall" style={{ fontFamily: 'monospace' }}>
              {domain.owner.slice(0, 10)}...{domain.owner.slice(-8)}
            </Text>
          </View>

          <View style={{ marginBottom: spacing.sm }}>
            <Text variant="caption" color={colors.textSecondary}>
              Resolver
            </Text>
            <Text variant="bodySmall" style={{ fontFamily: 'monospace' }}>
              {domain.resolver.slice(0, 10)}...{domain.resolver.slice(-8)}
            </Text>
          </View>

          <View>
            <Text variant="caption" color={colors.textSecondary}>
              Expiry Date
            </Text>
            <Text variant="bodySmall">
              {new Date(domain.expiryDate * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </Card>

        {/* Features */}
        <Text variant="h6" style={{ marginBottom: spacing.md }}>
          Domain Features
        </Text>

        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="link" size={24} color={colors.primary} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text variant="body" style={{ marginBottom: spacing.xs }}>
                Text Records
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Set social accounts, email, and more
              </Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="wallet" size={24} color={colors.primary} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text variant="body" style={{ marginBottom: spacing.xs }}>
                Crypto Addresses
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Link your BTC, ETH, and other addresses
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text variant="body" style={{ marginBottom: spacing.xs }}>
                Renewal
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Extend your domain ownership
              </Text>
            </View>
          </View>
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
