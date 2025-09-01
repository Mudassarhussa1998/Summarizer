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

export interface CategoricalVideoData {
  video_id: string;
  name: string;
  url: string;
  description: string;
  transcript: string;
  duration: number;
  duration_formatted: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  source_type: string;
  source_id: string;
  word_count: number;
  character_count: number;
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

// Get all categorical videos
export const getCategoricalVideos = async (): Promise<CategoricalVideoData[]> => {
  const response = await axios.get('/api/url-extraction/get-categorical-videos');
  return response.data.videos;
};

// Get categorical video by ID
export const getCategoricalVideoById = async (videoId: string): Promise<CategoricalVideoData> => {
  const response = await axios.get(`/api/url-extraction/get-categorical-video/${videoId}`);
  return response.data.video;
};

// Search categorical videos
export const searchCategoricalVideos = async (query: string): Promise<CategoricalVideoData[]> => {
  const response = await axios.get(`/api/url-extraction/search-categorical-videos?q=${encodeURIComponent(query)}`);
  return response.data.results;
};

// Delete categorical video
export const deleteCategoricalVideo = async (videoId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api/url-extraction/delete-categorical-video/${videoId}`);
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


export interface StructuredData {
  keywords: string[];
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  topics: string[];
  key_phrases: string[];
  language_detected: string;
  readability_score: number;
}

export interface StructuredDataSummary {
  total_videos: number;
  total_duration_hours: number;
  total_words: number;
  top_topics: Record<string, number>;
  top_keywords: Record<string, number>;
  average_sentiment: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface EnhancedCategoricalVideoData extends CategoricalVideoData {
  structured_data: StructuredData;
  keywords: string[];
  topics: string[];
  sentiment: {
    score: number;
    label: string;
  };
  language: string;
}

// Get structured data summary
export const getStructuredDataSummary = async (): Promise<StructuredDataSummary> => {
  const response = await axios.get('/api/url-extraction/get-structured-summary');
  return response.data.summary;
};

// Get all structured data
export const getAllStructuredData = async (): Promise<EnhancedCategoricalVideoData[]> => {
  const response = await axios.get('/api/url-extraction/get-all-structured-data');
  return response.data.videos;
};

// Export utility functions
export const exportToJSON = (data: any, filename: string = 'structured_data') => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: EnhancedCategoricalVideoData[], filename: string = 'structured_data') => {
  if (!data || data.length === 0) return;
  
  const headers = [
    'Video ID', 'Name', 'URL', 'Duration', 'Word Count', 'Character Count',
    'Keywords', 'Topics', 'Sentiment Score', 'Sentiment Label', 'Language',
    'Key Phrases', 'Readability Score', 'Created At'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(video => [
      `"${video.video_id}"`,
      `"${video.name.replace(/"/g, '""')}"`,
      `"${video.url}"`,
      video.duration,
      video.word_count,
      video.character_count,
      `"${video.keywords.join('; ')}"`,
      `"${video.topics.join('; ')}"`,
      video.sentiment.score,
      `"${video.sentiment.label}"`,
      `"${video.language}"`,
      `"${video.structured_data.key_phrases.join('; ')}"`,
      video.structured_data.readability_score,
      `"${video.created_at}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};