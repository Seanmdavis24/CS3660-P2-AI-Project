/**
 * Demo Video Processor
 * 
 * A simplified processor that creates demo stylized videos
 * when FFmpeg is not available or fails to load
 */

class DemoProcessor {
    constructor() {
        this.onProgress = null;
        this.onStageChange = null;
    }

    /**
     * Initialize demo processor
     */
    async initialize(onProgress, onStageChange) {
        this.onProgress = onProgress;
        this.onStageChange = onStageChange;

        // Simulate initialization delay
        if (this.onStageChange) this.onStageChange('initializing');
        await this.sleep(500);

        if (this.onStageChange) this.onStageChange('ready');
        return true;
    }

    /**
     * Create a demo stylized video
     */
    async processVideo(videoFile, styleId, options = {}) {
        const { onFrameProgress } = options;

        try {
            console.log(`🎭 Starting demo processing for: ${videoFile.name}`);

            // Validate inputs
            if (!videoFile) {
                throw new Error('No video file provided for demo processing');
            }
            if (!styleId) {
                throw new Error('No style ID provided for demo processing');
            }

            if (this.onStageChange) this.onStageChange('extracting_frames');

            // Extract first frame from video
            console.log('📸 Extracting first frame from video...');
            const firstFrame = await this.extractFirstFrame(videoFile);

            if (!firstFrame || !firstFrame.blob) {
                throw new Error('Failed to extract first frame from video');
            }

            console.log(`✅ First frame extracted: ${firstFrame.width}x${firstFrame.height}`);

            if (this.onStageChange) this.onStageChange('applying_style');

            // Apply style to the frame
            console.log(`🎨 Applying ${styleId} style to frame...`);
            const styledFrame = await this.applyStyleToFrame(firstFrame, styleId);

            if (!styledFrame || !styledFrame.blob) {
                throw new Error('Failed to apply style to frame');
            }

            console.log('✅ Style applied to frame successfully');

            // Simulate frame processing progress
            const totalFrames = 10; // Simulate 10 frames for demo
            for (let i = 1; i <= totalFrames; i++) {
                if (onFrameProgress) {
                    onFrameProgress({
                        current: i,
                        total: totalFrames,
                        progress: (i / totalFrames) * 100
                    });
                }
                await this.sleep(200); // Simulate processing time
            }

            if (this.onStageChange) this.onStageChange('reconstructing_video');

            // Create a demo video with the styled frame
            console.log('🔄 Creating demo video...');
            const demoVideoBlob = await this.createDemoVideo(styledFrame, styleId);

            if (!demoVideoBlob) {
                throw new Error('Failed to create demo video blob');
            }

            console.log('✅ Demo video created successfully');

            return {
                blob: demoVideoBlob,
                url: URL.createObjectURL(demoVideoBlob),
                frameCount: totalFrames,
                fps: 5
            };

        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error in demo processing';
            console.error('❌ Demo processing failed:', errorMessage);
            throw new Error(`Demo processing failed: ${errorMessage}`);
        }
    }

    /**
     * Extract first frame from video with multi-stage fallback
     */
    async extractFirstFrame(videoFile) {
        console.log(`🎭 Demo: Starting frame extraction for ${videoFile.name} (${videoFile.type})`);

        // Try multiple extraction methods in order of preference
        const extractionMethods = [
            () => this.extractFrameMethod1(videoFile), // Standard approach
            () => this.extractFrameMethod2(videoFile), // No crossOrigin
            () => this.extractFrameMethod3(videoFile), // Blob URL approach
            () => this.extractFrameMethodCanvas(videoFile), // Canvas-only approach
        ];

        for (let i = 0; i < extractionMethods.length; i++) {
            try {
                console.log(`📸 Trying extraction method ${i + 1}...`);
                const result = await extractionMethods[i]();

                if (result && result.blob) {
                    console.log(`✅ Frame extraction successful with method ${i + 1}`);
                    return result;
                }
            } catch (error) {
                console.warn(`⚠️ Extraction method ${i + 1} failed:`, error.message);

                // If this is the last method, throw the error
                if (i === extractionMethods.length - 1) {
                    throw new Error(`All frame extraction methods failed. Last error: ${error.message}`);
                }

                // Otherwise continue to next method
                continue;
            }
        }

        throw new Error('Failed to extract frame using any available method');
    }

