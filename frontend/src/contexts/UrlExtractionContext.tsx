import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { TranscriptData } from '../api/youtubeApi';

interface UrlExtractionState {
  url: string;
  loading: boolean;
  videoData: TranscriptData | null;
  error: string;
  errorType?: string;
  retryAvailable?: boolean;
  showFullTranscript: boolean;
  progress: number;
  status: string;
  canCancel: boolean;
}

interface UrlExtractionContextType {
  state: UrlExtractionState;
  setUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setVideoData: (data: TranscriptData | null) => void;
  setError: (error: string) => void;
  setShowFullTranscript: (show: boolean) => void;
  setProgress: (progress: number) => void;
  setStatus: (status: string) => void;
  setCanCancel: (canCancel: boolean) => void;
  startExtraction: (url: string, method: 'captions' | 'audio') => Promise<void>;
  cancelExtraction: () => void;
  resetState: () => void;
}

const initialState: UrlExtractionState = {
  url: '',
  loading: false,
  videoData: null,
  error: '',
  errorType: undefined,
  retryAvailable: false,
  showFullTranscript: false,
  progress: 0,
  status: '',
  canCancel: false,
};

const UrlExtractionContext = createContext<UrlExtractionContextType | undefined>(undefined);

export const useUrlExtraction = () => {
  const context = useContext(UrlExtractionContext);
  if (context === undefined) {
    throw new Error('useUrlExtraction must be used within a UrlExtractionProvider');
  }
  return context;
};

interface UrlExtractionProviderProps {
  children: ReactNode;
}

export const UrlExtractionProvider: React.FC<UrlExtractionProviderProps> = ({ children }) => {
  const [state, setState] = useState<UrlExtractionState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setUrl = (url: string) => {
    setState(prev => ({ ...prev, url }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setVideoData = (videoData: TranscriptData | null) => {
    setState(prev => ({ ...prev, videoData }));
  };

  const setError = (error: string) => {
    setState(prev => ({ ...prev, error }));
  };

  const setShowFullTranscript = (showFullTranscript: boolean) => {
    setState(prev => ({ ...prev, showFullTranscript }));
  };

  const setProgress = (progress: number) => {
    setState(prev => ({ ...prev, progress }));
  };

  const setStatus = (status: string) => {
    setState(prev => ({ ...prev, status }));
  };

  const setCanCancel = (canCancel: boolean) => {
    setState(prev => ({ ...prev, canCancel }));
  };

  const simulateProgress = () => {
    const statusMessages = [
      { threshold: 0, message: 'Validating YouTube URL...' },
      { threshold: 15, message: 'Connecting to YouTube servers...' },
      { threshold: 25, message: 'Fetching video metadata...' },
      { threshold: 40, message: 'Analyzing video content...' },
      { threshold: 55, message: 'Extracting transcript data...' },
      { threshold: 70, message: 'Processing transcript content...' },
      { threshold: 85, message: 'Formatting transcript...' },
      { threshold: 95, message: 'Finalizing extraction...' }
    ];
    
    progressIntervalRef.current = setInterval(() => {
      setState(prev => {
        const currentProgress = prev.progress;
        if (currentProgress >= 95) {
          return prev; // Don't go beyond 95% until actual completion
        }
        
        // More realistic progress with variable speed
        let increment;
        if (currentProgress < 30) {
          increment = Math.random() * 4 + 2; // Faster initial progress (2-6%)
        } else if (currentProgress < 70) {
          increment = Math.random() * 2 + 1; // Slower middle progress (1-3%)
        } else {
          increment = Math.random() * 1.5 + 0.5; // Slowest final progress (0.5-2%)
        }
        
        const newProgress = Math.min(currentProgress + increment, 95);
        
        // Find appropriate status message
        const currentStatus = statusMessages
          .slice()
          .reverse()
          .find(status => newProgress >= status.threshold);
        
        return {
          ...prev,
          progress: Math.round(newProgress * 10) / 10, // Round to 1 decimal
          status: currentStatus?.message || 'Processing...'
        };
      });
    }, 400 + Math.random() * 800); // 400-1200ms intervals for more natural feel
  };

  const startExtraction = async (url: string, method: 'captions' | 'audio' = 'captions') => {
    // Reset state
    setState(prev => ({
      ...prev,
      loading: true,
      error: '',
      videoData: null,
      showFullTranscript: false,
      progress: 0,
      status: 'Starting extraction...',
      canCancel: true,
      url
    }));

    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    // Start progress simulation
    simulateProgress();

    try {
      const { extractTranscript } = await import('../api/youtubeApi');
      
      // Add a timeout warning after 30 seconds at 95%
      const timeoutWarning = setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'This is taking longer than usual. Large videos may take several minutes...'
        }));
      }, 30000);
      
      const data = await extractTranscript({ 
        url, 
        method, 
        signal: abortControllerRef.current?.signal 
      });
      
      // Clear timeout warning
      clearTimeout(timeoutWarning);
      
      // Complete progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        videoData: data,
        progress: 100,
        status: 'Extraction completed!',
        canCancel: false
      }));
    } catch (error: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Extraction cancelled',
          errorType: undefined,
          retryAvailable: false,
          progress: 0,
          status: '',
          canCancel: false
        }));
      } else {
        // Handle structured error responses from backend
        let errorMessage = 'Failed to extract video content';
        let errorType: string | undefined = undefined;
        let retryAvailable = false;
        
        if (error.response?.data) {
          const errorData = error.response.data;
          errorMessage = errorData.error || errorMessage;
          errorType = errorData.error_type;
          retryAvailable = errorData.retry_suggested || false;
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          errorType,
          retryAvailable,
          progress: 0,
          status: '',
          canCancel: false
        }));
      }
    }
  };

  const cancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    setState(prev => ({
      ...prev,
      loading: false,
      progress: 0,
      status: '',
      canCancel: false,
      error: 'Extraction cancelled'
    }));
  };

  const resetState = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(initialState);
  };

  const value: UrlExtractionContextType = {
    state,
    setUrl,
    setLoading,
    setVideoData,
    setError,
    setShowFullTranscript,
    setProgress,
    setStatus,
    setCanCancel,
    startExtraction,
    cancelExtraction,
    resetState,
  };

  return (
    <UrlExtractionContext.Provider value={value}>
      {children}
    </UrlExtractionContext.Provider>
  );
};