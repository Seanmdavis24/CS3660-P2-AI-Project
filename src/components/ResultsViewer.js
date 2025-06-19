/**
 * Results Viewer Component
 * 
 * Displays the processed video results, allows comparison with original,
 * and provides download options with different formats.
 */

import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';

function ResultsViewer() {
    const {
        processingState,
        currentVideo,
        selectedStyle,
        startNewVideo,
        setSelectedStyle,
        setAppState
    } = useContext(AppContext);

    const [isPlaying, setIsPlaying] = useState({ original: false, processed: false });
    const [showComparison, setShowComparison] = useState(true);
    const [videoErrors, setVideoErrors] = useState({ original: null, processed: null });
    const [videoUrls, setVideoUrls] = useState({ original: null, processed: null });
    const [showProcessingDetails, setShowProcessingDetails] = useState(false);
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    const originalVideoRef = useRef(null);
    const processedVideoRef = useRef(null);

    const result = processingState.result;

    // Create and manage video URLs
    React.useEffect(() => {
        let originalUrl = null;
        let processedUrl = null;

        console.log('🔍 ResultsViewer Debug Info:');
        console.log('- currentVideo:', currentVideo);
        console.log('- result:', result);
        console.log('- currentVideo.file:', currentVideo?.file);
        console.log('- result.blob:', result?.blob);
        console.log('- result.url:', result?.url);

        try {
            // Create original video URL
            if (currentVideo && currentVideo.file) {
                console.log('📹 Creating original video URL...');
                console.log('- File type:', currentVideo.file.type);
                console.log('- File size:', currentVideo.file.size);
                console.log('- File name:', currentVideo.file.name);

                originalUrl = URL.createObjectURL(currentVideo.file);
                console.log('✅ Created original video URL:', originalUrl);
            } else {
                console.warn('⚠️ Cannot create original video URL - missing currentVideo or file');
                setVideoErrors(prev => ({
                    ...prev,
                    original: 'Missing video file data'
                }));
            }

            // Use processed video URL
            if (result && result.url) {
                processedUrl = result.url;
                console.log('✅ Using existing processed video URL:', processedUrl);
            } else if (result && result.blob) {
                console.log('📹 Creating processed video URL from blob...');
                console.log('- Blob type:', result.blob.type);
                console.log('- Blob size:', result.blob.size);
                console.log('- Blob constructor:', result.blob.constructor.name);

                // Additional blob analysis
                if (result.blob.type) {
                    console.log('- MIME type detected:', result.blob.type);
                    console.log('- Is video MIME:', result.blob.type.startsWith('video/'));
                    console.log('- Is image MIME:', result.blob.type.startsWith('image/'));
                } else {
                    console.warn('⚠️ No MIME type detected on blob');
                }

                if (result.blob.size === 0) {
                    console.error('❌ Processed video blob is empty!');
                    setVideoErrors(prev => ({
                        ...prev,
                        processed: 'Processed video is empty'
                    }));
                } else {
                    processedUrl = URL.createObjectURL(result.blob);
                    console.log('✅ Created processed video URL from blob:', processedUrl);

                    // Test if blob can be read as video
                    const testVideo = document.createElement('video');
                    testVideo.src = processedUrl;
                    testVideo.onloadedmetadata = () => {
                        console.log('🎬 Test video metadata loaded successfully');
                        console.log('- Test video duration:', testVideo.duration);
                        console.log('- Test video dimensions:', `${testVideo.videoWidth}x${testVideo.videoHeight}`);
                    };
                    testVideo.onerror = (e) => {
                        console.error('❌ Test video failed to load:', e);
                    };
                }
            } else {
                console.error('❌ No processed video data available!');
                setVideoErrors(prev => ({
                    ...prev,
                    processed: 'No processed video data available'
                }));
            }

            console.log('🎬 Final URLs:');
            console.log('- Original URL:', originalUrl);
            console.log('- Processed URL:', processedUrl);

            // Set URLs immediately and clear any existing errors
            setVideoUrls({ original: originalUrl, processed: processedUrl });
            setVideoErrors({ original: null, processed: null });

            // Give a moment for the URLs to be set before videos try to load
            setTimeout(() => {
                console.log('⏰ URLs should now be available for video loading');
                if (originalVideoRef.current && originalUrl) {
                    originalVideoRef.current.load();
                }
                if (processedVideoRef.current && processedUrl) {
                    processedVideoRef.current.load();
                }
            }, 100);

        } catch (error) {
            console.error('❌ Error creating video URLs:', error);
            setVideoErrors(prev => ({
                ...prev,
                original: originalUrl ? null : `Failed to create original video URL: ${error.message}`,
                processed: processedUrl ? null : `Failed to create processed video URL: ${error.message}`
            }));
        }

        // Cleanup function - only clean up when component unmounts or dependencies change
        return () => {
            // Use a delay to prevent premature cleanup
            setTimeout(() => {
                try {
                    if (originalUrl && originalUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(originalUrl);
                        console.log('🧹 Cleaned up original video URL');
                    }
                    if (processedUrl && processedUrl.startsWith('blob:') && processedUrl !== result?.url) {
                        URL.revokeObjectURL(processedUrl);
                        console.log('🧹 Cleaned up processed video URL');
                    }
                } catch (cleanupError) {
                    console.warn('⚠️ Error during URL cleanup:', cleanupError);
                }
            }, 1000); // 1 second delay to prevent premature cleanup
        };
    }, [currentVideo, result]);

    // Debug Focus View functionality
    React.useEffect(() => {
        if (!showComparison) {
            console.log('🎯 Focus View Debug:', {
                showComparison,
                processedUrl: videoUrls.processed,
                originalUrl: videoUrls.original,
                urlsAreEqual: videoUrls.processed === videoUrls.original,
                resultBlob: result?.blob,
                resultUrl: result?.url,
                processedVideoExists: !!processedVideoRef.current
            });
        }
    }, [showComparison, videoUrls.processed, videoUrls.original]);

    if (!result) {
        return (
            <div className="card text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-semibold mb-4">No Results Available</h3>
                <p className="text-gray-600 mb-6">
                    It looks like there's no processed video to display.
                </p>
                <button className="btn btn-primary" onClick={startNewVideo}>
                    Start New Video
                </button>
            </div>
        );
    }

    const handleVideoToggle = (videoType, videoRef) => {
        if (videoRef.current) {
            if (isPlaying[videoType]) {
                videoRef.current.pause();
                setIsPlaying(prev => ({ ...prev, [videoType]: false }));
            } else {
                console.log(`▶️ Attempting to play ${videoType} video...`);
                videoRef.current.play().catch(error => {
                    console.error(`❌ Error playing ${videoType} video:`, error);
                    setVideoErrors(prev => ({ ...prev, [videoType]: `Playback failed: ${error.message}` }));
                });
                setIsPlaying(prev => ({ ...prev, [videoType]: true }));
            }
        } else {
            console.warn(`⚠️ No video ref available for ${videoType}`);
        }
    };

    const handleVideoError = (videoType, event) => {
        console.error(`❌ ${videoType} video error event:`, event);

        const video = event.target;
        console.error('- Video element:', video);
        console.error('- Video src:', video?.src);
        console.error('- Video currentSrc:', video?.currentSrc);
        console.error('- Video readyState:', video?.readyState);
        console.error('- Video networkState:', video?.networkState);
        console.error('- Video error object:', video?.error);

        let errorMessage = 'Video failed to load';

        if (video?.error) {
            const mediaError = video.error;
            console.error('- MediaError code:', mediaError.code);
            console.error('- MediaError message:', mediaError.message);

            switch (mediaError.code) {
                case 1: // MEDIA_ERR_ABORTED
                    errorMessage = 'Video loading was aborted';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorMessage = 'Network error while loading video';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorMessage = 'Video codec not supported or corrupted data';
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorMessage = 'Video format not supported by browser';
                    break;
                default:
                    errorMessage = `Video error (code: ${mediaError.code})`;
            }
            if (mediaError.message) {
                errorMessage += ` - ${mediaError.message}`;
            }
        } else {
            // Try to determine error from networkState and readyState
            if (video?.networkState === 3) { // NETWORK_NO_SOURCE
                errorMessage = 'No video source found or supported';
            } else if (video?.readyState === 0) { // HAVE_NOTHING
                errorMessage = 'Video data unavailable';
            } else {
                errorMessage = 'Unknown video loading error';
            }
        }

        console.error(`🚨 Final error message for ${videoType}:`, errorMessage);
        setVideoErrors(prev => ({ ...prev, [videoType]: errorMessage }));
    };

    const handleVideoLoad = (videoType) => {
        console.log(`✅ ${videoType} video loaded successfully`);
        setVideoErrors(prev => ({ ...prev, [videoType]: null }));
    };

    const handleVideoCanPlay = (videoType) => {
        console.log(`🎬 ${videoType} video can start playing`);
        setVideoErrors(prev => ({ ...prev, [videoType]: null }));
    };

    const handleDownload = async (format = 'mp4') => {
        try {
            if (!result.url && !result.blob) {
                throw new Error('No video available for download');
            }

            // Create download link
            const link = document.createElement('a');
            link.href = result.url || URL.createObjectURL(result.blob);
            link.download = `cartoonized_${currentVideo.name.replace(/\.[^/.]+$/, '')}_${selectedStyle.id}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('📥 Download initiated successfully');
        } catch (error) {
            console.error('❌ Download failed:', error);
            alert(`Download failed: ${error.message}. Please try again.`);
        }
    };

    const formatProcessingTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
    };

    const formatFileSize = (bytes) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    // Get video type for processed video
    const getProcessedVideoType = () => {
        if (result.blob && result.blob.type) {
            return result.blob.type;
        }
        return 'video/webm'; // Default to webm as our demo processor creates webm
    };

    const renderVideoPlayer = (videoType, videoRef, videoUrl, title, fileSize, isProcessed = false) => {
        const error = videoErrors[videoType];

        return (
            <div className="card group">
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xl font-semibold ${isProcessed ? 'text-gradient-secondary' : 'text-gradient-primary'}`}>
                        {title}
                    </h3>
                    <span className="text-sm text-gray-600">
                        {formatFileSize(fileSize)}
                    </span>
                </div>

                {error ? (
                    // Error state
                    <div className="relative rounded-xl overflow-hidden bg-red-100 aspect-video flex items-center justify-center">
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">❌</div>
                            <h4 className="text-lg font-semibold text-red-800 mb-2">Video Load Error</h4>
                            <p className="text-sm text-red-600 mb-4">{error}</p>
                            <button
                                className="btn btn-sm bg-red-600 text-white"
                                onClick={() => {
                                    setVideoErrors(prev => ({ ...prev, [videoType]: null }));
                                    if (videoRef.current) {
                                        videoRef.current.load();
                                    }
                                }}
                            >
                                Retry Loading
                            </button>
                        </div>
                    </div>
                ) : !videoUrl ? (
                    // Loading state
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                        <div className="text-center">
                            <div className="loading-spinner-lg loading-spinner-primary mb-4"></div>
                            <p className="text-gray-600">Loading video...</p>
                        </div>
                    </div>
                ) : (
                    // Video player
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video group-hover:shadow-2xl transition-all duration-500">
                        {/* Video Type Indicator */}
                        <div className="absolute top-3 left-3 z-10">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isProcessed
                                ? 'bg-gradient-secondary text-white'
                                : 'bg-gradient-primary text-white'
                                }`}>
                                {isProcessed ? '🎨 AI-STYLIZED' : '📹 ORIGINAL'}
                            </div>
                        </div>

                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            controls
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            src={videoUrl}
                            onPlay={() => setIsPlaying(prev => ({ ...prev, [videoType]: true }))}
                            onPause={() => setIsPlaying(prev => ({ ...prev, [videoType]: false }))}
                            onError={(e) => handleVideoError(videoType, e)}
                            onLoadedData={() => handleVideoLoad(videoType)}
                            onCanPlay={() => handleVideoCanPlay(videoType)}
                            onLoadStart={() => {
                                console.log(`🔄 ${videoType} video started loading from URL: ${videoUrl}`);
                                console.log(`🔍 Video ${videoType} source verification:`, {
                                    videoType,
                                    videoUrl,
                                    isProcessed,
                                    currentVideoSize: currentVideo?.size,
                                    resultBlobSize: result?.blob?.size
                                });
                            }}
                            onLoadedMetadata={() => {
                                console.log(`📊 ${videoType} video metadata loaded`);
                                const video = videoRef.current;
                                if (video) {
                                    console.log(`- Duration: ${video.duration}s`);
                                    console.log(`- Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
                                    console.log(`- Ready state: ${video.readyState}`);
                                    console.log(`- Current src: ${video.currentSrc}`);
                                }
                            }}
                            onCanPlayThrough={() => {
                                console.log(`✅ ${videoType} video can play through`);
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>

                        {/* Play/Pause Overlay */}
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={() => handleVideoToggle(videoType, videoRef)}
                        >
                            <div className="text-6xl text-white/80">
                                {isPlaying[videoType] ? '⏸️' : '▶️'}
                            </div>
                        </div>

                        {/* Style Badge for processed video */}
                        {isProcessed && (
                            <div className="absolute top-4 right-4 glass rounded-full px-3 py-1">
                                <span className="text-sm font-medium text-white">
                                    Custom Style
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center mt-4">
                    <span className="text-sm text-gray-600">
                        {isProcessed ? 'AI-stylized video' : 'Original video'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Success Header */}
            <div className="text-center relative">
                {/* Floating celebration elements */}
                <div className="absolute top-0 left-1/4 text-4xl floating">🎉</div>
                <div className="absolute top-5 right-1/4 text-3xl floating floating-delay-1">✨</div>
                <div className="absolute -top-2 right-1/3 text-2xl floating floating-delay-2">🎊</div>

                <h2 className="text-4xl md:text-5xl font-black text-gradient-rainbow mb-6">
                    🎉 Your Video is Ready!
                </h2>
                <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Your video has been successfully transformed using
                    <span className="text-gradient-primary font-bold"> Custom Style</span>
                </p>

                {/* Processing Summary */}
                <div className="glass rounded-2xl p-6 mt-6 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-400">{result.frameCount}</div>
                            <div className="text-sm text-white/70">Frames Processed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-400">
                                {formatProcessingTime(result.processingTime)}
                            </div>
                            <div className="text-sm text-white/70">Processing Time</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-400">Custom Style</div>
                            <div className="text-sm text-white/70">Style Applied</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-400">100%</div>
                            <div className="text-sm text-white/70">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Comparison Toggle */}
            <div className="flex justify-center">
                <div className="glass rounded-2xl p-6 flex gap-4">
                    <button
                        className={`px-16 py-4 rounded-xl font-medium text-base transition-all duration-300 w-48 ${showComparison
                            ? 'bg-gradient-primary text-white shadow-lg transform scale-105'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        onClick={() => setShowComparison(true)}
                    >
                        Compare Videos
                    </button>
                    <button
                        className={`px-16 py-4 rounded-xl font-medium text-base transition-all duration-300 w-48 ${!showComparison
                            ? 'bg-gradient-secondary text-white shadow-lg transform scale-105'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        onClick={() => setShowComparison(false)}
                    >
                        Focus View
                    </button>
                </div>
            </div>

            {/* Video Display */}
            {showComparison ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {renderVideoPlayer('original', originalVideoRef, videoUrls.original, 'Original', currentVideo.size)}
                    {renderVideoPlayer('processed', processedVideoRef, videoUrls.processed, '🎨 Custom Style', result.blob.size, true)}
                </div>
            ) : (
                /* Focus View - Only Processed Video */
                <div className="max-w-4xl mx-auto">
                    <div className="mb-4 text-center">
                        <div className="inline-flex items-center glass rounded-full px-4 py-2">
                            <span className="text-sm text-white/80 mr-2">🎯 Focus View:</span>
                            <span className="text-sm font-medium text-white">AI-Stylized Video Only</span>
                        </div>
                    </div>

                    {renderVideoPlayer('processed', processedVideoRef, videoUrls.processed, '🎨 Custom Style', result.blob.size, true)}
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-6">
                {/* Download Options */}
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Download Your Video</h3>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            className="btn bg-gradient-primary text-white btn-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            onClick={() => handleDownload('mp4')}
                        >
                            <span className="mr-2">📥</span>
                            Download MP4
                            <span className="ml-2">✨</span>
                        </button>

                        <button
                            className="btn bg-gradient-secondary text-white btn-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            onClick={() => {
                                // Share functionality
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Check out my AI-stylized video!',
                                        text: `I transformed my video using Custom Style with CartoonizeMe!`,
                                    });
                                } else {
                                    // Fallback to copy link
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                        >
                            <span className="mr-2">📤</span>
                            Share Video
                            <span className="ml-2">🚀</span>
                        </button>
                    </div>
                </div>

                {/* Additional Actions */}
                <div className="text-center">
                    <h4 className="text-lg font-medium text-white/80 mb-4">What's Next?</h4>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            className="btn glass text-white hover:bg-white/20 transition-all duration-300"
                            onClick={startNewVideo}
                        >
                            <span className="mr-2">🔄</span>
                            Process Another Video
                        </button>

                        <button
                            className="btn glass text-white hover:bg-white/20 transition-all duration-300"
                            onClick={() => {
                                setSelectedStyle(null);
                                setAppState('styleSelection');
                            }}
                        >
                            <span className="mr-2">🎨</span>
                            Try Different Style
                        </button>

                        <button
                            className="btn glass text-white hover:bg-white/20 transition-all duration-300"
                            onClick={() => setShowProcessingDetails(!showProcessingDetails)}
                        >
                            <span className="mr-2">📊</span>
                            {showProcessingDetails ? 'Hide' : 'Show'} Processing Details
                        </button>

                        <button
                            className="btn glass text-white hover:bg-white/20 transition-all duration-300"
                            onClick={() => setShowDebugInfo(!showDebugInfo)}
                        >
                            <span className="mr-2">🔧</span>
                            {showDebugInfo ? 'Hide' : 'Show'} Debug Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Processing Details */}
            {showProcessingDetails && (
                <div className="glass rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">Processing Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-300">
                            <div className="text-white/60 mb-1">Original Size</div>
                            <div className="font-medium text-white">{formatFileSize(currentVideo.size)}</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-300">
                            <div className="text-white/60 mb-1">Processed Size</div>
                            <div className="font-medium text-white">{formatFileSize(result.blob.size)}</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-300">
                            <div className="text-white/60 mb-1">Processing Time</div>
                            <div className="font-medium text-white">{formatProcessingTime(result.processingTime)}</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-300">
                            <div className="text-white/60 mb-1">Frames</div>
                            <div className="font-medium text-white">{result.frameCount}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Panel */}
            {showDebugInfo && (
                <div className="glass rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">🔧 Debug Information</h4>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span>Current Video Data</span>
                            </h5>
                            <div className="bg-black/30 rounded-xl p-4 font-mono text-xs text-white/80 border border-white/10">
                                <div>• File exists: {currentVideo?.file ? '✅ Yes' : '❌ No'}</div>
                                <div>• File type: {currentVideo?.file?.type || 'N/A'}</div>
                                <div>• File size: {currentVideo?.file?.size || 'N/A'} bytes</div>
                                <div>• File name: {currentVideo?.file?.name || 'N/A'}</div>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <span>Result Data</span>
                            </h5>
                            <div className="bg-black/30 rounded-xl p-4 font-mono text-xs text-white/80 border border-white/10">
                                <div>• Result exists: {result ? '✅ Yes' : '❌ No'}</div>
                                <div>• Has blob: {result?.blob ? '✅ Yes' : '❌ No'}</div>
                                <div>• Blob type: {result?.blob?.type || 'N/A'}</div>
                                <div>• Blob size: {result?.blob?.size || 'N/A'} bytes</div>
                                <div>• Has URL: {result?.url ? '✅ Yes' : '❌ No'}</div>
                                <div>• Frame count: {result?.frameCount || 'N/A'}</div>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                <span>Video URLs</span>
                            </h5>
                            <div className="bg-black/30 rounded-xl p-4 font-mono text-xs text-white/80 border border-white/10">
                                <div>• Original URL: {videoUrls.original ? '✅ Created' : '❌ Missing'}</div>
                                <div>• Processed URL: {videoUrls.processed ? '✅ Created' : '❌ Missing'}</div>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                <span>Video Errors</span>
                            </h5>
                            <div className="bg-black/30 rounded-xl p-4 font-mono text-xs text-white/80 border border-white/10">
                                <div>• Original error: {videoErrors.original || '✅ None'}</div>
                                <div>• Processed error: {videoErrors.processed || '✅ None'}</div>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                <span>Video Debug Actions</span>
                            </h5>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300"
                                    onClick={() => {
                                        console.log('🔍 MANUAL VIDEO DEBUG:');
                                        [originalVideoRef, processedVideoRef].forEach((ref, index) => {
                                            const videoType = index === 0 ? 'original' : 'processed';
                                            const video = ref.current;
                                            if (video) {
                                                console.log(`\n📹 ${videoType.toUpperCase()} VIDEO STATE:`);
                                                console.log('- src:', video.src);
                                                console.log('- currentSrc:', video.currentSrc);
                                                console.log('- readyState:', video.readyState);
                                                console.log('- networkState:', video.networkState);
                                                console.log('- duration:', video.duration);
                                                console.log('- videoWidth:', video.videoWidth);
                                                console.log('- videoHeight:', video.videoHeight);
                                                console.log('- paused:', video.paused);
                                                console.log('- ended:', video.ended);
                                                console.log('- currentTime:', video.currentTime);
                                                console.log('- controls:', video.controls);
                                                console.log('- muted:', video.muted);

                                                // Try to force play
                                                video.play().then(() => {
                                                    console.log(`✅ ${videoType} video started playing`);
                                                }).catch(err => {
                                                    console.error(`❌ ${videoType} video play failed:`, err);
                                                });
                                            } else {
                                                console.log(`❌ No ${videoType} video ref found`);
                                            }
                                        });
                                    }}
                                >
                                    🔍 Debug Videos
                                </button>
                                <button
                                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 transition-colors duration-300"
                                    onClick={() => {
                                        [originalVideoRef, processedVideoRef].forEach((ref, index) => {
                                            const videoType = index === 0 ? 'original' : 'processed';
                                            const video = ref.current;
                                            if (video) {
                                                video.load();
                                                console.log(`🔄 Reloaded ${videoType} video`);
                                            }
                                        });
                                    }}
                                >
                                    🔄 Reload Videos
                                </button>
                                <button
                                    className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300"
                                    onClick={() => {
                                        [originalVideoRef, processedVideoRef].forEach((ref, index) => {
                                            const videoType = index === 0 ? 'original' : 'processed';
                                            const video = ref.current;
                                            if (video) {
                                                video.currentTime = 0;
                                                video.play().catch(err => {
                                                    console.error(`❌ Force play ${videoType} failed:`, err);
                                                });
                                            }
                                        });
                                    }}
                                >
                                    ▶️ Force Play
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResultsViewer; 