import React from 'react';
import { Sparkles, Heart, Github, Twitter, Mail } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Main Footer Text */}
        <div className="footer-main">
          <div className="footer-brand">
            <Sparkles className="brand-icon" />
            <span className="brand-text">Powered by TensorFlow.js Neural Style Transfer</span>
            <Sparkles className="brand-icon" />
          </div>
          
          <div className="footer-description">
            <p>Transform your videos into artistic masterpieces with cutting-edge AI technology</p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="tech-stack">
          <h4 className="tech-title">Built with</h4>
          <div className="tech-badges">
            <div className="tech-badge">
              <span className="tech-icon">⚛️</span>
              <span>React</span>
            </div>
            <div className="tech-badge">
              <span className="tech-icon">🧠</span>
              <span>TensorFlow.js</span>
            </div>
            <div className="tech-badge">
              <span className="tech-icon">🎬</span>
              <span>FFmpeg.wasm</span>
            </div>
            <div className="tech-badge">
              <span className="tech-icon">✨</span>
              <span>Neural Networks</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="footer-features">
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <span>Client-side Processing</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>Privacy Protected</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Real-time Preview</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span>Multiple Art Styles</span>
          </div>
        </div>

        {/* Social Links */}
        <div className="footer-social">
          <div className="social-links">
            <a href="https://github.com" className="social-link" aria-label="GitHub">
              <Github className="social-icon" />
            </a>
            <a href="https://twitter.com" className="social-link" aria-label="Twitter">
              <Twitter className="social-icon" />
            </a>
            <a href="mailto:contact@example.com" className="social-link" aria-label="Email">
              <Mail className="social-icon" />
            </a>
          </div>
          
          <div className="footer-love">
            <span>Made with</span>
            <Heart className="heart-icon" />
            <span>for creators</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <div className="copyright">
            <span>© 2025 Neural Video Style Transfer. All rights reserved.</span>
          </div>
          
          <div className="footer-links">
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <span className="separator">•</span>
            <a href="#terms" className="footer-link">Terms of Service</a>
            <span className="separator">•</span>
            <a href="#support" className="footer-link">Support</a>
          </div>
        </div>

        {/* Performance Info */}
        <div className="performance-info">
          <div className="perf-item">
            <span className="perf-label">Processing:</span>
            <span className="perf-value">Client-side only</span>
          </div>
          <div className="perf-item">
            <span className="perf-label">Data:</span>
            <span className="perf-value">Never uploaded</span>
          </div>
          <div className="perf-item">
            <span className="perf-label">Speed:</span>
            <span className="perf-value">Real-time AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;