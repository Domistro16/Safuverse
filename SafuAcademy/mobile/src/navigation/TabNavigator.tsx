import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeStackNavigator, CoursesStackNavigator, DomainsStackNavigator } from './StackNavigators';
import { ProfileScreen } from '@screens/Profile/ProfileScreen';
import { PointsScreen } from '@screens/Points/PointsScreen';
import { useTheme } from '@theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const { mode, colors } = useTheme();

  const activeColor = mode === 'light' ? '#111111' : colors.primary;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 65,
          paddingTop: 8,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesStackNavigator}
        options={{
          tabBarLabel: 'Academy',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "school" : "school-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DomainsTab"
        component={DomainsStackNavigator}
        options={{
          tabBarLabel: 'Domains',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "finger-print" : "finger-print-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PointsTab"
        component={PointsScreen}
        options={{
          tabBarLabel: 'Alpha',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flash" : "flash-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
