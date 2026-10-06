import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

// Attach token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('tv_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Handle 401 Unauthorized globally - clear storage and fire event (no page reload!)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.multiRemove(['tv_user', 'tv_token']);
        // Fire a custom event so AuthContext can log the user out without a page reload
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tv_unauthorized'));
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;
