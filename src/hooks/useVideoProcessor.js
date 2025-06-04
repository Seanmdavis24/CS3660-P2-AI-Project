import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { APP_CONFIG, ERROR_MESSAGES } from '../constants/config';
import { QUALITY_SETTINGS } from '../constants/qualitySettings';

// Initial state
const initialState = {
  // Files
  videoFile: null,
  styleImage: null,
  
  // Processing state
  isProcessing: false,
  progress: 0,
  processedFrames: 0,
  totalFrames: 0,
  currentFrame: null,
  processedVideo: null,
  
  // Settings
  selectedStyle: 'cartoon',
  styleStrength: 80,
  quality: 'balanced',
  
  // Stats
  processingStats: {},
  
  // Models and libraries
  isModelLoaded: false,
  isFFmpegLoaded: false,
  
  // Errors
  error: null,
  success: null
};

// Action types
const actionTypes = {
  SET_VIDEO_FILE: 'SET_VIDEO_FILE',
  SET_STYLE_IMAGE: 'SET_STYLE_IMAGE',
  SET_SELECTED_STYLE: 'SET_SELECTED_STYLE',
  SET_STYLE_STRENGTH: 'SET_STYLE_STRENGTH',
  SET_QUALITY: 'SET_QUALITY',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_PROGRESS: 'SET_PROGRESS',
  SET_PROCESSED_FRAMES: 'SET_PROCESSED_FRAMES',
  SET_TOTAL_FRAMES: 'SET_TOTAL_FRAMES',
  SET_CURRENT_FRAME: 'SET_CURRENT_FRAME',
  SET_PROCESSED_VIDEO: 'SET_PROCESSED_VIDEO',
  SET_PROCESSING_STATS: 'SET_PROCESSING_STATS',
  UPDATE_PROCESSING_STATS: 'UPDATE_PROCESSING_STATS',
  SET_MODEL_LOADED: 'SET_MODEL_LOADED',
  SET_FFMPEG_LOADED: 'SET_FFMPEG_LOADED',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  RESET_PROCESSING: 'RESET_PROCESSING',
  RESET_ALL: 'RESET_ALL'
};

// Reducer
const videoProcessorReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_VIDEO_FILE:
      return {
        ...state,
        videoFile: action.payload,
        processedVideo: null,
        progress: 0,
        processedFrames: 0,
        error: null
      };
      
    case actionTypes.SET_STYLE_IMAGE:
      return {
        ...state,
        styleImage: action.payload,
        selectedStyle: action.payload ? 'custom' : state.selectedStyle
      };
      
    case actionTypes.SET_SELECTED_STYLE:
      return { ...state, selectedStyle: action.payload };
      
    case actionTypes.SET_STYLE_STRENGTH:
      return { ...state, styleStrength: action.payload };
      
    case actionTypes.SET_QUALITY:
      return { ...state, quality: action.payload };
      
    case actionTypes.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };
      
    case actionTypes.SET_PROGRESS:
      return { ...state, progress: action.payload };
      
    case actionTypes.SET_PROCESSED_FRAMES:
      return { ...state, processedFrames: action.payload };
      
    case actionTypes.SET_TOTAL_FRAMES:
      return { ...state, totalFrames: action.payload };
      
    case actionTypes.SET_CURRENT_FRAME:
      return { ...state, currentFrame: action.payload };
      
    case actionTypes.SET_PROCESSED_VIDEO:
      return { ...state, processedVideo: action.payload };
      
    case actionTypes.SET_PROCESSING_STATS:
      return { ...state, processingStats: action.payload };
      
    case actionTypes.UPDATE_PROCESSING_STATS:
      return {
        ...state,
        processingStats: { ...state.processingStats, ...action.payload }
      };
      
    case actionTypes.SET_MODEL_LOADED:
      return { ...state, isModelLoaded: action.payload };
      
    case actionTypes.SET_FFMPEG_LOADED:
      return { ...state, isFFmpegLoaded: action.payload };
      
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, success: null };
      
    case actionTypes.SET_SUCCESS:
      return { ...state, success: action.payload, error: null };
      
    case actionTypes.RESET_PROCESSING:
      return {
        ...state,
        isProcessing: false,
        progress: 0,
        processedFrames: 0,
        totalFrames: 0,
        currentFrame: null,
        error: null
      };
      
    case actionTypes.RESET_ALL:
      return { ...initialState, isModelLoaded: state.isModelLoaded, isFFmpegLoaded: state.isFFmpegLoaded };
      
    default:
      return state;
  }
};

