import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, padding }) => {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.xl, // Premium 26px radius
          padding: padding !== undefined ? padding : spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
