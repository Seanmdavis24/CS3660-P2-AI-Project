/**
 * Processing Engine Component - Placeholder
 * 
 * Handles the video processing workflow including frame extraction,
 * style transfer, and video reconstruction.
 */

import React from 'react';

function ProcessingEngine({ video, style }) {
    return (
        <div className="card text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-2xl font-semibold mb-4">Processing Video</h3>
            <p className="text-gray-600 mb-6">
                Applying {style?.name} style to {video?.name}...
            </p>
            <div className="loading-spinner mx-auto"></div>
        </div>
    );
}

export default ProcessingEngine; 