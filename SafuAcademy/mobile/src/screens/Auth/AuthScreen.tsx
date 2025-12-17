import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Button, Text } from '@components/ui';

export const AuthScreen: React.FC = () => {
  const { colors, spacing } = useTheme();

  const handleConnect = () => {
    // TODO: Implement wallet connection
    console.log('Connect wallet');
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
        <Button title="Connect Wallet" onPress={handleConnect} fullWidth />
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
