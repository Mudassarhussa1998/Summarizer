import React, { useState, useRef, useEffect } from 'react';
import './VideoUpload.css';
import { useTheme } from '../../contexts/ThemeContext';
import { useVideoProcessing } from '../../contexts';
import { ProgressIndicator } from '../ProgressIndicator';

interface VideoData {
  transcript_id: string;
  video_filename: string;
  duration: number;
  duration_formatted: string;
  transcribed_text: string;
  word_count: number;
  character_count: number;
  language: string;
}

const VideoUpload: React.FC = () => {
  const { theme } = useTheme();
  const { state: processingState, startProcessing, cancelProcessing, resetState } = useVideoProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with processing context
  useEffect(() => {
    if (processingState.result) {
      setVideoData(processingState.result);
      setError('');
    }
    if (processingState.error) {
      setError(processingState.error);
      setVideoData(null);
    }
  }, [processingState.result, processingState.error]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a valid video file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a valid video file');
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setVideoData(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processVideo = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    setError('');
    setVideoData(null);
    await startProcessing(selectedFile, language);
  };

  const handleCancelProcessing = () => {
    cancelProcessing();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="video-upload-page" data-theme={theme}>
      <div className="video-upload-container">
        <div className="upload-header">
          <h1 className="page-title">
            <span className="upload-icon">🎥</span>
            Video Transcription Studio
          </h1>
          <p className="page-subtitle">Upload your video and get AI-powered transcription</p>
        </div>

        <div className="upload-section">
          {!selectedFile ? (
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <div className="upload-content">
                <div className="upload-icon-large">📁</div>
                <h3>Drag and drop your video here</h3>
                <p>or click to browse files</p>
                <div className="supported-formats">
                  <span>Supported formats: MP4, AVI, MOV, MKV</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="file-selected">
              <div className="file-info">
                <div className="file-icon">🎬</div>
                <div className="file-details">
                  <h3>{selectedFile.name}</h3>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
                <button className="remove-file" onClick={removeFile}>
                  ✕
                </button>
              </div>
              
              <div className="language-selector">
                <label htmlFor="language">Transcription Language:</label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={processingState.isProcessing}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div className="button-group">
                <button
                  className="process-button"
                  onClick={processVideo}
                  disabled={processingState.isProcessing}
                >
                  {processingState.isProcessing ? (
                    <>
                      <span className="loading-spinner"></span>
                      Processing Video...
                    </>
                  ) : (
                    <>
                      <span className="process-icon">⚡</span>
                      Start Transcription
                    </>
                  )}
                </button>

                {processingState.isProcessing && processingState.canCancel && (
                  <button
                    className="cancel-button"
                    onClick={handleCancelProcessing}
                  >
                    <span className="cancel-icon">✕</span>
                    Cancel
                  </button>
                )}
              </div>

              {processingState.isProcessing && (
                <div className="progress-section">
                  <ProgressIndicator
                    progress={processingState.progress}
                    variant="linear"
                    size="medium"
                    showPercentage={true}
                    status={processingState.status}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {processingState.isProcessing && (
          <div className="processing-status">
            <div className="processing-animation">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
            <p>Processing your video... This may take a few minutes.</p>
          </div>
        )}

        {videoData && (
          <div className="results-section">
            <div className="video-results">
              <div className="result-header">
                <h2>✅ Transcription Complete!</h2>
                <div className="video-stats">
                  <div className="stat">
                    <span className="stat-label">Duration:</span>
                    <span className="stat-value">{videoData.duration_formatted}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Words:</span>
                    <span className="stat-value">{videoData.word_count ? videoData.word_count.toLocaleString() : '0'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Characters:</span>
                    <span className="stat-value">{videoData.character_count ? videoData.character_count.toLocaleString() : '0'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Language:</span>
                    <span className="stat-value">{videoData.language ? videoData.language.toUpperCase() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="transcript-section">
                <div className="transcript-header">
                  <h3>📝 Transcript</h3>
                  <button
                    className="toggle-transcript"
                    onClick={() => setShowFullTranscript(!showFullTranscript)}
                  >
                    {showFullTranscript ? 'Show Less' : 'Show Full Transcript'}
                  </button>
                </div>
                
                <div className="transcript-content">
                  <p>
                    {showFullTranscript 
                      ? videoData.transcribed_text 
                      : truncateText(videoData.transcribed_text, 500)
                    }
                  </p>
                </div>
              </div>

              <div className="action-buttons">
                <button className="action-btn primary">
                  💾 Save Transcript
                </button>
                <button className="action-btn secondary">
                  📋 Copy to Clipboard
                </button>
                <button className="action-btn secondary">
                  📥 Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;