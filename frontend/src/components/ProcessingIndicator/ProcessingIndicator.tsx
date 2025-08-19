import React from 'react';
import { useVideoProcessing } from '../../contexts';
import './ProcessingIndicator.css';

const ProcessingIndicator: React.FC = () => {
  const { state } = useVideoProcessing();

  if (!state.isProcessing) {
    return null;
  }

  return (
    <div className="processing-indicator">
      <div className="processing-content">
        <div className="processing-spinner">
          <div className="spinner"></div>
        </div>
        <div className="processing-info">
          <span className="processing-title">Processing Video</span>
          <span className="processing-progress">{Math.round(state.progress)}%</span>
        </div>
        <div className="processing-status">
          {state.status}
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;