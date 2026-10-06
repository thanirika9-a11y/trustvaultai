import api from './api';

/**
 * Fetch the dashboard aggregated data
 */
export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

/**
 * Trigger backend database seeding for demo display
 */
export const seedDashboard = async () => {
  const response = await api.post('/dashboard/seed');
  return response.data;
};
