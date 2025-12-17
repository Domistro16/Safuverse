import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DomainsStackParamList } from '@navigation/types';
import { useDomainPrice, useDomainRegistration } from '@hooks/useDomains';
import { DOMAIN_CONFIG } from '@config/domains';
import { RegistrationStep } from '@types/domain';

type DomainRegistrationRouteProp = RouteProp<DomainsStackParamList, 'DomainRegistration'>;
type DomainRegistrationNavigationProp = NativeStackNavigationProp<
  DomainsStackParamList,
  'DomainRegistration'
>;

export const DomainRegistrationScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const route = useRoute<DomainRegistrationRouteProp>();
  const navigation = useNavigation<DomainRegistrationNavigationProp>();
  const { label } = route.params;

  const [years, setYears] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [secret, setSecret] = useState('');

  const { getPrice, price, isLoading: isPriceLoading } = useDomainPrice();
  const { commit, register, generateSecret, isRegistering, currentStep, setCurrentStep } =
    useDomainRegistration();

  useEffect(() => {
    getPrice(label, years);
    setSecret(generateSecret());
  }, [label, years]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && currentStep === RegistrationStep.WAIT) {
      setCurrentStep(RegistrationStep.REGISTER);
    }
  }, [countdown, currentStep]);

  const handleCommit = async () => {
    try {
      const duration = years * 365 * 24 * 60 * 60;
      await commit(label, duration, secret);
      setCurrentStep(RegistrationStep.WAIT);
      setCountdown(DOMAIN_CONFIG.COMMIT_WAIT_TIME);
      Alert.alert('Step 1 Complete', 'Please wait 60 seconds before completing registration.');
    } catch (error) {
      console.error('Commit error:', error);
      Alert.alert('Error', 'Failed to commit registration. Please try again.');
    }
  };

  const handleRegister = async () => {
    try {
      if (!price) {
        throw new Error('Price not loaded');
      }

      const duration = years * 365 * 24 * 60 * 60;
      await register(label, duration, secret, price.bnb);

      Alert.alert('Success!', 'Domain registered successfully!', [
        {
          text: 'View My Domains',
          onPress: () => navigation.navigate('MyDomains'),
        },
      ]);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register domain. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {/* Domain Name */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="h4" color={colors.primary} align="center">
            {label}.{DOMAIN_CONFIG.TLD}
          </Text>
        </Card>

        {/* Steps */}
        <View style={{ marginBottom: spacing.lg }}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor:
                    currentStep >= step ? colors.primary : colors.backgroundSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <Text
                  variant="body"
                  style={{
                    color: currentStep >= step ? '#000' : colors.textSecondary,
                    fontWeight: '600',
                  }}
                >
                  {step}
                </Text>
              </View>
              <Text
                variant="body"
                color={currentStep >= step ? colors.text : colors.textSecondary}
              >
                {step === 1 && 'Commit Transaction'}
                {step === 2 && 'Wait 60 Seconds'}
                {step === 3 && 'Complete Registration'}
              </Text>
            </View>
          ))}
        </View>

        {/* Price */}
        {price && (
          <Card style={{ marginBottom: spacing.lg }}>
            <Text variant="h6" style={{ marginBottom: spacing.md }}>
              Registration Fee
            </Text>
            <Text variant="h3" color={colors.primary}>
              {parseFloat(price.bnb).toFixed(4)} BNB
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              ≈ ${price.usd} USD
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              For {years} year{years > 1 ? 's' : ''}
            </Text>
          </Card>
        )}

        {/* Countdown Timer */}
        {currentStep === RegistrationStep.WAIT && countdown > 0 && (
          <Card style={{ marginBottom: spacing.lg, alignItems: 'center' }}>
            <Text variant="h1" color={colors.primary}>
              {countdown}s
            </Text>
            <Text variant="body" color={colors.textSecondary}>
              Please wait...
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        {currentStep === RegistrationStep.COMMIT && (
          <Button
            title="Start Registration (Step 1)"
            onPress={handleCommit}
            fullWidth
            loading={isRegistering}
            disabled={isRegistering || isPriceLoading}
          />
        )}

        {currentStep === RegistrationStep.WAIT && (
          <Button
            title={`Waiting... (${countdown}s)`}
            onPress={() => {}}
            fullWidth
            disabled
          />
        )}

        {currentStep === RegistrationStep.REGISTER && (
          <Button
            title="Complete Registration (Step 3)"
            onPress={handleRegister}
            fullWidth
            loading={isRegistering}
            disabled={isRegistering}
          />
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
