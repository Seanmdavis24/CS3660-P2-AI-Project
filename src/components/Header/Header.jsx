import React from 'react';
import { Sparkles } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <Sparkles className="header-icon" />
          <h1 className="title">Neural Video Style Transfer</h1>
          <Sparkles className="header-icon" />
        </div>
        <p className="subtitle">
          Transform your videos with AI-powered artistic styles
        </p>
        <div className="header-features">
          <div className="feature-pill">
            <span>🎨</span>
            <span>6 Artistic Styles</span>
          </div>
          <div className="feature-pill">
            <span>🧠</span>
            <span>Neural AI Processing</span>
          </div>
          <div className="feature-pill">
            <span>⚡</span>
            <span>Real-time Preview</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;