    /**
     * Method 1: Standard video element approach
     */
    async extractFrameMethod1(videoFile) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.muted = true;
            video.preload = 'metadata';
            video.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
                this.cleanupVideo(video);
                reject(new Error('Method 1: Video loading timeout'));
            }, 15000);

            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                this.setupFrameCapture(video, canvas, ctx, resolve, reject, 'Method 1');
            };

            video.onerror = (event) => {
                clearTimeout(timeout);
                this.cleanupVideo(video);
                reject(new Error(`Method 1: Video error - ${this.getVideoErrorMessage(video.error)}`));
            };

            try {
                video.src = URL.createObjectURL(videoFile);
            } catch (error) {
                clearTimeout(timeout);
                reject(new Error(`Method 1: Failed to create video URL - ${error.message}`));
            }
        });
    }

    /**
     * Method 2: No crossOrigin approach (for some compatibility issues)
     */
    async extractFrameMethod2(videoFile) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.muted = true;
            video.preload = 'metadata';
            // No crossOrigin set

            const timeout = setTimeout(() => {
                this.cleanupVideo(video);
                reject(new Error('Method 2: Video loading timeout'));
            }, 15000);

            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                this.setupFrameCapture(video, canvas, ctx, resolve, reject, 'Method 2');
            };

            video.onerror = (event) => {
                clearTimeout(timeout);
                this.cleanupVideo(video);
                reject(new Error(`Method 2: Video error - ${this.getVideoErrorMessage(video.error)}`));
            };

            try {
                video.src = URL.createObjectURL(videoFile);
            } catch (error) {
                clearTimeout(timeout);
                reject(new Error(`Method 2: Failed to create video URL - ${error.message}`));
            }
        });
    }

    /**
     * Method 3: Blob URL with immediate revocation approach
     */
    async extractFrameMethod3(videoFile) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.muted = true;
            video.preload = 'auto'; // Try auto preload
            video.playsInline = true;

            const timeout = setTimeout(() => {
                this.cleanupVideo(video);
                reject(new Error('Method 3: Video loading timeout'));
            }, 20000);

            let videoUrl = null;

            video.oncanplay = () => {
                clearTimeout(timeout);
                console.log('📹 Method 3: Video can play, setting up capture...');
                this.setupFrameCapture(video, canvas, ctx, resolve, reject, 'Method 3', videoUrl);
            };

            video.onerror = (event) => {
                clearTimeout(timeout);
                this.cleanupVideo(video, videoUrl);
                reject(new Error(`Method 3: Video error - ${this.getVideoErrorMessage(video.error)}`));
            };

            try {
                videoUrl = URL.createObjectURL(videoFile);
                video.src = videoUrl;
                video.load();
            } catch (error) {
                clearTimeout(timeout);
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                reject(new Error(`Method 3: Failed to create video URL - ${error.message}`));
            }
        });
    }

    /**
     * Method 4: Canvas-only approach (last resort)
     */
    async extractFrameMethodCanvas(videoFile) {
        return new Promise((resolve, reject) => {
            // Create a simple colored rectangle as a fallback
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 640;
            canvas.height = 360;

            // Create a gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add text indicating this is a placeholder
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Video Preview', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '16px Arial';
            ctx.fillText('Processing will continue...', canvas.width / 2, canvas.height / 2 + 20);

            console.log('📸 Method 4: Using canvas fallback frame');

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve({
                        blob: blob,
                        width: canvas.width,
                        height: canvas.height,
                        isPlaceholder: true
                    });
                } else {
                    reject(new Error('Method 4: Failed to create canvas fallback'));
                }
            }, 'image/png');
        });
    }

    /**
     * Setup frame capture with multiple seek attempts
     */
    setupFrameCapture(video, canvas, ctx, resolve, reject, methodName, videoUrl = null) {
        try {
            console.log(`📹 ${methodName}: Video metadata loaded: ${video.videoWidth}x${video.videoHeight}, ${video.duration?.toFixed(1)}s`);

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                this.cleanupVideo(video, videoUrl);
                reject(new Error(`${methodName}: Invalid video dimensions`));
                return;
            }

            if (!video.duration || video.duration === 0 || isNaN(video.duration) || !isFinite(video.duration)) {
                this.cleanupVideo(video, videoUrl);
                reject(new Error(`${methodName}: Invalid video duration`));
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Try multiple seek times
            const seekTimes = [
                0.1, // Very beginning
                Math.min(1, video.duration * 0.05), // 5% into video
                Math.min(2, video.duration * 0.1),  // 10% into video
                Math.min(3, video.duration * 0.2),  // 20% into video
                Math.min(0.5, video.duration * 0.01) // 1% into video
            ];

            let currentSeekIndex = 0;
            let captureAttempts = 0;
            const maxAttempts = 3;

            const tryCapture = () => {
                if (currentSeekIndex >= seekTimes.length) {
                    this.cleanupVideo(video, videoUrl);
                    reject(new Error(`${methodName}: No valid frames found after trying all seek times`));
                    return;
                }

                const seekTime = seekTimes[currentSeekIndex];
                console.log(`📸 ${methodName}: Seeking to ${seekTime.toFixed(2)}s (attempt ${currentSeekIndex + 1})`);

                video.currentTime = seekTime;
                captureAttempts = 0;
            };

            const attemptFrameCapture = () => {
                try {
                    console.log(`📸 ${methodName}: Attempting frame capture at ${video.currentTime.toFixed(2)}s`);

                    // Draw the frame
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Check if frame is valid (not completely black or transparent)
                    const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
                    const isValidFrame = this.isFrameValid(imageData);

                    if (!isValidFrame && currentSeekIndex < seekTimes.length - 1) {
                        console.warn(`⚠️ ${methodName}: Invalid frame at ${video.currentTime.toFixed(2)}s, trying next seek time...`);
                        currentSeekIndex++;
                        setTimeout(tryCapture, 100);
                        return;
                    }

                    // Convert to blob
                    canvas.toBlob((blob) => {
                        this.cleanupVideo(video, videoUrl);

                        if (blob) {
                            console.log(`✅ ${methodName}: Frame captured successfully`);
                            resolve({
                                blob: blob,
                                width: canvas.width,
                                height: canvas.height,
                                isPlaceholder: false
                            });
                        } else {
                            reject(new Error(`${methodName}: Failed to create image blob`));
                        }
                    }, 'image/png');

                } catch (captureError) {
                    captureAttempts++;
                    if (captureAttempts < maxAttempts) {
                        console.warn(`⚠️ ${methodName}: Capture attempt ${captureAttempts} failed, retrying...`);
                        setTimeout(attemptFrameCapture, 200);
                    } else {
                        this.cleanupVideo(video, videoUrl);
                        reject(new Error(`${methodName}: Frame capture failed after ${maxAttempts} attempts: ${captureError.message}`));
                    }
                }
            };

            video.onseeked = () => {
                console.log(`📹 ${methodName}: Seeked to ${video.currentTime.toFixed(2)}s`);
                setTimeout(attemptFrameCapture, 100); // Small delay to ensure frame is ready
            };

            video.onseeking = () => {
                console.log(`📹 ${methodName}: Seeking to ${video.currentTime.toFixed(2)}s...`);
            };

            // Start the first seek
            tryCapture();

        } catch (setupError) {
            this.cleanupVideo(video, videoUrl);
            reject(new Error(`${methodName}: Setup failed: ${setupError.message}`));
        }
    }

    /**
     * Check if a frame is valid (not completely black/transparent)
     */
    isFrameValid(imageData) {
        const data = imageData.data;
        let nonZeroPixels = 0;
        const sampleSize = Math.min(1000, data.length / 4); // Sample subset for performance
        const step = Math.floor((data.length / 4) / sampleSize);

        for (let i = 0; i < data.length; i += (step * 4)) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Check if pixel has any color or is not fully transparent
            if (r > 10 || g > 10 || b > 10 || a > 100) {
                nonZeroPixels++;
            }
        }

        // If more than 5% of sampled pixels have content, consider frame valid
        return (nonZeroPixels / sampleSize) > 0.05;
    }

    /**
     * Get human-readable video error message
     */
    getVideoErrorMessage(error) {
        if (!error) return 'Unknown video error';

        switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                return 'Video loading was aborted';
            case MediaError.MEDIA_ERR_NETWORK:
                return 'Network error while loading video';
            case MediaError.MEDIA_ERR_DECODE:
                return 'Video format cannot be decoded - codec not supported';
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                return 'Video format or codec not supported by browser';
            default:
                return `Video error (code: ${error.code})`;
        }
    }

    /**
     * Clean up video resources
     */
    cleanupVideo(video, videoUrl = null) {
        try {
            if (video) {
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        } catch (error) {
            console.warn('⚠️ Error during video cleanup:', error);
        }
    }

    /**
     * Apply style filter to frame
     */
    async applyStyleToFrame(frameData, styleId) {
        const img = await this.createImageFromBlob(frameData.blob);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = frameData.width;
        canvas.height = frameData.height;

        ctx.drawImage(img, 0, 0);

        // Apply style-specific filters
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const styledImageData = this.applyStyleFilter(imageData, styleId);
        ctx.putImageData(styledImageData, 0, 0);

        // Add style overlay text
        this.addStyleOverlay(ctx, styleId, canvas.width, canvas.height);

        const styledBlob = await this.canvasToBlob(canvas);

        return {
            blob: styledBlob,
            width: canvas.width,
            height: canvas.height
        };
    }

    /**
     * Apply style-specific image filters
     */
    applyStyleFilter(imageData, styleId) {
        const data = imageData.data;

        switch (styleId) {
            case 'cartoon':
                // Cartoon effect: increase saturation and contrast
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = Math.min(255, gray + (data[i] - gray) * 1.8);
                    data[i + 1] = Math.min(255, gray + (data[i + 1] - gray) * 1.8);
                    data[i + 2] = Math.min(255, gray + (data[i + 2] - gray) * 1.8);

                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128));
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128));
                }
                break;

            case 'anime':
                // Anime effect: softer colors with slight blue tint
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 0.85 + 20);
                    data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 15);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2);
                }
                break;

            case 'oil_painting':
                // Oil painting effect: warm colors
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.2 + 20);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1 + 15);
                    data[i + 2] = Math.min(255, data[i + 2] * 0.8 + 10);
                }
                break;

            case 'watercolor':
                // Watercolor effect: softer, more transparent look
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 0.7 + 60);
                    data[i + 1] = Math.min(255, data[i + 1] * 0.8 + 45);
                    data[i + 2] = Math.min(255, data[i + 2] * 0.85 + 30);
                }
                break;

            case 'sketch':
                // Sketch effect: convert to grayscale with edge enhancement
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    const enhanced = gray > 128 ? Math.min(255, gray * 1.3) : Math.max(0, gray * 0.7);
                    data[i] = enhanced;
                    data[i + 1] = enhanced;
                    data[i + 2] = enhanced;
                }
                break;
        }

        return imageData;
    }

    /**
     * Add style overlay text to indicate this is a demo
     */
    addStyleOverlay(ctx, styleId, width, height) {
        // Add semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, height - 80, width, 80);

        // Add style name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.getStyleName(styleId)} Style Applied`, width / 2, height - 45);

        // Add demo label
        ctx.fillStyle = '#fbbf24';
        ctx.font = '16px Arial';
        ctx.fillText('DEMO VERSION', width / 2, height - 20);
    }

    /**
     * Get display name for style
     */
    getStyleName(styleId) {
        return 'Custom Style';
    }

    /**
     * Create a demo video using MediaRecorder with the styled frame
     */
    async createDemoVideo(styledFrame, styleId) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = styledFrame.width;
                canvas.height = styledFrame.height;

                // Create video stream from canvas
                const stream = canvas.captureStream(30); // 30 FPS
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp9'
                });

                const chunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    try {
                        const videoBlob = new Blob(chunks, { type: 'video/webm' });
                        resolve(videoBlob);
                    } catch (error) {
                        reject(new Error(`Failed to create video blob: ${error.message}`));
                    }
                };

                mediaRecorder.onerror = (error) => {
                    reject(new Error(`MediaRecorder error: ${error.message || 'Recording failed'}`));
                };

                // Start recording
                mediaRecorder.start();

                const img = new Image();
                img.onload = () => {
                    let frame = 0;
                    const totalFrames = 150; // 5 seconds at 30 FPS

                    const drawFrame = () => {
                        try {
                            // Clear canvas
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);

                            // Draw the styled image
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                            // Add demo-specific overlays
                            if (styledFrame.isPlaceholder) {
                                // For placeholder frames, add more prominent demo indicators
                                this.addPlaceholderOverlay(ctx, styleId, canvas.width, canvas.height, frame, totalFrames);
                            } else {
                                // For real frames, add standard demo overlay
                                this.addDemoOverlay(ctx, styleId, canvas.width, canvas.height, frame, totalFrames);
                            }

                            frame++;

                            if (frame < totalFrames) {
                                requestAnimationFrame(drawFrame);
                            } else {
                                // Stop recording after 5 seconds
                                try {
                                    mediaRecorder.stop();
                                } catch (error) {
                                    console.warn('⚠️ Error stopping MediaRecorder:', error);
                                    reject(new Error('Failed to stop recording'));
                                }
                            }
                        } catch (drawError) {
                            console.error('❌ Error drawing frame:', drawError);
                            reject(new Error(`Frame drawing failed: ${drawError.message}`));
                        }
                    };

                    // Start the animation
                    drawFrame();
                };

                img.onerror = () => {
                    reject(new Error('Failed to load styled frame image'));
                };

                img.src = URL.createObjectURL(styledFrame.blob);

            } catch (setupError) {
                reject(new Error(`Demo video creation setup failed: ${setupError.message}`));
            }
        });
    }

    /**
     * Add overlay for real demo frames
     */
    addDemoOverlay(ctx, styleId, width, height, frame, totalFrames) {
        // Add animated border
        const progress = frame / totalFrames;
        const borderWidth = 8;
        const hue = (progress * 360) % 360;

        ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth / 2, borderWidth / 2,
            width - borderWidth, height - borderWidth);

        // Add bottom overlay with demo info
        const overlayHeight = Math.min(80, height * 0.2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

        // Add style name
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.min(24, width * 0.04)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.getStyleName(styleId)} Style Demo`, width / 2, height - overlayHeight + 30);

        // Add demo label
        ctx.fillStyle = '#fbbf24';
        ctx.font = `${Math.min(16, width * 0.025)}px Arial`;
        ctx.fillText('DEMO VERSION', width / 2, height - overlayHeight + 55);
    }

    /**
     * Add overlay for placeholder frames
     */
    addPlaceholderOverlay(ctx, styleId, width, height, frame, totalFrames) {
        // Add prominent placeholder indicators
        const progress = frame / totalFrames;

        // Animated background overlay
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + 0.05 * Math.sin(progress * Math.PI * 4)})`;
        ctx.fillRect(0, 0, width, height);

        // Large centered text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${Math.min(48, width * 0.08)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.getStyleName(styleId)} Preview`, width / 2, height / 2 - 30);

        ctx.font = `${Math.min(24, width * 0.04)}px Arial`;
        ctx.fillText('Video processing simulation', width / 2, height / 2 + 10);

        // Bottom status bar
        const barHeight = 60;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, height - barHeight, width, barHeight);

        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${Math.min(20, width * 0.03)}px Arial`;
        ctx.fillText('DEMO MODE - Video format compatibility issue detected', width / 2, height - 35);

        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.min(14, width * 0.022)}px Arial`;
        ctx.fillText('Try converting your video to MP4 (H.264) for full processing', width / 2, height - 15);
    }

    /**
     * Helper: Create image from blob
     */
    createImageFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * Helper: Convert canvas to blob
     */
    canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas to blob conversion failed'));
            }, 'image/png');
        });
    }

    /**
     * Helper: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Nothing to clean up for demo processor
    }
}

export default DemoProcessor; 