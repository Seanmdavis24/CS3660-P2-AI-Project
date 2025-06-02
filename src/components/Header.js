/**
 * Header Component
 * 
 * Application header with branding, navigation, and user information.
 * 
 * @author CartoonizeMe Team
 */

import React from 'react';

function Header() {
    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="container">
                <div className="flex items-center justify-between py-4">
                    {/* Logo and Branding */}
                    <div className="flex items-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                            🎬 CartoonizeMe
                        </div>
                        <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
                            AI Video Style Transfer
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-6">
                        <a
                            href="#features"
                            className="text-gray-600 hover:text-primary-600 transition-colors text-sm"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-gray-600 hover:text-primary-600 transition-colors text-sm"
                        >
                            How it works
                        </a>
                        <a
                            href="#support"
                            className="text-gray-600 hover:text-primary-600 transition-colors text-sm"
                        >
                            Support
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header; 