import api from './api';

export const chatWithAI = async (message, chatHistory) => {
  const response = await api.post('/ai/chat', { message, chatHistory });
  return response.data;
};
