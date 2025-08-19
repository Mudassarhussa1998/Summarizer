import axios from './axios';

export interface HistoryItem {
  _id: string;
  type: 'url' | 'video';
  source: string;
  created_at: string;
  updated_at?: string;
  
  // URL transcript fields
  video_title?: string;
  video_url?: string;
  duration?: number;
  duration_formatted?: string;
  transcript_content?: string;
  video_info?: any;
  
  // Video upload fields
  filename?: string;
  transcript?: string;
  language?: string;
  video_data?: string;
  audio_data?: string;
  file_size?: number;
  word_count?: number;
  character_count?: number;
}

export interface HistoryResponse {
  history: HistoryItem[];
  total_count: number;
  url_count: number;
  video_count: number;
}

export interface SearchHistoryResponse {
  results: HistoryItem[];
  count: number;
  search_term: string;
}

export interface HistoryByTypeResponse {
  history: HistoryItem[];
  count: number;
  type: string;
}

export interface HistoryStats {
  total_items: number;
  url_transcripts: number;
  video_transcripts: number;
  recent_activity: {
    last_7_days: number;
    url_last_7_days: number;
    video_last_7_days: number;
  };
}

// Get all processing history
export const getAllHistory = async (): Promise<HistoryResponse> => {
  const response = await axios.get('/api/history/get-all-history');
  return response.data;
};

// Search through history
export const searchHistory = async (query: string): Promise<SearchHistoryResponse> => {
  const response = await axios.get(`/api/history/search-history?q=${encodeURIComponent(query)}`);
  return response.data;
};

// Get history by type (url or video)
export const getHistoryByType = async (type: 'url' | 'video'): Promise<HistoryByTypeResponse> => {
  const response = await axios.get(`/api/history/get-history-by-type/${type}`);
  return response.data;
};

// Delete history item
export const deleteHistoryItem = async (type: 'url' | 'video', itemId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api/history/delete-history-item/${type}/${itemId}`);
  return response.data;
};

// Get history statistics
export const getHistoryStats = async (): Promise<HistoryStats> => {
  const response = await axios.get('/api/history/get-history-stats');
  return response.data;
};

// Format duration helper
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Format file size helper
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};