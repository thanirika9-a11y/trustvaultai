import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  TextInput
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword, resetPassword } from '../services/authApi';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import CustomButton from '../components/CustomButton';

export default function ForgotPassword({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  
  const { control, handleSubmit, formState: { errors }, getValues } = useForm({
    defaultValues: { email: '', otp: '', newPassword: '' },
  });

  const onSendCode = async ({ email }) => {
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      // Auto-fill in dev mode if available
      if (res.devOtp && Platform.OS === 'web') {
        window.alert(`[DEV] Your Reset Code is: ${res.devOtp}`);
      } else if (res.devOtp) {
        Alert.alert('DEV CODE', `Your Reset Code is: ${res.devOtp}`);
      }
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send reset email.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async ({ email, otp, newPassword }) => {
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      if (Platform.OS === 'web') window.alert('Password has been reset successfully. You can now login.');
      else Alert.alert('Success', 'Password has been reset successfully. You can now login.');
      navigation.navigate('Login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.blobTL} />

      <KeyboardAvoidingView style={{ flex: 1, width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="key" size={42} color={COLORS.primary} />
          </View>

          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.sub}>
            {step === 1
              ? 'Enter your registered email and we\'ll send you a 6-digit reset code.'
              : 'Enter the 6-digit code we sent to your email and your new password.'}
          </Text>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.label}>Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: 'Email is required', pattern: { value: /^\\S+@\\S+$/i, message: 'Invalid email' } }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputRow, errors.email && styles.inputErr]}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={COLORS.textMuted}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

                <CustomButton
                  title="Send Reset Code"
                  onPress={handleSubmit(onSendCode)}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Reset Code (OTP)</Text>
                <Controller
                  control={control}
                  name="otp"
                  rules={{ required: 'Code is required', minLength: { value: 6, message: 'Must be 6 digits' } }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputRow, errors.otp && styles.inputErr]}>
                      <Ionicons name="keypad-outline" size={18} color={COLORS.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="123456"
                        placeholderTextColor={COLORS.textMuted}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  )}
                />
                {errors.otp && <Text style={styles.errorText}>{errors.otp.message}</Text>}

                <Text style={[styles.label, { marginTop: SIZES.medium }]}>New Password</Text>
                <Controller
                  control={control}
                  name="newPassword"
                  rules={{ required: 'New Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputRow, errors.newPassword && styles.inputErr]}>
                      <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor={COLORS.textMuted}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        secureTextEntry
                      />
                    </View>
                  )}
                />
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message}</Text>}

                <CustomButton
                  title="Reset Password"
                  onPress={handleSubmit(onResetPassword)}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  blobTL: { position: 'absolute', top: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary + '22' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 60, paddingBottom: 48 },
  backBtn:{ alignSelf: 'flex-start', marginBottom: SIZES.xl, padding: 8, backgroundColor: COLORS.surface, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border },
  iconWrap:{ width: 90, height: 90, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.lg, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  heading: { fontSize: 26, color: COLORS.text, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  sub:     { fontSize: 14, color: COLORS.textSub, textAlign: 'center', lineHeight: 22, marginBottom: SIZES.xl, paddingHorizontal: SIZES.md },
  card:    { width: '100%', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.xl },
  label:   { color: COLORS.textSub, fontSize: 13, fontWeight: '600', marginBottom: 7 },
  inputRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surfaceHigh, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SIZES.md },
  inputErr:{ borderColor: COLORS.error },
  input:   { flex: 1, paddingVertical: Platform.OS === 'web' ? SIZES.medium : 12, color: COLORS.text, fontSize: 14, outlineStyle: 'none' },
  errorText:{ color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
  submitBtn:{ marginTop: SIZES.xl }
});
