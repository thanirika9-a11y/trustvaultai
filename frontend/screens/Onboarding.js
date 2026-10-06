import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=600&auto=format&fit=crop',
    title: 'Secure Your\nFamily Documents',
    sub:   'Store Aadhaar, PAN, passports, and vital documents in one encrypted vault.',
    accentColor: COLORS.primary,
    icon: 'shield-checkmark',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
    title: 'Share with\nFamily',
    sub:   'Instantly share documents with family members. Control access anytime.',
    accentColor: COLORS.secondary,
    icon: 'people',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=600&auto=format&fit=crop',
    title: 'AI-Powered\nAssistant',
    sub:   'Upload documents and get smart summaries in Tamil & English instantly.',
    accentColor: '#F59E0B',
    icon: 'sparkles',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=600&auto=format&fit=crop',
    title: 'Never Miss\na Deadline',
    sub:   'Smart reminders for renewals, loan EMIs, and insurance premiums.',
    accentColor: '#3B82F6',
    icon: 'notifications',
  },
];

export default function Onboarding({ navigation }) {
  const [current, setCurrent] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Skip onboarding if already seen before
  useEffect(() => {
    AsyncStorage.getItem('tv_onboarded').then(val => {
      if (val === 'true') {
        navigation.replace('Login');
      }
    });
  }, []);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('tv_onboarded', 'true');
    navigation.replace('Login');
  };

  const goToSlide = (idx) => {
    // Fade out → change slide → fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrent(idx);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      goToSlide(current + 1);
    } else {
      finishOnboarding();
    }
  };

  const slide = SLIDES[current];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={[styles.blob1, { backgroundColor: slide.accentColor + '20' }]} />
      <View style={[styles.blob2, { backgroundColor: slide.accentColor + '14' }]} />

      {/* Skip button (top right) */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipTop} onPress={finishOnboarding}>
          <Text style={styles.skipTopTxt}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        {/* Icon badge */}
        <View style={[styles.iconBadge, { borderColor: slide.accentColor + '55', backgroundColor: COLORS.surface }]}>
          <Ionicons name={slide.icon} size={40} color={slide.accentColor} />
        </View>

        {/* Hero Image */}
        <View style={[styles.imageFrame, { borderColor: slide.accentColor + '66' }]}>
          <Image
            source={{ uri: slide.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={[styles.imageOverlay, { backgroundColor: slide.accentColor + '22' }]} />
        </View>

        {/* Text */}
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.sub}>{slide.sub}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
            <View style={[
              styles.dot,
              {
                width: i === current ? 28 : 8,
                backgroundColor: i === current ? slide.accentColor : COLORS.textMuted,
                opacity: i === current ? 1 : 0.4,
              }
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Next / Get Started button */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide.accentColor }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextTxt}>
            {current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name={current === SLIDES.length - 1 ? 'checkmark-circle' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl,
  },
  blob1: {
    position: 'absolute', top: -80, left: -60,
    width: 260, height: 260, borderRadius: 130,
  },
  blob2: {
    position: 'absolute', bottom: 60, right: -70,
    width: 220, height: 220, borderRadius: 110,
  },
  skipTop: {
    position: 'absolute', top: 52, right: SIZES.lg,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  skipTopTxt: {
    color: COLORS.textSub, fontSize: 15, fontWeight: '500',
  },

  slideContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  iconBadge: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  imageFrame: {
    width: 220, height: 220,
    borderRadius: 24, borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000', shadowOpacity: 0.4,
    shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },

  title: {
    fontSize: 30, color: COLORS.text,
    fontWeight: '900', textAlign: 'center',
    lineHeight: 38, marginBottom: 14,
  },
  sub: {
    fontSize: 15, color: COLORS.textSub,
    textAlign: 'center', lineHeight: 24,
    maxWidth: 320,
  },

  dots: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: 36, marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },

  btnRow: {
    width: '100%', maxWidth: 420, paddingBottom: 48,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 99,
    shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  nextTxt: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
