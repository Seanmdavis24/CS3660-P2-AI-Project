import React from 'react';
import { Upload, Video, Image, CheckCircle, XCircle } from 'lucide-react';
import { useVideoProcessor } from '../../hooks/useVideoProcessor';
import './UploadSection.css';

const UploadSection = () => {
  const {
    videoFile,
    styleImage,
    processingStats,
    isModelLoaded,
    isFFmpegLoaded,
    error,
    success,
    actions
  } = useVideoProcessor();

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      actions.setVideoFile(file);
    }
  };

  const handleStyleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      actions.setStyleImage(file);
    }
  };

  return (
    <div className="upload-section glass-card">
      <h2 className="section-title">
        <Upload className="section-icon" />
        Upload Content
      </h2>

      {/* Status Indicators */}
      <div className="status-indicators">
        <div className={`status-item ${isModelLoaded ? 'ready' : 'loading'}`}>
          {isModelLoaded ? <CheckCircle className="status-icon" /> : <div className="spinner" />}
          <span>AI Models</span>
        </div>
        <div className={`status-item ${isFFmpegLoaded ? 'ready' : 'loading'}`}>
          {isFFmpegLoaded ? <CheckCircle className="status-icon" /> : <div className="spinner" />}
          <span>Video Processor</span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="message error-message">
          <XCircle className="message-icon" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="message success-message">
          <CheckCircle className="message-icon" />
          <span>{success}</span>
        </div>
      )}

      {/* Video Upload */}
      <div className="upload-group">
        <label className="upload-label">
          Video File (MP4, WebM, MOV)
        </label>
        <div className="upload-area">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="upload-input"
            disabled={!isFFmpegLoaded}
          />
          <div className={`upload-dropzone ${videoFile ? 'has-file' : ''}`}>
            <Video className="upload-icon" />
            <div className="upload-text">
              <p className="upload-primary">
                {videoFile ? videoFile.name : 'Click to upload video'}
              </p>
              <p className="upload-secondary">
                {videoFile ? 'Click to change file' : 'Max 100MB, up to 30 seconds'}
              </p>
            </div>
            {videoFile && (
              <div className="upload-badge">
                <CheckCircle className="badge-icon" />
                Uploaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Style Image Upload */}
      <div className="upload-group">
        <label className="upload-label">
          Custom Style Image (Optional)
        </label>
        <div className="upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleStyleImageUpload}
            className="upload-input"
          />
          <div className={`upload-dropzone style-dropzone ${styleImage ? 'has-file' : ''}`}>
            <Image className="upload-icon" />
            <div className="upload-text">
              <p className="upload-primary">
                {styleImage ? styleImage.name : 'Upload style reference'}
              </p>
              <p className="upload-secondary">
                {styleImage ? 'Custom style selected' : 'PNG, JPG, WebP - Max 10MB'}
              </p>
            </div>
            {styleImage && (
              <div className="upload-badge custom-badge">
                <CheckCircle className="badge-icon" />
                Custom Style
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Stats */}
      {processingStats.duration && (
        <div className="stats-card">
          <h3 className="stats-title">Video Information</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{processingStats.duration}s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size:</span>
              <span className="stat-value">{processingStats.size} MB</span>
            </div>
            {processingStats.processingTime && (
              <div className="stat-item">
                <span className="stat-label">Processed in:</span>
                <span className="stat-value">{processingStats.processingTime}s</span>
              </div>
            )}
            {processingStats.framesProcessed && (
              <div className="stat-item">
                <span className="stat-label">Frames:</span>
                <span className="stat-value">{processingStats.framesProcessed}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;