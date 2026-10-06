import React, { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from '../screens/Home';
import Vault from '../screens/Vault';
import AiAssistant from '../screens/AiAssistant';
import Shared from '../screens/Shared';
import Profile from '../screens/Profile';
import AddDocument from '../screens/AddDocument';
import CameraScan from '../screens/CameraScan';
import EditProfile from '../screens/EditProfile';
import Notifications from '../screens/Notifications';
import Reminders from '../screens/Reminders';
import { useTheme } from '../context/ThemeContext';
import { getUnreadCount } from '../services/notificationApi';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HeaderRightActions({ navigation }) {
  const { colors } = useTheme();
  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await getUnreadCount();
      if (res.success) {
        setUnread(res.data.count);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.headerRightRow}>
      {/* Reminders Shortcut */}
      <TouchableOpacity
        style={[styles.headerBtn, { backgroundColor: colors.surfaceHigh }]}
        onPress={() => navigation.navigate('Reminders')}
        activeOpacity={0.7}
        title="Smart Reminders"
      >
        <Ionicons name="alarm-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Notifications Bell */}
      <TouchableOpacity
        style={[styles.headerBtn, { backgroundColor: colors.surfaceHigh }]}
        onPress={() => navigation.navigate('Notifications')}
        activeOpacity={0.7}
        title="Notifications"
      >
        <Ionicons name="notifications-outline" size={20} color={colors.text} />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerStyle: { 
          backgroundColor: colors.headerBg, 
          borderBottomWidth: 1, 
          borderBottomColor: colors.headerBorder,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'web' ? 64 : undefined,
        },
        headerTintColor: colors.headerText,
        headerTitleStyle: { 
          fontWeight: '700',
          fontSize: 18,
          color: colors.headerText,
        },
        headerRight: () => <HeaderRightActions navigation={navigation} />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Vault') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'AI') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Shared') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.headerBorder,
          height: Platform.OS === 'web' ? 68 : 64,
          paddingTop: 6,
          paddingBottom: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{ 
          title: 'Dashboard',
          headerTitle: () => (
            <View style={styles.brandHeader}>
              <View style={styles.brandIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.brandTitle, { color: colors.headerText }]}>
                TrustVault <Text style={{ color: colors.primary }}>AI</Text>
              </Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Protected</Text>
              </View>
            </View>
          )
        }} 
      />
      <Tab.Screen 
        name="Vault" 
        component={Vault} 
        options={{ 
          title: 'My Vault',
          headerTitle: '📂 My Vault Documents'
        }} 
      />
      <Tab.Screen 
        name="AI" 
        component={AiAssistant} 
        options={{ 
          title: 'AI Assistant',
          headerTitle: '✨ TrustVault AI Assistant'
        }} 
      />
      <Tab.Screen 
        name="Shared" 
        component={Shared} 
        options={{ 
          title: 'Shared',
          headerTitle: '🤝 Shared Vault & Family'
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        options={{ 
          title: 'Profile',
          headerTitle: '👤 Vault Settings & Profile'
        }} 
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="Notifications" 
        component={Notifications} 
        options={{ 
          headerShown: true, 
          title: '🔔 Notifications', 
          headerStyle: { backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder }, 
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' }
        }} 
      />
      <Stack.Screen 
        name="Reminders" 
        component={Reminders} 
        options={{ 
          headerShown: true, 
          title: '⏰ Smart Reminders', 
          headerStyle: { backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder }, 
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' }
        }} 
      />
      <Stack.Screen 
        name="AddDocument" 
        component={AddDocument} 
        options={{ 
          headerShown: true, 
          title: 'Upload Document', 
          headerStyle: { backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder }, 
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' }
        }} 
      />
      <Stack.Screen 
        name="CameraScan" 
        component={CameraScan} 
        options={{ 
          headerShown: true, 
          title: 'Scan Document', 
          headerStyle: { backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder }, 
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' }
        }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfile} 
        options={{ 
          headerShown: true, 
          title: 'Edit Profile', 
          headerStyle: { backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder }, 
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' }
        }} 
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    padding: 2,
    borderRadius: 8,
  },
  tabIconWrapActive: {
    transform: [{ scale: 1.05 }],
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  }
});
