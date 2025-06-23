/**
 * Video Processing Utility
 * 
 * Handles video frame extraction, style transfer, and reconstruction
 * using FFmpeg.wasm and TensorFlow.js with fallback methods
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import * as tf from '@tensorflow/tfjs';

class VideoProcessor {
    constructor() {
        this.ffmpeg = null;
        this.isLoaded = false;
        this.useFallback = false;
        this.onProgress = null;
        this.onStageChange = null;
        this.styleModel = null;        // Magenta style network (extracts style features)
        this.transformerModel = null;  // Magenta transformer network (applies style transfer)
        this.isModelReady = false;
        this.usingSingleHubModel = false;

        // Simple performance tracking
        this.performanceStats = {
            totalStartTime: null
        };
    }

    /**
     * Initialize FFmpeg and TensorFlow.js with style transfer models
     */
    async initialize(onProgress, onStageChange) {
        this.onProgress = onProgress;
        this.onStageChange = onStageChange;

        try {
            if (this.onStageChange) this.onStageChange('initializing');

            console.log('🚀 Initializing VideoProcessor...');
            console.log('ℹ️ Note: Some CDN loading warnings are normal and expected during initialization');

            // Initialize TensorFlow.js
            console.log('🧠 Initializing TensorFlow.js...');
            await tf.ready();
            console.log('✅ TensorFlow.js initialized');
            console.log('- Backend:', tf.getBackend());
            console.log('- Memory:', tf.memory());

            // Load the pre-trained neural style transfer models (non-blocking)
            try {
                await this.loadStyleTransferModels();
            } catch (modelError) {
                console.warn('⚠️ Neural style transfer models failed to load, using enhanced filters:', modelError.message);
                this.isModelReady = false;
                // Don't throw - this is expected and we have fallbacks
            }

            // Try to load FFmpeg (non-blocking)
            try {
                await this.tryLoadFFmpeg();
            } catch (ffmpegError) {
                console.warn('⚠️ FFmpeg failed to load, using fallback method:', ffmpegError.message);
                this.useFallback = true;
                // Don't throw - this is expected and we have fallbacks
            }

            // Always mark as ready - we have fallback methods
            if (this.onStageChange) this.onStageChange('ready');

            console.log('✅ VideoProcessor initialized successfully');
            console.log(`- Neural networks: ${this.isModelReady ? 'loaded' : 'using fallback filters'}`);
            console.log(`- Video processing: ${this.useFallback ? 'HTML5 fallback' : 'FFmpeg'}`);

            if (this.useFallback) {
                console.log('ℹ️ Note: Using browser-based processing (this is normal and works well)');
            }
            if (!this.isModelReady) {
                console.log('ℹ️ Note: Using enhanced filter-based style transfer (still produces great results)');
            }

        } catch (error) {
            // Only throw for truly critical errors
            console.error('❌ Critical initialization error:', error);
            this.useFallback = true;
            this.isModelReady = false;

            if (this.onStageChange) this.onStageChange('ready');

            // Don't throw - we can still process with fallbacks
            console.log('🔄 Continuing with fallback processing methods');
        }
    }

    /**
     * Load pre-trained neural style transfer models
     */
    async loadStyleTransferModels() {
        console.log('🧠 Loading neural style transfer models...');

        try {
            // Use the working arbitrary image stylization models from the master directory
            // These are TensorFlow Graph models that need to be loaded with tf.loadGraphModel
            const styleModelUrl = '/models/arbitrary-image-stylization-tfjs-master/saved_model_style_js/model.json';
            const transformerModelUrl = '/models/arbitrary-image-stylization-tfjs-master/saved_model_transformer_js/model.json';

            console.log('🔄 Loading Magenta Arbitrary Style Transfer models...');
            console.log(`📍 Style Model: ${styleModelUrl}`);
            console.log(`📍 Transformer Model: ${transformerModelUrl}`);

            // Test model URLs first
            try {
                console.log('🔍 Testing model URL accessibility...');
                const styleResponse = await fetch(styleModelUrl);
                const transformerResponse = await fetch(transformerModelUrl);

                console.log(`📊 Style model response: ${styleResponse.status} ${styleResponse.statusText}`);
                console.log(`📊 Transformer model response: ${transformerResponse.status} ${transformerResponse.statusText}`);

                if (!styleResponse.ok || !transformerResponse.ok) {
                    throw new Error('Model URLs not accessible');
                }
            } catch (fetchError) {
                console.warn('⚠️ Model URL test failed:', fetchError.message);
                throw fetchError;
            }

            // Load both models in parallel using tf.loadGraphModel for TensorFlow Graph models
            console.log('🔄 Loading TensorFlow models...');
            const [styleModel, transformerModel] = await Promise.all([
                tf.loadGraphModel(styleModelUrl),
                tf.loadGraphModel(transformerModelUrl)
            ]);

            console.log('✅ Models loaded, checking model info...');
            console.log(`📊 Style model inputs:`, styleModel.inputs.map(input => `${input.name}: ${input.shape}`));
            console.log(`📊 Style model outputs:`, styleModel.outputs.map(output => `${output.name}: ${output.shape}`));
            console.log(`📊 Transformer model inputs:`, transformerModel.inputs.map(input => `${input.name}: ${input.shape}`));
            console.log(`📊 Transformer model outputs:`, transformerModel.outputs.map(output => `${output.name}: ${output.shape}`));

            this.styleModel = styleModel;
            this.transformerModel = transformerModel;
            this.isModelReady = true;

            console.log('✅ Neural style transfer models loaded successfully!');
            console.log('🎨 Style Model loaded:', styleModel);
            console.log('🔄 Transformer Model loaded:', transformerModel);
            console.log('📊 Models ready for neural style transfer processing!');

            return true;

        } catch (error) {
            console.error('❌ Failed to load neural style transfer models:', error);
            console.log('📋 Error details:', {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3)
            });

            // Try fallback to the older model format
            try {
                console.log('🔄 Trying fallback models...');
                const fallbackStyleUrl = '/models/style_network/model.json';
                const fallbackTransformerUrl = '/models/transformer_network/model.json';

                console.log(`📍 Fallback Style Model: ${fallbackStyleUrl}`);
                console.log(`📍 Fallback Transformer Model: ${fallbackTransformerUrl}`);

                const [fallbackStyleModel, fallbackTransformerModel] = await Promise.all([
                    tf.loadGraphModel(fallbackStyleUrl),
                    tf.loadGraphModel(fallbackTransformerUrl)
                ]);

                this.styleModel = fallbackStyleModel;
                this.transformerModel = fallbackTransformerModel;
                this.isModelReady = true;

                console.log('✅ Fallback models loaded successfully!');
                return true;

            } catch (fallbackError) {
                console.error('❌ Fallback models also failed:', fallbackError);

                // Try TensorFlow Hub model as final fallback
                try {
                    console.log('🔄 Trying TensorFlow Hub model as final fallback...');
                    const hubModelUrl = 'https://tfhub.dev/google/tfjs-model/magenta/arbitrary-image-stylization-v1-256/2/default/1';

                    console.log(`📍 TensorFlow Hub Model: ${hubModelUrl}`);

                    const hubModel = await tf.loadGraphModel(hubModelUrl, { fromTFHub: true });

                    // For TensorFlow Hub models, we can use a single model for both style extraction and transfer
                    this.styleModel = hubModel;
                    this.transformerModel = hubModel; // Same model for both operations
                    this.isModelReady = true;
                    this.usingSingleHubModel = true; // Flag to indicate different usage pattern

                    console.log('✅ TensorFlow Hub model loaded successfully!');
                    console.log(`📊 Hub model inputs:`, hubModel.inputs.map(input => `${input.name}: ${input.shape}`));
                    console.log(`📊 Hub model outputs:`, hubModel.outputs.map(output => `${output.name}: ${output.shape}`));

                    return true;

                } catch (hubError) {
                    console.error('❌ TensorFlow Hub model also failed:', hubError);
                    console.log('🎨 Will use enhanced filter-based style transfer as final fallback');
                    this.isModelReady = false;
                    this.usingSingleHubModel = false;
                    return false;
                }
            }
        }
    }

    /**
     * Process user-uploaded style reference image into tensor
     */
    async processStyleReference(styleData) {
        try {
            console.log('🎨 Processing user-uploaded style reference...');

            if (!styleData || !styleData.file) {
                throw new Error('No style reference data provided');
            }

            // Use the image element if available, otherwise create from file
            let img;
            if (styleData.image) {
                img = styleData.image;
            } else {
                img = await this.createImageFromBlob(styleData.file);
                // Store the image for later use
                styleData.image = img;
            }

            console.log(`📸 Style reference: ${styleData.metadata.fileName} (${img.width}x${img.height})`);

            // For the TensorFlow Hub model, we don't need to pre-process the style image into a tensor
            // The model expects raw images as input, so we just ensure the image is available
            // This is different from the previous approach that used separate style and transform models

            console.log(`✅ Style reference processed and ready for neural transfer`);

            // Store additional metadata that might be useful
            styleData.processedAt = Date.now();
            styleData.originalDimensions = {
                width: img.width,
                height: img.height
            };

            return true;

        } catch (error) {
            console.error('❌ Failed to process style reference:', error);
            return false;
        }
    }

    /**
     * Load image from URL
     */
    async loadImageFromUrl(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                console.log(`📸 Loaded image: ${imageUrl} (${img.width}x${img.height})`);
                resolve(img);
            };

            img.onerror = (error) => {
                console.warn(`❌ Failed to load image: ${imageUrl}`);
                reject(new Error(`Failed to load style reference image: ${imageUrl}`));
            };

            img.src = imageUrl;
        });
    }

    /**
     * Load image from data URL (fallback method)
     */
    async loadImageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    async tryLoadFFmpeg() {
        try {
            this.ffmpeg = new FFmpeg();

            // Set up progress tracking
            this.ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg:', message);
            });

            this.ffmpeg.on('progress', ({ progress, time }) => {
                if (this.onProgress) {
                    this.onProgress({
                        progress: Math.round(progress * 100),
                        time
                    });
                }
            });

            // Try different CDN URLs for better compatibility
            const cdnOptions = [
                {
                    name: 'unpkg.com (core-mt)',
                    baseURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm',
                    files: {
                        coreURL: 'ffmpeg-core.js',
                        wasmURL: 'ffmpeg-core.wasm',
                        workerURL: 'ffmpeg-core.worker.js'
                    }
                },
                {
                    name: 'unpkg.com (core)',
                    baseURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
                    files: {
                        coreURL: 'ffmpeg-core.js',
                        wasmURL: 'ffmpeg-core.wasm'
                    }
                }
            ];

            let loadSuccess = false;

            for (const cdn of cdnOptions) {
                try {
                    console.log(`Trying to load FFmpeg from ${cdn.name}...`);

                    const loadConfig = {
                        coreURL: await toBlobURL(`${cdn.baseURL}/${cdn.files.coreURL}`, 'text/javascript'),
                        wasmURL: await toBlobURL(`${cdn.baseURL}/${cdn.files.wasmURL}`, 'application/wasm'),
                    };

                    if (cdn.files.workerURL) {
                        loadConfig.workerURL = await toBlobURL(`${cdn.baseURL}/${cdn.files.workerURL}`, 'text/javascript');
                    }

                    await this.ffmpeg.load(loadConfig);

                    this.isLoaded = true;
                    loadSuccess = true;
                    console.log(`✅ FFmpeg loaded successfully from ${cdn.name}`);

                    if (this.onStageChange) this.onStageChange('ready');
                    return; // Success - exit function

                } catch (error) {
                    // Reduce console noise for expected failures
                    if (cdn === cdnOptions[cdnOptions.length - 1]) {
                        // Only log the final failure
                        console.log(`⚠️ FFmpeg failed to load from all CDNs, will use fallback processing`);
                    }
                    continue;
                }
            }

            if (!loadSuccess) {
                console.log('⚠️ FFmpeg failed to load from all CDNs, will use fallback processing');
                this.useFallback = true;
                this.isLoaded = false;
                // Don't throw - fallback is expected and available
            }

        } catch (error) {
            console.warn('⚠️ FFmpeg initialization failed, using fallback method:', error.message);
            this.useFallback = true;
            this.isLoaded = false;
            // Don't throw - fallback is expected and available
        }
    }

    /**
     * Extract frames from video using FFmpeg or fallback method
     */
    async extractFrames(videoFile, fps = 5) {
        if (this.useFallback) {
            return await this.extractFramesFallback(videoFile, fps);
        }

        if (!this.isLoaded) {
            throw new Error('FFmpeg not loaded. Call initialize() first.');
        }

        try {
            if (this.onStageChange) this.onStageChange('extracting_frames');

            // Write input video to FFmpeg filesystem
            const inputName = 'input.mp4';
            await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // Extract frames at specified FPS
            await this.ffmpeg.exec([
                '-i', inputName,
                '-vf', `fps=${fps}`,
                '-q:v', '2', // High quality
                'frame_%04d.png'
            ]);

            // List extracted frames
            const files = await this.ffmpeg.listDir('/');
            const frameFiles = files.filter(file =>
                file.name.startsWith('frame_') && file.name.endsWith('.png')
            );

            console.log(`✅ Extracted ${frameFiles.length} frames`);
            return frameFiles.map(file => file.name).sort();

        } catch (error) {
            console.error('❌ Frame extraction failed:', error);
            throw new Error(`Frame extraction failed: ${error.message}`);
        }
    }

    /**
     * Fallback frame extraction using HTML5 video and canvas
     */
    async extractFramesFallback(videoFile, fps = 5) {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔄 Using fallback frame extraction method...');

                const video = document.createElement('video');
                video.muted = true;
                video.crossOrigin = 'anonymous';

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const frames = [];
                let frameCount = 0;

                // Set up timeout for loading
                const loadTimeout = setTimeout(() => {
                    reject(new Error('Video loading timeout - file may be corrupted or unsupported format'));
                }, 30000); // 30 second timeout

                video.onloadedmetadata = () => {
                    try {
                        clearTimeout(loadTimeout);

                        // Validate video properties before accessing them
                        if (!video.videoWidth || !video.videoHeight || !video.duration) {
                            reject(new Error('Video metadata is incomplete - width, height, or duration missing'));
                            return;
                        }

                        console.log(`📹 Video metadata loaded: ${video.videoWidth}x${video.videoHeight}, ${video.duration.toFixed(1)}s`);

                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        const duration = video.duration;
                        const interval = 1 / fps;
                        const totalFrames = Math.floor(duration * fps);

                        if (totalFrames === 0) {
                            reject(new Error('Video duration is too short to extract frames'));
                            return;
                        }

                        // Validate that the video is actually playable
                        if (video.readyState < 2) { // HAVE_CURRENT_DATA
                            console.log('⏳ Waiting for video to be ready...');
                            video.addEventListener('canplay', () => {
                                console.log('✅ Video is now ready for frame extraction');
                            });
                        }

                        console.log(`📸 Extracting ${totalFrames} frames at ${fps} FPS...`);

                        let currentTime = 0;

                        const captureFrame = () => {
                            if (currentTime >= duration) {
                                console.log(`✅ Extracted ${frames.length} frames using fallback method`);
                                if (frames.length === 0) {
                                    reject(new Error('No frames were successfully extracted'));
                                } else {
                                    resolve(frames);
                                }
                                return;
                            }

                            video.currentTime = currentTime;
                        };

                        video.onseeked = () => {
                            try {
                                // Draw current frame to canvas
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                                // Convert to PNG blob
                                canvas.toBlob((blob) => {
                                    if (!blob) {
                                        console.warn(`⚠️ Failed to create blob for frame ${frameCount + 1}`);
                                        // Continue to next frame
                                        currentTime += interval;
                                        setTimeout(captureFrame, 100);
                                        return;
                                    }

                                    const frameName = `frame_${String(frameCount + 1).padStart(4, '0')}.png`;
                                    frames.push({
                                        name: frameName,
                                        blob: blob,
                                        width: canvas.width,
                                        height: canvas.height
                                    });

                                    frameCount++;
                                    currentTime += interval;

                                    // Continue to next frame
                                    setTimeout(captureFrame, 100);
                                }, 'image/png');

                            } catch (canvasError) {
                                console.error('❌ Canvas processing error:', canvasError);
                                reject(new Error(`Canvas processing failed: ${canvasError.message || canvasError.toString()}`));
                            }
                        };

                        video.onerror = (videoError) => {
                            console.error('❌ Video error during seeking:', videoError);
                            reject(new Error(`Video seeking failed: ${videoError.message || 'Unknown video error'}`));
                        };

                        // Start frame extraction
                        captureFrame();

                    } catch (metadataError) {
                        console.error('❌ Error processing video metadata:', metadataError);
                        reject(new Error(`Video metadata processing failed: ${metadataError.message || metadataError.toString()}`));
                    }
                };

                video.onerror = (loadError) => {
                    clearTimeout(loadTimeout);
                    console.error('❌ Video loading error:', loadError);
                    reject(new Error(`Failed to load video file: ${loadError.message || 'Video format may not be supported'}`));
                };

                video.onabort = () => {
                    clearTimeout(loadTimeout);
                    reject(new Error('Video loading was aborted'));
                };

                // Start loading the video
                try {
                    video.src = URL.createObjectURL(videoFile);
                } catch (urlError) {
                    clearTimeout(loadTimeout);
                    reject(new Error(`Failed to create video URL: ${urlError.message || urlError.toString()}`));
                }

            } catch (setupError) {
                console.error('❌ Error setting up fallback frame extraction:', setupError);
                reject(new Error(`Fallback frame extraction setup failed: ${setupError.message || setupError.toString()}`));
            }
        });
    }

    /**
     * Apply neural style transfer to a frame using TensorFlow.js
     */
    async processFrame(frameName, styleData, styleRatio = 1.0) {
        if (this.useFallback) {
            return await this.processFrameFallback(frameName, styleData, styleRatio);
        }

        try {
            // Read frame data
            const frameData = await this.ffmpeg.readFile(frameName);

            // Create image from frame data
            const blob = new Blob([frameData.buffer], { type: 'image/png' });
            const img = await this.createImageFromBlob(blob);

            // Apply neural style transfer if models are loaded and style image is available
            let processedCanvas;
            if (this.isModelReady && this.styleModel && styleData.image) {
                console.log(`🧠 Using neural style transfer for: ${styleData.metadata.fileName}`);
                processedCanvas = await this.applyNeuralStyleTransfer(img, styleData, styleRatio);
            } else {
                console.log(`🎨 Using filter fallback for style: ${styleData.metadata.fileName}`);
                processedCanvas = await this.applyStyleFilter(img, styleData);
            }

            // Convert back to PNG data
            const processedBlob = await this.canvasToBlob(processedCanvas);
            const processedData = new Uint8Array(await processedBlob.arrayBuffer());

            // Write processed frame back to FFmpeg
            const outputName = `processed_${frameName}`;
            await this.ffmpeg.writeFile(outputName, processedData);

            return outputName;

        } catch (error) {
            console.error(`❌ Frame processing failed for ${frameName}:`, error);
            throw error;
        }
    }

    /**
     * Fallback frame processing for when FFmpeg isn't available
     */
    async processFrameFallback(frameData, styleData, styleRatio = 1.0) {
        try {
            // Create image from blob
            const img = await this.createImageFromBlob(frameData.blob);

            // Apply neural style transfer if available and style image is present
            let processedCanvas;
            if (this.isModelReady && this.styleModel && styleData.image) {
                console.log(`🧠 Using neural style transfer for: ${styleData.metadata.fileName}`);
                processedCanvas = await this.applyNeuralStyleTransfer(img, styleData, styleRatio);
            } else {
                console.log(`🎨 Using filter fallback for style: ${styleData.metadata.fileName}`);
                processedCanvas = await this.applyStyleFilter(img, styleData);
            }

            // Convert back to blob
            const processedBlob = await this.canvasToBlob(processedCanvas);

            return {
                name: `processed_${frameData.name}`,
                blob: processedBlob,
                data: new Uint8Array(await processedBlob.arrayBuffer())
            };

        } catch (error) {
            console.error(`❌ Frame processing failed:`, error);
            throw error;
        }
    }

    /**
     * Apply neural style transfer using TensorFlow.js models
     */
    async applyNeuralStyleTransfer(img, styleData, styleRatio = 1.0) {
        try {
            console.log(`🧠 Applying neural style transfer using: ${styleData.metadata.fileName} with style ratio: ${styleRatio}`);

            // Check if we have both models loaded
            if (!this.isModelReady || !this.styleModel || !this.transformerModel) {
                console.warn('⚠️ Neural style transfer models not ready, using enhanced filters');
                return await this.applyStyleFilter(img, styleData);
            }

            // Check if we have style reference image
            if (!styleData.image) {
                console.warn('⚠️ No style reference image available, using enhanced filters');
                return await this.applyStyleFilter(img, styleData);
            }

            // Force garbage collection before processing to free memory
            if (window.gc) {
                window.gc();
            }

            // Check GPU memory and warn if high
            const memoryBefore = tf.memory();
            if (memoryBefore.numBytes > 1500000000) { // 1.5GB threshold
                console.warn(`⚠️ High GPU memory usage before processing: ${(memoryBefore.numBytes / 1024 / 1024).toFixed(2)} MB`);
                // Force tensor cleanup
                tf.engine().endScope();
                tf.engine().startScope();
            }

            // Create canvases for content and style images
            const contentCanvas = document.createElement('canvas');
            const contentCtx = contentCanvas.getContext('2d');
            const styleCanvas = document.createElement('canvas');
            const styleCtx = styleCanvas.getContext('2d');

            // OPTIMIZED: Use smaller sizes for faster processing
            // Reduce size for better performance while maintaining quality
            const styleSize = 256; // Keep style at 256 for model requirements
            const maxContentSize = 384; // Reduced from 512 for better performance
            const contentSize = Math.min(maxContentSize, Math.max(256, Math.max(img.width, img.height)));

            contentCanvas.width = contentSize;
            contentCanvas.height = contentSize;
            styleCanvas.width = styleSize;
            styleCanvas.height = styleSize;

            // Draw both images at model sizes
            contentCtx.drawImage(img, 0, 0, contentSize, contentSize);
            styleCtx.drawImage(styleData.image, 0, 0, styleSize, styleSize);

            console.log('🔄 Converting images to tensors for neural style transfer...');

            // Convert images to tensors with proper preprocessing (exactly like the working example)
            let contentTensor, styleTensor, styledTensor, bottleneck;

            try {
                contentTensor = tf.browser.fromPixels(contentCanvas)
                    .toFloat()
                    .div(tf.scalar(255))
                    .expandDims();

                styleTensor = tf.browser.fromPixels(styleCanvas)
                    .toFloat()
                    .div(tf.scalar(255))
                    .expandDims();

                console.log('🎨 Running style network to extract style features...');
                console.log(`📊 Content tensor shape: [${contentTensor.shape}]`);
                console.log(`📊 Style tensor shape: [${styleTensor.shape}]`);

                if (this.usingSingleHubModel) {
                    // TensorFlow Hub model approach - single model takes both inputs
                    console.log('🔄 Using TensorFlow Hub single model for style transfer...');
                    styledTensor = this.styleModel.predict([contentTensor, styleTensor]);
                    console.log('✅ TensorFlow Hub model processing complete!');
                } else {
                    // Two-model approach (Magenta style) - FIXED: No tf.tidy() wrapper
                    console.log('🔄 Using two-model Magenta approach...');

                    // Step 1: Extract style features using the style model
                    console.log('🔄 Calling style model predict...');
                    bottleneck = this.styleModel.predict(styleTensor);
                    console.log(`📊 Style model output shape: [${bottleneck.shape}]`);

                    // Step 1.5: Apply style ratio interpolation if not 1.0
                    if (styleRatio !== 1.0) {
                        console.log(`🔄 Applying style ratio interpolation: ${styleRatio}`);

                        // Extract identity (content) style features
                        const identityBottleneck = this.styleModel.predict(contentTensor);
                        console.log(`📊 Identity bottleneck shape: [${identityBottleneck.shape}]`);

                        // Interpolate between style and identity bottlenecks
                        const styleBottleneckScaled = bottleneck.mul(tf.scalar(styleRatio));
                        const identityBottleneckScaled = identityBottleneck.mul(tf.scalar(1.0 - styleRatio));
                        const interpolatedBottleneck = tf.add(styleBottleneckScaled, identityBottleneckScaled);

                        // Clean up intermediate tensors
                        bottleneck.dispose();
                        identityBottleneck.dispose();
                        styleBottleneckScaled.dispose();
                        identityBottleneckScaled.dispose();

                        // Use interpolated bottleneck
                        bottleneck = interpolatedBottleneck;
                        console.log(`📊 Interpolated bottleneck shape: [${bottleneck.shape}]`);
                    }

                    console.log('🔄 Running transformer network to apply style transfer...');
                    console.log(`📊 Bottleneck shape: [${bottleneck.shape}]`);

                    // Step 2: Apply style transfer using the transformer model
                    console.log('🔄 Calling transformer model predict...');
                    styledTensor = this.transformerModel.predict([contentTensor, bottleneck]);
                    console.log(`📊 Transformer model output shape: [${styledTensor.shape}]`);

                    console.log('✅ Two-model processing complete!');
                }

                // Create output canvas at original size
                const outputCanvas = document.createElement('canvas');
                outputCanvas.width = img.width;
                outputCanvas.height = img.height;

                // Create temp canvas for model output
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = contentSize;
                tempCanvas.height = contentSize;

                // Convert output tensor to pixels (squeeze to remove batch dimension)
                console.log('🔄 Converting tensor to pixels...');
                const squeezedResult = styledTensor.squeeze();
                console.log(`📊 Squeezed result shape: [${squeezedResult.shape}]`);

                // This operation is synchronous and safe
                await tf.browser.toPixels(squeezedResult, tempCanvas);
                console.log('✅ Tensor to pixels conversion successful');

                // Scale to original image size
                const outputCtx = outputCanvas.getContext('2d');
                outputCtx.drawImage(tempCanvas, 0, 0, img.width, img.height);

                // MANUAL tensor cleanup to prevent memory leaks
                contentTensor.dispose();
                styleTensor.dispose();
                styledTensor.dispose();
                squeezedResult.dispose();
                if (bottleneck) {
                    bottleneck.dispose();
                }

                console.log('✅ Neural style transfer completed successfully using real AI models!');
                return outputCanvas;

            } catch (tensorError) {
                console.error('❌ Error during tensor operations:', tensorError);

                // Clean up any tensors that were created
                try {
                    if (contentTensor) contentTensor.dispose();
                    if (styleTensor) styleTensor.dispose();
                    if (styledTensor) styledTensor.dispose();
                    if (bottleneck) bottleneck.dispose();
                } catch (cleanupError) {
                    console.error('❌ Error during tensor cleanup:', cleanupError);
                }

                throw tensorError; // Re-throw to be caught by outer catch
            }

        } catch (error) {
            console.error('❌ Neural style transfer failed:', error);
            console.log('📋 Detailed error info:', {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 5),
                modelReady: this.isModelReady,
                hasStyleModel: !!this.styleModel,
                hasTransformerModel: !!this.transformerModel
            });

            // Force cleanup on error
            if (tf.memory().numTensors > 100) {
                console.log('🧹 Forcing tensor cleanup due to error...');
                tf.engine().endScope();
                tf.engine().startScope();
            }

            console.log('🔄 Falling back to enhanced filter method...');
            return await this.applyStyleFilter(img, styleData);
        } finally {
            // Monitor memory after processing
            const memoryAfter = tf.memory();
            console.log(`📊 GPU memory after processing: ${(memoryAfter.numBytes / 1024 / 1024).toFixed(2)} MB`);

            if (memoryAfter.numBytes > 2000000000) { // 2GB threshold
                console.warn(`⚠️ High memory usage in GPU: ${(memoryAfter.numBytes / 1024 / 1024).toFixed(2)} MB, forcing cleanup`);
                tf.engine().endScope();
                tf.engine().startScope();
            }
        }
    }

    /**
     * Apply style-specific image filters (fallback method)
     */
    async applyStyleFilter(img, styleData) {
        console.log(`🎨 Applying enhanced filter-based style using: ${styleData.metadata.fileName}`);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Apply enhanced style-inspired filters based on the uploaded image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze the uploaded style image to determine appropriate filter
        const styleAnalysis = await this.analyzeStyleImage(styleData);

        console.log(`🔍 Applying style type: ${styleAnalysis.type} with characteristics:`, styleAnalysis.characteristics);

        switch (styleAnalysis.type) {
            case 'cartoon':
                // DRAMATIC cartoon effect: heavy posterization + saturation boost
                for (let i = 0; i < data.length; i += 4) {
                    // Heavy posterize colors (reduce color palette significantly)
                    data[i] = Math.floor(data[i] / 48) * 48;
                    data[i + 1] = Math.floor(data[i + 1] / 48) * 48;
                    data[i + 2] = Math.floor(data[i + 2] / 48) * 48;

                    // Massive saturation increase
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * 3.5));
                    data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * 3.5));
                    data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * 3.5));

                    // Add cartoon-like contrast
                    data[i] = data[i] > 128 ? Math.min(255, data[i] * 1.4) : Math.max(0, data[i] * 0.6);
                    data[i + 1] = data[i + 1] > 128 ? Math.min(255, data[i + 1] * 1.4) : Math.max(0, data[i + 1] * 0.6);
                    data[i + 2] = data[i + 2] > 128 ? Math.min(255, data[i + 2] * 1.4) : Math.max(0, data[i + 2] * 0.6);
                }
                break;

            case 'anime':
                // DRAMATIC anime effect: vibrant colors with high contrast
                for (let i = 0; i < data.length; i += 4) {
                    // Anime color palette shift (cooler tones, more vibrant)
                    data[i] = Math.min(255, data[i] * 0.7 + 60);      // Reduce red, add warmth
                    data[i + 1] = Math.min(255, data[i + 1] * 1.2 + 30); // Boost green
                    data[i + 2] = Math.min(255, data[i + 2] * 1.6);       // Significantly boost blue

                    // Dramatic contrast for anime look
                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 2.0 + 128));
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 2.0 + 128));
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 2.0 + 128));

                    // Add anime-style brightness
                    data[i] = Math.min(255, data[i] * 1.3);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.3);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2);
                }
                break;

            case 'oil_painting':
                // DRAMATIC oil painting effect: warm, textured look
                for (let i = 0; i < data.length; i += 4) {
                    // Warm oil painting palette
                    data[i] = Math.min(255, data[i] * 1.6 + 50);      // Heavy red boost
                    data[i + 1] = Math.min(255, data[i + 1] * 1.3 + 35); // Warm yellows
                    data[i + 2] = Math.min(255, data[i + 2] * 0.6 + 20);  // Reduce blues

                    // Oil painting texture simulation (slight blur effect)
                    const noise = (Math.random() - 0.5) * 15;
                    data[i] = Math.min(255, Math.max(0, data[i] + noise));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
                }
                break;

            case 'watercolor':
                // DRAMATIC watercolor effect: soft, washed, dreamy look
                for (let i = 0; i < data.length; i += 4) {
                    // Watercolor wash effect
                    data[i] = Math.min(255, data[i] * 0.4 + 120);     // Washed out with white
                    data[i + 1] = Math.min(255, data[i + 1] * 0.5 + 100);
                    data[i + 2] = Math.min(255, data[i + 2] * 0.6 + 80);

                    // Add watercolor bleeding effect
                    const bleed = Math.sin(i / 100) * 20;
                    data[i] = Math.min(255, Math.max(0, data[i] + bleed));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + bleed));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + bleed));
                }
                break;

            case 'sketch':
                // DRAMATIC sketch effect: stark black and white with details
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                    // High contrast sketch effect
                    let enhanced;
                    if (gray > 180) {
                        enhanced = 255; // Pure white
                    } else if (gray < 80) {
                        enhanced = 0;   // Pure black
                    } else {
                        enhanced = gray > 130 ? 220 : 40; // High contrast midtones
                    }

                    // Add sketch texture
                    const texture = (Math.random() - 0.5) * 30;
                    enhanced = Math.min(255, Math.max(0, enhanced + texture));

                    data[i] = enhanced;
                    data[i + 1] = enhanced;
                    data[i + 2] = enhanced;
                }
                break;

            default:
                // DRAMATIC generic artistic enhancement based on style analysis
                const { brightness, contrast, saturation } = styleAnalysis;
                for (let i = 0; i < data.length; i += 4) {
                    // Apply dramatic brightness (amplified)
                    const brightnessFactor = brightness * 2;
                    data[i] = Math.min(255, Math.max(0, data[i] + brightnessFactor));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightnessFactor));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightnessFactor));

                    // Apply dramatic contrast (amplified)
                    const contrastFactor = contrast * 1.5;
                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));

                    // Apply dramatic saturation (amplified)
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    const saturationFactor = saturation * 2;
                    data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * saturationFactor));
                    data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * saturationFactor));
                    data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * saturationFactor));

                    // Add artistic color shift based on dominant color
                    if (styleAnalysis.dominantColor) {
                        const { r, g, b } = styleAnalysis.dominantColor;
                        // Subtle color temperature shift toward dominant style color
                        data[i] = Math.min(255, data[i] * 0.8 + r * 0.2);
                        data[i + 1] = Math.min(255, data[i + 1] * 0.8 + g * 0.2);
                        data[i + 2] = Math.min(255, data[i + 2] * 0.8 + b * 0.2);
                    }
                }
                break;
        }

        ctx.putImageData(imageData, 0, 0);

        console.log(`✅ Applied ${styleAnalysis.type} style filter with dramatic effects`);
        return canvas;
    }

    /**
     * Analyze uploaded style image to determine appropriate filters
     */
    async analyzeStyleImage(styleData) {
        try {
            // Create a small canvas to analyze the style image
            const analysisCanvas = document.createElement('canvas');
            const ctx = analysisCanvas.getContext('2d');
            analysisCanvas.width = 64;
            analysisCanvas.height = 64;

            // Draw the style image at small size for analysis
            ctx.drawImage(styleData.image, 0, 0, 64, 64);
            const imageData = ctx.getImageData(0, 0, 64, 64);
            const data = imageData.data;

            // Calculate image statistics
            let totalR = 0, totalG = 0, totalB = 0;
            let totalBrightness = 0;
            let edges = 0;
            let highContrast = 0;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                totalR += r;
                totalG += g;
                totalB += b;

                const brightness = (r + g + b) / 3;
                totalBrightness += brightness;

                // Simple edge detection
                if (i > 256 && i < data.length - 256) {
                    const diff = Math.abs(brightness - (data[i - 256] + data[i - 252] + data[i - 248]) / 3);
                    if (diff > 30) edges++;
                    if (diff > 60) highContrast++;
                }
            }

            const pixelCount = data.length / 4;
            const avgR = totalR / pixelCount;
            const avgG = totalG / pixelCount;
            const avgB = totalB / pixelCount;
            const avgBrightness = totalBrightness / pixelCount;
            const edgeRatio = edges / pixelCount;
            const contrastRatio = highContrast / pixelCount;

            // Determine style type based on analysis
            let type = 'generic';

            if (edgeRatio > 0.3 && avgBrightness > 200) {
                type = 'sketch';
            } else if (contrastRatio > 0.2 && edgeRatio > 0.15) {
                type = 'cartoon';
            } else if (avgR > avgG && avgR > avgB && contrastRatio > 0.1) {
                type = 'oil_painting';
            } else if (avgBrightness > 150 && contrastRatio < 0.1) {
                type = 'watercolor';
            } else if (avgG > avgR && avgB > avgR) {
                type = 'anime';
            }

            // Calculate adjustment parameters
            const brightness = avgBrightness < 128 ? 20 : -10;
            const contrast = contrastRatio < 0.1 ? 1.2 : 0.9;
            const saturation = edgeRatio > 0.2 ? 1.3 : 1.1;

            console.log(`🔍 Style analysis: ${type} (edges: ${edgeRatio.toFixed(2)}, contrast: ${contrastRatio.toFixed(2)}, brightness: ${avgBrightness.toFixed(0)})`);

            return {
                type,
                brightness,
                contrast,
                saturation,
                dominantColor: { r: avgR, g: avgG, b: avgB },
                characteristics: {
                    edgeRatio,
                    contrastRatio,
                    avgBrightness
                }
            };

        } catch (error) {
            console.warn('⚠️ Style analysis failed, using generic enhancement:', error);
            return {
                type: 'generic',
                brightness: 0,
                contrast: 1.1,
                saturation: 1.2
            };
        }
    }

    /**
     * Reconstruct video from processed frames
     */
    async reconstructVideo(frameNames, fps = 5) {
        console.log('🔄 Starting video reconstruction...');
        console.log(`📊 Frame data type: ${typeof frameNames[0]}`);
        console.log(`📊 Frame structure:`, frameNames[0]);

        if (this.useFallback) {
            console.log('🔄 Using fallback video reconstruction method');
            return await this.reconstructVideoFallback(frameNames, fps);
        }

        try {
            if (this.onStageChange) this.onStageChange('reconstructing_video');

            console.log('🔄 Using FFmpeg video reconstruction method');

            // Use processed frames to create video
            await this.ffmpeg.exec([
                '-framerate', fps.toString(),
                '-i', 'processed_frame_%04d.png',
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-crf', '23', // Good quality
                'output.mp4'
            ]);

            // Read the output video
            const outputData = await this.ffmpeg.readFile('output.mp4');
            return new Blob([outputData.buffer], { type: 'video/mp4' });

        } catch (error) {
            console.error('❌ FFmpeg video reconstruction failed:', error);
            console.log('🔄 Falling back to browser-based reconstruction...');

            // If FFmpeg fails, try fallback method
            this.useFallback = true;
            return await this.reconstructVideoFallback(frameNames, fps);
        }
    }

    /**
     * Fallback video reconstruction using MediaRecorder API
     */
    async reconstructVideoFallback(processedFrames, fps = 5) {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔄 Starting fallback video reconstruction...');
                console.log(`📊 Processed frames count: ${processedFrames.length}`);
                console.log(`📊 Frame structure:`, processedFrames[0]);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Validate frames
                if (!processedFrames || processedFrames.length === 0) {
                    reject(new Error('No processed frames provided for reconstruction'));
                    return;
                }

                // Get first frame to determine canvas size
                const firstFrame = processedFrames[0];

                // Handle different frame structures
                let firstFrameBlob;
                if (firstFrame && firstFrame.blob) {
                    firstFrameBlob = firstFrame.blob;
                } else if (firstFrame && typeof firstFrame === 'object' && firstFrame.data) {
                    // Handle case where frame is a processed frame object
                    firstFrameBlob = new Blob([firstFrame.data], { type: 'image/png' });
                } else {
                    reject(new Error('Invalid frame structure - no blob found'));
                    return;
                }

                const img = new Image();

                img.onload = () => {
                    try {
                        console.log(`📐 Canvas size: ${img.width}x${img.height}`);
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Check if browser supports video recording
                        if (!canvas.captureStream) {
                            reject(new Error('Browser does not support video recording'));
                            return;
                        }

                        // Create video stream from canvas with error handling
                        let stream;
                        try {
                            stream = canvas.captureStream(fps);
                        } catch (streamError) {
                            console.error('❌ Failed to create canvas stream:', streamError);
                            reject(new Error(`Failed to create video stream: ${streamError.message}`));
                            return;
                        }

                        // Validate stream
                        if (!stream || !stream.getVideoTracks || stream.getVideoTracks().length === 0) {
                            reject(new Error('Failed to create valid video stream'));
                            return;
                        }

                        console.log(`📹 Video stream created with ${stream.getVideoTracks().length} video tracks`);

                        // Create MediaRecorder with fallback options
                        let mediaRecorder;
                        const mimeTypes = [
                            'video/webm;codecs=vp9',
                            'video/webm;codecs=vp8',
                            'video/webm',
                            'video/mp4'
                        ];

                        for (const mimeType of mimeTypes) {
                            if (MediaRecorder.isTypeSupported(mimeType)) {
                                try {
                                    mediaRecorder = new MediaRecorder(stream, { mimeType });
                                    console.log(`📹 Using MediaRecorder with: ${mimeType}`);
                                    break;
                                } catch (recorderError) {
                                    console.warn(`⚠️ Failed to create MediaRecorder with ${mimeType}:`, recorderError);
                                    continue;
                                }
                            }
                        }

                        if (!mediaRecorder) {
                            reject(new Error('MediaRecorder not supported with any available codec'));
                            return;
                        }

                        const chunks = [];

                        mediaRecorder.ondataavailable = (event) => {
                            if (event.data && event.data.size > 0) {
                                chunks.push(event.data);
                            }
                        };

                        mediaRecorder.onstop = () => {
                            try {
                                console.log(`📹 Recording stopped, ${chunks.length} chunks collected`);
                                if (chunks.length === 0) {
                                    reject(new Error('No video data was recorded'));
                                    return;
                                }

                                const videoBlob = new Blob(chunks, {
                                    type: mediaRecorder.mimeType || 'video/webm'
                                });

                                console.log(`✅ Video reconstruction complete: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
                                resolve(videoBlob);
                            } catch (stopError) {
                                console.error('❌ Error during recording stop:', stopError);
                                reject(new Error(`Video finalization failed: ${stopError.message}`));
                            }
                        };

                        mediaRecorder.onerror = (event) => {
                            console.error('❌ MediaRecorder error:', event);
                            reject(new Error(`MediaRecorder error: ${event.error?.message || 'Unknown recording error'}`));
                        };

                        // Start recording
                        try {
                            mediaRecorder.start(100); // Record in 100ms chunks
                            console.log('📹 Recording started');
                        } catch (startError) {
                            console.error('❌ Failed to start recording:', startError);
                            reject(new Error(`Failed to start recording: ${startError.message}`));
                            return;
                        }

                        // Draw frames to canvas
                        let frameIndex = 0;
                        const frameInterval = 1000 / fps;

                        const drawNextFrame = () => {
                            if (frameIndex >= processedFrames.length) {
                                // Stop recording
                                try {
                                    console.log('🎬 All frames processed, stopping recording...');
                                    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                                        mediaRecorder.stop();
                                    }

                                    // Stop all tracks to free resources - with null check
                                    if (stream && stream.getTracks) {
                                        stream.getTracks().forEach(track => {
                                            if (track && track.stop) {
                                                track.stop();
                                            }
                                        });
                                    }
                                } catch (stopError) {
                                    console.error('❌ Error stopping recording:', stopError);
                                    reject(new Error(`Failed to stop recording: ${stopError.message}`));
                                }
                                return;
                            }

                            const frameData = processedFrames[frameIndex];

                            if (!frameData) {
                                console.error(`❌ Frame data is null at index ${frameIndex}`);
                                reject(new Error(`Frame data is null at index ${frameIndex}`));
                                return;
                            }

                            const frameImg = new Image();

                            frameImg.onload = () => {
                                try {
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                    ctx.drawImage(frameImg, 0, 0);
                                    frameIndex++;
                                    setTimeout(drawNextFrame, frameInterval);
                                } catch (drawError) {
                                    console.error('❌ Error drawing frame:', drawError);
                                    reject(new Error(`Frame drawing failed: ${drawError.message}`));
                                }
                            };

                            frameImg.onerror = (imgError) => {
                                console.error('❌ Error loading frame image:', imgError);
                                reject(new Error(`Frame image loading failed`));
                            };

                            // Handle different frame structures
                            try {
                                if (frameData.blob) {
                                    frameImg.src = URL.createObjectURL(frameData.blob);
                                } else if (frameData.data) {
                                    const blob = new Blob([frameData.data], { type: 'image/png' });
                                    frameImg.src = URL.createObjectURL(blob);
                                } else {
                                    throw new Error('Invalid frame data structure');
                                }
                            } catch (frameError) {
                                console.error('❌ Error processing frame data:', frameError);
                                reject(new Error(`Frame processing failed: ${frameError.message}`));
                            }
                        };

                        // Start drawing frames
                        drawNextFrame();

                    } catch (setupError) {
                        console.error('❌ Error setting up video recording:', setupError);
                        reject(new Error(`Video recording setup failed: ${setupError.message}`));
                    }
                };

                img.onerror = (imgError) => {
                    console.error('❌ Error loading first frame:', imgError);
                    reject(new Error('Failed to load first frame for canvas setup'));
                };

                img.src = URL.createObjectURL(firstFrameBlob);

            } catch (error) {
                console.error('❌ Error in reconstructVideoFallback setup:', error);
                reject(new Error(`Video reconstruction setup failed: ${error.message || error.toString()}`));
            }
        });
    }

    /**
     * Process entire video workflow with optimizations
     */
    async processVideo(videoFile, styleData, options = {}) {
        const { fps = 5, onFrameProgress, styleRatio = 1.0 } = options;

        try {
            console.log(`🎬 Starting video processing: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(1)}MB)`);
            console.log(`🎨 Using style: ${styleData.metadata.fileName}`);
            console.log(`⚙️ Processing options:`, { fps, useFallback: this.useFallback, isModelReady: this.isModelReady, styleRatio });

            // Validate inputs
            if (!videoFile) {
                throw new Error('No video file provided');
            }
            if (!styleData) {
                throw new Error('No style data provided');
            }

            // Extract frames
            console.log('📸 Starting frame extraction...');
            const frameNames = await this.extractFrames(videoFile, fps);

            if (!frameNames || frameNames.length === 0) {
                throw new Error('Failed to extract any frames from video');
            }

            console.log(`✅ Extracted ${frameNames.length} frames`);

            if (this.onStageChange) this.onStageChange('applying_style');

            // Initialize performance tracking
            this.performanceStats.totalStartTime = Date.now();

            const processedFrameNames = [];

            // Process each frame sequentially (simplified approach)
            console.log('🎨 Starting frame processing...');
            console.log(`🧠 Neural networks ready: ${this.isModelReady}`);
            console.log(`🎨 Style reference available: ${!!styleData.image}`);

            for (let i = 0; i < frameNames.length; i++) {
                const frameStartTime = Date.now();

                try {
                    console.log(`🖼️ Processing frame ${i + 1}/${frameNames.length}: ${frameNames[i]}`);

                    const frameName = this.useFallback ? frameNames[i] : frameNames[i];
                    const processedName = await this.processFrame(frameName, styleData, styleRatio);
                    processedFrameNames.push(processedName);

                    // Track performance
                    const frameTime = (Date.now() - frameStartTime) / 1000;

                    console.log(`✅ Frame ${i + 1} processed successfully in ${frameTime.toFixed(2)}s: ${processedName}`);

                    if (onFrameProgress) {
                        onFrameProgress({
                            current: i + 1,
                            total: frameNames.length,
                            progress: ((i + 1) / frameNames.length) * 100
                        });
                    }

                    // Small break between frames to keep browser responsive
                    if (i < frameNames.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }

                } catch (frameError) {
                    console.error(`❌ Failed to process frame ${i + 1}:`, frameError);
                    throw new Error(`Failed to process frame ${i + 1}: ${frameError.message || frameError.toString()}`);
                }
            }

            console.log(`✅ Processed ${processedFrameNames.length} frames successfully`);

            // Simple performance metrics
            const totalProcessingTime = (Date.now() - this.performanceStats.totalStartTime) / 1000;
            console.log(`📊 PERFORMANCE SUMMARY:`);
            console.log(`   🎬 Total processing time: ${(totalProcessingTime / 60).toFixed(1)} minutes`);
            console.log(`   🎯 Total frames processed: ${frameNames.length}`);
            console.log(`   🧠 Memory efficiency: ${tf.memory().numTensors} tensors remaining`);

            // Reconstruct video
            console.log('🔄 Starting video reconstruction...');
            console.log(`📊 Processed frames for reconstruction:`, processedFrameNames.length);
            console.log(`📊 Sample processed frame:`, processedFrameNames[0]);
            console.log(`📊 Using fallback reconstruction: ${this.useFallback}`);

            const outputBlob = await this.reconstructVideo(processedFrameNames, fps);

            if (!outputBlob) {
                throw new Error('Failed to reconstruct video - output blob is null');
            }

            console.log(`✅ Video processing completed successfully`);
            console.log(`📊 Final stats:`, {
                originalSize: `${(videoFile.size / 1024 / 1024).toFixed(1)}MB`,
                outputSize: `${(outputBlob.size / 1024 / 1024).toFixed(1)}MB`,
                frameCount: frameNames.length,
                fps: fps,
                usedNeuralNetworks: this.isModelReady && styleData.image,
                processingMethod: 'sequential',
                styleRatio: styleRatio
            });

            return {
                blob: outputBlob,
                url: URL.createObjectURL(outputBlob),
                frameCount: frameNames.length,
                fps: fps
            };

        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error during video processing';
            console.error('❌ Video processing failed:', errorMessage);
            console.error('❌ Processing context:', {
                videoName: videoFile?.name,
                styleName: styleData?.metadata?.fileName,
                useFallback: this.useFallback,
                isModelReady: this.isModelReady,
                hasStyleReference: !!styleData.image,
                styleRatio: styleRatio
            });
            throw new Error(`Video processing failed: ${errorMessage}`);
        }
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
     * Clean up resources
     */
    cleanup() {
        if (this.ffmpeg) {
            // FFmpeg cleanup would go here if available
            this.ffmpeg = null;
        }
        this.isLoaded = false;
        this.useFallback = false;
    }
}

export default VideoProcessor; 