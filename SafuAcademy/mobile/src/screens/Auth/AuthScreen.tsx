import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Button, Text } from '@components/ui';
import { useWeb3 } from '@/contexts/Web3Context';

export const AuthScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { connect, isConnecting } = useWeb3();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect wallet. Please try again.');
      Alert.alert('Connection Error', 'Failed to connect wallet. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text variant="h1" align="center" style={{ marginBottom: spacing.md }}>
          SafuAcademy
        </Text>
        <Text
          variant="body"
          align="center"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.xxl }}
        >
          Learn Web3 & Blockchain{'\n'}Connect your wallet to get started
        </Text>
        {error && (
          <Text
            variant="bodySmall"
            color={colors.error}
            align="center"
            style={{ marginBottom: spacing.md }}
          >
            {error}
          </Text>
        )}
        <Button
          title={isConnecting ? 'Connecting...' : 'Connect Wallet'}
          onPress={handleConnect}
          fullWidth
          loading={isConnecting}
          disabled={isConnecting}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
