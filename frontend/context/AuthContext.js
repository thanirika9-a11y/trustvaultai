import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInUser, registerUser, signOutUser, resetPassword } from '../services/firebaseAuth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,      setUser]    = useState(null);
  const [isLoading, setLoading] = useState(true);

  // ── Restore persisted session on cold start ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('tv_user');
        if (stored) setUser(JSON.parse(stored));
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // ── Listen for 401 unauthorized events from the API interceptor ──────────
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('tv_unauthorized', handleUnauthorized);
      return () => window.removeEventListener('tv_unauthorized', handleUnauthorized);
    }
  }, []);

  // ── Persist session helper ───────────────────────────────────────────────
  const _persist = async (userData, token) => {
    try {
      await AsyncStorage.setItem('tv_user',  JSON.stringify(userData));
      await AsyncStorage.setItem('tv_token', token || '');
    } catch (_) {}
    setUser(userData);
  };

  // ── Public API ───────────────────────────────────────────────────────────

  /** Email + password sign-in */
  const signIn = async (email, password) => {
    const res = await signInUser(email, password);
    if (res?.success && res?.data) {
      await _persist(res.data.user, res.data.accessToken);
    }
    return res;
  };

  /** Registration */
  const signUp = async (name, email, password) =>
    registerUser(name, email, password);

  /** Forgot password */
  const forgotPassword = async (email) => resetPassword(email);

  /** Logout */
  const logout = async () => {
    try { await signOutUser(); } catch (_) {}
    try { await AsyncStorage.multiRemove(['tv_user', 'tv_token']); } catch (_) {}
    setUser(null);
  };

  /** Called by OTPVerification after successful verify — sets user & navigates to dashboard */
  const login = async (userData, accessToken) =>
    _persist(userData, accessToken);

  /** Update user profile in state and AsyncStorage */
  const updateUser = async (updatedFields) => {
    const newUser = { ...user, ...updatedFields };
    try { await AsyncStorage.setItem('tv_user', JSON.stringify(newUser)); } catch (_) {}
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signIn, signUp, forgotPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
