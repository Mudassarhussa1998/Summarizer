const API_BASE_URL = 'http://127.0.0.1:5001';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Create headers with auth token
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Create headers for file upload
const createFileHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Session API
export const sessionApi = {
  // Create a new session
  createSession: async (name?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/session/create-session`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  // Get all user sessions
  getSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/session/sessions`, {
      method: 'GET',
      headers: createHeaders()
    });
    return response.json();
  },

  // Get specific session
  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/session/session/${sessionId}`, {
      method: 'GET',
      headers: createHeaders()
    });
    return response.json();
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/session/delete-session/${sessionId}`, {
      method: 'DELETE',
      headers: createHeaders()
    });
    return response.json();
  }
};

// Chat API
export const chatApi = {
  // Send a message
  sendMessage: async (sessionId: string, message: string, type: string = 'text', fileData?: string, fileName?: string, fileSize?: number) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/send-message`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        session_id: sessionId,
        message,
        type,
        file_data: fileData,
        file_name: fileName,
        file_size: fileSize
      })
    });
    return response.json();
  },

  // Get messages for a session
  getMessages: async (sessionId: string, page: number = 1, limit: number = 50) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/messages/${sessionId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders()
    });
    return response.json();
  },

  // Delete a message
  deleteMessage: async (messageId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/delete-message/${messageId}`, {
      method: 'DELETE',
      headers: createHeaders()
    });
    return response.json();
  },

  // Add AI response (for future use)
  addAiResponse: async (sessionId: string, response: string) => {
    const responseData = await fetch(`${API_BASE_URL}/api/chat/add-ai-response`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        session_id: sessionId,
        response
      })
    });
    return responseData.json();
  }
};

// Upload API
export const uploadApi = {
  // Upload file using FormData
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload/upload-file`, {
      method: 'POST',
      headers: createFileHeaders(),
      body: formData
    });
    return response.json();
  },

  // Upload base64 file data
  uploadBase64: async (fileData: string, filename: string) => {
    const response = await fetch(`${API_BASE_URL}/api/upload/upload-base64`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        file_data: fileData,
        filename
      })
    });
    return response.json();
  },

  // Validate file
  validateFile: async (filename: string, fileSize: number) => {
    const response = await fetch(`${API_BASE_URL}/api/upload/validate-file`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        filename,
        file_size: fileSize
      })
    });
    return response.json();
  },

  // Get supported formats
  getSupportedFormats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/upload/supported-formats`, {
      method: 'GET'
    });
    return response.json();
  }
};

// Types
export interface Session {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  message: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  timestamp: string;
  sender: 'user' | 'ai';
  file_name?: string;
  file_size?: number;
  file_data?: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  mime_type: string;
  size: number;
  data: string;
  uploaded_at: string;
}