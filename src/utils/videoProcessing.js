import { QUALITY_SETTINGS } from '../constants/qualitySettings';
import { extractFrames, createVideo } from './ffmpegWorker';
import { styleTransferFrame } from './styleTransfer';

export const processVideo = async ({
  videoFile,
  styleImage,
  styleStrength,
  quality,
  actions
}) => {
  actions.setProcessing(true);
  actions.setProgress(0);
  actions.setProcessedFrames(0);
  actions.setError(null);

  try {
    const startTime = Date.now();
    const qualitySettings = QUALITY_SETTINGS[quality];

    // Step 1: Extract frames from video (10-20%)
    actions.setProgress(5);
    console.log('Starting frame extraction...');
    
    const frames = await extractFrames(videoFile, qualitySettings);
    actions.setTotalFrames(frames.length);
    actions.setProgress(15);

    console.log(`Extracted ${frames.length} frames`);

    // Step 2: Process each frame with style transfer (20-80%)
    actions.setProgress(20);
    const styledFrames = [];
    const progressStep = 60 / frames.length; // 60% of progress for frame processing

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      // Update current frame being processed
      actions.setCurrentFrame({
        index: i,
        timestamp: frame.timestamp,
        total: frames.length
      });

      // Apply style transfer
      const styledFrame = await styleTransferFrame(
        frame,
        styleImage,
        styleStrength / 100,
        qualitySettings
      );

      styledFrames.push(styledFrame);
      actions.setProcessedFrames(i + 1);
      actions.setProgress(20 + (i + 1) * progressStep);

      // Add small delay to make progress visible in demo
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Step 3: Reconstruct video (80-95%)
    actions.setProgress(85);
    console.log('Reconstructing video...');
    
    const finalVideoBlob = await createVideo(styledFrames, videoFile, qualitySettings);
    
    // Step 4: Create download URL (95-100%)
    actions.setProgress(95);
    const videoURL = URL.createObjectURL(finalVideoBlob);
    
    actions.setProcessedVideo(videoURL);
    actions.setProgress(100);
    
    // Update processing stats
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    actions.updateProcessingStats({
      processingTime,
      framesProcessed: frames.length,
      finalSize: (finalVideoBlob.size / (1024 * 1024)).toFixed(2)
    });

    console.log(`Processing completed in ${processingTime}s`);
    actions.setSuccess('Video processing completed successfully!');

  } catch (error) {
    console.error('Video processing failed:', error);
    actions.setError(`Processing failed: ${error.message}`);
    throw error;
  } finally {
    actions.setProcessing(false);
    actions.setCurrentFrame(null);
  }
};

export const validateVideoFile = (file) => {
  const errors = [];
  
  // Check file type
  if (!file.type.startsWith('video/')) {
    errors.push('File must be a video');
  }
  
  // Check file size (100MB limit)
  if (file.size > 100 * 1024 * 1024) {
    errors.push('File size must be less than 100MB');
  }
  
  return errors;
};

export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Could not load video metadata'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const estimateProcessingTime = (duration, quality, frameCount) => {
  // Rough estimates based on quality settings
  const baseTimePerFrame = {
    preview: 0.1,   // 100ms per frame
    balanced: 0.2,  // 200ms per frame  
    high: 0.4      // 400ms per frame
  };
  
  const timePerFrame = baseTimePerFrame[quality] || baseTimePerFrame.balanced;
  const totalTime = frameCount * timePerFrame;
  
  return {
    estimatedSeconds: Math.ceil(totalTime),
    estimatedMinutes: Math.ceil(totalTime / 60)
  };
};