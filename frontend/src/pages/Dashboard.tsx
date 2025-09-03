import React, { useState, useEffect } from 'react';
import { 
  getStructuredDataSummary, 
  getAllStructuredData, 
  exportToJSON, 
  exportToCSV,
  type StructuredDataSummary, 
  type EnhancedCategoricalVideoData 
} from '../api/youtubeApi';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<StructuredDataSummary | null>(null);
  const [videos, setVideos] = useState<EnhancedCategoricalVideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, videosData] = await Promise.all([
          getStructuredDataSummary(),
          getAllStructuredData()
        ]);
        setSummary(summaryData);
        setVideos(videosData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportJSON = async () => {
    try {
      const data = await getAllStructuredData();
      exportToJSON(data, `structured_data_${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await getAllStructuredData();
      exportToCSV(data, `structured_data_${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Data Analytics Dashboard</h1>
        <div className="export-buttons">
          <button onClick={handleExportJSON} className="export-btn json-btn">
            📄 Export JSON
          </button>
          <button onClick={handleExportCSV} className="export-btn csv-btn">
            📊 Export CSV
          </button>
        </div>
      </div>

      {summary && (
        <div className="dashboard-overview">
          <div className="overview-cards">
            <div className="overview-card">
              <h3>Total Videos</h3>
              <p className="card-value">{summary.total_videos}</p>
            </div>
            <div className="overview-card">
              <h3>Total Duration</h3>
              <p className="card-value">{summary.total_duration_hours ? summary.total_duration_hours.toFixed(1) : '0'}h</p>
            </div>
            <div className="overview-card">
              <h3>Total Words</h3>
              <p className="card-value">{summary.total_words ? summary.total_words.toLocaleString() : '0'}</p>
            </div>
            <div className="overview-card">
              <h3>Avg Sentiment</h3>
              <p className="card-value">{summary.average_sentiment !== undefined ? summary.average_sentiment.toFixed(2) : '0'}</p>
            </div>
          </div>

          <div className="analytics-section">
            <div className="analytics-card">
              <h3>Top Topics</h3>
              <div className="topic-list">
                {Object.entries(summary.top_topics).slice(0, 5).map(([topic, count]) => (
                  <div key={topic} className="topic-item">
                    <span className="topic-name">{topic}</span>
                    <span className="topic-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <h3>Top Keywords</h3>
              <div className="keyword-list">
                {summary.top_keywords ? Object.entries(summary.top_keywords).slice(0, 8).map(([keyword, count]) => (
                  <span key={keyword} className="keyword-tag">
                    {keyword} ({count})
                  </span>
                )) : <p>No keywords data available</p>}
              </div>
            </div>

            <div className="analytics-card">
              <h3>Sentiment Distribution</h3>
              <div className="sentiment-bars">
                <div className="sentiment-bar">
                  <span>Positive</span>
                  <div className="bar positive" style={{width: `${summary.sentiment_distribution?.positive || 0}%`}}></div>
                  <span>{summary.sentiment_distribution?.positive || 0}%</span>
                </div>
                <div className="sentiment-bar">
                  <span>Neutral</span>
                  <div className="bar neutral" style={{width: `${summary.sentiment_distribution?.neutral || 0}%`}}></div>
                  <span>{summary.sentiment_distribution?.neutral || 0}%</span>
                </div>
                <div className="sentiment-bar">
                  <span>Negative</span>
                  <div className="bar negative" style={{width: `${summary.sentiment_distribution?.negative || 0}%`}}></div>
                  <span>{summary.sentiment_distribution?.negative || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="videos-section">
        <h2>Video Library</h2>
        <div className="videos-grid">
          {videos.map((video) => (
            <div key={video.video_id} className="video-card">
              <div className="video-header">
                <h3>{video.name}</h3>
                <span className={`sentiment-badge ${video.sentiment.label}`}>
                  {video.sentiment.label}
                </span>
              </div>
              <div className="video-meta">
                <p><strong>Duration:</strong> {video.duration_formatted}</p>
                <p><strong>Words:</strong> {video.word_count ? video.word_count.toLocaleString() : '0'}</p>
                <p><strong>Language:</strong> {video.language}</p>
                <p><strong>Readability:</strong> {video.structured_data && video.structured_data.readability_score !== undefined ? video.structured_data.readability_score.toFixed(1) : 'N/A'}</p>
              </div>
              <div className="video-topics">
                <strong>Topics:</strong>
                <div className="topic-tags">
                  {video.topics.slice(0, 3).map((topic, index) => (
                    <span key={index} className="topic-tag">{topic}</span>
                  ))}
                </div>
              </div>
              <div className="video-keywords">
                <strong>Keywords:</strong>
                <div className="keyword-tags">
                  {video.keywords.slice(0, 5).map((keyword, index) => (
                    <span key={index} className="keyword-tag-small">{keyword}</span>
                  ))}
                </div>
              </div>
              <div className="video-actions">
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="view-video-btn">
                  View Video
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;