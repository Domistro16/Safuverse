import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Text, Button, Card, Input } from '@components/ui';
import { CourseCard } from '@components/common/CourseCard';
import { useFeaturedCourses } from '@hooks/useCourses';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '@navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;

export const HomeScreen: React.FC = () => {
  const { mode, colors, spacing, borderRadius } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { data: featuredCourses, isLoading } = useFeaturedCourses();

  const handleCoursePress = (courseId: string) => {
    // Navigate to Courses tab and then details
    navigation.navigate('CoursesTab', {
      screen: 'CourseDetails',
      params: { courseId }
    } as any);
  };

  const navigateToDomains = () => {
    navigation.navigate('DomainsTab');
  };

  const navigateToCourses = () => {
    navigation.navigate('CoursesTab');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Mist Gradient Background */}
      <LinearGradient
        colors={mode === 'light' ? ['#FFFFFF', '#F8F8F7', '#F0F0F0'] : ['#040409', '#0A0A1F', '#040409']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>

          {/* Hero Section */}
          <View style={[styles.heroSection, { paddingHorizontal: spacing.xl }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="globe-outline" size={28} color={mode === 'light' ? '#fff' : '#000'} />
            </View>

            <View style={styles.heroPill}>
              <View style={styles.heroPillDot} />
              <Text variant="bodySmall" style={{ fontWeight: '600', color: '#666' }}>Live on Monad & BNB</Text>
            </View>

            <Text variant="h1" style={styles.heroTitle}>
              Welcome to Safu<Text variant="h1" style={styles.italicSerif}>verse</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              The ultimate home for Web3 education and decentralized identity.
            </Text>

            {/* Domain Search Quick Box */}
            <Card style={styles.searchBox}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                <Input
                  placeholder="Find your .safu name"
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  inputStyle={{ borderWidth: 0, backgroundColor: 'transparent' }}
                />
                <Button
                  title="Search"
                  size="small"
                  onPress={navigateToDomains}
                  style={{ height: 40, width: 80 }}
                />
              </View>
            </Card>
          </View>

          {/* Product Cards */}
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
            <Text variant="h3" style={{ marginBottom: spacing.sm, paddingHorizontal: spacing.sm }}>Explore Ecosystem</Text>

            <View style={styles.productsRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={navigateToCourses}
                style={[styles.productItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.productIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="school" size={24} color={colors.primary} />
                </View>
                <Text variant="h5" style={{ marginTop: spacing.md }}>SafuAcademy</Text>
                <Text variant="bodySmall" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.xs }}>
                  Learn Web3 & Earn Rewards
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={navigateToDomains}
                style={[styles.productItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.productIconContainer, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="finger-print" size={24} color="#3B82F6" />
                </View>
                <Text variant="h5" style={{ marginTop: spacing.md }}>SafuDomains</Text>
                <Text variant="bodySmall" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.xs }}>
                  Your Web3 Identity
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured Courses Preview */}
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Text variant="h4">Featured Courses</Text>
              <TouchableOpacity onPress={navigateToCourses}>
                <Text color={colors.primary} style={{ fontWeight: '600' }}>See All</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : (
              featuredCourses?.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} onPress={handleCoursePress} />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14D46B',
    marginRight: 8,
  },
  heroTitle: {
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -1,
  },
  italicSerif: {
    fontStyle: 'italic',
    fontWeight: '400',
    fontFamily: 'serif',
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    color: '#666',
    marginTop: 15,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  searchBox: {
    width: '100%',
    padding: 6,
    borderRadius: 99,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  productsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  productItem: {
    flex: 1,
    padding: 24,
    borderRadius: 26,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  productIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  }
});
