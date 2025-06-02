/**
 * Performance Monitoring and Optimization Utilities
 * 
 * This module provides comprehensive performance tracking for CartoonizeMe,
 * monitoring load times, processing performance, memory usage, and user experience metrics.
 * 
 * Requirements addressed:
 * - REQ-080: Application load time under 3 seconds
 * - REQ-082: Real-time progress updates (minimum 1Hz refresh)
 * - REQ-123: Performance monitoring and alerts
 * 
 * @author CartoonizeMe Team
 */

/**
 * Performance metrics collector
 * Stores all performance data for analysis and optimization
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            appLoad: null,
            modelLoad: {},
            videoProcessing: {},
            memoryUsage: [],
            userInteractions: [],
            errors: []
        };

        this.observers = new Set();
        this.isMonitoring = false;
    }

    /**
     * Initialize performance monitoring
     * Sets up all tracking mechanisms
     */
    initialize() {
        if (this.isMonitoring) return;

        console.log('📊 Initializing performance monitoring...');

        this.isMonitoring = true;
        this.trackAppLoad();
        this.setupMemoryMonitoring();
        this.setupUserInteractionTracking();
        this.setupErrorTracking();

        console.log('✅ Performance monitoring initialized');
    }

    /**
     * Track application load performance (REQ-080)
     * Ensures we meet the 3-second load time requirement
     */
    trackAppLoad() {
        if (performance.timing) {
            const timing = performance.timing;

            window.addEventListener('load', () => {
                const loadMetrics = {
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    fullLoad: timing.loadEventEnd - timing.navigationStart,
                    domReady: timing.domInteractive - timing.navigationStart,
                    resourcesLoaded: timing.loadEventStart - timing.navigationStart,
                    timestamp: Date.now()
                };

                this.metrics.appLoad = loadMetrics;

                console.log('⚡ App load performance:', loadMetrics);

                // Check if we meet the 3-second requirement (REQ-080)
                if (loadMetrics.fullLoad > 3000) {
                    console.warn('⚠️ App load time exceeded 3 seconds:', loadMetrics.fullLoad + 'ms');
                    this.recordAlert('slow_load', `App loaded in ${loadMetrics.fullLoad}ms (target: <3000ms)`);
                } else {
                    console.log('✅ App load time within target:', loadMetrics.fullLoad + 'ms');
                }

                this.notifyObservers('appLoad', loadMetrics);
            });
        }
    }

    /**
     * Track model loading performance
     * Monitors TensorFlow.js model load times
     */
    trackModelLoad(modelName, startTime, endTime = null) {
        const now = performance.now();
        endTime = endTime || now;

        const loadTime = endTime - startTime;

        this.metrics.modelLoad[modelName] = {
            startTime,
            endTime,
            loadTime,
            timestamp: Date.now()
        };

        console.log(`🧠 Model "${modelName}" loaded in ${Math.round(loadTime)}ms`);

        // Alert if model loading is slow
        if (loadTime > 10000) { // 10 seconds
            this.recordAlert('slow_model_load', `Model ${modelName} took ${Math.round(loadTime)}ms to load`);
        }

        this.notifyObservers('modelLoad', { modelName, loadTime });

        return loadTime;
    }

    /**
     * Track video processing performance
     * Monitors frame processing, style transfer, and reconstruction times
     */
    trackVideoProcessing(videoId, stage, data) {
        if (!this.metrics.videoProcessing[videoId]) {
            this.metrics.videoProcessing[videoId] = {
                stages: {},
                totalTime: 0,
                framesProcessed: 0,
                startTime: performance.now()
            };
        }

        const video = this.metrics.videoProcessing[videoId];

        switch (stage) {
            case 'start':
                video.startTime = performance.now();
                video.metadata = data;
                break;

            case 'frameExtraction':
                video.stages.frameExtraction = {
                    startTime: data.startTime,
                    endTime: performance.now(),
                    framesExtracted: data.frameCount
                };
                break;

            case 'styleTransfer':
                if (!video.stages.styleTransfer) {
                    video.stages.styleTransfer = {
                        startTime: performance.now(),
                        framesProcessed: 0,
                        avgTimePerFrame: 0
                    };
                }

                video.stages.styleTransfer.framesProcessed = data.frameIndex + 1;
                video.stages.styleTransfer.endTime = performance.now();
                video.stages.styleTransfer.avgTimePerFrame =
                    (video.stages.styleTransfer.endTime - video.stages.styleTransfer.startTime) /
                    video.stages.styleTransfer.framesProcessed;
                break;

            case 'reconstruction':
                video.stages.reconstruction = {
                    startTime: data.startTime,
                    endTime: performance.now()
                };
                break;

            case 'complete':
                video.endTime = performance.now();
                video.totalTime = video.endTime - video.startTime;

                const avgTimePerFrame = video.totalTime / (video.metadata?.frameCount || 1);

                console.log(`🎬 Video processing complete for ${videoId}:`, {
                    totalTime: Math.round(video.totalTime) + 'ms',
                    avgTimePerFrame: Math.round(avgTimePerFrame) + 'ms',
                    stages: video.stages
                });

                // Check if processing meets performance targets (REQ-076)
                const targetTime = (video.metadata?.duration || 10) * 12000; // 2 minutes per 10 seconds
                if (video.totalTime > targetTime) {
                    this.recordAlert('slow_processing',
                        `Video processing took ${Math.round(video.totalTime)}ms (target: ${targetTime}ms)`);
                }

                this.notifyObservers('videoComplete', { videoId, ...video });
                break;
        }

        // Real-time progress updates (REQ-082)
        this.notifyObservers('processingUpdate', { videoId, stage, data, video });
    }

    /**
     * Setup memory usage monitoring
     * Tracks RAM consumption to prevent crashes (REQ-078)
     */
    setupMemoryMonitoring() {
        const monitorMemory = () => {
            if (performance.memory) {
                const memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };

                this.metrics.memoryUsage.push(memory);

                // Keep only last 100 measurements
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage.shift();
                }

                // Alert if memory usage is high (REQ-078: max 2GB)
                const memoryGB = memory.used / (1024 * 1024 * 1024);
                if (memoryGB > 1.5) { // Alert at 1.5GB to prevent hitting 2GB limit
                    console.warn('⚠️ High memory usage:', Math.round(memoryGB * 100) / 100 + 'GB');
                    this.recordAlert('high_memory', `Memory usage: ${Math.round(memoryGB * 100) / 100}GB`);
                }

                this.notifyObservers('memoryUpdate', memory);
            }
        };

        // Monitor memory every 5 seconds
        setInterval(monitorMemory, 5000);
        monitorMemory(); // Initial measurement
    }

    /**
     * Track user interaction performance
     * Monitors UI responsiveness during processing (REQ-079)
     */
    setupUserInteractionTracking() {
        const trackInteraction = (type, event) => {
            const interaction = {
                type,
                timestamp: Date.now(),
                target: event.target?.tagName || 'unknown',
                processingTime: performance.now()
            };

            // Measure interaction response time
            requestAnimationFrame(() => {
                interaction.responseTime = performance.now() - interaction.processingTime;

                this.metrics.userInteractions.push(interaction);

                // Keep only last 50 interactions
                if (this.metrics.userInteractions.length > 50) {
                    this.metrics.userInteractions.shift();
                }

                // Alert if interaction response is slow (>100ms indicates jank)
                if (interaction.responseTime > 100) {
                    console.warn('⚠️ Slow UI interaction:', interaction);
                    this.recordAlert('slow_interaction',
                        `${type} interaction took ${Math.round(interaction.responseTime)}ms`);
                }
            });
        };

        // Track click interactions
        document.addEventListener('click', (e) => trackInteraction('click', e), { passive: true });

        // Track input interactions
        document.addEventListener('input', (e) => trackInteraction('input', e), { passive: true });
    }

    /**
     * Setup error tracking
     * Monitors and categorizes application errors (REQ-104)
     */
    setupErrorTracking() {
        const trackError = (error, type = 'unknown') => {
            const errorData = {
                message: error.message || error,
                type,
                stack: error.stack,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            this.metrics.errors.push(errorData);

            // Keep only last 20 errors
            if (this.metrics.errors.length > 20) {
                this.metrics.errors.shift();
            }

            console.error('🚨 Error tracked:', errorData);
            this.notifyObservers('error', errorData);
        };

        // Track JavaScript errors
        window.addEventListener('error', (event) => {
            trackError(event.error, 'javascript');
        });

        // Track promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            trackError(event.reason, 'promise');
        });
    }

    /**
     * Record performance alerts
     * Stores alerts for analysis and user notification
     */
    recordAlert(type, message) {
        const alert = {
            type,
            message,
            timestamp: Date.now(),
            severity: this.getAlertSeverity(type)
        };

        if (!this.metrics.alerts) {
            this.metrics.alerts = [];
        }

        this.metrics.alerts.push(alert);
        console.warn('📢 Performance alert:', alert);

        this.notifyObservers('alert', alert);
    }

    /**
     * Get alert severity level
     */
    getAlertSeverity(type) {
        const severityMap = {
            slow_load: 'medium',
            slow_model_load: 'low',
            slow_processing: 'high',
            high_memory: 'high',
            slow_interaction: 'medium'
        };

        return severityMap[type] || 'low';
    }

    /**
     * Subscribe to performance updates
     * Allows components to react to performance changes
     */
    subscribe(callback) {
        this.observers.add(callback);

        return () => {
            this.observers.delete(callback);
        };
    }

    /**
     * Notify all observers of performance updates
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Performance observer error:', error);
            }
        });
    }

    /**
     * Get current performance summary
     */
    getSummary() {
        const currentMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        const recentInteractions = this.metrics.userInteractions.slice(-10);
        const avgInteractionTime = recentInteractions.length > 0
            ? recentInteractions.reduce((sum, i) => sum + i.responseTime, 0) / recentInteractions.length
            : 0;

        return {
            appLoadTime: this.metrics.appLoad?.fullLoad || null,
            modelsLoaded: Object.keys(this.metrics.modelLoad).length,
            videosProcessed: Object.keys(this.metrics.videoProcessing).length,
            currentMemoryUsage: currentMemory ? Math.round(currentMemory.used / 1024 / 1024) : null,
            avgInteractionTime: Math.round(avgInteractionTime),
            errorCount: this.metrics.errors.length,
            alertCount: this.metrics.alerts?.length || 0
        };
    }

    /**
     * Export metrics for analysis
     */
    exportMetrics() {
        return JSON.stringify(this.metrics, null, 2);
    }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Initialize performance monitoring
 * Called from main app initialization
 */
