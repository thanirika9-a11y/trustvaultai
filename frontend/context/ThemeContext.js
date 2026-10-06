import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Light & Dark Palettes ────────────────────────────────────────────────────
const LightTheme = {
  dark: false,
  // Brand
  primary:       '#6366F1',
  primaryDark:   '#4F46E5',
  primaryLight:  '#818CF8',
  // Accent / Security green
  secondary:     '#059669',
  secondaryDark: '#047857',
  secondaryLight:'#10B981',
  // Backgrounds
  bg:            '#F1F5F9',
  background:    '#F1F5F9',
  surface:       '#FFFFFF',
  surfaceHigh:   '#E2E8F0',
  card:          '#FFFFFF',
  border:        '#E2E8F0',
  // Text
  text:          '#0F172A',
  textSub:       '#334155',
  textLight:     '#64748B',
  textMuted:     '#94A3B8',
  // Status
  error:         '#EF4444',
  success:       '#10B981',
  warning:       '#F59E0B',
  info:          '#3B82F6',
  // Chart
  chart1: '#6366F1', chart2: '#3B82F6', chart3: '#10B981',
  chart4: '#EF4444', chart5: '#F59E0B', chart6: '#EC4899', chart7: '#6B7280',
  // Navigation
  tabBarBg:      '#FFFFFF',
  headerBg:      '#FFFFFF',
  headerText:    '#0F172A',
  headerBorder:  '#E2E8F0',
  // Input
  inputBg:       '#F8FAFC',
  inputBorder:   '#E2E8F0',
  inputText:     '#0F172A',
  placeholder:   '#94A3B8',
};

const DarkTheme = {
  dark: true,
  // Brand (slightly brighter for dark bg)
  primary:       '#818CF8',
  primaryDark:   '#6366F1',
  primaryLight:  '#A5B4FC',
  // Accent
  secondary:     '#34D399',
  secondaryDark: '#10B981',
  secondaryLight:'#6EE7B7',
  // Backgrounds
  bg:            '#0F172A',
  background:    '#0F172A',
  surface:       '#1E293B',
  surfaceHigh:   '#334155',
  card:          '#1E293B',
  border:        '#334155',
  // Text
  text:          '#F1F5F9',
  textSub:       '#CBD5E1',
  textLight:     '#94A3B8',
  textMuted:     '#64748B',
  // Status
  error:         '#F87171',
  success:       '#34D399',
  warning:       '#FBBF24',
  info:          '#60A5FA',
  // Chart
  chart1: '#818CF8', chart2: '#60A5FA', chart3: '#34D399',
  chart4: '#F87171', chart5: '#FBBF24', chart6: '#F472B6', chart7: '#9CA3AF',
  // Navigation
  tabBarBg:      '#1E293B',
  headerBg:      '#1E293B',
  headerText:    '#F1F5F9',
  headerBorder:  '#334155',
  // Input
  inputBg:       '#1E293B',
  inputBorder:   '#475569',
  inputText:     '#F1F5F9',
  placeholder:   '#64748B',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext({
  isDark: false,
  colors: LightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('tv_dark_mode');
        if (saved === 'true') setIsDark(true);
      } catch (_) {}
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem('tv_dark_mode', String(next));
    } catch (_) {}
  };

  const colors = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { LightTheme, DarkTheme };
export default ThemeContext;
