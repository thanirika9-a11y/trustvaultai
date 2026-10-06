import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function Login({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signIn(email, password);
      // On success AuthContext sets user → RootNavigator switches to MainNavigator
    } catch (err) {
      const code = err?.response?.data?.code || err?.code;
      const msg  = err?.response?.data?.message || err?.message || 'Please check your credentials and try again.';
      if (code === 'NOT_VERIFIED') {
        navigation.navigate('OTPVerification', { email });
      } else {
        setErrorMessage(msg);
        if (Platform.OS !== 'web') {
          Alert.alert('Sign In Failed', msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Decorative blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ── */}
          <View style={styles.brand}>
            <View style={styles.logoRing}>
              <Ionicons name="shield-checkmark" size={38} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>TrustVault</Text>
            <Text style={styles.tagline}>Your Family's Secure Digital Vault</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to access your vault</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputRow, errors.email && styles.inputErr]}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              )}
            />
            {errors.email && <Text style={styles.errMsg}>{errors.email.message}</Text>}

            {/* Password */}
            <Text style={[styles.label, { marginTop: SIZES.md }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              rules={{ required: 'Password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputRow, errors.password && styles.inputErr]}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errMsg}>{errors.password.message}</Text>}

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotTxt}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Text style={styles.signInBtnTxt}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )
              }
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  blobTL: { position: 'absolute', top: -100, left: -80,  width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.primary + '22' },
  blobBR: { position: 'absolute', bottom: 40, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.secondary + '14' },

  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 72, paddingBottom: 48 },

  brand:    { alignItems: 'center', marginBottom: SIZES.xl },
  logoRing: {
    width: 78, height: 78, borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  appName:  { fontSize: 28, color: COLORS.text,    ...FONTS.black, letterSpacing: 0.5 },
  tagline:  { fontSize: 13, color: COLORS.textSub, marginTop: 5 },

  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.xl,
  },
  cardTitle: { fontSize: 22, color: COLORS.text,    ...FONTS.bold,    marginBottom: 4 },
  cardSub:   { fontSize: 13, color: COLORS.textSub, marginBottom: SIZES.lg },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: SIZES.radius,
    padding: 10,
    marginBottom: SIZES.md,
    gap: 8,
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
  },

  label:     { color: COLORS.textSub, fontSize: 13, ...FONTS.semibold, marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
  },
  inputErr:  { borderColor: COLORS.error },
  input:     { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 14 },
  errMsg:    { color: COLORS.error, fontSize: 12, marginTop: 5 },

  forgotWrap: { alignSelf: 'flex-end', marginTop: 10, marginBottom: SIZES.lg },
  forgotTxt:  { color: COLORS.primary, fontSize: 13, ...FONTS.medium },

  signInBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 15, borderRadius: SIZES.radiusFull,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnTxt: { color: '#fff', fontSize: 16, ...FONTS.bold },

  footer:    { flexDirection: 'row', alignItems: 'center' },
  footerTxt: { color: COLORS.textMuted, fontSize: 14 },
  footerLink:{ color: COLORS.primary,  fontSize: 14, ...FONTS.bold },
});
