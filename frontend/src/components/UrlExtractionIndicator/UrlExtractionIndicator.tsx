import React from 'react';
import { useUrlExtraction } from '../../contexts/UrlExtractionContext';
import './UrlExtractionIndicator.css';

const UrlExtractionIndicator: React.FC = () => {
  const { state } = useUrlExtraction();

  if (!state.loading) {
    return null;
  }

  return (
    <div className="url-extraction-indicator">
      <div className="url-extraction-content">
        <div className="url-extraction-spinner"></div>
        <div className="url-extraction-info">
          <span className="url-extraction-progress">{state.progress}%</span>
          <span className="url-extraction-status">{state.status}</span>
        </div>
      </div>
    </div>
  );
};

export default UrlExtractionIndicator;