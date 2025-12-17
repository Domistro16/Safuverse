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
  const { colors, typography, spacing, borderRadius } = useTheme();

  const sizeStyles = {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  };

  const textSizes = {
    small: { fontSize: 14 },
    medium: { fontSize: 16 },
    large: { fontSize: 18 },
  };

  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle = {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...sizeStyles[size],
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  const baseTextStyle: TextStyle = {
    ...typography.button,
    ...textSizes[size],
    fontWeight: '600',
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[buttonStyle, style]}
      >
        <LinearGradient
          colors={[colors.primary, '#ffaa00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.md }]}
        />
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={[baseTextStyle, { color: '#000' }, textStyle]}>{title}</Text>
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
        style={[buttonStyle, { backgroundColor: colors.backgroundSecondary }, style]}
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
          { borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[baseTextStyle, { color: colors.primary }, textStyle]}>{title}</Text>
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
