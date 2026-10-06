import api from './api';

export const register  = (data) => api.post('/auth/register', data).then(r => r.data);
export const verifyOTP = (email, otp) => api.post('/auth/verify-otp', { email, otp }).then(r => r.data);
export const login     = (data) => api.post('/auth/login', data).then(r => r.data);
export const getMe     = () => api.get('/auth/me').then(r => r.data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then(r => r.data);
export const updateProfile = (data) => api.put('/auth/me', data).then(r => r.data);
export const resetPassword = (data) => api.post('/auth/reset-password', data).then(r => r.data);
