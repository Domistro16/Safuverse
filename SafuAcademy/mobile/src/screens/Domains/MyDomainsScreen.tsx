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

type MyDomainsNavigationProp = NativeStackNavigationProp<DomainsStackParamList, 'MyDomains'>;

export const MyDomainsScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const navigation = useNavigation<MyDomainsNavigationProp>();

  // Placeholder - in production, fetch user's domains from blockchain
  const domains = [
    // Example structure - will be populated from blockchain
    // { label: 'example', expiryDate: Date.now() + 31536000000, isWrapped: true }
  ];

  const handleDomainPress = (label: string) => {
    navigation.navigate('DomainDetails', { label });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text variant="h2" style={{ marginBottom: spacing.lg }}>
          My Domains
        </Text>

        {domains.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: spacing.xl }}>
            <Ionicons name="globe-outline" size={64} color={colors.textSecondary} />
            <Text
              variant="h6"
              color={colors.textSecondary}
              align="center"
              style={{ marginTop: spacing.md }}
            >
              No domains yet
            </Text>
            <Text
              variant="bodySmall"
              color={colors.textSecondary}
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              Search and register your first .{DOMAIN_CONFIG.TLD} domain
            </Text>
          </Card>
        ) : (
          domains.map((domain, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDomainPress(domain.label)}
            >
              <Card style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="h6">
                      {domain.label}.{DOMAIN_CONFIG.TLD}
                    </Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      Expires: {new Date(domain.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
