/**
 * Progress Tracker Component - Placeholder
 * 
 * Displays real-time processing progress and status updates.
 */

import React from 'react';

function ProgressTracker() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4">Processing Progress</h3>
            <div className="progress mb-2">
                <div className="progress-bar" style={{ width: '45%' }}></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
                <span>Frame 45 of 100</span>
                <span>45%</span>
            </div>
        </div>
    );
}

export default ProgressTracker; 