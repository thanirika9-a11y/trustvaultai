import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  Modal, Image, Switch, FlatList, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { SIZES } from '../constants/theme';
import { getActivities } from '../services/activityApi';
import { soundService } from '../utils/soundUtil';

export default function Profile({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { isDark, colors, toggleTheme } = useTheme();
  const [activeModal, setActiveModal] = useState(null); // 'security' | 'notifications' | 'activity' | 'help' | null

  // Interactive Security Settings state
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled]   = useState(true);
  const [autoLockEnabled, setAutoLockEnabled]     = useState(false);

  // Interactive Notification Settings state
  const [docShareAlerts, setDocShareAlerts]       = useState(true);
  const [expiryReminders, setExpiryReminders]     = useState(true);
  const [securityAlerts, setSecurityAlerts]       = useState(true);
  const [browserPushEnabled, setBrowserPushEnabled] = useState(false);

  // Activity Log State
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchActivityLogs = async () => {
    setLoadingActivities(true);
    try {
      const res = await getActivities();
      if (res.success) {
        setActivities(res.data);
      }
    } catch (err) {
      console.log('Error fetching activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const openActivityModal = () => {
    setActiveModal('activity');
    fetchActivityLogs();
  };

  const handleTestSound = () => {
    soundService.playNotificationSound();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      
      {/* Header Profile Card */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.avatarCircle}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: 84, height: 84, borderRadius: 42 }} />
          ) : (
            <Text style={styles.avatarInitial}>
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'Arun Kumar'}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email || 'arun.kumar@trustvault.com'}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
            <Text style={[styles.badgeText, { color: '#4F46E5' }]}>VAULT OWNER</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="pencil" size={14} color="#059669" />
            <Text style={[styles.editBtnText, { color: '#059669' }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Settings Section */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance & Vault Settings</Text>
      
      <Card style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Dark Mode Switch */}
        <View style={[styles.settingRow, { borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#312E81' : '#E0E7FF' }]}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? "#A5B4FC" : "#4F46E5"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
              {isDark ? 'Dark theme active' : 'Light theme active'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Security & Biometrics */}
        <TouchableOpacity 
          style={[styles.settingRow, { borderColor: colors.border }]}
          onPress={() => setActiveModal('security')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, { color: colors.text }]}>Security & Biometrics</Text>
            <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>2FA, Fingerprint & Auto-lock</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        
        {/* Notification Preferences */}
        <TouchableOpacity 
          style={[styles.settingRow, { borderColor: colors.border }]}
          onPress={() => setActiveModal('notifications')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="notifications" size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, { color: colors.text }]}>Notification & Audio Alerts</Text>
            <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>Chime sounds, push & email alerts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Activity Log & Audit Trail */}
        <TouchableOpacity 
          style={[styles.settingRow, { borderColor: colors.border }]}
          onPress={openActivityModal}
        >
          <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="time" size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, { color: colors.text }]}>Activity Log & Audit Trail</Text>
            <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>History of uploads, shares & AI chats</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Manage Family Circle */}
        <TouchableOpacity 
          style={[styles.settingRow, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('Shared')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
            <Ionicons name="people-sharp" size={20} color="#DB2777" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, { color: colors.text }]}>Manage Family Circle</Text>
            <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>Permissions & emergency access</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        
        {/* Help & Support */}
        <TouchableOpacity 
          style={[styles.settingRow, { borderBottomWidth: 0 }]}
          onPress={() => setActiveModal('help')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="help-circle" size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
            <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>FAQ, hotlines & recovery</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      <CustomButton 
        title="Logout Securely" 
        variant="danger" 
        onPress={logout} 
        style={styles.logoutButton}
      />

      {/* Security Modal */}
      <Modal visible={activeModal === 'security'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark-sharp" size={38} color="#10B981" style={{ marginBottom: 8 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Security & Biometrics</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Manage hardware authentication & encryption</Text>
            
            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Fingerprint / Face ID</Text>
                <Text style={[styles.switchSub, { color: colors.textMuted }]}>Require biometrics on launch</Text>
              </View>
              <Switch 
                value={biometricsEnabled} 
                onValueChange={setBiometricsEnabled} 
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Two-Factor Authentication</Text>
                <Text style={[styles.switchSub, { color: colors.textMuted }]}>Require email OTP on login</Text>
              </View>
              <Switch 
                value={twoFactorEnabled} 
                onValueChange={setTwoFactorEnabled} 
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Auto-Lock Vault</Text>
                <Text style={[styles.switchSub, { color: colors.textMuted }]}>Lock vault after 5 mins idle</Text>
              </View>
              <Switch 
                value={autoLockEnabled} 
                onValueChange={setAutoLockEnabled} 
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <CustomButton title="Save & Close" onPress={() => setActiveModal(null)} style={{ marginTop: 16, width: '100%' }} />
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={activeModal === 'notifications'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-circle-sharp" size={40} color="#D97706" style={{ marginBottom: 8 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Notification & Sound Alerts</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Manage real-time chimes and browser alerts</Text>

            {/* Audio Chime Test Button */}
            <TouchableOpacity 
              style={[styles.switchRow, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}
              onPress={handleTestSound}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: '#4F46E5' }]}>🔊 Notification Sound / Chime</Text>
                <Text style={[styles.switchSub, { color: '#6366F1' }]}>Click to test audio chime tone</Text>
              </View>
              <Ionicons name="volume-high" size={24} color="#4F46E5" />
            </TouchableOpacity>

            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Document Share Alerts</Text>
                <Text style={[styles.switchSub, { color: colors.textMuted }]}>Alerts when documents are shared</Text>
              </View>
              <Switch 
                value={docShareAlerts} 
                onValueChange={setDocShareAlerts} 
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Expiry & Renewal Reminders</Text>
                <Text style={[styles.switchSub, { color: colors.textMuted }]}>Alert before document expiration</Text>
              </View>
              <Switch 
                value={expiryReminders} 
                onValueChange={setExpiryReminders} 
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity 
              style={[styles.switchRow, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', borderWidth: 1 }]}
              onPress={async () => {
                if (typeof window !== 'undefined' && 'Notification' in window) {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') {
                    soundService.playNotificationSound();
                    new Notification("TrustVault AI", {
                      body: "🔔 Notifications Enabled! Real-time alerts and chime are now active.",
                    });
                    setBrowserPushEnabled(true);
                  }
                }
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: '#10B981' }]}>Enable Browser Push Notifications</Text>
                <Text style={styles.switchSub}>Click to allow desktop & pop-up alerts</Text>
              </View>
              <Ionicons name="notifications" size={22} color="#10B981" />
            </TouchableOpacity>

            <CustomButton title="Save & Close" onPress={() => setActiveModal(null)} style={{ marginTop: 16, width: '100%' }} />
          </View>
        </View>
      </Modal>

      {/* Activity Log Modal */}
      <Modal visible={activeModal === 'activity'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time" size={24} color="#2563EB" />
                <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Activity Audit Trail</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textMuted, marginBottom: 12 }]}>
              Chronological security log of all vault interactions
            </Text>

            <ScrollView style={{ width: '100%', maxHeight: 380 }}>
              {activities.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>
                    {loadingActivities ? 'Loading audit trail...' : 'No activity records found yet.'}
                  </Text>
                </View>
              ) : (
                activities.map((item, idx) => (
                  <View
                    key={item._id || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      gap: 10,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', marginTop: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                        {item.action}
                      </Text>
                      {item.details ? (
                        <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>
                          {item.details}
                        </Text>
                      ) : null}
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>
                        {new Date(item.timestamp || item.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <CustomButton title="Close" onPress={() => setActiveModal(null)} style={{ marginTop: 16, width: '100%' }} />
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={activeModal === 'help'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="help-buoy-sharp" size={40} color="#059669" style={{ marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Help & Support</Text>
            <Text style={[styles.modalBody, { color: colors.textSub }]}>
              Need assistance with your document vault?{'\n\n'}
              📧 Email: support@trustvault.ai{'\n'}
              💬 AI Assistant: Available 24/7 in-app{'\n'}
              🛡️ Emergency Vault Recovery Hotline: 1800-TRUST-VAULT
            </Text>
            <CustomButton title="Close" onPress={() => setActiveModal(null)} style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.large,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.large,
    paddingVertical: SIZES.xlarge,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.medium,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: SIZES.medium,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  settingCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SIZES.large,
    borderRadius: 16,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 18,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
