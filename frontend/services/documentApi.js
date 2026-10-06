import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const uploadDocument = async (formData) => {
  // Use multipart/form-data
  const response = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (err) {
    console.error('Error retrieving auth token', err);
    return null;
  }
};

export const getMyDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};
