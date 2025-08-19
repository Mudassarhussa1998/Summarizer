import React, { useState, useEffect } from 'react';
import './HistoryPage.css';
import { 
  getAllHistory, 
  searchHistory, 
  getHistoryByType, 
  deleteHistoryItem, 
  getHistoryStats,
  HistoryItem, 
  HistoryResponse, 
  HistoryStats,
  formatDuration,
  formatFileSize 
} from '../../api/historyApi';
import { useTheme } from '../../contexts/ThemeContext';

const HistoryPage: React.FC = () => {
  const { theme } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'url' | 'video'>('all');
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, filterType]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAllHistory();
      setHistory(data.history);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getHistoryStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.video_title?.toLowerCase().includes(searchLower)) ||
          (item.filename?.toLowerCase().includes(searchLower)) ||
          (item.transcript_content?.toLowerCase().includes(searchLower)) ||
          (item.transcript?.toLowerCase().includes(searchLower)) ||
          (item.video_url?.toLowerCase().includes(searchLower)) ||
          (item.language?.toLowerCase().includes(searchLower))
        );
      });
    }

    setFilteredHistory(filtered);
  };

  const handleDelete = async (item: HistoryItem) => {
    try {
      await deleteHistoryItem(item.type, item._id);
      setHistory(prev => prev.filter(h => h._id !== item._id));
      setShowDeleteConfirm(null);
      loadStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getItemTitle = (item: HistoryItem) => {
    return item.video_title || item.filename || 'Untitled';
  };

  const getItemDuration = (item: HistoryItem) => {
    if (item.duration) {
      return formatDuration(item.duration);
    }
    return 'Unknown';
  };

  const getTranscriptPreview = (item: HistoryItem) => {
    const content = item.transcript_content || item.transcript || '';
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  return (
    <div className="history-page" data-theme={theme}>
      <div className="history-container">
        <div className="history-header">
          <h1 className="page-title">📚 Processing History</h1>
          <p className="page-subtitle">View and manage all your video and URL processing history</p>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{stats.total_items}</div>
                <div className="stat-label">Total Items</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔗</div>
              <div className="stat-info">
                <div className="stat-value">{stats.url_transcripts}</div>
                <div className="stat-label">URL Transcripts</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.video_transcripts}</div>
                <div className="stat-label">Video Uploads</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <div className="stat-value">{stats.recent_activity.last_7_days}</div>
                <div className="stat-label">Last 7 Days</div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className="controls-section">
          <div className="search-controls">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="search-input"
            />
            <button onClick={() => setSearchTerm('')} className="clear-search">
              Clear
            </button>
          </div>

          <div className="filter-controls">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'url' | 'video')}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="url">URL Transcripts</option>
              <option value="video">Video Uploads</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading history...</p>
          </div>
        ) : (
          <div className="history-content">
            {filteredHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No History Found</h3>
                <p>
                  {searchTerm || filterType !== 'all' 
                    ? 'No items match your current filters.' 
                    : 'Start processing videos or URLs to see your history here.'}
                </p>
              </div>
            ) : (
              <div className="history-list">
                {filteredHistory.map((item) => (
                  <div key={item._id} className="history-item">
                    <div className="item-header">
                      <div className="item-type-badge" data-type={item.type}>
                        {item.type === 'url' ? '🔗' : '🎥'} {item.source}
                      </div>
                      <div className="item-actions">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="view-button"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(item._id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="item-content">
                      <h3 className="item-title">{getItemTitle(item)}</h3>
                      
                      <div className="item-meta">
                        <span className="meta-item">
                          📅 {formatDate(item.created_at)}
                        </span>
                        <span className="meta-item">
                          ⏱️ {getItemDuration(item)}
                        </span>
                        {item.language && (
                          <span className="meta-item">
                            🌐 {item.language.toUpperCase()}
                          </span>
                        )}
                        {item.word_count && (
                          <span className="meta-item">
                            📝 {item.word_count} words
                          </span>
                        )}
                      </div>

                      {item.video_url && (
                        <div className="item-url">
                          <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                            {item.video_url}
                          </a>
                        </div>
                      )}

                      <div className="transcript-preview">
                        {getTranscriptPreview(item)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this item? This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const item = history.find(h => h._id === showDeleteConfirm);
                    if (item) handleDelete(item);
                  }}
                  className="confirm-delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="modal-overlay">
            <div className="modal large">
              <div className="modal-header">
                <h3>{getItemTitle(selectedItem)}</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="close-button"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="detail-section">
                  <h4>Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Type:</strong> {selectedItem.source}
                    </div>
                    <div className="detail-item">
                      <strong>Created:</strong> {formatDate(selectedItem.created_at)}
                    </div>
                    <div className="detail-item">
                      <strong>Duration:</strong> {getItemDuration(selectedItem)}
                    </div>
                    {selectedItem.language && (
                      <div className="detail-item">
                        <strong>Language:</strong> {selectedItem.language.toUpperCase()}
                      </div>
                    )}
                    {selectedItem.word_count && (
                      <div className="detail-item">
                        <strong>Word Count:</strong> {selectedItem.word_count}
                      </div>
                    )}
                    {selectedItem.file_size && (
                      <div className="detail-item">
                        <strong>File Size:</strong> {formatFileSize(selectedItem.file_size)}
                      </div>
                    )}
                  </div>
                </div>

                {selectedItem.video_url && (
                  <div className="detail-section">
                    <h4>URL</h4>
                    <a href={selectedItem.video_url} target="_blank" rel="noopener noreferrer">
                      {selectedItem.video_url}
                    </a>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Transcript</h4>
                  <div className="transcript-full">
                    {selectedItem.transcript_content || selectedItem.transcript || 'No transcript available'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;