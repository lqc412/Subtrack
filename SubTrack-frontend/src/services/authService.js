import api from './api';

export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async ({ token, password }) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
};

export default {
  requestPasswordReset,
  resetPassword
};
