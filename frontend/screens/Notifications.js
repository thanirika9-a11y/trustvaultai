import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useWindowDimensions, RefreshControl, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification
} from '../services/notificationApi';

const TYPE_CONFIG = {
  document: { icon: 'document-text', bg: '#EEF2FF', color: '#4F46E5' },
  reminder: { icon: 'alarm',         bg: '#FEF3C7', color: '#D97706' },
  share:    { icon: 'share-social',   bg: '#ECFDF5', color: '#059669' },
  security: { icon: 'shield-checkmark', bg: '#FEE2E2', color: '#EF4444' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications({ navigation }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getNotifications();
      if (res.success) setNotifications(res.data);
    } catch (e) {
      console.log('Fetch notifications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (e) { console.log('Mark read error:', e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.log('Mark all read error:', e); }
  };

  const handleDelete = async (id) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Delete this notification?')
      : true;
    if (!confirmed) return;
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) { console.log('Delete error:', e); }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.document;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border },
          !item.read && { borderLeftWidth: 4, borderLeftColor: '#4F46E5' }
        ]}
        onPress={() => handleMarkRead(item._id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text },
            !item.read && { fontWeight: '700' }
          ]}>{item.title}</Text>
          <Text style={[styles.cardMsg, { color: colors.textSub }]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item._id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSub }]}>No notifications yet</Text>
      <Text style={[styles.emptyMsg, { color: colors.textMuted }]}>
        You'll see document shares, reminders, and security alerts here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.wrapper, isDesktop && { maxWidth: 860, alignSelf: 'center' }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <Ionicons name="checkmark-done" size={18} color="#4F46E5" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={!loading ? renderEmpty : null}
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1, width: '100%', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20,
  },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, marginBottom: 10, borderRadius: 14,
    borderWidth: 1, gap: 12,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  cardMsg: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  timeText: { fontSize: 11 },
  deleteBtn: { padding: 4, marginTop: 2 },
  emptyBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyMsg: { fontSize: 14, textAlign: 'center', marginTop: 6, maxWidth: 280 },
});
