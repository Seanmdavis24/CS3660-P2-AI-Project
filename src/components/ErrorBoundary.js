/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree and displays
 * a fallback UI instead of crashing the entire application.
 * 
 * Requirements addressed:
 * - REQ-101: Graceful degradation for unsupported browsers
 * - REQ-102: Automatic retry mechanisms for transient failures
 * - REQ-103: User-initiated recovery options
 * - REQ-104: Detailed error logging for debugging
 * 
 * @author CartoonizeMe Team
 */

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    /**
     * Update state so the next render will show the fallback UI
     */
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    /**
     * Log error details and update state with error information
     */
    componentDidCatch(error, errorInfo) {
        console.error('🚨 Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
            hasError: true
        });

        // Log detailed error information (REQ-104)
        this.logError(error, errorInfo);
    }

    /**
     * Log error details for debugging and monitoring
     */
    logError = (error, errorInfo) => {
        const errorData = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            retryCount: this.state.retryCount
        };

        console.error('📋 Detailed error log:', errorData);

        // In production, this could be sent to an error tracking service
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error tracking service
            // errorTrackingService.logError(errorData);
        }
    };

    /**
     * Retry mechanism for transient failures (REQ-102)
     */
    handleRetry = () => {
        console.log('🔄 Retrying after error...');

        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    /**
     * Reset error state and return to initial application state
     */
    handleReset = () => {
        console.log('🔄 Resetting application after error...');

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        });

        // Clear any cached data that might be causing issues
        try {
            // Clear any problematic localStorage data
            const keysToRemove = ['cartoonizeme_temp_video', 'cartoonizeme_processing_state'];
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
    };

    /**
     * Reload the entire application
     */
    handleReload = () => {
        console.log('🔄 Reloading application...');
        window.location.reload();
    };

    /**
     * Get user-friendly error message based on error type
     */
    getErrorMessage = () => {
        const { error } = this.state;

        if (!error) return 'An unexpected error occurred.';

        // Check for specific error types
        if (error.message.includes('Loading chunk')) {
            return 'Failed to load application resources. This might be due to a network issue.';
        }

        if (error.message.includes('WebGL') || error.message.includes('GPU')) {
            return 'Graphics processing error. Your browser may not support the required features.';
        }

        if (error.message.includes('Memory') || error.message.includes('heap')) {
            return 'Memory error. Try closing other browser tabs or processing a smaller video.';
        }

        if (error.message.includes('Network') || error.message.includes('fetch')) {
            return 'Network error. Please check your internet connection.';
        }

        // Generic error message
        return 'Something went wrong while processing your video.';
    };

    /**
     * Get recovery suggestions based on error type
     */
    getRecoverySuggestions = () => {
        const { error } = this.state;

        if (!error) return [];

        const suggestions = [];

        if (error.message.includes('Loading chunk')) {
            suggestions.push('Refresh the page to reload application resources');
            suggestions.push('Check your internet connection');
        }

        if (error.message.includes('WebGL') || error.message.includes('GPU')) {
            suggestions.push('Try using a different browser (Chrome recommended)');
            suggestions.push('Update your graphics drivers');
            suggestions.push('Enable hardware acceleration in browser settings');
        }

        if (error.message.includes('Memory') || error.message.includes('heap')) {
            suggestions.push('Close other browser tabs to free up memory');
            suggestions.push('Try processing a shorter or smaller video');
            suggestions.push('Restart your browser');
        }

        if (error.message.includes('Network') || error.message.includes('fetch')) {
            suggestions.push('Check your internet connection');
            suggestions.push('Disable any VPN or proxy');
            suggestions.push('Try again in a few minutes');
        }

        // Always include general suggestions
        suggestions.push('Try refreshing the page');
        suggestions.push('Clear your browser cache');

        return suggestions;
    };

    render() {
        if (this.state.hasError) {
            const errorMessage = this.getErrorMessage();
            const suggestions = this.getRecoverySuggestions();
            const canRetry = this.state.retryCount < 3; // Limit retry attempts

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-2xl w-full">
                        <div className="card bg-white text-center">
                            {/* Error Icon */}
                            <div className="text-6xl mb-6">💥</div>

                            {/* Error Title */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Oops! Something went wrong
                            </h1>

                            {/* Error Message */}
                            <p className="text-lg text-gray-600 mb-6">
                                {errorMessage}
                            </p>

                            {/* Recovery Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                                    <h3 className="font-semibold text-blue-900 mb-2">
                                        💡 Try these solutions:
                                    </h3>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        {suggestions.map((suggestion, index) => (
                                            <li key={index}>• {suggestion}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {canRetry && (
                                    <button
                                        onClick={this.handleRetry}
                                        className="btn btn-primary btn-lg"
                                    >
                                        🔄 Try Again
                                    </button>
                                )}

                                <button
                                    onClick={this.handleReset}
                                    className="btn btn-secondary btn-lg"
                                >
                                    🏠 Start Over
                                </button>

                                <button
                                    onClick={this.handleReload}
                                    className="btn btn-outline btn-lg"
                                >
                                    ↻ Reload Page
                                </button>
                            </div>

                            {/* Retry Information */}
                            {this.state.retryCount > 0 && (
                                <div className="mt-4 text-sm text-gray-500">
                                    Retry attempt: {this.state.retryCount}/3
                                </div>
                            )}

                            {/* Technical Details (Development Only) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-6 text-left">
                                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                        🔧 Technical Details (Development)
                                    </summary>
                                    <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto">
                                        <div className="mb-2">
                                            <strong>Error:</strong> {this.state.error.message}
                                        </div>
                                        {this.state.error.stack && (
                                            <div className="mb-2">
                                                <strong>Stack:</strong>
                                                <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                                            </div>
                                        )}
                                        {this.state.errorInfo && this.state.errorInfo.componentStack && (
                                            <div>
                                                <strong>Component Stack:</strong>
                                                <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            )}

                            {/* Support Information */}
                            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
                                <p>
                                    If this problem persists, please try using a different browser or device.
                                    <br />
                                    CartoonizeMe works best with Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // If no error, render children normally
        return this.props.children;
    }
}

export default ErrorBoundary; 