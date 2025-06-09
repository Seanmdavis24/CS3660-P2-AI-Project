/**
 * Style Selector Component - User Upload Version
 * 
 * Allows users to upload their own artistic reference images for style transfer
 * instead of selecting from predefined styles.
 * 
 * @author CartoonizeMe Team
 */

import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';

function StyleSelector({ video }) {
    const { setSelectedStyle, setAppState } = useContext(AppContext);
    const [dragActive, setDragActive] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    /**
     * Handle file drop
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    /**
     * Handle file input change
     */
    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    };

    /**
     * Process uploaded style reference image
     */
    const handleFile = async (file) => {
        setError(null);
        setIsProcessing(true);

        try {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Please upload a valid image file (JPG, PNG, or WEBP)');
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Image file is too large. Please use an image under 10MB.');
            }

            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);

            // Load and validate image
            const img = await loadImage(file);

            // Validate dimensions
            if (img.width < 256 || img.height < 256) {
                throw new Error('Image is too small. Please use an image at least 256x256 pixels.');
            }

            // Create style data object
            const styleData = {
                id: 'user_upload',
                name: 'Custom Style',
                description: `Your uploaded artwork: ${file.name}`,
                file: file,
                image: img,
                url: previewUrl,
                metadata: {
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    type: file.type,
                    fileName: file.name
                }
            };

            setUploadedImage(styleData);
            console.log('✅ Style reference image processed:', styleData);

        } catch (error) {
            console.error('❌ Error processing style image:', error);
            setError(error.message);
            setImagePreview(null);
            setUploadedImage(null);
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Load image and return img element
     */
    const loadImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    };

    /**
     * Handle drag events
     */
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    /**
     * Proceed with selected style
     */
    const handleProceed = () => {
        if (uploadedImage) {
            setSelectedStyle(uploadedImage);
            console.log('🎨 Style selected for processing:', uploadedImage.metadata);
        }
    };

    /**
     * Clear current selection
     */
    const handleClear = () => {
        setUploadedImage(null);
        setImagePreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * Go back to video upload
     */
    const handleBack = () => {
        setAppState('upload');
    };

    return (
        <div className="glass rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gradient-primary mb-3">
                    🎨 Choose Your Art Style
                </h2>
                <p className="text-lg text-white/80 max-w-2xl mx-auto">
                    Upload any artwork to use as your style reference. The AI will transfer the artistic
                    characteristics from your image to your video.
                </p>
            </div>

            {/* Current Video Info */}
            <div className="mb-8 p-4 bg-black/20 rounded-xl">
                <div className="flex items-center justify-center space-x-4">
                    <span className="text-white/60">Video selected:</span>
                    <span className="font-medium text-white">{video?.file?.name}</span>
                    <span className="text-white/60">
                        ({video?.duration ? `${video.duration.toFixed(1)}s` : 'Processing...'})
                    </span>
                </div>
            </div>

            {/* Style Upload Section */}
            <div className="space-y-6">
                {!uploadedImage ? (
                    <>
                        {/* Upload Area */}
                        <div
                            className={`
                                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                                ${dragActive
                                    ? 'border-primary-400 bg-primary-500/10'
                                    : 'border-white/30 hover:border-white/50'
                                }
                                ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                            `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileInput}
                                className="hidden"
                            />

                            {isProcessing ? (
                                <div className="space-y-4">
                                    <div className="text-6xl animate-pulse">🎨</div>
                                    <div className="text-xl font-medium text-white">Processing image...</div>
                                    <div className="loading-spinner mx-auto"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-6xl">{dragActive ? '🎯' : '🖼️'}</div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {dragActive ? 'Drop your artwork here!' : 'Upload Style Reference'}
                                        </h3>
                                        <p className="text-white/70">
                                            Drag & drop an image or click to browse
                                        </p>
                                    </div>
                                    <div className="text-sm text-white/50 space-y-1">
                                        <div>Supported formats: JPG, PNG, WEBP</div>
                                        <div>Minimum size: 256×256 pixels</div>
                                        <div>Maximum size: 10MB</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <span className="text-red-400 text-xl">⚠️</span>
                                    <div>
                                        <div className="font-medium text-red-400">Upload Error</div>
                                        <div className="text-red-300 text-sm">{error}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Style Examples */}
                        <div className="mt-8 p-6 bg-blue-900/20 rounded-xl">
                            <h4 className="font-bold text-white mb-3">💡 Style Reference Tips:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                                <div>
                                    <div className="font-medium text-white mb-2">Great style references:</div>
                                    <ul className="space-y-1">
                                        <li>• Paintings (Van Gogh, Monet, Picasso)</li>
                                        <li>• Anime/cartoon artwork</li>
                                        <li>• Sketches and drawings</li>
                                        <li>• Digital art with clear style</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="font-medium text-white mb-2">For best results:</div>
                                    <ul className="space-y-1">
                                        <li>• Use high-contrast images</li>
                                        <li>• Clear artistic characteristics</li>
                                        <li>• Avoid blurry or low-quality images</li>
                                        <li>• 512×512 pixels ideal size</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Style Preview */
                    <div className="space-y-6">
                        <div className="p-6 bg-black/20 rounded-xl">
                            <h3 className="text-xl font-bold text-white mb-4 text-center">
                                Style Reference Preview
                            </h3>

                            <div className="flex flex-col lg:flex-row gap-6 items-center">
                                {/* Image Preview */}
                                <div className="flex-shrink-0">
                                    <div className="w-64 h-64 rounded-xl overflow-hidden border-2 border-white/20">
                                        <img
                                            src={imagePreview}
                                            alt="Style reference"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-white/60">Filename:</span>
                                            <div className="font-medium text-white">{uploadedImage.metadata.fileName}</div>
                                        </div>
                                        <div>
                                            <span className="text-white/60">Dimensions:</span>
                                            <div className="font-medium text-white">
                                                {uploadedImage.metadata.width} × {uploadedImage.metadata.height}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-white/60">File Size:</span>
                                            <div className="font-medium text-white">
                                                {(uploadedImage.metadata.size / 1024 / 1024).toFixed(1)} MB
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-white/60">Format:</span>
                                            <div className="font-medium text-white">{uploadedImage.metadata.type}</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-green-400">✅</span>
                                            <span className="text-green-300 font-medium">
                                                Style reference ready for AI processing!
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
                <button
                    onClick={handleBack}
                    className="btn btn-secondary"
                >
                    ← Back to Upload
                </button>

                <div className="flex gap-4">
                    {uploadedImage && (
                        <button
                            onClick={handleClear}
                            className="btn btn-outline"
                        >
                            Choose Different Image
                        </button>
                    )}

                    <button
                        onClick={handleProceed}
                        disabled={!uploadedImage}
                        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadedImage ? 'Start Processing →' : 'Upload Style Reference First'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StyleSelector; 