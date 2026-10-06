import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocument } from '../services/documentApi';
import { COLORS, SIZES } from '../constants/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const CATEGORIES = ['Identity', 'Banking and Finance', 'Loans', 'Insurance', 'Medical', 'Other'];

export default function AddDocument({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Other');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (route.params?.capturedPhoto) {
      setSelectedFile(route.params.capturedPhoto);
      if (!title) {
        setTitle(`Scanned Doc ${new Date().toLocaleDateString()}`);
      }
    }
  }, [route.params?.capturedPhoto]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      setSelectedFile({
        uri: asset.uri,
        name: fileName,
        type: asset.mimeType || 'image/jpeg',
        file: asset.file || null
      });
      if (!title) {
        const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handlePickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
        file: asset.file || null
      });
      if (!title && asset.name) {
        const cleanName = asset.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleUpload = async () => {
    if (!title) {
      if (Platform.OS === 'web') window.alert('Please enter a Document Title');
      else Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!selectedFile) {
      if (Platform.OS === 'web') window.alert('Please select a file');
      else Alert.alert('Error', 'Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      
      // Append file correctly depending on platform (Web vs Mobile)
      if (Platform.OS === 'web') {
        if (selectedFile.file) {
          formData.append('document', selectedFile.file);
        } else {
          // Fallback: Fetch blob from local URI
          const response = await fetch(selectedFile.uri);
          const blob = await response.blob();
          formData.append('document', blob, selectedFile.name);
        }
      } else {
        formData.append('document', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        });
      }

      const response = await uploadDocument(formData);
      if (response.success) {
        if (Platform.OS === 'web') window.alert('✅ Document uploaded successfully!');
        else Alert.alert('Success', 'Document uploaded successfully');
        // Reset form
        setTitle('');
        setCategory('Other');
        setSelectedFile(null);
        // Navigate to Dashboard and force refresh via timestamp param
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        // Also navigate to Home tab so useFocusEffect re-triggers and storage updates
        setTimeout(() => {
          navigation.navigate('Home', { refreshKey: Date.now() });
        }, 200);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Upload failed. Please try again.';
      if (Platform.OS === 'web') window.alert('Upload Failed: ' + msg);
      else Alert.alert('Upload Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Back button */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Document</Text>
      </View>
      
      <CustomInput 
        label="Document Title" 
        placeholder="e.g. Aadhaar Card, Home Loan" 
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Select File</Text>
      
      {selectedFile ? (
        <View style={styles.filePreview}>
          <Ionicons name="document" size={40} color={COLORS.primary} />
          <Text style={styles.fileName}>{selectedFile.name}</Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CameraScan')}>
            <Ionicons name="camera" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePickImage}>
            <Ionicons name="image" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePickDocument}>
            <Ionicons name="document-text" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>Files</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomButton 
        title={loading ? "Analyzing & Uploading..." : "Upload Document"} 
        onPress={handleUpload} 
        loading={loading}
        disabled={!selectedFile || !title}
        style={{ marginTop: SIZES.xlarge }}
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
        <Text style={styles.cancelBtnText}>Cancel & Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.large,
  },
  title: {
    fontSize: SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.large,
  },
  label: {
    marginBottom: 8,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: SIZES.medium,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.medium,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 14,
  },
  categoryTextActive: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.small,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    padding: SIZES.large,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    marginTop: 8,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.medium,
    borderRadius: SIZES.radius,
    marginTop: SIZES.small,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileName: {
    flex: 1,
    marginLeft: SIZES.medium,
    color: COLORS.text,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.large,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: COLORS.textMuted || '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  }
});
