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

export default function Register({ navigation }) {
  const { signUp } = useContext(AuthContext);
  const [loading,       setLoading]       = useState(false);
  const [showPass,      setShowPass]      = useState(false);
  const [showConf,      setShowConf]      = useState(false);
  const [errorMessage,  setErrorMessage]  = useState('');

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const password = watch('password');

  const onSubmit = async ({ name, email, password }) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await signUp(name, email, password);
      if (res?.success) {
        navigation.navigate('OTPVerification', { email, devOtp: res?.data?.devOtp });
      } else {
        throw new Error(res?.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Registration Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, placeholder, rules, secure, toggleSecure, showSecure, keyboardType }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.inputRow, errors[name] && styles.inputErr]}>
            <Ionicons
              name={secure ? 'lock-closed-outline' : name === 'email' ? 'mail-outline' : 'person-outline'}
              size={18} color={COLORS.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize={name === 'email' ? 'none' : 'words'}
              keyboardType={keyboardType || 'default'}
              secureTextEntry={secure && !showSecure}
              autoCorrect={false}
            />
            {secure && (
              <TouchableOpacity onPress={toggleSecure} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showSecure ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      {errors[name] && <Text style={styles.errMsg}>{errors[name].message}</Text>}
    </>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        <Text style={styles.backText}>Sign In</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1, width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.brand}>
            <View style={styles.logoRing}>
              <Ionicons name="shield-checkmark" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>TrustVault</Text>
            <Text style={styles.tagline}>Create Your Secure Account</Text>
          </View>

          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorBoxText}>{errorMessage}</Text>
                  {errorMessage.toLowerCase().includes('already') ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 4 }}>
                      <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 13 }}>Click here to Sign In →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            <Field
              name="name" label="Full Name" placeholder="Arun Kumar"
              rules={{ required: 'Full name is required' }}
            />
            <Field
              name="email" label="Email Address" placeholder="you@example.com"
              rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
              keyboardType="email-address"
            />
            <Field
              name="password" label="Password" placeholder="Min 6 characters"
              rules={{ required: 'Password required', minLength: { value: 6, message: 'Minimum 6 characters' } }}
              secure toggleSecure={() => setShowPass(p => !p)} showSecure={showPass}
            />
            <Field
              name="confirm" label="Confirm Password" placeholder="Re-enter password"
              rules={{ required: 'Please confirm your password', validate: v => v === password || 'Passwords do not match' }}
              secure toggleSecure={() => setShowConf(p => !p)} showSecure={showConf}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Text style={styles.btnTxt}>Create Account</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  </>
                )
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerTxt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  blobTL: { position: 'absolute', top: -100, left: -80,   width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.primary + '22' },
  blobBR: { position: 'absolute', bottom: 40, right: -80,  width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.secondary + '14' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 60, paddingBottom: 48 },

  brand:    { alignItems: 'center', marginBottom: SIZES.xl },
  logoRing: {
    width: 74, height: 74, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  appName: { fontSize: 26, color: COLORS.text, ...FONTS.black },
  tagline: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },

  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg, padding: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.xl,
  },

  label:    { color: COLORS.textSub, fontSize: 13, ...FONTS.semibold, marginBottom: 6, marginTop: SIZES.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surfaceHigh, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SIZES.md },
  inputErr: { borderColor: COLORS.error },
  input:    { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 14 },
  errMsg:   { color: COLORS.error, fontSize: 12, marginTop: 4 },

  btn:        { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: SIZES.radiusFull, marginTop: SIZES.lg, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  btnDisabled:{ opacity: 0.7 },
  btnTxt:     { color: '#fff', fontSize: 16, ...FONTS.bold },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 50,
    left: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
    padding: 6,
  },
  backText: {
    color: COLORS.text,
    fontSize: 14,
    ...FONTS.semibold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
  },
  footer:    { flexDirection: 'row', alignItems: 'center' },
  footerTxt: { color: COLORS.textMuted, fontSize: 14 },
  footerLink:{ color: COLORS.primary,  fontSize: 14, ...FONTS.bold },
});
