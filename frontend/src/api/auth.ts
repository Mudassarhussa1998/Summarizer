import api from './axios';

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  photo: string;
}) => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};
