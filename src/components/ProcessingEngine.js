/**
 * Processing Engine Component
 * 
 * Handles the complete video processing workflow including:
 * - Frame extraction using FFmpeg
 * - Neural style transfer using TensorFlow.js
 * - Video reconstruction from processed frames
 * - Real-time progress tracking
 * - Fallback to demo mode when advanced processing fails
 */

import React, { useEffect, useContext, useState, useRef, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import VideoProcessor from '../utils/videoProcessor';
import DemoProcessor from '../utils/demoProcessor';

function ProcessingEngine({ video, style }) {
    const {
        updateProgress,
        setProcessingResult,
        setError,
        processingState,
        setProcessingState,
        setAppState
    } = useContext(AppContext);

    const [currentStage, setCurrentStage] = useState('initializing');
    const [stageProgress, setStageProgress] = useState(0);
    const [processedFrames, setProcessedFrames] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [debugLog, setDebugLog] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [result, setResult] = useState(null);

    const processorRef = useRef(null);
    const isProcessingRef = useRef(false);
    const startTimeRef = useRef(null);

    // Add safety checks for context functions
    const safeSetError = useCallback((error) => {
        try {
            if (setError && typeof setError === 'function') {
                setError(error);
            } else {
                console.error('❌ setError function not available:', error);
            }
        } catch (contextError) {
            console.error('❌ Error calling setError:', contextError, 'Original error:', error);
        }
    }, [setError]);

    const safeUpdateProgress = useCallback((progressData) => {
        try {
            if (updateProgress && typeof updateProgress === 'function') {
                updateProgress(progressData);
            } else {
                console.log('📊 Progress update (no context):', progressData);
            }
        } catch (contextError) {
            console.error('❌ Error calling updateProgress:', contextError);
        }
    }, [updateProgress]);

    const safeSetProcessingResult = useCallback((result) => {
        try {
            if (setProcessingResult && typeof setProcessingResult === 'function') {
                setProcessingResult(result);
            } else {
                console.error('❌ setProcessingResult function not available');
            }
        } catch (contextError) {
            console.error('❌ Error calling setProcessingResult:', contextError);
        }
    }, [setProcessingResult]);

    const safeSetAppState = useCallback((state) => {
        try {
            if (setAppState && typeof setAppState === 'function') {
                setAppState(state);
            } else {
                console.error('❌ setAppState function not available');
            }
        } catch (contextError) {
            console.error('❌ Error calling setAppState:', contextError);
        }
    }, [setAppState]);

    const addDebugLog = (message) => {
        try {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] ${message}`;
            console.log(logEntry);
            setDebugLog(prev => [...prev.slice(-4), logEntry]); // Keep last 5 entries
        } catch (error) {
            console.error('❌ Error adding debug log:', error);
        }
    };

    const startProcessing = useCallback(async () => {
        try {
            if (!video || !style) {
                console.error('❌ Missing video or style data');
                safeSetError('Missing video or style data');
                return;
            }

            console.log('🎬 Starting ProcessingEngine with:', {
                videoName: video?.file?.name,
                styleName: style?.metadata?.fileName,
                hasVideo: !!video,
                hasStyle: !!style
            });

            setIsProcessing(true);
            setProgress(0);
            setCurrentStage('initializing');

            // Clear any previous errors
            safeSetError(null);

            // Set start time for processing duration calculation
            const startTime = Date.now();
            setStartTime(startTime);

            console.log('🎬 Starting video processing workflow...');
            console.log('- Video:', video.file.name);
            console.log('- Style:', style.metadata.fileName);

            let processor = null;

            // Helper function to determine optimal FPS based on video duration
            const getOptimalFPS = () => {
                if (!video || !video.duration) return 5; // default FPS

                // For longer videos, use lower FPS to reduce processing time
                if (video.duration > 30) return 3;
                if (video.duration > 15) return 4;
                return 5; // Maximum FPS for shorter videos
            };

            // Progress tracking callback
            const onProgress = (progressData) => {
                console.log(`📊 Progress update:`, progressData);

                // Update local state
                setProgress(Math.round(progressData.progress));
                setCurrentStage(progressData.stage);
                setProcessedFrames(progressData.currentFrame || 0);
                setTotalFrames(progressData.totalFrames || 0);
                setTimeRemaining(progressData.timeRemaining);

                // Update global progress context safely
                safeUpdateProgress(progressData);
            };

            // Stage 1: Initialize processor
            setCurrentStage('initializing');
            processor = new VideoProcessor();

            await processor.initialize(
                (progressData) => {
                    setProgress(Math.round(progressData.progress * 0.1)); // 0-10%
                },
                (stage) => {
                    setCurrentStage(stage);
                }
            );

            // Stage 2: Process user's style reference
            setCurrentStage('processing_style_reference');
            setProgress(10);

            const styleProcessed = await processor.processStyleReference(style);
            if (!styleProcessed) {
                throw new Error('Failed to process style reference image');
            }

            // Stage 3: Extract frames
            setCurrentStage('extracting_frames');
            setProgress(20);

            console.log('📸 Extracting video frames...');
            const fps = getOptimalFPS();

            // Stage 4: Process video
            setCurrentStage('applying_style');

            const result = await processor.processVideo(video.file, style, {
                fps: fps,
                styleRatio: style.styleRatio || 1.0,
                onFrameProgress: (frameProgress) => {
                    // Map frame progress to 20-90% of total progress
                    const progressPercent = 20 + (frameProgress.progress * 0.7);

                    // Calculate time remaining
                    const elapsedTime = Date.now() - startTime;
                    const estimatedTotalTime = frameProgress.current > 0
                        ? (elapsedTime / frameProgress.current) * frameProgress.total
                        : null;
                    const timeRemaining = estimatedTotalTime
                        ? Math.max(0, Math.round((estimatedTotalTime - elapsedTime) / 1000))
                        : null;

                    // Call progress callback
                    onProgress({
                        progress: progressPercent,
                        stage: 'applying_style',
                        currentFrame: frameProgress.current,
                        totalFrames: frameProgress.total,
                        timeRemaining: timeRemaining
                    });
                }
            });

            // Stage 5: Finalize
            setCurrentStage('finalizing');
            setProgress(95);

            console.log('✅ Video processing completed successfully!');

            // Save result
            const finalResult = {
                ...result,
                originalVideo: video,
                appliedStyle: style,
                processingTime: Date.now() - startTime,
                fps: fps
            };

            setResult(finalResult);
            setProgress(100);
            setCurrentStage('completed');

            // Update global state safely
            safeSetProcessingResult(finalResult);

            // Auto-transition to results after a brief delay
            setTimeout(() => {
                safeSetAppState('results');
            }, 1000);

        } catch (error) {
            console.error('❌ Processing failed:', error);

            // Enhanced error handling with better debugging
            let errorMessage = 'Processing failed with unknown error';

            if (error && error.message) {
                errorMessage = `Processing failed: ${error.message}`;
            } else if (typeof error === 'string') {
                errorMessage = `Processing failed: ${error}`;
            } else if (error) {
                errorMessage = `Processing failed: ${error.toString()}`;
            }

            // Add more context for debugging
            console.error('❌ Full error details:', {
                error: error,
                message: error?.message,
                stack: error?.stack,
                video: video?.file?.name,
                style: style?.metadata?.fileName,
                stage: currentStage
            });

            safeSetError(errorMessage);
            setCurrentStage('error');
        } finally {
            setIsProcessing(false);

            // Cleanup processor
            if (processorRef.current) {
                try {
                    processorRef.current.cleanup();
                } catch (cleanupError) {
                    console.warn('⚠️ Cleanup warning:', cleanupError);
                }
            }
        }
    }, [video, style, safeUpdateProgress, safeSetProcessingResult, safeSetAppState, safeSetError]);

    useEffect(() => {
        try {
            console.log('🔄 ProcessingEngine useEffect triggered:', {
                hasVideo: !!video,
                hasStyle: !!style,
                isProcessing: isProcessingRef.current,
                videoName: video?.file?.name,
                styleName: style?.metadata?.fileName
            });

            if (video && style && !isProcessingRef.current) {
                console.log('🎬 Starting processing workflow...');
                isProcessingRef.current = true;

                // Clear any previous errors before starting
                safeSetError(null);

                // Add a small delay to ensure UI is ready
                setTimeout(() => {
                    startProcessing().catch(error => {
                        console.error('❌ Error in startProcessing:', error);
                        // Only set error if it's a real processing error
                        if (error && error.message && !error.message.includes('load')) {
                            safeSetError(`Failed to start processing: ${error.message || error.toString()}`);
                        } else {
                            console.log('🔄 Processing continues with fallback methods');
                        }
                    }).finally(() => {
                        isProcessingRef.current = false;
                    });
                }, 100);
            }
        } catch (effectError) {
            console.error('❌ Error in ProcessingEngine useEffect:', effectError);
            safeSetError(`Component initialization error: ${effectError.message || effectError.toString()}`);
        }

        // Cleanup on unmount
        return () => {
            try {
                if (processorRef.current) {
                    processorRef.current.cleanup();
                }
            } catch (cleanupError) {
                console.warn('⚠️ Cleanup error:', cleanupError);
            }
        };
    }, [video, style, startProcessing, safeSetError]);

    const tryDemoProcessing = async () => {
        try {
            console.log('🎬 Starting demo processing mode...');
            addDebugLog('Starting demo processing mode...');
            setIsDemoMode(true);

            // Initialize demo processor
            processorRef.current = new DemoProcessor();

            // Set up progress tracking callbacks for demo
            const onStageChange = (stage) => {
                addDebugLog(`Demo stage changed to: ${stage}`);
                setCurrentStage(stage);
                setStageProgress(0);
            };

            const onFrameProgress = ({ current, total, progress }) => {
                addDebugLog(`Demo progress: ${current}/${total} (${progress.toFixed(1)}%)`);
                setProcessedFrames(current);
                setTotalFrames(total);

                // Calculate overall progress
                const overallProgress = 20 + (progress * 0.6);

                // Calculate time remaining (faster for demo)
                const elapsedTime = Date.now() - startTimeRef.current;
                const estimatedTotalTime = (elapsedTime / current) * total;
                const remaining = Math.max(0, estimatedTotalTime - elapsedTime);

                setTimeRemaining(Math.round(remaining / 1000));

                updateProgress({
                    progress: Math.round(overallProgress),
                    currentFrame: current,
                    totalFrames: total,
                    timeRemaining: Math.round(remaining / 1000),
                    stage: 'applying_style'
                });
            };

            // Initialize the demo processor
            addDebugLog('Initializing demo processor...');
            await processorRef.current.initialize(null, onStageChange);
            updateProgress({ progress: 20, stage: 'ready' });
            addDebugLog('Demo processor initialized successfully');

            // Process the video in demo mode
            addDebugLog('Starting demo video processing...');
            const result = await processorRef.current.processVideo(
                video.file,
                style.id,
                {
                    onFrameProgress
                }
            );

            addDebugLog('Demo video processing completed');

            // Final progress update
            updateProgress({ progress: 100, stage: 'completed' });

            // Set the processing result with demo flag
            setProcessingResult({
                url: result.url,
                blob: result.blob,
                originalVideo: video,
                appliedStyle: style,
                processingTime: Date.now() - startTimeRef.current,
                frameCount: result.frameCount,
                fps: result.fps,
                isDemoMode: true
            });

            addDebugLog('Demo processing completed successfully');

        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error in demo processing';
            addDebugLog(`Error in tryDemoProcessing: ${errorMessage}`);
            throw new Error(`Demo processing failed: ${errorMessage}`);
        }
    };

    const getStageDisplay = () => {
        try {
            const baseStages = {
                'initializing': { icon: '🔧', text: 'Initializing video processor...', color: 'text-blue-400' },
                'ready': { icon: '🧠', text: 'Loading Custom Style model...', color: 'text-purple-400' },
                'extracting_frames': { icon: '🎬', text: 'Extracting video frames...', color: 'text-green-400' },
                'applying_style': { icon: '🎨', text: 'Applying Custom Style to frames...', color: 'text-orange-400' },
                'reconstructing_video': { icon: '🔄', text: 'Reconstructing stylized video...', color: 'text-cyan-400' },
            };

            const stage = baseStages[currentStage] || { icon: '⚙️', text: 'Processing...', color: 'text-gray-400' };

            // Add demo mode indicator
            if (isDemoMode) {
                stage.text = `[DEMO] ${stage.text}`;
            }

            return stage;
        } catch (error) {
            console.error('❌ Error in getStageDisplay:', error);
            return { icon: '⚙️', text: 'Processing...', color: 'text-gray-400' };
        }
    };

    // Early return with error state if required props are missing
    if (!video || !style) {
        return (
            <div className="space-y-6">
                <div className="card bg-red-50 border-red-200 text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-700 mb-2">
                        Processing Configuration Error
                    </h3>
                    <p className="text-red-600">
                        Missing required video or style data. Please go back and try again.
                    </p>
                </div>
            </div>
        );
    }

    const stage = getStageDisplay();

    // Wrap the entire render in a try-catch
    try {
        return (
            <div className="space-y-6">
                {/* Debug Log Panel (development only) */}
                {process.env.NODE_ENV === 'development' && debugLog.length > 0 && (
                    <div className="card bg-gray-50 border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">🔍 Debug Log</h4>
                        <div className="text-xs text-gray-600 space-y-1 max-h-24 overflow-y-auto">
                            {debugLog.map((log, index) => (
                                <div key={index} className="font-mono">{log}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Demo Mode Notice */}
                {isDemoMode && (
                    <div className="card bg-amber-50 border-amber-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="text-3xl">🎭</div>
                            <div>
                                <h4 className="text-lg font-semibold text-amber-800">Demo Mode Active</h4>
                                <p className="text-amber-700 text-sm">
                                    Advanced processing isn't available, but we're creating a styled preview for you!
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-amber-600 bg-amber-100 rounded px-3 py-2">
                            <strong>Note:</strong> This demo applies style effects to a single frame.
                            For full video processing, please use a browser that supports WebAssembly and Web Workers.
                        </div>
                    </div>
                )}

                {/* Current Stage Display */}
                <div className="card text-center">
                    <div className="text-6xl mb-4 animate-pulse">{stage.icon}</div>
                    <h3 className={`text-2xl font-semibold mb-4 ${stage.color}`}>
                        {stage.text}
                    </h3>

                    {/* Stage Progress Bar */}
                    <div className="progress mb-4">
                        <div
                            className={`progress-bar transition-all duration-500 ${isDemoMode ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-primary'
                                }`}
                            style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                        ></div>
                    </div>

                    <p className="text-gray-600">Progress: {Math.round(progress || 0)}%</p>
                </div>

                {/* Frame Processing Details */}
                {currentStage === 'applying_style' && totalFrames > 0 && (
                    <div className="card">
                        <h4 className="text-lg font-semibold mb-4 text-center">
                            {isDemoMode ? 'Demo Processing' : 'Frame Processing'}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className={`text-2xl font-bold ${isDemoMode ? 'text-amber-600' : 'text-primary-600'}`}>
                                    {processedFrames || 0}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {isDemoMode ? 'Steps Completed' : 'Frames Processed'}
                                </div>
                            </div>
                            <div>
                                <div className={`text-2xl font-bold ${isDemoMode ? 'text-orange-600' : 'text-secondary-600'}`}>
                                    {totalFrames || 0}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {isDemoMode ? 'Total Steps' : 'Total Frames'}
                                </div>
                            </div>
                        </div>

                        {timeRemaining && timeRemaining > 0 && (
                            <div className="text-center mt-4">
                                <div className="text-lg font-medium text-gray-700">
                                    Estimated time remaining: {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Processing Stats */}
                <div className="card">
                    <h4 className="text-lg font-semibold mb-4">Processing Information</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Video:</span>
                            <span className="font-medium">{video?.file?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Style:</span>
                            <span className="font-medium">Custom Style</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">File Size:</span>
                            <span className="font-medium">
                                {video?.file?.size ? `${(video.file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mode:</span>
                            <span className={`font-medium ${isDemoMode ? 'text-amber-600' : 'text-green-600'}`}>
                                {isDemoMode ? 'Demo Processing' : 'Full Processing'}
                            </span>
                        </div>
                        {style?.styleRatio && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Style Strength:</span>
                                <span className="font-medium text-purple-600">
                                    {Math.round((style.styleRatio || 1.0) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Tips */}
                <div className={`card ${isDemoMode ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <h4 className={`text-lg font-semibold mb-3 ${isDemoMode ? 'text-amber-800' : 'text-blue-800'}`}>
                        💡 {isDemoMode ? 'Demo Mode Info' : 'Processing Tips'}
                    </h4>
                    <ul className={`text-sm space-y-2 ${isDemoMode ? 'text-amber-700' : 'text-blue-700'}`}>
                        {isDemoMode ? (
                            <>
                                <li>• This demo creates a stylized preview from your video's first frame</li>
                                <li>• The result shows how the style effect would look on your content</li>
                                <li>• For full video processing, try using Chrome, Firefox, or Safari</li>
                                <li>• Make sure your browser supports modern web technologies</li>
                            </>
                        ) : (
                            <>
                                <li>• Keep your browser tab active for optimal performance</li>
                                <li>• Processing time depends on video length and device capabilities</li>
                                <li>• The video is processed entirely in your browser - nothing is uploaded</li>
                                <li>• You can process multiple videos, but one at a time for best results</li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        );
    } catch (renderError) {
        console.error('❌ Error rendering ProcessingEngine:', renderError);

        // Fallback render
        return (
            <div className="space-y-6">
                <div className="card bg-yellow-50 border-yellow-200 text-center">
                    <div className="text-4xl mb-4">🔄</div>
                    <h3 className="text-xl font-bold text-yellow-700 mb-2">
                        Processing Your Video
                    </h3>
                    <p className="text-yellow-600 mb-4">
                        The AI is working on transforming your video. This may take a few moments...
                    </p>
                    <div className="progress mb-4">
                        <div
                            className="progress-bar bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000"
                            style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-yellow-600">
                        Progress: {Math.round(progress || 0)}%
                    </p>
                </div>
            </div>
        );
    }
}

export default ProcessingEngine; 