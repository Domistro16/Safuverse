import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="label" style={{ marginBottom: spacing.xs, color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            backgroundColor: '#FFFFFF', // Clean white background for inputs
            borderWidth: 1.2,
            borderColor: error ? colors.error : colors.border,
            borderRadius: 14, // Specific radius from SafuDomains
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            color: colors.text,
            ...typography.body,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {error && (
        <Text variant="caption" style={{ marginTop: spacing.xs, color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
};
