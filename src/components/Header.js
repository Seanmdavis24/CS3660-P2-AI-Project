/**
 * Header Component
 * 
 * Simplified application header with vibrant branding and glass morphism design.
 * 
 * @author CartoonizeMe Team
 */

import React from 'react';

function Header() {
    return (
        <header className="glass border-b border-white/20 shadow-lg relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-rainbow opacity-10 animate-pulse"></div>

            <div className="container relative z-10">
                <div className="flex items-center justify-center py-6">
                    {/* Logo and Branding - Centered */}
                    <div className="flex items-center group">
                        <div className="text-3xl font-black text-gradient-rainbow mr-3 transition-transform duration-300 group-hover:scale-110">
                            🎬
                        </div>
                        <div className="flex flex-col">
                            <div className="text-2xl font-black text-gradient-primary hover:text-gradient-rainbow transition-all duration-300">
                                CartoonizeMe
                            </div>
                            <span className="text-xs text-white/70 font-medium tracking-wide hidden sm:inline">
                                AI Video Style Transfer ✨
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header; 