/**
 * Loading Overlay Component
 * 
 * Displays loading state during application initialization and model loading.
 */

import React from 'react';

function LoadingOverlay({ message = 'Loading...' }) {
    return (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="text-center">
                <div className="loading-spinner-lg mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {message}
                </h2>
                <p className="text-gray-600">
                    This may take a few moments...
                </p>
            </div>
        </div>
    );
}

export default LoadingOverlay; 