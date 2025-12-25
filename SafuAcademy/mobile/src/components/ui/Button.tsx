import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { mode, colors, typography, spacing, borderRadius } = useTheme();

  const sizeStyles = {
    small: { height: 36, paddingHorizontal: spacing.md },
    medium: { height: 48, paddingHorizontal: spacing.lg },
    large: { height: 56, paddingHorizontal: spacing.xl },
  };

  const textSizes = {
    small: { fontSize: 13 },
    medium: { fontSize: 15 },
    large: { fontSize: 17 },
  };

  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle = {
    borderRadius: borderRadius.full, // Premium pill style
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...sizeStyles[size],
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  const baseTextStyle: TextStyle = {
    ...typography.button,
    ...textSizes[size],
    fontWeight: '600',
    letterSpacing: -0.2,
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          buttonStyle,
          {
            backgroundColor: mode === 'light' ? '#111111' : colors.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          },
          style
        ]}
      >
        {loading ? (
          <ActivityIndicator color={mode === 'light' ? '#fff' : '#000'} />
        ) : (
          <Text style={[baseTextStyle, { color: mode === 'light' ? '#fff' : '#000' }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          buttonStyle,
          {
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 1.5,
            borderColor: colors.text,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          },
          style
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[baseTextStyle, { color: colors.text }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          buttonStyle,
          {
            borderWidth: 1.2,
            borderColor: colors.border,
            backgroundColor: 'transparent'
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[baseTextStyle, { color: colors.text }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // ghost variant
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[buttonStyle, { backgroundColor: 'transparent' }, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[baseTextStyle, { color: colors.text }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
