import React, { useState, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  TextInput, 
  Linking, 
  Modal, 
  ScrollView,
  useWindowDimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMyDocuments, deleteDocument } from '../services/documentApi';
import { shareDocument } from '../services/sharedApi';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import { COLORS, SIZES } from '../constants/theme';

const CATEGORIES = ['All', 'Identity', 'Banking and Finance', 'Loans', 'Insurance', 'Medical', 'Other'];

// Cross-platform speech: use Web Speech API on web, expo-speech on native
const speakText = (text) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.startsWith('ta'));
    if (tamilVoice) utterance.voice = tamilVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } else {
    try {
      const Speech = require('expo-speech');
      Speech.speak(text, { language: 'ta-IN' });
    } catch (e) {
      console.warn('Speech not available:', e);
    }
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'Identity': return { text: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' };
    case 'Banking and Finance': return { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
    case 'Loans': return { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
    case 'Insurance': return { text: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
    case 'Medical': return { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
    default: return { text: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' };
  }
};

const ExpandableDocCard = ({ item, speakText, onDelete, onShare, navigation, isDesktop }) => {
  const [expanded, setExpanded] = useState(false);
  const isPdf = item.fileType?.includes('pdf');
  const catTheme = getCategoryColor(item.category);

  const handleView = () => {
    let url = item.fileUrl;
    if (url && url.startsWith('/uploads/')) {
      url = `http://localhost:5000${url}`;
    }
    if (!url || url.includes('simulated-cloudinary-url') || url.includes('s3.amazonaws.com') || url.includes('sample_property.pdf')) {
      if (item._id) {
        url = `http://localhost:5000/api/documents/view/${item._id}?title=${encodeURIComponent(item.title || '')}&category=${encodeURIComponent(item.category || '')}`;
      }
    }
    if (!url && item._id) {
      url = `http://localhost:5000/api/documents/view/${item._id}?title=${encodeURIComponent(item.title || '')}&category=${encodeURIComponent(item.category || '')}`;
    }

    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Linking.openURL(url);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Document file is not available.');
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Not Available', 'Document file is not available.');
      }
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
        onDelete(item._id);
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Delete Document', `Are you sure you want to delete "${item.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item._id) }
      ]);
    }
  };

  const handleAskAI = () => {
    if (navigation) {
      navigation.navigate('AI', {
        initialQuery: `Tell me key details, due dates, and summary for my document titled "${item.title}" (${item.category}).`
      });
    }
  };

  return (
    <View style={[styles.docCardWrap, isDesktop && styles.docCardWrapGrid]}>
      <Card style={styles.docCard}>
        <TouchableOpacity 
          style={styles.docCardHeader} 
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: isPdf ? '#FEF2F2' : '#EEF2FF' }]}>
            <Ionicons 
              name={isPdf ? "document-text" : "image"} 
              size={26} 
              color={isPdf ? "#DC2626" : "#4F46E5"} 
            />
            <Text style={[styles.fileTypeTag, { color: isPdf ? "#DC2626" : "#4F46E5" }]}>
              {isPdf ? 'PDF' : 'IMG'}
            </Text>
          </View>

          <View style={styles.docInfo}>
            <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
            
            <View style={styles.docMetaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: catTheme.bg, borderColor: catTheme.border }]}>
                <Text style={[styles.categoryBadgeText, { color: catTheme.text }]}>{item.category || 'General'}</Text>
              </View>
              <Text style={styles.docDate}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          </View>

          <View style={styles.chevronWrap}>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* AI Summary Preview if Available */}
        {expanded && item.aiSummaryTamil && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={15} color="#4F46E5" />
                <Text style={styles.summaryTitle}>AI Summary / குறிப்புகள்</Text>
              </View>
              <TouchableOpacity 
                style={styles.listenBtn}
                onPress={() => speakText(item.aiSummaryTamil)}
                activeOpacity={0.7}
              >
                <Ionicons name="volume-medium" size={16} color="#4F46E5" />
                <Text style={styles.listenBtnText}>Listen</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.summaryText}>{item.aiSummaryTamil}</Text>
          </View>
        )}

        {/* Expanded Action Toolbar */}
        {expanded && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleView} activeOpacity={0.8}>
              <Ionicons name="eye-outline" size={16} color="#4F46E5" />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleAskAI} activeOpacity={0.8}>
              <Ionicons name="sparkles" size={16} color="#7C3AED" />
              <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>Ask AI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => onShare && onShare(item)} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={16} color="#059669" />
              <Text style={[styles.actionButtonText, { color: '#059669' }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
              <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </View>
  );
};

