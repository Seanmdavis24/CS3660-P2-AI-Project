/**
 * Video Upload Component
 * 
 * Simplified video upload interface with single upload action, glass morphism design,
 * and clean user experience focused on the core upload functionality.
 * 
 * Requirements addressed:
 * - REQ-030: Drag-and-drop video upload zone
 * - REQ-031: Single unified upload action (no duplicate buttons)
 * - REQ-032: Upload progress indicator
 * - REQ-033: Video thumbnail generation and display
 * 
 * @author CartoonizeMe Team
 */

import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

function VideoUpload() {
    const { setCurrentVideo, setError } = useContext(AppContext);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    /**
     * Handle drag and drop events
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    };

    /**
     * Handle file input change
     */
    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    };

    /**
     * Process selected file
     */
    const handleFileSelection = async (file) => {
        try {
            setIsUploading(true);

            // Enhanced file validation
            const validation = await validateVideoFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            console.log('📁 Processing file:', file.name, file.size, file.type);

            // Extract basic video metadata
            const metadata = await extractVideoMetadata(file);

            // Create video object with validation results
            const videoData = {
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                duration: metadata.duration || 10,
                thumbnail: metadata.thumbnail || null,
                metadata: {
                    width: metadata.width || 1920,
                    height: metadata.height || 1080,
                    frameRate: metadata.frameRate || 30,
                    codec: metadata.codec || 'unknown',
                    compatibility: validation.compatibility
                }
            };

            setCurrentVideo(videoData);

        } catch (error) {
            console.error('❌ File processing error:', error);
            setError(error);
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Validate video file format and compatibility
     */
    const validateVideoFile = async (file) => {
        return new Promise((resolve) => {
            // Check file type
            const allowedTypes = [
                'video/mp4',
                'video/webm',
                'video/quicktime', // .mov
                'video/avi',
                'video/x-msvideo' // alternative avi mime type
            ];

            if (!allowedTypes.includes(file.type)) {
                resolve({
                    isValid: false,
                    error: `Unsupported file format: ${file.type || 'unknown'}. Please use MP4 (H.264), WebM, MOV, or AVI format.`,
                    compatibility: 'unsupported'
                });
                return;
            }

            // Check file size (100MB limit)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                resolve({
                    isValid: false,
                    error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 100MB.`,
                    compatibility: 'too_large'
                });
                return;
            }

            // Test browser support for the specific video type
            const video = document.createElement('video');
            const canPlayType = video.canPlayType(file.type);

            let compatibility = 'unknown';
            if (canPlayType === 'probably') {
                compatibility = 'excellent';
            } else if (canPlayType === 'maybe') {
                compatibility = 'good';
            } else if (canPlayType === '') {
                compatibility = 'poor';
            }

            // For MP4, check for common codec support
            if (file.type === 'video/mp4') {
                const h264Support = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
                if (h264Support === 'probably' || h264Support === 'maybe') {
                    compatibility = 'excellent';
                }
            }

            console.log(`📹 Browser compatibility for ${file.type}: ${canPlayType} (${compatibility})`);

            if (compatibility === 'poor') {
                resolve({
                    isValid: false,
                    error: `Your browser may not support this video format. Please try converting to MP4 with H.264 codec for best compatibility.`,
                    compatibility: 'poor'
                });
                return;
            }

            resolve({
                isValid: true,
                compatibility: compatibility
            });
        });
    };

    /**
     * Extract basic video metadata
     */
    const extractVideoMetadata = (file) => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.muted = true;
            video.preload = 'metadata';

            const timeout = setTimeout(() => {
                resolve({
                    duration: null,
                    width: null,
                    height: null,
                    frameRate: null,
                    thumbnail: null,
                    codec: null
                });
            }, 10000); // 10 second timeout

            video.onloadedmetadata = () => {
                clearTimeout(timeout);

                const metadata = {
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    frameRate: 30, // Default estimate
                    codec: 'unknown'
                };

                // Check duration limit (30 seconds)
                if (video.duration > 30) {
                    resolve({
                        ...metadata,
                        error: `Video too long: ${video.duration.toFixed(1)}s. Maximum duration is 30 seconds.`
                    });
                    return;
                }

                // Create thumbnail
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    canvas.width = 200; // Thumbnail width
                    canvas.height = (200 * video.videoHeight) / video.videoWidth;

                    video.currentTime = Math.min(1, video.duration * 0.1);

                    video.onseeked = () => {
                        try {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob((blob) => {
                                resolve({
                                    ...metadata,
                                    thumbnail: blob ? URL.createObjectURL(blob) : null
                                });
                            }, 'image/jpeg', 0.8);
                        } catch (error) {
                            resolve(metadata);
                        }
                    };
                } else {
                    resolve(metadata);
                }
            };

            video.onerror = () => {
                clearTimeout(timeout);
                resolve({
                    duration: null,
                    width: null,
                    height: null,
                    frameRate: null,
                    thumbnail: null,
                    codec: null,
                    error: 'Could not read video metadata'
                });
            };

            try {
                video.src = URL.createObjectURL(file);
            } catch (error) {
                clearTimeout(timeout);
                resolve({
                    duration: null,
                    width: null,
                    height: null,
                    frameRate: null,
                    thumbnail: null,
                    codec: null,
                    error: 'Could not create video URL'
                });
            }
        });
    };

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center relative">
                {/* Floating decorative elements */}
                <div className="absolute top-0 left-1/4 text-4xl floating">🎨</div>
                <div className="absolute top-10 right-1/4 text-3xl floating floating-delay-1">✨</div>
                <div className="absolute -top-5 right-1/3 text-2xl floating floating-delay-2">🎬</div>

                {/* Enhanced headline with better contrast */}
                <h1 className="text-5xl md:text-6xl font-black mb-6 relative z-10"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 25%, #e0f2fe 50%, #bae6fd 75%, #7dd3fc 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(255, 255, 255, 0.1)',
                        filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))'
                    }}>
                    Transform Your Videos with AI
                </h1>

                <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-3xl mx-auto font-medium leading-relaxed"
                    style={{
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}>
                    Upload a video and watch it transform into beautiful artistic styles using
                    <span className="text-gradient-primary font-bold"> cutting-edge neural style transfer</span> technology.
                </p>
            </div>

            {/* Main Upload Zone */}
            <div className="max-w-4xl mx-auto">
                <div
                    className={`
                        relative group transition-all duration-500 ease-out transform
                        ${isDragging ? 'scale-105' : 'hover:scale-[1.02]'}
                        ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && document.getElementById('file-input').click()}
                >
                    {/* Main upload card */}
                    <div className={`
                        card p-16 text-center transition-all duration-500
                        ${isDragging
                            ? 'border-primary-400 bg-primary-50/20 shadow-glow'
                            : 'border-white/20 hover:border-white/40'
                        }
                        ${isUploading ? 'opacity-75' : ''}
                        relative overflow-hidden
                    `}>
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-gradient-rainbow animate-pulse"></div>
                        </div>

                        {/* Upload content */}
                        <div className="relative z-10">
                            {/* Dynamic upload icon */}
                            <div className={`
                                text-8xl mb-8 transition-all duration-500 transform
                                ${isDragging ? 'scale-125 rotate-12' : 'group-hover:scale-110'}
                                ${isUploading ? 'animate-pulse' : ''}
                            `}>
                                {isUploading ? (
                                    <div className="inline-block">
                                        <div className="loading-spinner-lg loading-spinner-rainbow"></div>
                                    </div>
                                ) : isDragging ? '🎯' : '🎬'}
                            </div>

                            {/* Upload text */}
                            <h2 className="text-3xl md:text-4xl font-bold mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #7c2d12 0%, #a855f7 30%, #c084fc 60%, #e9d5ff 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                    filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.6))'
                                }}>
                                {isUploading ? 'Processing Your Video...' :
                                    isDragging ? 'Drop It Like It\'s Hot!' :
                                        'Upload Your Video'}
                            </h2>

                            <p className="text-lg text-white/80 mb-8 max-w-md mx-auto">
                                {isUploading
                                    ? 'Analyzing your video file and preparing for magic...'
                                    : isDragging
                                        ? 'Release to start the transformation!'
                                        : 'Drag & drop your video here, or click to browse'
                                }
                            </p>

                            {/* File requirements */}
                            <div className="glass rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📁</div>
                                        <div className="font-semibold text-white mb-1">Best Formats</div>
                                        <div className="text-white/70">MP4 (H.264)</div>
                                        <div className="text-white/50 text-xs mt-1">Also: WebM, MOV, AVI</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">⏱️</div>
                                        <div className="font-semibold text-white mb-1">Max Duration</div>
                                        <div className="text-white/70">30 seconds</div>
                                        <div className="text-white/50 text-xs mt-1">For best performance</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">💾</div>
                                        <div className="font-semibold text-white mb-1">Max File Size</div>
                                        <div className="text-white/70">100MB</div>
                                        <div className="text-white/50 text-xs mt-1">Smaller = faster</div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/20">
                                    <div className="text-center text-xs text-white/60">
                                        💡 <strong>Having issues?</strong> Try converting your video to MP4 format with H.264 codec for best compatibility
                                    </div>
                                </div>
                            </div>

                            {/* Single upload action */}
                            {!isUploading && (
                                <button
                                    className="btn btn-rainbow btn-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById('file-input').click();
                                    }}
                                >
                                    <span className="mr-3 text-xl">🚀</span>
                                    Choose Your Video
                                    <span className="ml-3 text-xl">✨</span>
                                </button>
                            )}

                            {/* Hidden File Input */}
                            <input
                                id="file-input"
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/avi,video/x-msvideo,.mp4,.webm,.mov,.avi"
                                onChange={handleFileInput}
                                className="hidden"
                            />

                            {/* Loading Progress */}
                            {isUploading && (
                                <div className="mt-8 max-w-md mx-auto">
                                    <div className="progress mb-4">
                                        <div
                                            className="progress-bar"
                                            style={{ width: '60%' }}
                                        ></div>
                                    </div>
                                    <p className="text-white/80 text-sm">Analyzing video properties...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom info section */}
            <div className="text-center">
                <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-gradient-primary mb-4">
                        🚀 Ready to Create Magic?
                    </h3>
                    <p className="text-white/80 text-lg mb-6 leading-relaxed">
                        Join thousands of creators who have transformed their videos into stunning artistic masterpieces.
                        Your next viral video is just one upload away!
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
                        <span>✅ No registration required</span>
                        <span>✅ Unlimited transformations</span>
                        <span>✅ Professional quality output</span>
                        <span>✅ Works on all devices</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoUpload; 