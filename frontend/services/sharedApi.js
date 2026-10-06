import api from './api';

export const getSharedWithMe = () => api.get('/shared/with-me').then(r => r.data);
export const getSharedByMe   = () => api.get('/shared/by-me').then(r => r.data);
export const shareDocument   = (docId, email) => api.post(`/shared/share/${docId}`, { email }).then(r => r.data);
