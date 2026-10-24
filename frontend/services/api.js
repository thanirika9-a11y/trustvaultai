import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use env var if set (injected at Vercel build time), otherwise fall back to the
// deployed Render backend so the production app always connects correctly.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://trustvault-api.onrender.com/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 60000 }); // 60s timeout (Render free tier wakes slowly)

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
