export const QUALITY_SETTINGS = {
  preview: { 
    width: 320, 
    height: 240, 
    fps: 15, 
    name: 'Preview (Fast)',
    bitrate: '500k',
    description: 'Fast processing, lower quality'
  },
  balanced: { 
    width: 640, 
    height: 480, 
    fps: 24, 
    name: 'Balanced',
    bitrate: '1500k',
    description: 'Good balance of speed and quality'
  },
  high: { 
    width: 1280, 
    height: 720, 
    fps: 30, 
    name: 'High Quality',
    bitrate: '3000k',
    description: 'Best quality, slower processing'
  }
};

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/avi'
];

export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const MAX_FILE_SIZES = {
  video: 100 * 1024 * 1024, // 100MB
  image: 10 * 1024 * 1024,  // 10MB
};

export const PROCESSING_LIMITS = {
  maxDuration: 30, // 30 seconds
  maxFrames: 900,  // 30fps * 30s
  minDuration: 1   // 1 second
};