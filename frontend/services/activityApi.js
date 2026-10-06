import api from './api';

export const getActivities = async () => {
  const res = await api.get('/activity');
  return res.data;
};
