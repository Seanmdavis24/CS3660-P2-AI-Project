import React from 'react';
import { Palette, Zap, Settings } from 'lucide-react';
import { useVideoProcessor } from '../../hooks/useVideoProcessor';
import { DEFAULT_STYLES } from '../../constants/styles';
import { QUALITY_SETTINGS } from '../../constants/qualitySettings';
import { processVideo } from '../../utils/videoProcessing';
import './StyleControls.css';

const StyleControls = () => {
  const {
    videoFile,
    styleImage,
    selectedStyle,
    styleStrength,
    quality,
    isProcessing,
    isModelLoaded,
    isFFmpegLoaded,
    actions
  } = useVideoProcessor();

  const handleProcessVideo = async () => {
    if (!videoFile) {
      actions.setError('Please select a video file first');
      return;
    }

    if (!isModelLoaded || !isFFmpegLoaded) {
      actions.setError('Please wait for the AI models to load');
      return;
    }

    try {
      await processVideo({
        videoFile,
        styleImage: styleImage || selectedStyle,
        styleStrength,
        quality,
        actions
      });
    } catch (error) {
      console.error('Processing failed:', error);
      actions.setError('Video processing failed. Please try again.');
    }
  };

  const canProcess = videoFile && isModelLoaded && isFFmpegLoaded && !isProcessing;

  return (
    <div className="style-controls glass-card">
      <h2 className="section-title">
        <Palette className="section-icon" />
        Style & Settings
      </h2>

      {/* Default Styles */}
      <div className="control-group">
        <label className="control-label">
          Choose Artistic Style
        </label>
        <div className="styles-grid">
          {DEFAULT_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => actions.setSelectedStyle(style.id)}
              className={`style-card ${
                selectedStyle === style.id && !styleImage ? 'selected' : ''
              }`}
              disabled={isProcessing}
            >
              <div className="style-header">
                <span className="style-emoji">{style.emoji}</span>
                <span className="style-name">{style.name}</span>
              </div>
              <p className="style-description">{style.description}</p>
              {selectedStyle === style.id && !styleImage && (
                <div className="selection-indicator">
                  <div className="indicator-dot"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Style Indicator */}
        {styleImage && (
          <div className="custom-style-card">
            <div className="style-header">
              <span className="style-emoji">🎨</span>
              <span className="style-name">Custom Style</span>
            </div>
            <p className="style-description">Using uploaded reference image</p>
            <div className="selection-indicator">
              <div className="indicator-dot custom-dot"></div>
            </div>
          </div>
        )}
      </div>

      {/* Style Strength */}
      <div className="control-group">
        <label className="control-label">
          Style Strength: <span className="strength-value">{styleStrength}%</span>
        </label>
        <div className="slider-container">
          <input
            type="range"
            min="10"
            max="100"
            value={styleStrength}
            onChange={(e) => actions.setStyleStrength(parseInt(e.target.value))}
            className="style-slider"
            disabled={isProcessing}
          />
          <div className="slider-labels">
            <span className="slider-label">Subtle</span>
            <span className="slider-label">Intense</span>
          </div>
        </div>
        <div className="strength-indicators">
          <div className={`strength-indicator ${styleStrength <= 30 ? 'active' : ''}`}>
            Gentle
          </div>
          <div className={`strength-indicator ${styleStrength > 30 && styleStrength <= 70 ? 'active' : ''}`}>
            Balanced
          </div>
          <div className={`strength-indicator ${styleStrength > 70 ? 'active' : ''}`}>
            Bold
          </div>
        </div>
      </div>

      {/* Quality Settings */}
      <div className="control-group">
        <label className="control-label">
          Processing Quality
        </label>
        <select
          value={quality}
          onChange={(e) => actions.setQuality(e.target.value)}
          className="quality-select"
          disabled={isProcessing}
        >
          {Object.entries(QUALITY_SETTINGS).map(([key, setting]) => (
            <option key={key} value={key}>
              {setting.name} ({setting.width}x{setting.height})
            </option>
          ))}
        </select>
        <div className="quality-info">
          <div className="quality-detail">
            <span>Resolution:</span>
            <span>{QUALITY_SETTINGS[quality].width}x{QUALITY_SETTINGS[quality].height}</span>
          </div>
          <div className="quality-detail">
            <span>Frame Rate:</span>
            <span>{QUALITY_SETTINGS[quality].fps} fps</span>
          </div>
          <div className="quality-detail">
            <span>Bitrate:</span>
            <span>{QUALITY_SETTINGS[quality].bitrate}</span>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="control-group">
        <details className="advanced-settings">
          <summary className="advanced-toggle">
            <Settings className="settings-icon" />
            Advanced Settings
          </summary>
          <div className="advanced-content">
            <div className="advanced-option">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Preserve original audio
              </label>
            </div>
            <div className="advanced-option">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                High quality upscaling
              </label>
            </div>
            <div className="advanced-option">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Smooth frame transitions
              </label>
            </div>
          </div>
        </details>
      </div>

      {/* Process Button */}
      <button
        onClick={handleProcessVideo}
        disabled={!canProcess}
        className={`process-btn ${isProcessing ? 'processing' : ''} ${canProcess ? 'ready' : 'disabled'}`}
      >
        <div className="btn-content">
          {isProcessing ? (
            <>
              <div className="processing-spinner"></div>
              <span>Transforming Video...</span>
            </>
          ) : (
            <>
              <Zap className="btn-icon" />
              <span>Transform Video</span>
            </>
          )}
        </div>
        {isProcessing && (
          <div className="btn-glow"></div>
        )}
      </button>

      {/* Processing Requirements */}
      {!canProcess && !isProcessing && (
        <div className="requirements">
          <h4 className="requirements-title">Requirements:</h4>
          <div className="requirements-list">
            <div className={`requirement ${videoFile ? 'met' : 'unmet'}`}>
              <span className="req-icon">{videoFile ? '✓' : '○'}</span>
              <span>Video file selected</span>
            </div>
            <div className={`requirement ${isModelLoaded ? 'met' : 'unmet'}`}>
              <span className="req-icon">{isModelLoaded ? '✓' : '○'}</span>
              <span>AI models loaded</span>
            </div>
            <div className={`requirement ${isFFmpegLoaded ? 'met' : 'unmet'}`}>
              <span className="req-icon">{isFFmpegLoaded ? '✓' : '○'}</span>
              <span>Video processor ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleControls;