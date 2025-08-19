import axios from './axios';

export interface VideoInfo {
  title: string;
  duration: number;
  uploader: string;
  description: string;
  thumbnail: string;
  upload_date: string;
  view_count: number;
}

export interface TranscriptData {
  transcript_id: string;
  video_info: VideoInfo;
  transcript_preview: string;
  transcript_content: string;
  message: string;
}

export interface TranscriptResponse {
  transcript_id: string;
  video_title: string;
  video_url: string;
  duration: number;
  transcript_content: string;
  video_info: VideoInfo;
  created_at: string;
}

export interface ExtractTranscriptRequest {
  url: string;
  method: 'captions' | 'audio';
  signal?: AbortSignal;
}

export interface GetVideoInfoRequest {
  url: string;
}

// Extract transcript from YouTube URL
export const extractTranscript = async (data: ExtractTranscriptRequest): Promise<TranscriptData> => {
  const { signal, ...requestData } = data;
  const response = await axios.post('/api/url-extraction/extract-transcript', requestData, {
    signal,
    timeout: 300000 // 5 minutes timeout
  });
  return response.data;
};

// Get video information without extracting transcript
export const getVideoInfo = async (data: GetVideoInfoRequest): Promise<VideoInfo> => {
  const response = await axios.post('/api/url-extraction/get-video-info', data);
  return response.data;
};

// Get transcript by ID
export const getTranscriptById = async (transcriptId: string): Promise<TranscriptResponse> => {
  const response = await axios.get(`/api/url-extraction/get-transcript/${transcriptId}`);
  return response.data;
};

// Search transcripts
export const searchTranscripts = async (query: string): Promise<TranscriptResponse[]> => {
  const response = await axios.get(`/api/url-extraction/search-transcripts?q=${encodeURIComponent(query)}`);
  return response.data;
};

// Get all transcripts
export const getAllTranscripts = async (): Promise<TranscriptResponse[]> => {
  const response = await axios.get('/api/url-extraction/get-all-transcripts');
  return response.data;
};

// Delete transcript
export const deleteTranscript = async (transcriptId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api/url-extraction/delete-transcript/${transcriptId}`);
  return response.data;
};

// Validate YouTube URL
export const validateYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

// Extract video ID from YouTube URL
export const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Format duration from seconds to readable format
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Format large numbers (views, etc.)
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};