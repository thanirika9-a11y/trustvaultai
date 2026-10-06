import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { verifyOTP as verifyOTPApi } from '../services/authApi';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function OTPVerification({ route, navigation }) {
  const { email, devOtp } = route.params || {};
  const { login }  = useContext(AuthContext);
  
  // Auto-fill devOtp if available (only in development)
  const initialOtp = devOtp ? devOtp.split('') : ['', '', '', '', '', ''];
  const [otp,           setOtp]           = useState(initialOtp);
  const [loading,       setLoading]       = useState(false);
  const [errorMessage,  setErrorMessage]  = useState('');
  const refs = useRef([]);

  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (!val && idx > 0) refs.current[idx - 1]?.focus();
  };

  const onVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { 
      setErrorMessage('Please enter all 6 digits.'); 
      return; 
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await verifyOTPApi(email, code);
      if (res.success && res.data) {
        await login(res.data.user, res.data.accessToken, res.data.refreshToken);
      } else {
        throw new Error(res?.message || 'Verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Wrong code. Please try again.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid OTP', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.blob} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Ionicons name="mail" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Check Your Email</Text>
      <Text style={styles.sub}>We sent a 6-digit code to{'\n'}<Text style={{ color: COLORS.primary }}>{email}</Text></Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={COLORS.error} />
          <Text style={styles.errorBoxText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* OTP boxes */}
      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={el => (refs.current[i] = el)}
            style={[styles.otpBox, digit && styles.otpBoxFilled]}
            value={digit}
            onChangeText={v => handleChange(v, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity style={styles.verifyBtn} onPress={onVerify} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <><Text style={styles.verifyTxt}>Verify Email</Text><Ionicons name="checkmark-circle" size={20} color="#fff" /></>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.resend} onPress={() => navigation.goBack()}>
        <Text style={styles.resendTxt}>Didn't get it? <Text style={{ color: COLORS.primary }}>Go back & resend</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SIZES.lg },
  blob:       { position: 'absolute', top: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.primary + '20' },
  back:       { position: 'absolute', top: 56, left: SIZES.lg },
  iconWrap:   { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.lg },
  title:      { fontSize: 24, color: COLORS.text, ...FONTS.bold, marginBottom: 8 },
  sub:        { fontSize: 14, color: COLORS.textSub, textAlign: 'center', lineHeight: 22, marginBottom: SIZES.xl },
  otpRow:     { flexDirection: 'row', gap: 10, marginBottom: SIZES.xl },
  otpBox:     { width: 48, height: 58, backgroundColor: COLORS.surface, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border, fontSize: 22, color: COLORS.text, ...FONTS.bold },
  otpBoxFilled:{ borderColor: COLORS.primary },
  verifyBtn:  { width: '100%', backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: SIZES.radiusFull },
  verifyTxt:  { color: '#fff', fontSize: 16, ...FONTS.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    width: '100%',
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
  },
  resend:     { marginTop: SIZES.lg },
  resendTxt:  { color: COLORS.textMuted, fontSize: 14 },
});
