import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useWindowDimensions, Modal, TextInput, RefreshControl, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getReminders,
  createReminder,
  toggleReminder,
  deleteReminder
} from '../services/reminderApi';
import { soundService } from '../utils/soundUtil';

const REMINDER_TYPES = [
  { label: 'Loan EMI', icon: 'cash-outline', color: '#EF4444', bg: '#FEE2E2' },
  { label: 'Passport Expiry', icon: 'airplane-outline', color: '#3B82F6', bg: '#DBEAFE' },
  { label: 'Insurance Renewal', icon: 'shield-checkmark-outline', color: '#10B981', bg: '#D1FAE5' },
  { label: 'Property Tax', icon: 'home-outline', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Medical Reminder', icon: 'medkit-outline', color: '#EC4899', bg: '#FCE7F3' },
  { label: 'Other', icon: 'calendar-outline', color: '#6366F1', bg: '#EEF2FF' },
];

function getRemainingBadge(dueDateStr, isCompleted) {
  if (isCompleted) {
    return { text: 'Completed', bg: '#E2E8F0', color: '#64748B' };
  }
  const diffDays = Math.ceil((new Date(dueDateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d Overdue`, bg: '#FEE2E2', color: '#DC2626' };
  }
  if (diffDays === 0) {
    return { text: 'Due Today', bg: '#FEE2E2', color: '#DC2626' };
  }
  if (diffDays <= 3) {
    return { text: `${diffDays}d Left (Urgent)`, bg: '#FEF3C7', color: '#D97706' };
  }
  if (diffDays <= 7) {
    return { text: `${diffDays} days left`, bg: '#FEF9C3', color: '#CA8A04' };
  }
  return { text: `${diffDays} days left`, bg: '#ECFDF5', color: '#059669' };
}

export default function Reminders({ navigation }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Upcoming' | 'Completed'

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Loan EMI');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRemindersList = async () => {
    try {
      const res = await getReminders();
      if (res.success) {
        setReminders(res.data);
      }
    } catch (err) {
      console.log('Error fetching reminders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchRemindersList();
  }, []));

  const handleToggle = async (item) => {
    try {
      // Optimistic update
      const newStatus = !item.isCompleted;
      if (newStatus) {
        soundService.playSuccessSound();
      }
      setReminders(prev =>
        prev.map(r => r._id === item._id ? { ...r, isCompleted: newStatus } : r)
      );
      await toggleReminder(item._id);
    } catch (err) {
      console.log('Toggle error:', err);
      fetchRemindersList();
    }
  };

  const handleDelete = async (id) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this reminder?')
      : true;
    if (!confirmed) return;

    try {
      await deleteReminder(id);
      setReminders(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.log('Delete error:', err);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDueDate.trim()) {
      alert('Please enter title and valid due date (YYYY-MM-DD)');
      return;
    }
    setCreating(true);
    try {
      const res = await createReminder({
        title: newTitle.trim(),
        type: newType,
        dueDate: newDueDate.trim(),
      });
      if (res.success) {
        soundService.playNotificationSound();
        setShowAddModal(false);
        setNewTitle('');
        setNewDueDate('');
        fetchRemindersList();
      }
    } catch (err) {
      console.error('Error creating reminder:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error creating reminder';
      alert(`⚠️ ${errMsg}`);
    } finally {
      setCreating(false);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filterTab === 'Upcoming') return !r.isCompleted;
    if (filterTab === 'Completed') return r.isCompleted;
    return true;
  });

  const renderItem = ({ item }) => {
    const typeInfo = REMINDER_TYPES.find(t => t.label === item.type) || REMINDER_TYPES[5];
    const badge = getRemainingBadge(item.dueDate, item.isCompleted);

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Toggle Checkbox */}
        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => handleToggle(item)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox,
            item.isCompleted
              ? { backgroundColor: '#10B981', borderColor: '#10B981' }
              : { borderColor: colors.textMuted }
          ]}>
            {item.isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        {/* Type Icon */}
        <View style={[styles.iconBox, { backgroundColor: typeInfo.bg }]}>
          <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text },
              item.isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted }
            ]}
          >
            {item.title}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{item.type}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.text}</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              📅 {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.wrapper, isDesktop && { maxWidth: 960, alignSelf: 'center' }]}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Smart Reminders</Text>
            <Text style={[styles.pageSub, { color: colors.textMuted }]}>
              Automated renewal and payment alerts
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={styles.testSoundBtn}
              onPress={() => soundService.playNotificationSound()}
              title="Test notification chime"
            >
              <Ionicons name="volume-high" size={18} color="#4F46E5" />
              <Text style={styles.testSoundText}>Test Chime 🔔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>New Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['All', 'Upcoming', 'Completed'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterPill,
                filterTab === tab
                  ? { backgroundColor: '#4F46E5' }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
              ]}
              onPress={() => setFilterTab(tab)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterTab === tab ? { color: '#FFFFFF', fontWeight: '700' } : { color: colors.textSub }
                ]}
              >
                {tab} {tab === 'All' ? `(${reminders.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredReminders}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRemindersList(); }}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyBox}>
                <Ionicons name="alarm-outline" size={60} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textSub }]}>No reminders found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Add reminders for insurance renewals, passport expiry, and loan EMIs.
                </Text>
              </View>
            )
          }
        />
      </View>

      {/* Add Reminder Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Reminder</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={[styles.inputLabel, { color: colors.textSub }]}>Title / Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. HDFC Home Loan EMI"
                placeholderTextColor={colors.placeholder}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.textSub, marginTop: 14 }]}>Reminder Category</Text>
              <View style={styles.typeGrid}>
                {REMINDER_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.label}
                    style={[
                      styles.typeOption,
                      newType === t.label
                        ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }
                        : { backgroundColor: colors.bg, borderColor: colors.border }
                    ]}
                    onPress={() => setNewType(t.label)}
                  >
                    <Ionicons
                      name={t.icon}
                      size={14}
                      color={newType === t.label ? '#FFFFFF' : t.color}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        newType === t.label ? { color: '#FFFFFF', fontWeight: '700' } : { color: colors.text }
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSub, marginTop: 14 }]}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="2026-10-15"
                placeholderTextColor={colors.placeholder}
                value={newDueDate}
                onChangeText={setNewDueDate}
              />

              {/* Quick Date Presets */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  { label: '+3 Days', days: 3 },
                  { label: '+1 Week', days: 7 },
                  { label: '+1 Month', days: 30 },
                  { label: '+1 Year', days: 365 },
                ].map(preset => (
                  <TouchableOpacity
                    key={preset.label}
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + preset.days);
                      setNewDueDate(d.toISOString().split('T')[0]);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSub }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.saveBtnText}>{creating ? 'Saving...' : 'Set Reminder'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1, width: '100%', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  pageSub: { fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  testSoundText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  checkboxTouch: { padding: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11 },
  actionBtn: { padding: 6 },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, maxWidth: 300 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeOptionText: { fontSize: 12 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
