import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Card, Button } from '@components/ui';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DomainsStackParamList } from '@navigation/types';
import { useDomainPrice, useDomainRegistration } from '@hooks/useDomains';
import { DOMAIN_CONFIG } from '@config/domains';
import { RegistrationStep } from '@types/domain';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type DomainRegistrationRouteProp = RouteProp<DomainsStackParamList, 'DomainRegistration'>;
type DomainRegistrationNavigationProp = NativeStackNavigationProp<
  DomainsStackParamList,
  'DomainRegistration'
>;

export const DomainRegistrationScreen: React.FC = () => {
  const { mode, colors, spacing, borderRadius } = useTheme();
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

  const steps = [
    { id: 1, label: 'Commit', icon: 'shield-outline' },
    { id: 2, label: 'Wait', icon: 'time-outline' },
    { id: 3, label: 'Register', icon: 'checkmark-circle-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>

        {/* Visual Progress Header */}
        <View style={styles.progressHeader}>
          <LinearGradient
            colors={mode === 'light' ? ['#111', '#333'] : [colors.primary, '#E6B800']}
            style={styles.headerGradient}
          />
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={mode === 'light' ? '#fff' : '#000'} />
            </TouchableOpacity>

            <Text variant="h3" style={{ color: mode === 'light' ? '#fff' : '#000', fontWeight: '800' }}>
              Registration
            </Text>

            <View style={styles.progressContainer}>
              {steps.map((step, index) => (
                <View key={step.id} style={styles.stepWrapper}>
                  <View style={[
                    styles.stepPill,
                    {
                      backgroundColor: currentStep >= step.id
                        ? (mode === 'light' ? colors.primary : '#000')
                        : (mode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      borderColor: mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1
                    }
                  ]}>
                    <Ionicons
                      name={step.icon as any}
                      size={18}
                      color={currentStep >= step.id ? (mode === 'light' ? '#fff' : colors.primary) : (mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)')}
                    />
                    <Text variant="caption" style={{
                      marginLeft: 6,
                      fontWeight: '700',
                      color: currentStep >= step.id ? (mode === 'light' ? '#fff' : colors.primary) : (mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)')
                    }}>
                      {step.label}
                    </Text>
                  </View>
                  {index < steps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  )}
                </View>
              ))}
            </View>
          </SafeAreaView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -30 }}>
          {/* Domain Name Card */}
          <Card style={styles.domainCard}>
            <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>You are registering</Text>
            <Text variant="h2" style={{ fontWeight: '800' }}>
              {label}<Text variant="h2" style={{ color: colors.textSecondary }}>.{DOMAIN_CONFIG.TLD}</Text>
            </Text>
          </Card>

          {/* Registration Options / Price */}
          <Card style={{ padding: 24, marginBottom: 20 }}>
            <View style={styles.infoRow}>
              <View>
                <Text variant="caption" color={colors.textSecondary}>Registration Period</Text>
                <Text variant="h6" style={{ fontWeight: '700' }}>{years} Year{years > 1 ? 's' : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="caption" color={colors.textSecondary}>Total Fee</Text>
                <Text variant="h4" style={{ fontWeight: '800', color: colors.primary }}>
                  {price ? parseFloat(price.bnb).toFixed(4) : '...'} BNB
                </Text>
              </View>
            </View>

            <View style={[styles.usdBadge, { backgroundColor: colors.background }]}>
              <Text variant="caption" style={{ fontWeight: '600' }}>
                ≈ ${price?.usd || '0.00'} USD including service fee
              </Text>
            </View>
          </Card>

          {/* Dynamic Content based on currentStep */}
          {currentStep === RegistrationStep.COMMIT && (
            <View>
              <Text variant="bodySmall" color={colors.textSecondary} style={{ marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 }}>
                Step 1: Commit your registration request to the blockchain. This secures your name for 60 seconds.
              </Text>
              <Button
                title="Commit To Blockchain"
                onPress={handleCommit}
                fullWidth
                loading={isRegistering}
                disabled={isRegistering || isPriceLoading}
              />
            </View>
          )}

          {currentStep === RegistrationStep.WAIT && (
            <Card style={styles.timerCard}>
              <View style={styles.timerCircle}>
                <Text variant="h1" style={{ fontSize: 48, fontWeight: '800', color: colors.primary }}>
                  {countdown}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>Seconds left</Text>
              </View>
              <Text variant="body" style={{ fontWeight: '700', marginTop: 20 }}>Waiting for confirmation...</Text>
              <Text variant="bodySmall" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                The blockchain requires a 60-second wait to prevent front-running.
              </Text>
            </Card>
          )}

          {currentStep === RegistrationStep.REGISTER && (
            <View>
              <View style={[styles.successBanner, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text variant="body" style={{ color: colors.success, fontWeight: '700', marginLeft: 10 }}>Ready to register!</Text>
              </View>
              <Button
                title="Complete Registration"
                onPress={handleRegister}
                fullWidth
                loading={isRegistering}
                disabled={isRegistering}
                style={{ marginTop: 20 }}
              />
            </View>
          )}

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={{ marginLeft: 6 }}>
              Transactions are secure and decentralized
            </Text>
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
  progressHeader: {
    height: 240,
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
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 99,
  },
  stepLine: {
    width: 20,
    height: 2,
    marginHorizontal: 5,
  },
  domainCard: {
    padding: 24,
    marginBottom: 15,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  usdBadge: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  timerCard: {
    padding: 40,
    alignItems: 'center',
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 16,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  }
});
