import React, { useRef } from 'react';
import { Eye, Download, Play, Pause, RotateCcw, Share2, CheckCircle, Clock } from 'lucide-react';
import { useVideoProcessor } from '../../hooks/useVideoProcessor';
import ProgressBar from '../ProgressBar/ProgressBar';
import './PreviewSection.css';

const PreviewSection = () => {
  const {
    videoFile,
    processedVideo,
    isProcessing,
    progress,
    processedFrames,
    totalFrames,
    currentFrame,
    processingStats,
    selectedStyle,
    styleStrength,
    quality,
    actions
  } = useVideoProcessor();

  const originalVideoRef = useRef(null);
  const processedVideoRef = useRef(null);

  const downloadVideo = () => {
    if (processedVideo) {
      const a = document.createElement('a');
      a.href = processedVideo;
      a.download = `styled_video_${selectedStyle}_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      actions.setSuccess('Video downloaded successfully!');
    }
  };

  const shareVideo = async () => {
    if (processedVideo && navigator.share) {
      try {
        // Convert blob URL to actual blob for sharing
        const response = await fetch(processedVideo);
        const blob = await response.blob();
        const file = new File([blob], `styled_video_${selectedStyle}.mp4`, { type: 'video/mp4' });
        
        await navigator.share({
          title: 'My Styled Video',
          text: `Check out my video with ${selectedStyle} style!`,
          files: [file]
        });
      } catch (error) {
        console.log('Sharing failed:', error);
        // Fallback to copying link
        copyVideoLink();
      }
    } else {
      copyVideoLink();
    }
  };

  const copyVideoLink = () => {
    if (processedVideo) {
      navigator.clipboard.writeText(processedVideo);
      actions.setSuccess('Video link copied to clipboard!');
    }
  };

  const resetProcessing = () => {
    actions.resetProcessing();
    actions.setProcessedVideo(null);
  };

  return (
    <div className="preview-section glass-card">
      <h2 className="section-title">
        <Eye className="section-icon" />
        Preview & Download
      </h2>

      {/* Processing Progress */}
      {isProcessing && (
        <div className="processing-container">
          <div className="processing-header">
            <h3 className="processing-title">
              <div className="processing-spinner"></div>
              Transforming Your Video
            </h3>
            <div className="processing-stats">
              <span>{processedFrames}/{totalFrames} frames</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
          </div>
          
          <ProgressBar 
            progress={progress} 
            showDetails={true}
            currentFrame={currentFrame}
          />

          {/* Current Frame Info */}
          {currentFrame && (
            <div className="current-frame-info">
              <div className="frame-details">
                <span className="frame-label">Processing Frame:</span>
                <span className="frame-value">{currentFrame.index + 1}</span>
              </div>
              <div className="frame-details">
                <span className="frame-label">Timestamp:</span>
                <span className="frame-value">{currentFrame.timestamp.toFixed(2)}s</span>
              </div>
            </div>
          )}

          {/* Processing Settings Summary */}
          <div className="processing-summary">
            <div className="summary-item">
              <span>Style:</span>
              <span className="summary-value">{selectedStyle}</span>
            </div>
            <div className="summary-item">
              <span>Strength:</span>
              <span className="summary-value">{styleStrength}%</span>
            </div>
            <div className="summary-item">
              <span>Quality:</span>
              <span className="summary-value">{quality}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Previews */}
      <div className="video-previews">
        {/* Original Video */}
        {videoFile && (
          <div className="video-preview-container">
            <div className="video-label">
              <span>Original Video</span>
              {processingStats.duration && (
                <span className="video-duration">{processingStats.duration}s</span>
              )}
            </div>
            <div className="video-wrapper">
              <video
                ref={originalVideoRef}
                src={URL.createObjectURL(videoFile)}
                controls
                className="preview-video"
                poster=""
              />
              <div className="video-overlay">
                <div className="video-info">
                  <span>{processingStats.size} MB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processed Video */}
        {processedVideo && (
          <div className="video-preview-container">
            <div className="video-label">
              <span>Stylized Video</span>
              <div className="style-badge">
                <CheckCircle className="badge-icon" />
                {selectedStyle} Style
              </div>
            </div>
            <div className="video-wrapper">
              <video
                ref={processedVideoRef}
                src={processedVideo}
                controls
                className="preview-video processed"
                poster=""
              />
              <div className="video-overlay">
                <div className="video-info">
                  {processingStats.finalSize && (
                    <span>{processingStats.finalSize} MB</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {processedVideo && (
        <div className="action-buttons">
          <button
            onClick={downloadVideo}
            className="action-btn download-btn"
          >
            <Download className="btn-icon" />
            Download Video
          </button>
          
          <button
            onClick={shareVideo}
            className="action-btn share-btn"
          >
            <Share2 className="btn-icon" />
            Share
          </button>
          
          <button
            onClick={resetProcessing}
            className="action-btn reset-btn"
          >
            <RotateCcw className="btn-icon" />
            Process Again
          </button>
        </div>
      )}

      {/* Processing Statistics */}
      {processingStats.processingTime && (
        <div className="stats-display">
          <h3 className="stats-title">Processing Complete!</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <Clock className="stat-icon" />
              <div className="stat-content">
                <span className="stat-label">Processing Time</span>
                <span className="stat-value">{processingStats.processingTime}s</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Eye className="stat-icon" />
              <div className="stat-content">
                <span className="stat-label">Frames Processed</span>
                <span className="stat-value">{processingStats.framesProcessed}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Download className="stat-icon" />
              <div className="stat-content">
                <span className="stat-label">Output Size</span>
                <span className="stat-value">{processingStats.finalSize} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!videoFile && !isProcessing && !processedVideo && (
        <div className="empty-state">
          <div className="empty-icon">
            <Eye className="empty-icon-svg" />
          </div>
          <h3 className="empty-title">Ready for Preview</h3>
          <p className="empty-description">
            Upload a video and select a style to see the magic happen!
          </p>
          <div className="empty-features">
            <div className="empty-feature">
              <span>📱</span>
              <span>Real-time preview</span>
            </div>
            <div className="empty-feature">
              <span>⚡</span>
              <span>Fast processing</span>
            </div>
            <div className="empty-feature">
              <span>📥</span>
              <span>Instant download</span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!processedVideo && !isProcessing && videoFile && (
        <div className="tips-container">
          <h4 className="tips-title">💡 Pro Tips</h4>
          <ul className="tips-list">
            <li>Higher quality settings produce better results but take longer</li>
            <li>Shorter videos (5-10 seconds) process faster</li>
            <li>Try different style strengths for varied effects</li>
            <li>Custom style images work best with clear, distinct patterns</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PreviewSection;