import React from 'react';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  status: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'linear';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status,
  showPercentage = true,
  size = 'medium',
  variant = 'circular'
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  if (variant === 'linear') {
    return (
      <div className={`progress-container linear ${size}`}>
        <div className="progress-info">
          <span className="progress-status">{status}</span>
          {showPercentage && (
            <span className="progress-percentage">{Math.round(clampedProgress)}%</span>
          )}
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // Circular progress
  const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
  const strokeWidth = size === 'small' ? 3 : size === 'large' ? 5 : 4;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`progress-container circular ${size}`}>
      <div className="progress-circle-container">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="progress-circle"
        >
          <circle
            stroke="var(--border-color)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="progress-circle-bg"
          />
          <circle
            stroke="var(--primary-color)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="progress-circle-fill"
          />
        </svg>
        {showPercentage && (
          <div className="progress-circle-text">
            <span className="progress-percentage">{Math.round(clampedProgress)}%</span>
          </div>
        )}
      </div>
      <div className="progress-status">{status}</div>
    </div>
  );
};

export default ProgressIndicator;