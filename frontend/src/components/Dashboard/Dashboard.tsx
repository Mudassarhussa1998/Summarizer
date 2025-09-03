import React, { useState, useEffect } from 'react';
import { getStructuredDataSummary, getAllStructuredData, StructuredDataSummary, EnhancedCategoricalVideoData } from '../../api/youtubeApi';
import './Dashboard.css';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const [summary, setSummary] = useState<StructuredDataSummary | null>(null);
  const [videos, setVideos] = useState<EnhancedCategoricalVideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'analytics'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryData, videosData] = await Promise.all([
        getStructuredDataSummary(),
        getAllStructuredData()
      ]);
      
      setSummary(summaryData);
      setVideos(videosData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return '#10b981'; // green
    if (sentiment < -0.1) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.1) return 'Positive';
    if (sentiment < -0.1) return 'Negative';
    return 'Neutral';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Content Analytics Dashboard</h1>
        <p>Insights from your extracted video content</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos ({videos.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && summary && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Videos</h3>
                <p className="stat-number">{summary.total_videos}</p>
              </div>
              <div className="stat-card">
                <h3>Total Duration</h3>
                <p className="stat-number">{summary.total_duration_hours}h</p>
              </div>
              <div className="stat-card">
                <h3>Total Words</h3>
                <p className="stat-number">{summary.total_words ? summary.total_words.toLocaleString() : '0'}</p>
              </div>
              <div className="stat-card">
                <h3>Avg Sentiment</h3>
                <p 
                  className="stat-number"
                  style={{ color: getSentimentColor(summary.average_sentiment) }}
                >
                  {getSentimentLabel(summary.average_sentiment)}
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insight-card">
                <h3>Top Topics</h3>
                <div className="topic-list">
                  {summary.top_topics ? Object.entries(summary.top_topics).map(([topic, count]) => (
                    <div key={topic} className="topic-item">
                      <span className="topic-name">{topic}</span>
                      <span className="topic-count">{count}</span>
                    </div>
                  )) : <p>No topics data available</p>}
                </div>
              </div>

              <div className="insight-card">
                <h3>Top Keywords</h3>
                <div className="keyword-list">
                  {summary.top_keywords ? Object.entries(summary.top_keywords).slice(0, 8).map(([keyword, count]) => (
                    <span key={keyword} className="keyword-tag">
                      {keyword} ({count})
                    </span>
                  )) : <p>No keywords data available</p>}
                </div>
              </div>

              <div className="insight-card">
                <h3>Sentiment Distribution</h3>
                <div className="sentiment-chart">
                  <div className="sentiment-bar">
                    <div 
                      className="sentiment-segment positive"
                      style={{ 
                        width: `${summary.sentiment_distribution && summary.total_videos ? (summary.sentiment_distribution.positive / summary.total_videos) * 100 : 0}%` 
                      }}
                    ></div>
                    <div 
                      className="sentiment-segment neutral"
                      style={{ 
                        width: `${summary.sentiment_distribution && summary.total_videos ? (summary.sentiment_distribution.neutral / summary.total_videos) * 100 : 0}%` 
                      }}
                    ></div>
                    <div 
                      className="sentiment-segment negative"
                      style={{ 
                        width: `${summary.sentiment_distribution && summary.total_videos ? (summary.sentiment_distribution.negative / summary.total_videos) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="sentiment-legend">
                    <span className="legend-item positive">
                      Positive ({summary.sentiment_distribution ? summary.sentiment_distribution.positive : 0})
                    </span>
                    <span className="legend-item neutral">
                      Neutral ({summary.sentiment_distribution ? summary.sentiment_distribution.neutral : 0})
                    </span>
                    <span className="legend-item negative">
                      Negative ({summary.sentiment_distribution ? summary.sentiment_distribution.negative : 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="videos-tab">
            <div className="videos-grid">
              {videos.map((video) => (
                <div key={video.video_id} className="video-card">
                  <div className="video-header">
                    <h4 className="video-title">{video.name}</h4>
                    <span className="video-duration">{video.duration_formatted}</span>
                  </div>
                  
                  <div className="video-meta">
                    <span className="video-words">{video.word_count ? video.word_count.toLocaleString() : '0'} words</span>
                    <span 
                      className="video-sentiment"
                      style={{ color: getSentimentColor(video.sentiment.score) }}
                    >
                      {video.sentiment.label}
                    </span>
                    <span className="video-language">{video.language || 'N/A'}</span>
                  </div>

                  <div className="video-topics">
                    {video.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="topic-badge">{topic}</span>
                    ))}
                  </div>

                  <div className="video-keywords">
                    {video.keywords.slice(0, 5).map((keyword) => (
                      <span key={keyword} className="keyword-badge">{keyword}</span>
                    ))}
                  </div>

                  <div className="video-actions">
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-video-btn"
                    >
                      View Video
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && summary && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Content Analysis</h3>
                <div className="analytics-stats">
                  <div className="analytics-stat">
                    <span className="stat-label">Average Words per Video:</span>
                    <span className="stat-value">
                      {summary.total_words && summary.total_videos ? Math.round(summary.total_words / summary.total_videos) : 0}
                    </span>
                  </div>
                  <div className="analytics-stat">
                    <span className="stat-label">Average Duration per Video:</span>
                    <span className="stat-value">
                      {summary.total_duration_hours && summary.total_videos ? Math.round((summary.total_duration_hours * 60) / summary.total_videos) : 0} min
                    </span>
                  </div>
                  <div className="analytics-stat">
                    <span className="stat-label">Most Common Topic:</span>
                    <span className="stat-value">
                      {summary.top_topics && Object.keys(summary.top_topics).length > 0 ? Object.keys(summary.top_topics)[0] : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Language Distribution</h3>
                <div className="language-stats">
                  {Array.from(new Set(videos.map(v => v.language).filter(Boolean))).map(lang => (
                    <div key={lang} className="language-item">
                      <span className="language-name">{lang ? lang.toUpperCase() : 'N/A'}</span>
                      <span className="language-count">
                        {videos.filter(v => v.language === lang).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;