export const APP_CONFIG = {
  name: 'Neural Video Style Transfer',
  version: '1.0.0',
  description: 'Transform your videos with AI-powered artistic styles',
  author: 'Your Company Name',
  
  // TensorFlow.js Model URLs
  models: {
    styleTransfer: '/models/style-transfer/',
    cartoonGAN: '/models/cartoon-gan/',
    animeGAN: '/models/anime-gan/'
  },
  
  // FFmpeg Configuration
  ffmpeg: {
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
    workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js'
  },
  
  // Processing Configuration
  processing: {
    chunkSize: 10, // Process frames in chunks
    maxConcurrent: 2, // Max concurrent style transfers
    timeoutMs: 30000, // 30 second timeout per frame
  },
  
  // UI Configuration
  ui: {
    animations: true,
    progressUpdateInterval: 100, // ms
    previewUpdateInterval: 500, // ms
  },
  
  // Analytics (if needed)
  analytics: {
    enabled: false,
    trackingId: 'GA-XXXXXXXXX'
  }
};

export const ERROR_MESSAGES = {
  fileTooBig: 'File size exceeds the maximum limit',
  unsupportedFormat: 'File format is not supported',
  processingFailed: 'Video processing failed. Please try again.',
  modelLoadFailed: 'Failed to load AI model. Please refresh and try again.',
  ffmpegLoadFailed: 'Failed to initialize video processor',
  noVideoSelected: 'Please select a video file first',
  videoTooLong: 'Video duration exceeds the maximum limit of 30 seconds'
};

export const SUCCESS_MESSAGES = {
  videoUploaded: 'Video uploaded successfully',
  processingComplete: 'Video processing completed',
  modelLoaded: 'AI model loaded successfully',
  ffmpegReady: 'Video processor ready'
};