import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar, Image, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { updateProfile } from '../services/authApi';
import CustomInput from '../components/CustomInput';
import { COLORS, SIZES } from '../constants/theme';

export default function EditProfile({ navigation }) {
  const { user, updateUser } = useContext(AuthContext);
  const [name, setName]   = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);

  const handlePickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setAvatarUri(imageUri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    if (!email.trim()) return Alert.alert('Error', 'Email cannot be empty');
    setSaving(true);
    try {
      // 1. Update state & storage immediately
      await updateUser({ name: name.trim(), email: email.trim(), avatar: avatarUri });

      // 2. Sync to backend API
      try {
        const res = await updateProfile({ name: name.trim(), email: email.trim(), avatar: avatarUri });
        if (res?.success && res?.data) {
          await updateUser({ name: res.data.name, email: res.data.email, avatar: res.data.avatar || avatarUri });
        }
      } catch (apiErr) {
        console.warn('API update fallback to local state:', apiErr);
      }

      if (Platform.OS === 'web') {
        window.alert('Profile updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      if (Platform.OS === 'web') window.alert(e.message || 'Failed to update profile');
      else Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Avatar area */}
      <View style={styles.avatarArea}>
        <TouchableOpacity style={styles.avatarCircle} onPress={handlePickAvatar} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase() || 'U'}</Text>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickAvatar}>
          <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <CustomInput
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />
        <View style={{ height: 12 }} />
        <CustomInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SIZES.large, paddingBottom: 40 },
  avatarArea: { alignItems: 'center', marginTop: SIZES.large, marginBottom: SIZES.xlarge },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.primary,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  avatarInitial: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  changeAvatarText: { color: COLORS.textMuted, fontSize: 13, marginTop: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.xlarge,
  },
  saveBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
