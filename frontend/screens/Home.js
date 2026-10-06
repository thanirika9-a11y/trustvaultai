import React, { useState, useCallback, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  RefreshControl, 
  Alert,
  StatusBar,
  Modal,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import DonutChart from '../components/DonutChart';
import SkeletonLoader from '../components/SkeletonLoader';
import { getDashboard, seedDashboard } from '../services/dashboardApi';
import { getUnreadCount } from '../services/notificationApi';
import { soundService } from '../utils/soundUtil';

export default function Home({ route }) {
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 600 && width < 860;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data.count);
      }
    } catch (_) {}
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const enableBrowserNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification("TrustVault AI", {
            body: "🔔 Notifications Enabled! You will receive real-time document alerts.",
            icon: "https://cdn-icons-png.flaticon.com/512/1161/1161388.png"
          });
          if (Platform.OS === 'web') {
            window.alert('✅ Browser push notifications enabled successfully!');
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('Notification permission: ' + perm);
          }
        }
      } catch (e) {
        if (Platform.OS === 'web') {
          window.alert('Notification enabled for this session.');
        }
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('✅ In-App Notifications are enabled.');
      }
    }
  };

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.warn('Dashboard API failed:', error);
      setData({
        stats: { totalDocuments: 0, protectedItems: 0, sharedItems: 0, pendingActions: 0 },
        recentActivity: [],
        deadlines: []
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData(false);
      fetchUnread();
    }, [])
  );

  // Refresh when navigated back from AddDocument with a refreshKey
  useEffect(() => {
    if (route?.params?.refreshKey) {
      fetchDashboardData(false);
      fetchUnread();
    }
  }, [route?.params?.refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await getDashboard();
      if (res.success) {
        setData(res.data);
      }
      fetchUnread();
    } catch (e) {
      console.warn('Dashboard refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSeedPress = async () => {
    Alert.alert(
      'Reset & Seed Data',
      'This will reset your vault and re-populate it with the demo dashboard data. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await seedDashboard();
              await fetchDashboardData(false);
              Alert.alert('Success', 'Vault reset and seeded successfully.');
            } catch (err) {
              Alert.alert('Error', 'Failed to seed data.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Helper for rendering skeleton screens
  if (loading && !data) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={styles.skeletonHeader}>
          <SkeletonLoader width={150} height={24} style={{ marginBottom: 10 }} />
          <SkeletonLoader width={100} height={16} />
        </View>
        <View style={styles.skeletonQuickActions}>
          <SkeletonLoader width="23%" height={100} borderRadius={14} />
          <SkeletonLoader width="23%" height={100} borderRadius={14} />
          <SkeletonLoader width="23%" height={100} borderRadius={14} />
          <SkeletonLoader width="23%" height={100} borderRadius={14} />
        </View>
        <View style={styles.skeletonGrid}>
          <SkeletonLoader width="48%" height={180} borderRadius={14} />
          <SkeletonLoader width="48%" height={180} borderRadius={14} />
        </View>
        <SkeletonLoader width="100%" height={80} borderRadius={14} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Dashboard Aggregated Values
  const {
    user: profile = {},
    stats = {},
    storage = {},
    reminders = [],
    categoryChart = [],
    loanOverview = {},
    recentDocuments = [],
    recentActivity = [],
    security = {}
  } = data || {};

  return (
    <ScrollView 
      style={styles.root}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary || '#6366F1'} />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={[styles.mainWrapper, isDesktop && styles.desktopMainWrapper]}>
        {/* ─── HERO HEADER SECTION ─── */}
        <View style={styles.headerRow}>
          <View style={styles.headerGreeting}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name || profile.name || 'Thanu'} 👋</Text>
            <Text style={styles.subGreetingText}>Your documents are encrypted and protected with 256-bit AES vault storage.</Text>
            
            <View style={styles.badgeRow}>
              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.securityBadgeText}>AES-256 Vault Active</Text>
              </View>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={13} color="#4F46E5" />
                <Text style={styles.aiBadgeText}>AI Assistant Ready</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notifIconWrap} 
              onPress={() => {
                soundService.playNotificationSound();
                navigation.navigate('Notifications');
              }} 
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color="#0F172A" />
              {unreadCount > 0 ? (
                <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount}</Text></View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
              <Image 
                source={{ uri: user?.avatar || profile.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }} 
                style={styles.profileAvatar} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── CLOUD STORAGE WIDGET ─── */}
        <View style={styles.storageCard}>
          <View style={styles.storageCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.storageIconCircle}>
                <Ionicons name="cloud-done" size={22} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.storageLabel}>Encrypted Cloud Storage</Text>
                <Text style={styles.storageSubLabel}>Automated cloud backup & biometric protection</Text>
              </View>
            </View>
            <View style={styles.storageValueBadge}>
              <Text style={styles.storageValue}>
                {(() => {
                  const bytes = storage.usedBytes || 0;
                  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
                  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
                  return `${bytes} B`;
                })()} / 10 GB
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.max(storage.usedPercent || 0, storage.usedBytes > 0 ? 1 : 0)}%` }]} />
          </View>
          
          <View style={styles.storageCardFooter}>
            <Text style={styles.storageFootnote}>
              🔒 {stats.totalDocuments || 0} documents safely stored in your vault
            </Text>
            <Text style={styles.storagePercentage}>
              {storage.usedBytes > 0 && storage.usedPercent === 0 ? '<1%' : `${storage.usedPercent || 0}%`} used
            </Text>
          </View>
        </View>

        {/* ─── QUICK ACTIONS GRID (Responsive) ─── */}
        <View style={[styles.quickActionsContainer, !isDesktop && styles.quickActionsWrap]}>
          {/* Quick Scan */}
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#0D9488' }, !isDesktop && styles.quickActionCardMobile]}
            onPress={() => navigation.navigate('CameraScan')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <Ionicons name="scan" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.quickActionTitle}>Quick Scan</Text>
              <Text style={styles.quickActionSub}>Camera & OCR</Text>
            </View>
          </TouchableOpacity>

          {/* Upload Document */}
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#4F46E5' }, !isDesktop && styles.quickActionCardMobile]}
            onPress={() => navigation.navigate('AddDocument')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.quickActionTitle}>Upload Document</Text>
              <Text style={styles.quickActionSub}>PDF, Image or Files</Text>
            </View>
          </TouchableOpacity>

          {/* Add Family Member */}
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#7C3AED' }, !isDesktop && styles.quickActionCardMobile]}
            onPress={() => navigation.navigate('Shared', { openAddFamily: true })}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.quickActionTitle}>Family Vault</Text>
              <Text style={styles.quickActionSub}>Share & Invite</Text>
            </View>
          </TouchableOpacity>

          {/* Ask AI Assistant */}
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#0F172A' }, !isDesktop && styles.quickActionCardMobile]}
            onPress={() => navigation.navigate('AI')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <Ionicons name="sparkles" size={24} color="#A78BFA" />
            </View>
            <View>
              <Text style={styles.quickActionTitle}>Ask AI Assistant</Text>
              <Text style={styles.quickActionSub}>Document QA</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── STATISTICS COUNTERS ROW (Responsive) ─── */}
        <View style={[styles.statsCountersRow, !isDesktop && styles.statsCountersWrap]}>
          <View style={[styles.statBox, !isDesktop && styles.statBoxMobile]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="document-text" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.statNumberText}>{stats.totalDocuments || 0}</Text>
            <Text style={styles.statLabelText}>Total Documents</Text>
          </View>

          <View style={[styles.statBox, !isDesktop && styles.statBoxMobile]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="grid" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.statNumberText}>{stats.totalCategories || 0}</Text>
            <Text style={styles.statLabelText}>Categories</Text>
          </View>

          <View style={[styles.statBox, !isDesktop && styles.statBoxMobile]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={18} color="#059669" />
            </View>
            <Text style={styles.statNumberText}>{stats.totalFamilyMembers || 0}</Text>
            <Text style={styles.statLabelText}>Family Members</Text>
          </View>

          <View style={[styles.statBox, !isDesktop && styles.statBoxMobile]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="share-social" size={18} color="#D97706" />
            </View>
            <Text style={styles.statNumberText}>{stats.totalSharedWithMe || 0}</Text>
            <Text style={styles.statLabelText}>Shared With Me</Text>
          </View>
        </View>

        {/* ─── TWO-COLUMN MODULE LAYOUT (Responsive) ─── */}
        <View style={[styles.columnsWrapper, isDesktop ? styles.columnsDesktop : styles.columnsMobile]}>
          
          {/* LEFT COLUMN */}
          <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
          {/* Upcoming Reminders */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionCardTitle}>Upcoming Reminders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reminders')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {reminders.map((rem, i) => (
              <View key={rem._id || i} style={styles.reminderItemRow}>
                <View style={[styles.reminderIconBox, { backgroundColor: getReminderColor(rem.type) }]}>
                  <Ionicons name={getReminderIcon(rem.type)} size={16} color="#FFFFFF" />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTitle} numberOfLines={1}>{rem.title}</Text>
                  <Text style={styles.reminderDueDate}>Due on {new Date(rem.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.reminderDaysBadge}>
                  <Text style={[styles.reminderDaysText, { color: rem.remainingDays <= 5 ? COLORS.error : COLORS.warning }]}>
                    {rem.remainingDays}
                  </Text>
                  <Text style={styles.reminderDaysSub}>days left</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.viewAllRemindersButton} onPress={() => navigation.navigate('Reminders')}>
              <Text style={styles.viewAllRemindersText}>View All Reminders</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          {/* Recent Documents */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionCardTitle}>Recent Documents</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Vault')}><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
            </View>

            {recentDocuments.map((doc, i) => (
              <TouchableOpacity 
                key={doc._id || i} 
                style={styles.documentItemRow}
                onPress={() => navigation.navigate('Vault')}
              >
                <View style={styles.docIconBox}>
                  <Ionicons 
                    name={doc.fileType?.includes('pdf') ? 'document-text' : 'image'} 
                    size={20} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.docTypeBadge}>{doc.fileType?.includes('pdf') ? 'PDF' : 'IMG'}</Text>
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitleText} numberOfLines={1}>{doc.title}</Text>
                  <Text style={styles.docSubtext}>
                    Uploaded {formatRelativeTime(doc.createdAt)} • {formatBytesToMB(doc.fileSize)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.moreDocBtn}>
                  <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* RIGHT COLUMN */}
        <View style={styles.rightColumn}>
          {/* Documents by Category */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionCardTitle}>Documents by Category</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Vault')}><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
            </View>

            <View style={styles.chartLayoutRow}>
              {/* Donut Chart Visualizer */}
              <View style={styles.chartCol}>
                <DonutChart data={categoryChart} size={110} strokeWidth={10} />
              </View>

              {/* Chart Legend */}
              <View style={styles.legendCol}>
                {categoryChart.map((cat, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{cat.name}</Text>
                    <Text style={styles.legendCount}>{cat.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Loan Overview */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionCardTitle}>Loan Overview</Text>
              <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
            </View>

            <View style={styles.loanOverviewContainer}>
              <View style={styles.loanStatusHeader}>
                <View style={styles.loanIconCircle}>
                  <Ionicons name="business" size={18} color={COLORS.success} />
                </View>
                <View>
                  <Text style={styles.loanLabel}>Active Loans</Text>
                  <Text style={styles.loanActiveCount}>{loanOverview.activeLoans || 0}</Text>
                </View>
              </View>

              <View style={styles.loanDetailGrid}>
                <View style={styles.loanDetailCol}>
                  <Text style={styles.loanDetailLabel}>Total Outstanding</Text>
                  <Text style={styles.loanDetailValue}>₹{loanOverview.totalOutstanding?.toLocaleString('en-IN') || '0'}</Text>
                </View>
                <View style={styles.loanDetailCol}>
                  <Text style={styles.loanDetailLabel}>Monthly EMI</Text>
                  <Text style={styles.loanDetailValue}>₹{loanOverview.monthlyEmi?.toLocaleString('en-IN') || '0'}</Text>
                </View>
              </View>

              <View style={styles.loanDueRow}>
                <Text style={styles.loanDueLabel}>Next EMI Due</Text>
                <Text style={styles.loanDueValue}>
                  {loanOverview.nextDueDate 
                    ? new Date(loanOverview.nextDueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionCardTitle}>Recent Activity</Text>
              <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
            </View>

            {recentActivity.map((act, i) => (
              <View key={act._id || i} style={styles.activityItemRow}>
                <View style={[styles.activityIconCircle, { backgroundColor: getActivityColor(act.action) }]}>
                  <Ionicons name={getActivityIcon(act.action)} size={14} color="#FFFFFF" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{act.action}</Text>
                  <Text style={styles.activityDetails} numberOfLines={1}>{act.details}</Text>
                </View>
                <Text style={styles.activityTimeText}>{formatRelativeTime(act.timestamp)}</Text>
              </View>
            ))}
          </View>
        </View>

      </View>

      {/* ─── SECURITY PROTECTION BADGE FOOTER ─── */}
      <View style={styles.securityFooterCard}>
        <View style={styles.securityFooterContent}>
          <View style={styles.securityShieldCircle}>
            <Ionicons name="lock-closed" size={26} color="#3B82F6" />
          </View>
          <View style={styles.securityStatusInfo}>
            <Text style={styles.securityStatusTitle}>Your Vault is Protected</Text>
            <Text style={styles.securityStatusSub}>Biometric Login is Active</Text>
            <Text style={styles.securityStatusLogin}>
              Last login: {security.lastLogin ? new Date(security.lastLogin).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.securityBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.securityBtnText}>Security Settings</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
      </View>

    </ScrollView>
  );
}

// Helper colors for reminder categories
const getReminderColor = (type) => {
  switch (type) {
    case 'Loan EMI': return '#818CF8'; // Indigo
    case 'Insurance Renewal': return '#F43F5E'; // Red-pink
    case 'Passport Expiry': return '#10B981'; // Green
    default: return '#F59E0B'; // Orange
  }
};

const getReminderIcon = (type) => {
  switch (type) {
    case 'Loan EMI': return 'cash';
    case 'Insurance Renewal': return 'shield';
    case 'Passport Expiry': return 'airplane';
    default: return 'calendar';
  }
};

// Helper colors/icons for activities
const getActivityColor = (action) => {
  switch (action) {
    case 'Uploaded Document': return '#10B981';
    case 'Shared Document': return '#6C47FF';
    case 'AI Chat': return '#0284C7';
    default: return '#F59E0B';
  }
};

const getActivityIcon = (action) => {
  switch (action) {
    case 'Uploaded Document': return 'cloud-upload';
    case 'Shared Document': return 'share-social';
    case 'AI Chat': return 'chatbubbles';
    default: return 'sync';
  }
};

const formatBytesToMB = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes > 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'Just now';
  const diffMs = Date.now() - new Date(dateInput).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 600);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Seed Fallback data in case the local API fails
const getMockFallbackData = () => ({
  user: {
    name: 'Arun Kumar',
    email: 'arun.kumar@trustvault.com',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
  },
  stats: {
    totalDocuments: 128,
    totalCategories: 12,
    totalFamilyMembers: 8,
    totalSharedWithMe: 24
  },
  storage: {
    usedBytes: 3.42 * 1024 * 1024 * 1024,
    limitBytes: 10 * 1024 * 1024 * 1024,
    usedGB: '3.42',
    usedPercent: 34
  },
  reminders: [
    { _id: 'r1', title: 'Home Loan EMI', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), type: 'Loan EMI', remainingDays: 3 },
    { _id: 'r2', title: 'Health Insurance', dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), type: 'Insurance Renewal', remainingDays: 11 },
    { _id: 'r3', title: 'Passport Expiry', dueDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000), type: 'Passport Expiry', remainingDays: 85 },
    { _id: 'r4', title: 'Vehicle Insurance', dueDate: new Date(Date.now() + 111 * 24 * 60 * 60 * 1000), type: 'Insurance Renewal', remainingDays: 111 }
  ],
  categoryChart: [
    { name: 'Identity', count: 28, color: '#2DD4BF', icon: 'card-outline' },
    { name: 'Finance', count: 32, color: '#3B82F6', icon: 'wallet-outline' },
    { name: 'Loans', count: 18, color: '#6C47FF', icon: 'cash-outline' },
    { name: 'Insurance', count: 14, color: '#EF4444', icon: 'shield-checkmark-outline' },
    { name: 'Property', count: 12, color: '#F59E0B', icon: 'business-outline' },
    { name: 'Medical', count: 10, color: '#10B981', icon: 'heart-outline' },
    { name: 'Others', count: 14, color: '#9CA3AF', icon: 'document-text-outline' }
  ],
  loanOverview: {
    activeLoans: 3,
    totalOutstanding: 1875000,
    monthlyEmi: 45750,
    nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  recentDocuments: [
    { _id: 'd1', title: 'Home Loan Agreement', category: 'Loans', fileType: 'application/pdf', fileSize: 2.4 * 1024 * 1024, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { _id: 'd2', title: 'Health Insurance Policy', category: 'Insurance', fileType: 'application/pdf', fileSize: 1.8 * 1024 * 1024, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { _id: 'd3', title: 'Aadhaar Card', category: 'Identity', fileType: 'image/png', fileSize: 1.2 * 1024 * 1024, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { _id: 'd4', title: 'Property Sale Deed', category: 'Property', fileType: 'application/pdf', fileSize: 3.1 * 1024 * 1024, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
  ],
  recentActivity: [
    { _id: 'a1', action: 'Uploaded Document', details: 'Home Loan Agreement.pdf', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { _id: 'a2', action: 'Shared Document', details: "Shared 'Health Insurance' with Meena (Wife)", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { _id: 'a3', action: 'AI Chat', details: 'Asked about Home Loan details', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { _id: 'a4', action: 'Permission Updated', details: 'Updated access for Rohan (Son)', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  ],
  security: {
    vaultProtected: true,
    biometricEnabled: true,
    lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    securityScore: 98
  }
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  desktopScrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  mainWrapper: {
    width: '100%',
  },
  desktopMainWrapper: {
    maxWidth: 1180,
    alignSelf: 'center',
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    justifyContent: 'center',
  },
  skeletonHeader: {
    marginBottom: 30,
    marginTop: 20,
  },
  skeletonQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  skeletonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  headerGreeting: {
    flex: 1,
  },
  greetingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  userNameText: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subGreetingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  securityBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  aiBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  storageCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  storageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  storageIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  storageSubLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  storageValueBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storageValue: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13.5,
  },
  progressBarTrack: {
    height: 9,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },
  storageCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  storageFootnote: {
    color: '#64748B',
    fontSize: 12,
  },
  storagePercentage: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  quickActionsWrap: {
    flexWrap: 'wrap',
  },
  quickActionCard: {
    flex: 1,
    height: 106,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    cursor: 'pointer',
  },
  quickActionCardMobile: {
    flex: undefined,
    width: '48%',
    marginBottom: 10,
  },
  quickActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  statsCountersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statsCountersWrap: {
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statBoxMobile: {
    flex: undefined,
    width: '48%',
    marginBottom: 10,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumberText: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabelText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  columnsWrapper: {
    marginBottom: 24,
  },
  columnsDesktop: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  columnsMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  leftColumn: {
    gap: 16,
  },
  leftColumnDesktop: {
    flex: 1.15,
  },
  rightColumn: {
    gap: 16,
  },
  rightColumnDesktop: {
    flex: 0.85,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  reminderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  reminderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  reminderTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },
  reminderDueDate: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  reminderDaysBadge: {
    alignItems: 'flex-end',
  },
  reminderDaysText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reminderDaysSub: {
    color: COLORS.textMuted,
    fontSize: 8,
  },
  viewAllRemindersButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    marginTop: 4,
  },
  viewAllRemindersText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  documentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  docIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  docTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.error,
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
    paddingHorizontal: 2,
    borderRadius: 3,
  },
  docTitleText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '500',
  },
  docSubtext: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
  moreDocBtn: {
    padding: 4,
  },
  chartLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chartCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  legendCol: {
    flex: 1,
    paddingLeft: 6,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendName: {
    color: COLORS.textSub,
    fontSize: 9,
    flex: 1,
    marginLeft: 6,
  },
  legendCount: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: 'bold',
  },
  loanOverviewContainer: {
    gap: 10,
  },
  loanStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loanIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  loanActiveCount: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  loanDetailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceHigh,
    padding: 8,
    borderRadius: 8,
  },
  loanDetailCol: {
    flex: 1,
  },
  loanDetailLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
  },
  loanDetailValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  loanDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  loanDueLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  loanDueValue: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: 'bold',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  activityIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 8,
  },
  activityTitle: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  activityDetails: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
  activityTimeText: {
    color: COLORS.textMuted,
    fontSize: 8,
  },
  securityFooterCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  securityFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  securityShieldCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityStatusInfo: {
    flex: 1,
  },
  securityStatusTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  securityStatusSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  securityStatusLogin: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
  securityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  securityBtnText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notifModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 480,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  notifModalSub: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  enablePushBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  enablePushText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  notifItemUnread: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  notifTypeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifItemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notifItemMessage: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  notifItemTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    alignSelf: 'center',
  },
  notifModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notifFooterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  notifFooterBtnText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