// Context
const VideoProcessorContext = createContext();

// Provider component
export const VideoProcessorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(videoProcessorReducer, initialState);

  // Initialize libraries on mount
  useEffect(() => {
    const initializeLibraries = async () => {
      try {
        // Initialize TensorFlow.js
        if (window.tf) {
          dispatch({ type: actionTypes.SET_MODEL_LOADED, payload: true });
          dispatch({ type: actionTypes.SET_SUCCESS, payload: 'AI models ready' });
        }

        // Initialize FFmpeg
        // This would be the actual FFmpeg initialization in production
        setTimeout(() => {
          dispatch({ type: actionTypes.SET_FFMPEG_LOADED, payload: true });
        }, 1000);

      } catch (error) {
        console.error('Failed to initialize libraries:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: ERROR_MESSAGES.modelLoadFailed });
      }
    };

    initializeLibraries();
  }, []);

  // Actions
  const actions = {
    setVideoFile: (file) => {
      // Validate file
      if (file && file.size > 100 * 1024 * 1024) { // 100MB limit
        dispatch({ type: actionTypes.SET_ERROR, payload: ERROR_MESSAGES.fileTooBig });
        return;
      }
      
      dispatch({ type: actionTypes.SET_VIDEO_FILE, payload: file });
      
      if (file) {
        // Extract video metadata
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          const stats = {
            duration: video.duration.toFixed(2),
            size: (file.size / (1024 * 1024)).toFixed(2)
          };
          dispatch({ type: actionTypes.SET_PROCESSING_STATS, payload: stats });
        };
      }
    },
    
    setStyleImage: (file) => {
      if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
        dispatch({ type: actionTypes.SET_ERROR, payload: ERROR_MESSAGES.fileTooBig });
        return;
      }
      dispatch({ type: actionTypes.SET_STYLE_IMAGE, payload: file });
    },
    
    setSelectedStyle: (style) => dispatch({ type: actionTypes.SET_SELECTED_STYLE, payload: style }),
    setStyleStrength: (strength) => dispatch({ type: actionTypes.SET_STYLE_STRENGTH, payload: strength }),
    setQuality: (quality) => dispatch({ type: actionTypes.SET_QUALITY, payload: quality }),
    setProcessing: (processing) => dispatch({ type: actionTypes.SET_PROCESSING, payload: processing }),
    setProgress: (progress) => dispatch({ type: actionTypes.SET_PROGRESS, payload: progress }),
    setProcessedFrames: (frames) => dispatch({ type: actionTypes.SET_PROCESSED_FRAMES, payload: frames }),
    setTotalFrames: (frames) => dispatch({ type: actionTypes.SET_TOTAL_FRAMES, payload: frames }),
    setCurrentFrame: (frame) => dispatch({ type: actionTypes.SET_CURRENT_FRAME, payload: frame }),
    setProcessedVideo: (video) => dispatch({ type: actionTypes.SET_PROCESSED_VIDEO, payload: video }),
    updateProcessingStats: (stats) => dispatch({ type: actionTypes.UPDATE_PROCESSING_STATS, payload: stats }),
    setError: (error) => dispatch({ type: actionTypes.SET_ERROR, payload: error }),
    setSuccess: (success) => dispatch({ type: actionTypes.SET_SUCCESS, payload: success }),
    resetProcessing: () => dispatch({ type: actionTypes.RESET_PROCESSING }),
    resetAll: () => dispatch({ type: actionTypes.RESET_ALL })
  };

  const value = {
    ...state,
    actions,
    qualitySettings: QUALITY_SETTINGS[state.quality]
  };

  return (
    <VideoProcessorContext.Provider value={value}>
      {children}
    </VideoProcessorContext.Provider>
  );
};

// Hook to use the context
export const useVideoProcessor = () => {
  const context = useContext(VideoProcessorContext);
  if (!context) {
    throw new Error('useVideoProcessor must be used within a VideoProcessorProvider');
  }
  return context;
};