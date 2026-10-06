import api from './api';

export const getReminders = async () => {
  const res = await api.get('/reminders');
  return res.data;
};

export const getUpcomingReminders = async () => {
  const res = await api.get('/reminders/upcoming');
  return res.data;
};

export const createReminder = async (data) => {
  const res = await api.post('/reminders', data);
  return res.data;
};

export const updateReminder = async (id, data) => {
  const res = await api.put(`/reminders/${id}`, data);
  return res.data;
};

export const toggleReminder = async (id) => {
  const res = await api.put(`/reminders/${id}/toggle`);
  return res.data;
};

export const deleteReminder = async (id) => {
  const res = await api.delete(`/reminders/${id}`);
  return res.data;
};
