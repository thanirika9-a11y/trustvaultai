import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function CustomInput({ label, error, style, ...props }) {
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, { color: COLORS.text }, error ? styles.inputError : null]}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    marginBottom: 6,
    color: COLORS.textSub,
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: COLORS.surfaceHigh,
    color: COLORS.text,
    paddingHorizontal: SIZES.md,
    paddingVertical: 13,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
