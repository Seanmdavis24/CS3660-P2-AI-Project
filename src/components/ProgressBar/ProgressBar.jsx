import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ 
  progress = 0, 
  showDetails = false, 
  currentFrame = null,
  className = '' 
}) => {
  const getProgressPhase = (progress) => {
    if (progress < 15) return 'Extracting frames...';
    if (progress < 80) return 'Applying style transfer...';
    if (progress < 95) return 'Reconstructing video...';
    return 'Finalizing...';
  };

  const getProgressColor = (progress) => {
    if (progress < 25) return 'from-blue-400 to-blue-600';
    if (progress < 50) return 'from-purple-400 to-purple-600';
    if (progress < 75) return 'from-pink-400 to-pink-600';
    return 'from-green-400 to-green-600';
  };

  return (
    <div className={`progress-bar-container ${className}`}>
      {showDetails && (
        <div className="progress-header">
          <span className="progress-phase">{getProgressPhase(progress)}</span>
          <span className="progress-percentage">{progress.toFixed(1)}%</span>
        </div>
      )}
      
      <div className="progress-track">
        <div 
          className={`progress-fill ${getProgressColor(progress)}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        >
          <div className="progress-shine"></div>
        </div>
        
        {/* Progress markers */}
        <div className="progress-markers">
          <div className={`marker ${progress >= 15 ? 'completed' : ''}`} style={{ left: '15%' }}>
            <div className="marker-dot"></div>
            <span className="marker-label">Frames</span>
          </div>
          <div className={`marker ${progress >= 50 ? 'completed' : ''}`} style={{ left: '50%' }}>
            <div className="marker-dot"></div>
            <span className="marker-label">Styling</span>
          </div>
          <div className={`marker ${progress >= 85 ? 'completed' : ''}`} style={{ left: '85%' }}>
            <div className="marker-dot"></div>
            <span className="marker-label">Video</span>
          </div>
        </div>
      </div>

      {showDetails && currentFrame && (
        <div className="progress-details">
          <div className="detail-item">
            <span className="detail-label">Current Frame:</span>
            <span className="detail-value">{currentFrame.index + 1} of {currentFrame.total}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Time:</span>
            <span className="detail-value">{currentFrame.timestamp.toFixed(2)}s</span>
          </div>
        </div>
      )}

      {/* Animated progress indicator */}
      {progress > 0 && progress < 100 && (
        <div className="progress-animation">
          <div className="pulse-dot" style={{ left: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;