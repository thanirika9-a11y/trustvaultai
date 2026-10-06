import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function Splash() {
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 55, friction: 7, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }], opacity }]}>
        <Ionicons name="shield-checkmark" size={68} color={COLORS.primary} />
      </Animated.View>
      <Animated.Text style={[styles.name, { opacity }]}>TrustVault</Animated.Text>
      <Animated.Text style={[styles.tag, { opacity }]}>Your Family Document Vault</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  blob1:    { position: 'absolute', top: -100, left: -80,   width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.primary   + '22' },
  blob2:    { position: 'absolute', bottom: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.secondary + '16' },
  iconWrap: { width: 116, height: 116, borderRadius: 30, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.lg },
  name:     { fontSize: 32, color: COLORS.text, ...FONTS.black, letterSpacing: 0.8 },
  tag:      { fontSize: 14, color: COLORS.textSub, marginTop: 8, ...FONTS.medium },
});
