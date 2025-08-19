import React from 'react';
import './YouTubePage.css';
import { validateYouTubeUrl, formatDuration, formatNumber } from '../../api/youtubeApi';
import { useTheme } from '../../contexts/ThemeContext';
import { useUrlExtraction } from '../../contexts/UrlExtractionContext';

const YouTubePage: React.FC = () => {
  const { theme } = useTheme();
  const {
    state: { url, loading, videoData, error, showFullTranscript, progress, status, canCancel },
    setUrl,
    setShowFullTranscript,
    startExtraction,
    cancelExtraction
  } = useUrlExtraction();

  const extractVideoContent = async () => {
    if (!url.trim()) {
      return;
    }

    if (!validateYouTubeUrl(url)) {
      return;
    }

    await startExtraction(url, 'captions');
  };

  const handleCancelExtraction = () => {
    cancelExtraction();
  };

  const loadFullTranscript = () => {
    setShowFullTranscript(true);
  };

  return (
    <div className="youtube-page" data-theme={theme}>
      <div className="youtube-container">
        <h1 className="page-title">YouTube Video Content Extractor</h1>
        
        <div className="input-section">
          <div className="url-input-group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="url-input"
              disabled={loading}
            />
            <div className="button-group">
              <button
                onClick={extractVideoContent}
                disabled={loading || !url.trim()}
                className="extract-button"
              >
                {loading ? 'Extracting...' : 'Extract Content'}
              </button>
              {canCancel && (
                <button
                  onClick={handleCancelExtraction}
                  className="cancel-button"
                  title="Cancel extraction"
                >
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="progress-info">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span className="progress-percentage">{progress}%</span>
                <span className="progress-status">{status}</span>
              </div>
            </div>
          </div>
        )}

        {videoData && videoData.video_info && (
          <div className="video-content">
            <div className="video-info">
              <div className="video-header">
                <img 
                  src={videoData.video_info.thumbnail || '/placeholder-thumbnail.jpg'} 
                  alt="Video thumbnail"
                  className="video-thumbnail"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-thumbnail.jpg';
                  }}
                />
                <div className="video-details">
                  <h2 className="video-title">{videoData.video_info.title || 'Untitled Video'}</h2>
                  <div className="video-meta">
                    <span className="uploader">👤 {videoData.video_info.uploader || 'Unknown'}</span>
                    <span className="duration">⏱️ {formatDuration(videoData.video_info.duration || 0)}</span>
                    <span className="views">👁️ {formatNumber(videoData.video_info.view_count || 0)} views</span>
                    <span className="upload-date">📅 {videoData.video_info.upload_date || 'Unknown date'}</span>
                  </div>
                </div>
              </div>
              
              {videoData.video_info.description && (
                <div className="video-description">
                  <h3>Description</h3>
                  <p>{videoData.video_info.description}</p>
                </div>
              )}
            </div>

            <div className="transcript-section">
              <div className="transcript-header">
                <h3>Transcript</h3>
                {!showFullTranscript && videoData.transcript_preview && (
                  <button 
                    onClick={loadFullTranscript}
                    className="load-full-button"
                  >
                    Load Full Transcript
                  </button>
                )}
              </div>
              
              <div className="transcript-content">
                {showFullTranscript ? (
                  <div className="full-transcript">
                    <p>{videoData.transcript_content || 'No transcript available'}</p>
                  </div>
                ) : (
                  <div className="transcript-preview">
                    <p>{videoData.transcript_preview || 'No transcript preview available'}</p>
                    {videoData.transcript_preview && <div className="preview-fade"></div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePage;