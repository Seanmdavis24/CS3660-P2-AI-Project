/**
 * Header Component
 *
 * Application header with branding, navigation, and user information.
 *
 * @author CartoonizeMe Team
 */

import React from "react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Branding */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"
            >
              🎬 CartoonizeMe
            </Link>
            <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
              AI Video Style Transfer
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center">
            <Link
              to="/features"
              className="text-gray-600 hover:text-primary-600 transition-colors text-sm px-6"
            >
              Features
            </Link>
            <div className="h-4 w-px bg-gray-300 mx-2"></div>
            <Link
              to="/how-it-works"
              className="text-gray-600 hover:text-primary-600 transition-colors text-sm px-6"
            >
              How it Works
            </Link>
            <div className="h-4 w-px bg-gray-300 mx-2"></div>
            <Link
              to="/support"
              className="text-gray-600 hover:text-primary-600 transition-colors text-sm px-6"
            >
              Support
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
