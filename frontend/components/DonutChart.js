import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

// Pure CSS/View-based Donut Chart — works on both web and native
export default function DonutChart({ data, size = 160, strokeWidth = 14 }) {
  const chartData = (data || []).filter(item => item.count > 0);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (total === 0 || chartData.length === 0) {
    // Empty state — grey ring
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: COLORS.border || '#1E293B',
          }
        ]} />
        <View style={styles.centerTextContainer}>
          <Text style={styles.totalNumber}>0</Text>
          <Text style={styles.totalLabel}>Total</Text>
        </View>
      </View>
    );
  }

  // Build conic-gradient segments for web
  if (Platform.OS === 'web') {
    let gradientParts = [];
    let cumulative = 0;
    chartData.forEach((item) => {
      const pct = (item.count / total) * 100;
      gradientParts.push(`${item.color} ${cumulative.toFixed(1)}% ${(cumulative + pct).toFixed(1)}%`);
      cumulative += pct;
    });
    const gradient = `conic-gradient(${gradientParts.join(', ')})`;
    const inner = size - strokeWidth * 2;

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: inner,
              height: inner,
              borderRadius: '50%',
              backgroundColor: COLORS.bg || '#0B1121',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' }}>{total}</span>
            <span style={{ fontSize: 11, color: '#A3B3D4', marginTop: 2 }}>Total</span>
          </div>
        </div>
      </View>
    );
  }

  // Native fallback — stacked arcs using View borders (simple pie approximation)
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[
        styles.outerRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: chartData[0]?.color || COLORS.primary,
        }
      ]} />
      <View style={styles.centerTextContainer}>
        <Text style={styles.totalNumber}>{total}</Text>
        <Text style={styles.totalLabel}>Total</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalLabel: {
    fontSize: 12,
    color: '#A3B3D4',
    marginTop: 2,
  },
});
