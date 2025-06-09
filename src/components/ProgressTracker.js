/**
 * Progress Tracker Component
 * 
 * Displays real-time processing progress and status updates
 * from the application context state.
 */

import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

function ProgressTracker() {
    const { processingState, currentVideo, selectedStyle } = useContext(AppContext);

    const {
        progress = 0,
        currentFrame = 0,
        totalFrames = 0,
        timeRemaining = null,
        stage = null,
        estimatedTimeRemaining = null,
        averageFrameTime = null
    } = processingState;

    const getProgressColor = () => {
        if (progress < 25) return 'bg-blue-500';
        if (progress < 50) return 'bg-purple-500';
        if (progress < 75) return 'bg-orange-500';
        if (progress < 100) return 'bg-green-500';
        return 'bg-emerald-500';
    };

    const getStageDescription = () => {
        switch (stage) {
            case 'initializing':
                return 'Setting up video processing environment...';
            case 'model_loaded':
                return 'AI model loaded and ready';
            case 'frames_extracted':
                return 'Video frames extracted successfully';
            case 'applying_style':
                return 'Applying neural style transfer to frames';
            case 'reconstructing':
                return 'Reconstructing stylized video';
            default:
                return 'Processing video...';
        }
    };

    return (
        <div className="card">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Processing Progress</h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${progress > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-600">
                        {progress === 100 ? 'Complete' : 'Processing'}
                    </span>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span className="font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="progress h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`progress-bar h-full transition-all duration-1000 ease-out rounded-full ${getProgressColor()}`}
                        style={{ width: `${progress}%` }}
                    >
                        {progress > 10 && (
                            <div className="w-full h-full bg-gradient-to-r from-transparent to-white/20"></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stage Information */}
            <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Current Stage</div>
                <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">{getStageDescription()}</span>
                </div>
            </div>

            {/* Frame Processing Details */}
            {totalFrames > 0 && (
                <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-3">Frame Processing</div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{currentFrame}</div>
                            <div className="text-xs text-gray-500">Current</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{totalFrames}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {totalFrames > 0 ? Math.round((currentFrame / totalFrames) * 100) : 0}%
                            </div>
                            <div className="text-xs text-gray-500">Frames</div>
                        </div>
                    </div>

                    {/* Frame Progress Bar */}
                    <div className="mt-3">
                        <div className="progress h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="progress-bar h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                                style={{ width: `${totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Time Remaining */}
            {(timeRemaining !== null && timeRemaining > 0) || (estimatedTimeRemaining !== null && estimatedTimeRemaining > 0) && (
                <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">Estimated Time Remaining</div>
                    <div className="flex items-center space-x-2">
                        <div className="text-lg font-bold text-orange-600">
                            {estimatedTimeRemaining ?
                                `${Math.floor(estimatedTimeRemaining / 60)}m ${estimatedTimeRemaining % 60}s` :
                                `${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`
                            }
                        </div>
                        <div className="text-xs text-gray-500">
                            (approximate)
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    {averageFrameTime && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-700 mb-2">Performance Metrics</div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Avg. Frame Time:</span>
                                    <span className="font-medium">{averageFrameTime.toFixed(2)}s</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Processing Rate:</span>
                                    <span className="font-medium">{(1 / averageFrameTime).toFixed(2)} fps</span>
                                </div>
                            </div>

                            {/* Performance Tips */}
                            {averageFrameTime > 10 && (
                                <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                    💡 Tip: Consider reducing video resolution for faster processing
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Processing Details */}
            <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Video:</span>
                        <span className="font-medium text-right truncate ml-2" title={currentVideo?.name}>
                            {currentVideo?.name || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Style:</span>
                        <span className="font-medium">{selectedStyle?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <span className="font-medium">
                            {currentVideo?.size ? `${(currentVideo.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                            {progress === 100 ? 'Complete' : 'Processing'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Milestones */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-3">Processing Milestones</div>
                <div className="flex justify-between text-xs">
                    <div className={`flex flex-col items-center ${progress >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full mb-1 ${progress >= 10 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Init</span>
                    </div>
                    <div className={`flex flex-col items-center ${progress >= 25 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full mb-1 ${progress >= 25 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Model</span>
                    </div>
                    <div className={`flex flex-col items-center ${progress >= 40 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full mb-1 ${progress >= 40 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Frames</span>
                    </div>
                    <div className={`flex flex-col items-center ${progress >= 80 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full mb-1 ${progress >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Style</span>
                    </div>
                    <div className={`flex flex-col items-center ${progress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full mb-1 ${progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Done</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProgressTracker; 