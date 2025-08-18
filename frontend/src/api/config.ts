// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:5001',
  ENDPOINTS: {
    AUTH: '/api/auth',
    SESSION: '/api/session',
    CHAT: '/api/chat',
    UPLOAD: '/api/upload'
  }
};

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Create headers with auth token
export const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Create headers for file upload
export const createFileHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};