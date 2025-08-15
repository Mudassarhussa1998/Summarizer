import api from './axios'

export const loginuser = async (email: string, password: string) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};