export function initializePerformanceMonitoring() {
    performanceMonitor.initialize();
}

/**
 * Track model loading performance
 */
export function trackModelLoad(modelName, startTime, endTime) {
    return performanceMonitor.trackModelLoad(modelName, startTime, endTime);
}

/**
 * Track video processing performance
 */
export function trackVideoProcessing(videoId, stage, data) {
    performanceMonitor.trackVideoProcessing(videoId, stage, data);
}

/**
 * Subscribe to performance updates
 */
export function subscribeToPerformanceUpdates(callback) {
    return performanceMonitor.subscribe(callback);
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
    return performanceMonitor.getSummary();
}

/**
 * Record custom performance metric
 */
export function recordCustomMetric(name, value, unit = 'ms') {
    console.log(`📊 Custom metric: ${name} = ${value}${unit}`);
    performanceMonitor.notifyObservers('customMetric', { name, value, unit, timestamp: Date.now() });
}

/**
 * Measure function execution time
 * Utility for measuring performance of specific functions
 */
export function measurePerformance(fn, name = 'unnamed') {
    return async (...args) => {
        const startTime = performance.now();

        try {
            const result = await fn(...args);
            const endTime = performance.now();
            const executionTime = endTime - startTime;

            console.log(`⏱️ ${name} executed in ${Math.round(executionTime)}ms`);
            recordCustomMetric(name, executionTime);

            return result;
        } catch (error) {
            const endTime = performance.now();
            const executionTime = endTime - startTime;

            console.error(`❌ ${name} failed after ${Math.round(executionTime)}ms:`, error);
            recordCustomMetric(`${name}_error`, executionTime);

            throw error;
        }
    };
}

/**
 * Create a performance observer for specific metrics
 * Useful for tracking Web Vitals and other performance metrics
 */
export function createPerformanceObserver(entryTypes, callback) {
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(callback);
            });

            observer.observe({ entryTypes });
            return observer;
        } catch (error) {
            console.warn('PerformanceObserver not supported:', error);
        }
    }

    return null;
}

// Export the monitor instance for direct access if needed
export { performanceMonitor }; 