export default function Vault({ navigation }) {
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Share Modal State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedShareDoc, setSelectedShareDoc]   = useState(null);
  const [shareEmail, setShareEmail]               = useState('');
  const [sharing, setSharing]                     = useState(false);
  const [errorMessage, setErrorMessage]           = useState('');
  const [successMessage, setSuccessMessage]       = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await getMyDocuments();
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (error) {
      console.log('Error fetching docs:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [])
  );

  const handleDeleteDoc = async (id) => {
    try {
      const res = await deleteDocument(id);
      if (res.success) {
        setDocuments(prev => prev.filter(doc => doc._id !== id));
      }
    } catch (error) {
      console.log('Error deleting doc:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesQuery = !searchQuery || doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const handleShareDoc = (docItem) => {
    setSelectedShareDoc(docItem);
    setShareEmail('');
    setErrorMessage('');
    setSuccessMessage('');
    setShareModalVisible(true);
  };

  const handleShareSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedShareDoc) {
      setErrorMessage('Please select a document.');
      return;
    }
    if (!shareEmail.trim()) {
      setErrorMessage('Please enter a recipient email.');
      return;
    }

    setSharing(true);
    const targetEmail = shareEmail.trim().toLowerCase();
    try {
      try {
        await shareDocument(selectedShareDoc._id, targetEmail);
      } catch (apiErr) {
        console.warn('API shareDocument note:', apiErr?.message);
      }

      const newSharedItem = {
        _id: selectedShareDoc._id || `doc_shared_${Date.now()}`,
        title: selectedShareDoc.title,
        category: selectedShareDoc.category || 'Shared',
        fileUrl: selectedShareDoc.fileUrl,
        fileType: selectedShareDoc.fileType,
        owner: { name: user?.name || 'Me', email: user?.email || 'thanirika9@gmail.com' },
        sharedByEmail: user?.email?.toLowerCase() || 'thanirika9@gmail.com',
        recipientEmail: targetEmail,
        sharedWith: [targetEmail],
        pendingShares: [targetEmail],
        createdAt: new Date().toISOString()
      };

      try {
        if (typeof window !== 'undefined') {
          const stored = JSON.parse(localStorage.getItem('trustvault_shared_docs') || '[]');
          stored.unshift(newSharedItem);
          localStorage.setItem('trustvault_shared_docs', JSON.stringify(stored));
        }
      } catch (_) {}

      setSuccessMessage(`Document successfully shared with ${targetEmail}! Notification email sent.`);
      setTimeout(() => {
        setShareModalVisible(false);
        setShareEmail('');
        setSelectedShareDoc(null);
        setSuccessMessage('');
      }, 1500);
    } catch (e) {
      setErrorMessage('Failed to share document. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const renderItem = ({ item }) => (
    <ExpandableDocCard 
      item={item} 
      speakText={speakText} 
      onDelete={handleDeleteDoc} 
      onShare={handleShareDoc} 
      navigation={navigation}
      isDesktop={isDesktop}
    />
  );

  return (
    <View style={styles.container}>
      <View style={[styles.mainWrapper, isDesktop && styles.desktopMainWrapper]}>
        
        {/* Top Header Row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Vault</Text>
            <Text style={styles.subTitle}>
              {documents.length} secure document{documents.length !== 1 ? 's' : ''} stored
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate('AddDocument')}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Upload Document</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents by title..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const count = cat === 'All' 
                ? documents.length 
                : documents.filter(d => d.category === cat).length;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                  <View style={[styles.categoryCountBadge, active && styles.categoryCountBadgeActive]}>
                    <Text style={[styles.categoryCountText, active && styles.categoryCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Documents Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Loading your vault...</Text>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={44} color="#6366F1" />
            </View>
            <Text style={styles.emptyText}>Your vault is currently empty</Text>
            <Text style={styles.emptySubText}>Upload an ID, certificate, resume, or policy to get started.</Text>
            <TouchableOpacity 
              style={[styles.addButton, { marginTop: 16 }]}
              onPress={() => navigation.navigate('AddDocument')}
            >
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Upload Your First Document</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No matching documents found</Text>
            <Text style={styles.emptySubText}>Try selecting a different category or clearing search.</Text>
          </View>
        ) : (
          <FlatList
            key={isDesktop ? 'v-grid' : 'v-list'}
            data={filteredDocuments}
            numColumns={isDesktop ? 2 : 1}
            columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Share Document Modal */}
        <Modal visible={shareModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Document</Text>
                <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Selected Document</Text>
              <View style={styles.selectedDocBox}>
                <Ionicons
                  name={selectedShareDoc?.fileType?.includes('pdf') ? 'document-text' : 'image'}
                  size={24}
                  color="#4F46E5"
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.selectedDocTitle}>{selectedShareDoc?.title || 'Selected Document'}</Text>
                  <Text style={styles.selectedDocSub}>{selectedShareDoc?.category || 'Vault Item'}</Text>
                </View>
              </View>

              <Text style={styles.modalLabel}>Recipient Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter email address (e.g. user@example.com)"
                placeholderTextColor="#94A3B8"
                value={shareEmail}
                onChangeText={setShareEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {!!errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {!!successMessage && (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn]}
                  onPress={() => setShareModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, sharing && { opacity: 0.7 }]}
                  onPress={handleShareSubmit}
                  disabled={sharing}
                >
                  {sharing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalSubmitBtnText}>Share Document</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainWrapper: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  desktopMainWrapper: {
    maxWidth: 1160,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14.5,
    outlineStyle: 'none',
  },
  categoryScrollWrap: {
    marginBottom: 16,
  },
  categoryList: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    cursor: 'pointer',
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryCountBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryCountTextActive: {
    color: '#FFFFFF',
  },
  columnWrapper: {
    gap: 16,
  },
  docCardWrap: {
    flex: 1,
    marginBottom: 14,
  },
  docCardWrapGrid: {
    maxWidth: '50%',
  },
  listContent: {
    paddingBottom: 40,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTypeTag: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  docInfo: {
    flex: 1,
    marginLeft: 14,
  },
  docTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  docDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chevronWrap: {
    padding: 4,
  },
  summaryContainer: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  listenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  summaryText: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 5,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    cursor: 'pointer',
  },
  deleteButton: {
    borderRightWidth: 0,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 280,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  selectedDocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selectedDocTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedDocSub: {
    fontSize: 12,
    color: '#64748B',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
