/**
 * Style Selector Component - Placeholder
 * 
 * Displays available artistic styles and allows users to select one.
 * This is a placeholder implementation that would be fully developed.
 */

import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const AVAILABLE_STYLES = [
    { id: 'cartoon', name: 'Cartoon', description: 'Colorful cartoon animation style' },
    { id: 'anime', name: 'Anime', description: 'Japanese anime-inspired style' },
    { id: 'oil_painting', name: 'Oil Painting', description: 'Classic oil painting effect' },
    { id: 'watercolor', name: 'Watercolor', description: 'Soft watercolor artistic style' },
    { id: 'sketch', name: 'Sketch', description: 'Pencil sketch and line art' }
];

function StyleSelector() {
    const { setSelectedStyle } = useContext(AppContext);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Choose Your Artistic Style
                </h2>
                <p className="text-lg text-gray-600">
                    Select the style you want to apply to your video
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AVAILABLE_STYLES.map((style) => (
                    <div
                        key={style.id}
                        className="card cursor-pointer"
                        onClick={() => setSelectedStyle(style)}
                    >
                        <div className="text-4xl mb-4 text-center">🎨</div>
                        <h3 className="text-xl font-semibold mb-2">{style.name}</h3>
                        <p className="text-gray-600 mb-4">{style.description}</p>
                        <button className="btn btn-primary w-full">
                            Select Style
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StyleSelector; 