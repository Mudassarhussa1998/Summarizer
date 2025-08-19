import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface VideoProcessingState {
  isProcessing: boolean;
  progress: number;
  status: string;
  videoFile: File | null;
  language: string;
  processingId: string | null;
  error: string | null;
  result: any | null;
  canCancel: boolean;
}

interface VideoProcessingContextType {
  state: VideoProcessingState;
  startProcessing: (file: File, language: string) => Promise<void>;
  cancelProcessing: () => void;
  resetState: () => void;
  updateProgress: (progress: number, status: string) => void;
}

const VideoProcessingContext = createContext<VideoProcessingContextType | undefined>(undefined);

const initialState: VideoProcessingState = {
  isProcessing: false,
  progress: 0,
  status: '',
  videoFile: null,
  language: 'en',
  processingId: null,
  error: null,
  result: null,
  canCancel: false
};

export const VideoProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<VideoProcessingState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateProgress = (progress: number, status: string) => {
    setState(prev => ({ ...prev, progress, status }));
  };

  const startProcessing = async (file: File, language: string) => {
    // Cancel any existing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const processingId = Date.now().toString();

    setState({
      ...initialState,
      isProcessing: true,
      videoFile: file,
      language,
      processingId,
      canCancel: true,
      status: 'Preparing video for processing...'
    });

    // Start progress simulation
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.random() * 8 + 2;
        setState(prev => ({ ...prev, progress: Math.min(currentProgress, 90) }));
      }
    }, 1000);

    // Update status messages
    setTimeout(() => updateProgress(currentProgress, 'Extracting audio from video...'), 2000);
    setTimeout(() => updateProgress(currentProgress, 'Transcribing audio with AI...'), 5000);
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      setTimeout(() => updateProgress(currentProgress, 'Processing large file, please wait...'), 8000);
    }

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('lang', language);
      formData.append('processing_id', processingId);

      const response = await fetch('http://127.0.0.1:5001/api/video/process_video', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      const result = await response.json();
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setState(prev => ({
        ...prev,
        progress: 100,
        status: 'Processing completed successfully!',
        result,
        canCancel: false
      }));

      // Reset processing state after showing completion
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          progress: 0,
          status: ''
        }));
      }, 2000);

    } catch (error: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      if (error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          progress: 0,
          status: 'Processing cancelled',
          error: 'Processing was cancelled by user',
          canCancel: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          progress: 0,
          status: '',
          error: error.message || 'Failed to process video',
          canCancel: false
        }));
      }
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current && state.canCancel) {
      abortControllerRef.current.abort();
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 0,
        status: 'Cancelling...',
        canCancel: false
      }));
    }
  };

  const resetState = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setState(initialState);
  };

  return (
    <VideoProcessingContext.Provider value={{
      state,
      startProcessing,
      cancelProcessing,
      resetState,
      updateProgress
    }}>
      {children}
    </VideoProcessingContext.Provider>
  );
};

export const useVideoProcessing = () => {
  const context = useContext(VideoProcessingContext);
  if (context === undefined) {
    throw new Error('useVideoProcessing must be used within a VideoProcessingProvider');
  }
  return context;
};