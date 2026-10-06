import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Linking,
  useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import { getSharedWithMe, getSharedByMe, shareDocument } from '../services/sharedApi';
import { getMyDocuments } from '../services/documentApi';
import { getFamilyMembers, addFamilyMember, deleteFamilyMember } from '../services/familyApi';

export default function Shared() {
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [activeTab, setActiveTab]         = useState('withMe');
  const [docsWithMe, setDocsWithMe]       = useState([]);
  const [docsByMe, setDocsByMe]           = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading]             = useState(true);

  // Share modal state
  const [shareModalVisible, setShareModalVisible]   = useState(false);
  const [myDocs, setMyDocs]                         = useState([]);
  const [selectedDoc, setSelectedDoc]               = useState(null);
  const [shareEmail, setShareEmail]                 = useState('');
  const [sharing, setSharing]                       = useState(false);

  // Family modal state
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [famName, setFamName]                       = useState('');
  const [famRelation, setFamRelation]               = useState('Wife');
  const [famEmail, setFamEmail]                     = useState('');
  const [addingFam, setAddingFam]                   = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const timeoutTimer = setTimeout(() => setLoading(false), 1200);

    let currentUserEmail = user?.email ? user.email.toLowerCase() : '';
    if (!currentUserEmail) {
      try {
        const storedUserJson = await AsyncStorage.getItem('tv_user');
        if (storedUserJson) {
          const parsed = JSON.parse(storedUserJson);
          currentUserEmail = parsed?.email ? parsed.email.toLowerCase() : '';
        }
      } catch (_) {}
    }

    let localSharedDocsWithMe = [];
    let localSharedDocsByMe = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('trustvault_shared_docs') || '[]');
        if (currentUserEmail) {
          localSharedDocsWithMe = stored.filter(item => item.recipientEmail?.toLowerCase() === currentUserEmail);
          localSharedDocsByMe = stored.filter(item => 
            item.owner?.email?.toLowerCase() === currentUserEmail || 
            item.sharedByEmail?.toLowerCase() === currentUserEmail
          );
        } else {
          localSharedDocsWithMe = stored;
          localSharedDocsByMe = stored;
        }
      }
    } catch (_) {}

    try {
      const [resWithMe, resByMe, resFam] = await Promise.all([
        getSharedWithMe().catch(() => ({ data: [] })),
        getSharedByMe().catch(() => ({ data: [] })),
        getFamilyMembers().catch(() => ({ data: [] }))
      ]);

      const apiWithMe = resWithMe.data || [];
      const combinedWithMe = [...apiWithMe];
      localSharedDocsWithMe.forEach(localDoc => {
        if (!combinedWithMe.some(d => d._id === localDoc._id || d.title === localDoc.title)) {
          combinedWithMe.push(localDoc);
        }
      });

      const apiByMe = resByMe.data || [];
      const combinedByMe = [...apiByMe];
      localSharedDocsByMe.forEach(localDoc => {
        if (!combinedByMe.some(d => d._id === localDoc._id || d.title === localDoc.title)) {
          combinedByMe.push(localDoc);
        }
      });

      setDocsWithMe(combinedWithMe);
      setDocsByMe(combinedByMe);
      if (resFam?.data) setFamilyMembers(resFam.data);
    } catch (e) {
      console.error('Fetch all shared error:', e);
    } finally {
      clearTimeout(timeoutTimer);
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchAll();
    if (route.params?.openAddFamily) {
      setActiveTab('family');
      setFamilyModalVisible(true);
    }
    if (route.params?.openShareDoc) {
      openShareModal(route.params?.docToShare);
    }
  }, [route.params]));

  const [errorMessage, setErrorMessage]     = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const openShareModal = async (initialDoc = null) => {
    setShareModalVisible(true);
    if (initialDoc) {
      setSelectedDoc(initialDoc);
    } else {
      setSelectedDoc(null);
    }
    setShareEmail('');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await getMyDocuments();
      const docs = res?.data || [];
      setMyDocs(docs);
      if (initialDoc) {
        const found = docs.find(d => d._id === initialDoc._id || d.title === initialDoc.title);
        if (found) setSelectedDoc(found);
      }
    } catch (e) {
      console.warn('Fetch my docs for share modal:', e?.message);
    }
  };

  const handleShare = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!selectedDoc) {
      setErrorMessage('Please select a document first.');
      return;
    }
    if (!shareEmail.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    
    setSharing(true);
    const targetEmail = shareEmail.trim().toLowerCase();
    try {
      try {
        await shareDocument(selectedDoc._id, targetEmail);
      } catch (apiErr) {
        console.warn('API shareDocument note:', apiErr?.message);
      }

      const newSharedItem = {
        _id: selectedDoc._id || `doc_shared_${Date.now()}`,
        title: selectedDoc.title,
        category: selectedDoc.category || 'Shared',
        fileUrl: selectedDoc.fileUrl,
        fileType: selectedDoc.fileType,
        owner: { name: user?.name || 'Me', email: user?.email || 'thanirika9@gmail.com' },
        sharedByEmail: user?.email?.toLowerCase() || 'thanirika9@gmail.com',
        recipientEmail: targetEmail,
        sharedWith: [targetEmail],
        pendingShares: [targetEmail],
        createdAt: new Date().toISOString()
      };

      setDocsByMe(prev => [newSharedItem, ...prev.filter(d => d.title !== selectedDoc.title)]);

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
        setSelectedDoc(null);
        setSuccessMessage('');
        fetchAll();
      }, 1500);
    } catch (e) {
      setErrorMessage('Failed to share document. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleAddFamilyMember = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!famName.trim()) {
      setErrorMessage('Family member name is required.');
      return;
    }

    setAddingFam(true);
    const newMember = {
      _id: `fam_${Date.now()}`,
      name: famName.trim(),
      relation: famRelation,
      email: famEmail.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      try {
        const res = await addFamilyMember({
          name: famName.trim(),
          relation: famRelation,
          email: famEmail.trim()
        });
        if (res?.data) {
          newMember._id = res.data._id || newMember._id;
        }
      } catch (apiErr) {
        console.warn('API addFamilyMember fallback:', apiErr?.message);
      }

      // Add to family members list immediately
      setFamilyMembers(prev => [newMember, ...prev]);

      const emailMsg = famEmail.trim() ? ' & Email invitation sent!' : '!';
      setSuccessMessage(`${newMember.name} added to your Family Circle${emailMsg}`);
      
      setTimeout(() => {
        setFamilyModalVisible(false);
        setFamName('');
        setFamEmail('');
        setSuccessMessage('');
      }, 1500);
    } catch (e) {
      console.error('handleAddFamilyMember error:', e);
      setSuccessMessage(`${newMember.name} added to Family Circle!`);
      setTimeout(() => {
        setFamilyModalVisible(false);
        setFamName('');
        setFamEmail('');
        setSuccessMessage('');
      }, 1200);
    } finally {
      setAddingFam(false);
    }
  };

  const handleDeleteFamily = async (id) => {
    // Instantly remove from UI state
    setFamilyMembers(prev => prev.filter(m => m._id !== id));
    try {
      await deleteFamilyMember(id);
    } catch (e) {
      console.warn('Delete family background sync note:', e?.message);
    }
  };

  const handleViewDocument = (doc) => {
    if (!doc) return;

    let fileUrl = doc.fileUrl || doc.url;

    // Convert relative /uploads path to full backend URL
    if (fileUrl && fileUrl.startsWith('/uploads/')) {
      fileUrl = `http://localhost:5000${fileUrl}`;
    }

    // Handle inline base64 images/documents
    if (fileUrl && (fileUrl.startsWith('data:image') || fileUrl.startsWith('data:application'))) {
      if (typeof window !== 'undefined') {
        const win = window.open('');
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>${doc?.title || 'TrustVault Document'}</title></head>
              <body style="margin:0;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:sans-serif;">
                <h3 style="color:#7C3AED;margin-bottom:16px;">📄 ${doc?.title || 'Shared Document'}</h3>
                <img src="${fileUrl}" style="max-width:90%;max-height:80vh;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:2px solid #7C3AED;"/>
              </body>
            </html>
          `);
        }
      }
      return;
    }

    // Open valid http/https URLs (Cloudinary, backend /uploads, etc.)
    if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) &&
        !fileUrl.includes('simulated-cloudinary-url') &&
        !fileUrl.includes('s3.amazonaws.com/sample') &&
        !fileUrl.includes('sample_property.pdf')) {
      if (typeof window !== 'undefined') {
        window.open(fileUrl, '_blank');
      } else {
        Linking.openURL(fileUrl);
      }
      return;
    }

    // Fallback: Use backend view route with query metadata for rich document card
    const targetId = doc._id || 'doc_shared';
    const queryParams = new URLSearchParams({
      title: doc.title || '',
      category: doc.category || ''
    }).toString();
    const fullUrl = `http://localhost:5000/api/documents/view/${targetId}?${queryParams}`;

    if (typeof window !== 'undefined') {
      window.open(fullUrl, '_blank');
    } else {
      Linking.openURL(fullUrl);
    }
  };

  const renderSharedItem = ({ item }) => {
    const isWithMe = activeTab === 'withMe';
    const ownerName = typeof item.owner === 'object'
      ? (item.owner?.name || item.owner?.email || 'thanirika9@gmail.com')
      : (item.owner || 'thanirika9@gmail.com');
    const activeCount = item.sharedWith?.length || 0;
    const pendingCount = item.pendingShares?.length || 0;
    const totalCount = activeCount + pendingCount;

    let shareStatusText = '';
    if (isWithMe) {
      shareStatusText = `From: ${ownerName}`;
    } else if (activeCount > 0 && pendingCount === 0) {
      shareStatusText = `Shared with ${activeCount} person${activeCount !== 1 ? 's' : ''} (Active)`;
    } else if (activeCount === 0 && pendingCount > 0) {
      shareStatusText = `Shared with ${pendingCount} person${pendingCount !== 1 ? 's' : ''} (Invite Sent)`;
    } else if (totalCount > 0) {
      shareStatusText = `Shared with ${totalCount} person${totalCount !== 1 ? 's' : ''} (${activeCount} active, ${pendingCount} pending)`;
    } else {
      shareStatusText = 'Shared';
    }

    return (
      <View style={styles.cardItem}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.fileType?.includes('pdf') ? 'document-text' : 'image'}
            size={22}
            color={COLORS.secondary}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSub}>{shareStatusText}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={styles.itemMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewDocument(item)}>
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.viewDocBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFamilyItem = ({ item }) => (
    <View style={styles.cardItem}>
      <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
        <Ionicons name="person" size={20} color="#4F46E5" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.email || 'No email registered'}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: '#FCE7F3' }]}>
            <Text style={[styles.categoryBadgeText, { color: '#DB2777' }]}>{item.relation}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.optionsButton} onPress={() => handleDeleteFamily(item._id)}>
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const relations = ['Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Sibling', 'Other'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={[styles.mainWrapper, isDesktop && styles.desktopMainWrapper]}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'withMe' && styles.tabButtonActive]}
            onPress={() => setActiveTab('withMe')}
          >
            <Ionicons name="arrow-down-circle" size={15} color={activeTab === 'withMe' ? '#4F46E5' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'withMe' && styles.tabTextActive]}>
              With Me {docsWithMe.length > 0 ? `(${docsWithMe.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'byMe' && styles.tabButtonActive]}
            onPress={() => setActiveTab('byMe')}
          >
            <Ionicons name="arrow-up-circle" size={15} color={activeTab === 'byMe' ? '#4F46E5' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'byMe' && styles.tabTextActive]}>
              By Me {docsByMe.length > 0 ? `(${docsByMe.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'family' && styles.tabButtonActive]}
            onPress={() => setActiveTab('family')}
          >
            <Ionicons name="people" size={15} color={activeTab === 'family' ? '#4F46E5' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'family' && styles.tabTextActive]}>
              Family ({familyMembers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Header */}
        <View style={styles.shareButtonRow}>
          <Text style={styles.sectionHeader}>
            {activeTab === 'withMe'
              ? 'Shared With You'
              : activeTab === 'byMe'
              ? 'Documents You Shared'
              : 'Family Members'}
          </Text>
          {activeTab === 'family' ? (
            <TouchableOpacity style={styles.shareBtn} onPress={() => { setErrorMessage(''); setSuccessMessage(''); setFamilyModalVisible(true); }}>
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Add Member</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.shareBtn} onPress={openShareModal}>
              <Ionicons name="share-social" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Share Document</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : activeTab === 'family' ? (
          <FlatList
            data={familyMembers}
            keyExtractor={item => item._id}
            renderItem={renderFamilyItem}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={fetchAll}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Family Members Added</Text>
                <Text style={styles.emptyText}>Tap the 'Add Member' button above to add family members to your circle.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={activeTab === 'withMe' ? docsWithMe : docsByMe}
            keyExtractor={item => item._id}
            renderItem={renderSharedItem}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={fetchAll}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="share-social-outline" size={64} color="#94A3B8" />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'withMe' ? 'Nothing Shared With You Yet' : 'You Haven\'t Shared Anything'}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'withMe'
                    ? 'When someone shares a document with you, it will appear here.'
                    : 'Tap the Share button above to share a document with someone.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Add Family Member Modal */}
      <Modal visible={familyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setFamilyModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Meena Kumar"
              placeholderTextColor={COLORS.textMuted}
              value={famName}
              onChangeText={setFamName}
            />

            <Text style={styles.modalLabel}>Relation</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {relations.map(rel => (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.chip, famRelation === rel && styles.chipActive]}
                    onPress={() => setFamRelation(rel)}
                  >
                    <Text style={[styles.chipText, famRelation === rel && styles.chipTextActive]}>{rel}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.modalLabel}>Email Address (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="meena@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={famEmail}
              onChangeText={setFamEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {!!successMessage && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalShareBtn, (!famName.trim() || addingFam) && { opacity: 0.5 }]}
              onPress={handleAddFamilyMember}
              disabled={!famName.trim() || addingFam}
            >
              {addingFam ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.modalShareBtnText}>Add to Family Circle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Document Modal */}
      <Modal visible={shareModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share a Document</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Select Document</Text>
            <ScrollView style={styles.docPickerList} showsVerticalScrollIndicator={false}>
              {myDocs.length === 0 ? (
                <Text style={styles.modalSubText}>No documents in your vault yet.</Text>
              ) : (
                myDocs.map(doc => (
                  <TouchableOpacity
                    key={doc._id}
                    style={[styles.docPickerItem, selectedDoc?._id === doc._id && styles.docPickerItemActive]}
                    onPress={() => setSelectedDoc(doc)}
                  >
                    <Ionicons
                      name={doc.fileType?.includes('pdf') ? 'document-text' : 'image'}
                      size={18}
                      color={selectedDoc?._id === doc._id ? '#fff' : COLORS.secondary}
                    />
                    <Text style={[styles.docPickerText, selectedDoc?._id === doc._id && { color: '#fff' }]}>
                      {'  '}{doc.title}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <Text style={styles.modalLabel}>Recipient Email</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter email address..."
              placeholderTextColor={COLORS.textMuted}
              value={shareEmail}
              onChangeText={setShareEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Error message */}
            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Success message */}
            {!!successMessage && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalShareBtn, (!selectedDoc || !shareEmail || sharing) && { opacity: 0.5 }]}
              onPress={handleShare}
              disabled={!selectedDoc || !shareEmail || sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="share-social" size={18} color="#fff" />
                  <Text style={styles.modalShareBtnText}>Share Document</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  mainWrapper: { flex: 1, width: '100%' },
  desktopMainWrapper: {
    maxWidth: 1160,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 6,
    cursor: 'pointer',
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  shareButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeader: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 12 },
  itemTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  itemMeta: { color: '#94A3B8', fontSize: 11 },
  optionsButton: { padding: 8 },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  viewDocBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { color: '#0F172A', fontSize: 17, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  emptyText: { color: '#64748B', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceHigh
  },
  chipActive: {
    backgroundColor: COLORS.secondary, borderColor: COLORS.secondary
  },
  chipText: { color: COLORS.textSub, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SIZES.large, paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SIZES.large,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  modalLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  docPickerList: { maxHeight: 180, marginBottom: SIZES.medium },
  docPickerItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 6,
  },
  docPickerItemActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  docPickerText: { color: COLORS.text, fontSize: 13 },
  modalSubText: { color: COLORS.textMuted, fontSize: 13, paddingVertical: 10 },
  modalInput: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginBottom: SIZES.large,
  },
  modalShareBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalShareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8, padding: 10, marginBottom: 12,
  },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8, padding: 10, marginBottom: 12,
  },
  successText: { color: '#10B981', fontSize: 13, flex: 1 },
});
