/**
 * CartoonizeMe - Main Application Entry Point
 * 
 * This file initializes the React application and handles:
 * - Browser compatibility checks (REQ-084)
 * - Error boundaries for graceful error handling (REQ-101)
 * - Application context providers for state management (REQ-047)
 * - Performance monitoring and optimization
 * 
 * @author CartoonizeMe Team
 * @version 1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { checkBrowserCompatibility } from './utils/browserCheck';
import { initializePerformanceMonitoring } from './utils/performance';
import './styles/global.css';

/**
 * Browser Compatibility Check
 * Ensures the user's browser supports all required features (REQ-084)
 */
function performCompatibilityCheck() {
    console.log('🔍 Checking browser compatibility...');

    const compatibility = checkBrowserCompatibility();

    if (!compatibility.isSupported) {
        console.error('❌ Browser compatibility check failed:', compatibility.missingFeatures);

        // Show compatibility error instead of loading the app
        const root = document.getElementById('root');

        // Create different messages for development vs production
        const isDevelopment = compatibility.isDevelopment;
        const hasOnlyWarnings = compatibility.missingFeatures.length === 0 && compatibility.warnings.length > 0;

        if (isDevelopment && hasOnlyWarnings) {
            // In development with only warnings, show warning but continue
            root.innerHTML = `
        <div style="max-width: 600px; margin: 1rem auto; padding: 1rem; background: #fef3cd; border-radius: 0.5rem; border: 1px solid #ffeaa7;">
          <h2 style="color: #856404; margin-bottom: 1rem;">⚠️ Development Mode - Performance Warnings</h2>
          <p style="margin-bottom: 1rem; color: #533f03;">
            Some features may not work optimally, but the app should still function in development mode.
          </p>
          <details style="margin-bottom: 1rem;">
            <summary style="cursor: pointer; color: #856404; font-weight: bold;">Show Warnings (${compatibility.warnings.length})</summary>
            <ul style="margin-top: 0.5rem; color: #533f03;">
              ${compatibility.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
          </details>
          <button onclick="this.parentElement.style.display='none'" 
                  style="background: #856404; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
            Continue Anyway
          </button>
        </div>
        <div id="app-container"></div>
      `;

            // Return true to continue loading the app
            setTimeout(() => {
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    const originalRoot = document.getElementById('root');
                    originalRoot.appendChild(appContainer);
                }
            }, 100);

            return true;
        } else {
            // Show full compatibility error
            root.innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; padding: 2rem; background: #fef2f2; border-radius: 0.5rem; border: 1px solid #fecaca;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Browser Not Supported</h1>
          <p style="margin-bottom: 1rem; color: #374151;">
            Your browser doesn't support the technologies required for CartoonizeMe. 
            We need modern browser features for AI-powered video processing.
          </p>
          ${compatibility.missingFeatures.length > 0 ? `
            <h3 style="color: #dc2626; margin-bottom: 0.5rem;">Missing Features:</h3>
            <ul style="margin-bottom: 1rem; color: #374151;">
              ${compatibility.missingFeatures.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          ` : ''}
          ${compatibility.warnings.length > 0 ? `
            <h3 style="color: #f59e0b; margin-bottom: 0.5rem;">Performance Warnings:</h3>
            <ul style="margin-bottom: 1rem; color: #374151;">
              ${compatibility.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
          ` : ''}
          <h3 style="color: #059669; margin-bottom: 0.5rem;">Recommended Browsers:</h3>
          <ul style="color: #374151; margin-bottom: 1rem;">
            <li>Chrome 90+ (recommended)</li>
            <li>Firefox 88+</li>
            <li>Safari 14+</li>
            <li>Edge 90+</li>
          </ul>
          ${isDevelopment ? `
            <div style="margin-top: 1rem; padding: 1rem; background: #e0f2fe; border-radius: 0.25rem;">
              <p style="color: #0277bd; font-size: 0.875rem;">
                <strong>Development Mode:</strong> If you're a developer, you can try to continue anyway, 
                but some features may not work properly.
              </p>
              <button onclick="window.location.reload()" 
                      style="background: #0277bd; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; margin-top: 0.5rem;">
                Retry Check
              </button>
            </div>
          ` : ''}
          <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
            Please update your browser or try a different one to use CartoonizeMe.
          </p>
        </div>
      `;
            return false;
        }
    }

    console.log('✅ Browser compatibility check passed');

    // Show any warnings in console
    if (compatibility.warnings.length > 0) {
        console.warn('⚠️ Non-critical warnings:', compatibility.warnings);
    }

    return true;
}

/**
 * Application Initialization
 * Sets up the React application with all necessary providers and monitoring
 */
function initializeApp() {
    console.log('🚀 Initializing CartoonizeMe application...');

    // Initialize performance monitoring (REQ-123)
    initializePerformanceMonitoring();

    // Get the root container
    const container = document.getElementById('root');
    if (!container) {
        console.error('❌ Root container not found');
        return;
    }

    // Create React root
    const root = createRoot(container);

    // Render the application with all providers and error boundaries
    root.render(
        <React.StrictMode>
            {/* Global Error Boundary for graceful error handling (REQ-101) */}
            <ErrorBoundary>
                {/* Application Context Provider for state management (REQ-047) */}
                <AppProvider>
                    <App />
                </AppProvider>
            </ErrorBoundary>
        </React.StrictMode>
    );

    console.log('✅ CartoonizeMe application initialized successfully');
}

/**
 * Service Worker Registration
 * Registers the service worker for PWA functionality (REQ-053)
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration);

                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                });

            } catch (error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            }
        });
    }
}

/**
 * Application Bootstrap
 * Main initialization sequence that starts the application
 */
function bootstrap() {
    console.log('🎬 Starting CartoonizeMe...');

    try {
        // 1. Check browser compatibility first
        if (!performCompatibilityCheck()) {
            return; // Stop if browser is not compatible
        }

        // 2. Register service worker for PWA functionality
        registerServiceWorker();

        // 3. Initialize the main application
        initializeApp();

        // 4. Log successful startup
        console.log('🎉 CartoonizeMe started successfully!');

        // 5. Performance tracking
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`⚡ Application loaded in ${Math.round(loadTime)}ms`);

            // Track if we meet the 3-second load time requirement (REQ-080)
            if (loadTime > 3000) {
                console.warn('⚠️ Application load time exceeded 3 seconds:', loadTime);
            }
        });

    } catch (error) {
        console.error('💥 Failed to start CartoonizeMe:', error);

        // Show a friendly error message to users
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; padding: 2rem; background: #fef2f2; border-radius: 0.5rem; text-align: center;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">🚨 Application Error</h1>
          <p style="margin-bottom: 1rem; color: #374151;">
            Sorry, something went wrong while starting CartoonizeMe.
          </p>
          <button onclick="window.location.reload()" 
                  style="background: #6366f1; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
            Reload Application
          </button>
          <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
            If the problem persists, please try refreshing the page or using a different browser.
          </p>
        </div>
      `;
        }
    }
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    // DOM is already ready
    bootstrap();
}

// Global error handlers for unhandled errors (REQ-104)
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    // Could send to error tracking service in production
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    // Could send to error tracking service in production
});

// Prevent default error pages from showing
window.addEventListener('error', (event) => {
    event.preventDefault();
});

// Export for testing purposes
export { performCompatibilityCheck, initializeApp }; 