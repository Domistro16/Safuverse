import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { userService } from '@services/userService';
import { Certificate } from '@types/index';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export const CertificatesScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getCertificates();
      setCertificates(data);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (certificate: Certificate) => {
    // TODO: Implement certificate download
    console.log('Download certificate:', certificate);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text variant="h2" style={{ marginBottom: spacing.lg }}>
          Certificates
        </Text>

        {certificates.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: spacing.xl }}>
            <Ionicons name="ribbon-outline" size={64} color={colors.textSecondary} />
            <Text
              variant="h6"
              color={colors.textSecondary}
              align="center"
              style={{ marginTop: spacing.md }}
            >
              No certificates yet
            </Text>
            <Text
              variant="bodySmall"
              color={colors.textSecondary}
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              Complete courses to earn certificates
            </Text>
          </Card>
        ) : (
          certificates.map((certificate, index) => (
            <Card key={index} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Ionicons name="ribbon" size={24} color={colors.primary} />
                    <Text variant="h6" style={{ marginLeft: spacing.sm, flex: 1 }}>
                      {certificate.courseName}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text
                      variant="caption"
                      color={colors.textSecondary}
                      style={{ marginLeft: spacing.xs }}
                    >
                      Completed: {format(new Date(certificate.completedAt), 'MMM dd, yyyy')}
                    </Text>
                  </View>

                  {certificate.onChainVerified && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                      <Text
                        variant="caption"
                        color={colors.success}
                        style={{ marginLeft: spacing.xs, fontWeight: '600' }}
                      >
                        Verified on-chain
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: borderRadius.sm,
                      padding: spacing.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text variant="caption" color={colors.textSecondary}>
                      Progress
                    </Text>
                    <View
                      style={{
                        height: 8,
                        backgroundColor: colors.border,
                        borderRadius: borderRadius.sm,
                        marginTop: spacing.xs,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${certificate.progress}%`,
                          backgroundColor: colors.success,
                        }}
                      />
                    </View>
                    <Text
                      variant="caption"
                      color={colors.textSecondary}
                      style={{ marginTop: spacing.xs }}
                    >
                      {certificate.progress}% Complete
                    </Text>
                  </View>
                </View>
              </View>

              {certificate.certificateUrl && (
                <Button
                  title="Download Certificate"
                  onPress={() => handleDownload(certificate)}
                  variant="outline"
                  size="small"
                  fullWidth
                />
              )}
            </Card>
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
