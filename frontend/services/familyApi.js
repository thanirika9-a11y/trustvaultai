import api from './api';

export const getFamilyMembers = () =>
  api.get('/family').catch(() => api.get('/shared/family')).then(r => r.data);

export const addFamilyMember = (data) =>
  api.post('/family', data).catch(() => api.post('/shared/family', data)).then(r => r.data);

export const deleteFamilyMember = (id) =>
  api.delete(`/family/${id}`).catch(() => api.delete(`/shared/family/${id}`)).then(r => r.data);
