import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const bg =
    disabled      ? COLORS.surfaceHigh :
    variant === 'danger'    ? COLORS.error    :
    variant === 'secondary' ? 'transparent'   :
    COLORS.primary;

  const textColor =
    disabled      ? COLORS.textMuted  :
    variant === 'secondary' ? COLORS.primary  :
    '#FFFFFF';

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1.5 : 0,
        borderColor:  COLORS.primary,
      }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
