import api from './axios';

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  photo: string;
}) => {
  const response = await api.post('/register', data);
  return response.data;
};
