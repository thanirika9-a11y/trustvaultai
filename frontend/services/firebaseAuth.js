/**
 * firebaseAuth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-mode authentication wrapper:
 *   1. Firebase Auth (when EXPO_PUBLIC_FIREBASE_API_KEY is set)
 *   2. Backend JWT (always attempted as secondary / main path)
 *   3. Offline simulation (when backend is also unreachable)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from './authApi';

let firebaseAuth   = null;
let useFirebase    = false;

// ── Try to initialise Firebase ───────────────────────────────────────────────
const apiKey     = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId  = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

if (apiKey && apiKey.length > 10 && projectId) {
  try {
    const { initializeApp, getApps } = require('firebase/app');
    const { getAuth }                = require('firebase/auth');
    if (getApps().length === 0) {
      initializeApp({
        apiKey,
        authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId,
        storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      });
    }
    firebaseAuth = getAuth();
    useFirebase  = true;
    console.log('[Auth] Firebase initialised');
  } catch (e) {
    console.warn('[Auth] Firebase init failed – falling back to JWT:', e.message);
  }
}

// ── Offline fallback payload ─────────────────────────────────────────────────
const _offlineFallback = (email) => ({
  success: true,
  data: {
    accessToken:  'offline_jwt',
    refreshToken: 'offline_refresh',
    user: {
      id:    'user_offline',
      name:  'Arun Kumar',
      email: email || 'arun@trustvault.com',
      role:  'owner',
    },
  },
});

// ── Sign In ──────────────────────────────────────────────────────────────────
export const signInUser = async (email, password) => {
  // 1. Firebase path
  if (useFirebase && firebaseAuth) {
    try {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      // Mirror to backend to get a signed JWT
      try {
        const local = await authApi.login({ email, password });
        if (local.success) return local;
      } catch (_) {}
      return {
        success: true,
        data: {
          accessToken:  await cred.user.getIdToken(),
          refreshToken: cred.user.refreshToken,
          user: {
            id:    cred.user.uid,
            name:  cred.user.displayName || 'User',
            email: cred.user.email,
            role:  'owner',
          },
        },
      };
    } catch (e) {
      throw new Error(e.message || 'Login failed');
    }
  }

  // 2. JWT backend path
  try {
    const res = await authApi.login({ email, password });
    if (res.success) return res;
    throw new Error(res.message || 'Login failed');
  } catch (netErr) {
    // 3. Offline fallback – backend unreachable
    if (
      netErr.message?.includes('Network') ||
      netErr.message?.includes('ECONNREFUSED') ||
      netErr.code === 'ERR_NETWORK' ||
      netErr.code === 'ECONNABORTED'
    ) {
      console.warn('[Auth] Backend unreachable – using offline simulation');
      return _offlineFallback(email);
    }
    throw netErr;
  }
};

// ── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (name, email, password) => {
  if (useFirebase && firebaseAuth) {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Also create user record on backend
      try { await authApi.register({ name, email, password }); } catch (_) {}
      return { success: true, data: { email: cred.user.email } };
    } catch (e) {
      throw new Error(e.message || 'Registration failed');
    }
  }
  // Backend path
  try {
    const res = await authApi.register({ name, email, password });
    if (res?.success) return res;
    throw new Error(res?.message || 'Registration failed');
  } catch (netErr) {
    if (
      netErr.message?.includes('Network') ||
      netErr.message?.includes('ECONNREFUSED') ||
      netErr.code === 'ERR_NETWORK' ||
      netErr.code === 'ECONNABORTED'
    ) {
      console.warn('[Auth] Backend unreachable – using offline registration fallback');
      return {
        success: true,
        data: {
          email,
          devOtp: '123456'
        }
      };
    }
    throw netErr;
  }
};

// ── Sign Out ─────────────────────────────────────────────────────────────────
export const signOutUser = async () => {
  if (useFirebase && firebaseAuth) {
    try {
      const { signOut } = require('firebase/auth');
      await signOut(firebaseAuth);
    } catch (_) {}
  }
  try {
    await AsyncStorage.multiRemove(['tv_user', 'tv_token']);
  } catch (_) {}
};

// ── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (email) => {
  if (useFirebase && firebaseAuth) {
    try {
      const { sendPasswordResetEmail } = require('firebase/auth');
      await sendPasswordResetEmail(firebaseAuth, email);
      return { success: true, message: 'Reset email sent.' };
    } catch (e) {
      throw new Error(e.message || 'Reset failed');
    }
  }
  return authApi.forgotPassword(email);
};
