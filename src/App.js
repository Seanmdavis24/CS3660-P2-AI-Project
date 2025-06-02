/**
 * CartoonizeMe - Main Application Component
 * 
 * This is the root component that orchestrates the entire video style transfer workflow.
 * It manages the application state and coordinates between different stages of processing.
 * 
 * Requirements addressed:
 * - REQ-027: Single-page application with intuitive workflow
 * - REQ-028: Clear visual hierarchy and call-to-action buttons
 * - Upload → Select Style → Process → Download (4 steps maximum)
 * 
 * @author CartoonizeMe Team
 */

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from './context/AppContext';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import StyleSelector from './components/StyleSelector';
import ProcessingEngine from './components/ProcessingEngine';
import ProgressTracker from './components/ProgressTracker';
import ResultsViewer from './components/ResultsViewer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingOverlay from './components/LoadingOverlay';
import { getPerformanceRecommendations } from './utils/browserCheck';

/**
 * Main Application Component
 * Manages the overall application flow and state
 */
function App() {
    // Get application state from context (REQ-047)
    const {
        appState,
        currentVideo,
        selectedStyle,
        processingState,
        error,
        isLoading
    } = useContext(AppContext);

    // Local state for performance recommendations
    const [performanceRecommendations, setPerformanceRecommendations] = useState([]);

    /**
     * Initialize application and check for performance recommendations
     */
    useEffect(() => {
        console.log('🎬 CartoonizeMe App initialized');

        // Get performance recommendations based on device capabilities
        const recommendations = getPerformanceRecommendations();
        setPerformanceRecommendations(recommendations);

        if (recommendations.length > 0) {
            console.log('📋 Performance recommendations:', recommendations);
        }
    }, []);

    /**
     * Determine which main component to render based on application state
     * This implements the simple 4-step workflow: Upload → Style → Process → Download
     */
    const renderMainContent = () => {
        // Show loading overlay if app is initializing
        if (isLoading) {
            return <LoadingOverlay message="Initializing AI models and video processing tools..." />;
        }

        // Handle error states with graceful error recovery (REQ-101)
        if (error) {
            return (
                <div className="container py-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="card bg-error-50 border-error-200 text-center">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-error-700 mb-4">
                                Something went wrong
                            </h2>
                            <p className="text-error-600 mb-6">
                                {error.message || 'An unexpected error occurred while processing your video.'}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => window.location.reload()}
                                >
                                    Reload Application
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        // Reset application state
                                        // This would be implemented in the context
                                    }}
                                >
                                    Start Over
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Step 1: Video Upload (REQ-001 to REQ-006)
        if (appState === 'upload' || !currentVideo) {
            return (
                <div className="container py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Performance recommendations banner */}
                        {performanceRecommendations.length > 0 && (
                            <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                                <h3 className="font-semibold text-warning-800 mb-2">
                                    💡 Performance Tips
                                </h3>
                                <ul className="text-sm text-warning-700 space-y-1">
                                    {performanceRecommendations.map((rec, index) => (
                                        <li key={index}>• {rec.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Main upload interface */}
                        <VideoUpload />
                    </div>
                </div>
            );
        }

        // Step 2: Style Selection (REQ-007 to REQ-010)
        if (appState === 'styleSelection' && currentVideo && !selectedStyle) {
            return (
                <div className="container py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Progress indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-center space-x-4 text-sm">
                                <span className="flex items-center text-success-600">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Video Uploaded
                                </span>
                                <div className="w-8 h-0.5 bg-primary-600"></div>
                                <span className="flex items-center text-primary-600 font-medium">
                                    <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center mr-2">
                                        2
                                    </span>
                                    Choose Style
                                </span>
                                <div className="w-8 h-0.5 bg-gray-300"></div>
                                <span className="flex items-center text-gray-400">
                                    <span className="w-6 h-6 border-2 border-gray-300 text-gray-400 rounded-full flex items-center justify-center mr-2">
                                        3
                                    </span>
                                    Process
                                </span>
                                <div className="w-8 h-0.5 bg-gray-300"></div>
                                <span className="flex items-center text-gray-400">
                                    <span className="w-6 h-6 border-2 border-gray-300 text-gray-400 rounded-full flex items-center justify-center mr-2">
                                        4
                                    </span>
                                    Download
                                </span>
                            </div>
                        </div>

                        <StyleSelector video={currentVideo} />
                    </div>
                </div>
            );
        }

        // Step 3: Processing (REQ-011 to REQ-020)
        if (appState === 'processing' && currentVideo && selectedStyle) {
            return (
                <div className="container py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Progress indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-center space-x-4 text-sm">
                                <span className="flex items-center text-success-600">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Video Uploaded
                                </span>
                                <div className="w-8 h-0.5 bg-success-600"></div>
                                <span className="flex items-center text-success-600">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Style Selected
                                </span>
                                <div className="w-8 h-0.5 bg-primary-600"></div>
                                <span className="flex items-center text-primary-600 font-medium">
                                    <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center mr-2">
                                        <div className="loading-spinner-sm"></div>
                                    </span>
                                    Processing
                                </span>
                                <div className="w-8 h-0.5 bg-gray-300"></div>
                                <span className="flex items-center text-gray-400">
                                    <span className="w-6 h-6 border-2 border-gray-300 text-gray-400 rounded-full flex items-center justify-center mr-2">
                                        4
                                    </span>
                                    Download
                                </span>
                            </div>
                        </div>

                        {/* Processing components */}
                        <div className="space-y-6">
                            <ProgressTracker />
                            <ProcessingEngine
                                video={currentVideo}
                                style={selectedStyle}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Step 4: Results and Download (REQ-021 to REQ-025)
        if (appState === 'results' && currentVideo && selectedStyle && processingState?.completed) {
            return (
                <div className="container py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Progress indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-center space-x-4 text-sm">
                                <span className="flex items-center text-success-600">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Video Uploaded
                                </span>
                                <div className="w-8 h-0.5 bg-success-600"></div>
                                <span className="flex items-center text-success-600">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Style Selected
                                </span>
                                <div className="w-8 h-0.5 bg-success-600"></div>
                                <span className="flex items-center text-success-600">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Processed
                                </span>
                                <div className="w-8 h-0.5 bg-success-600"></div>
                                <span className="flex items-center text-success-600 font-medium">
                                    <span className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center mr-2">
                                        ✓
                                    </span>
                                    Complete!
                                </span>
                            </div>
                        </div>

                        <ResultsViewer />
                    </div>
                </div>
            );
        }

        // Default fallback - should not reach here
        return (
            <div className="container py-8">
                <div className="text-center">
                    <div className="loading-spinner-lg mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading application...</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col" id="main-content">
            {/* Application Header */}
            <Header />

            {/* Main Content Area */}
            <main className="flex-1">
                <ErrorBoundary>
                    {renderMainContent()}
                </ErrorBoundary>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6 mt-8">
                <div className="container">
                    <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                        <div className="mb-4 md:mb-0">
                            <p>© 2024 CartoonizeMe. Transform your videos with AI-powered style transfer.</p>
                        </div>
                        <div className="flex space-x-6">
                            <a href="#" className="hover:text-primary-600 transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-primary-600 transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="hover:text-primary-600 transition-colors">
                                Help & Support
                            </a>
                        </div>
                    </div>

                    {/* Technical info for transparency */}
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
                        <p>
                            🔒 All processing happens in your browser. Videos never leave your device.
                            Powered by TensorFlow.js and ffmpeg.wasm.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App; 