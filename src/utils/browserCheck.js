/**
 * Browser Compatibility Checker
 * 
 * This utility checks if the user's browser supports all the features
 * required by CartoonizeMe for AI-powered video processing.
 * 
 * Requirements addressed:
 * - REQ-084: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
 * - REQ-085: WebGL 2.0 support for GPU acceleration
 * - REQ-086: Web Workers support for background processing
 * - REQ-087: File API and Blob support for video handling
 * 
 * @author CartoonizeMe Team
 */

/**
 * Checks if WebGL 2.0 is supported (REQ-085)
 * Required for TensorFlow.js GPU acceleration
 */
function checkWebGL2Support() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');

        if (!gl) {
            return {
                supported: false,
                reason: 'WebGL 2.0 context not available'
            };
        }

        // Check for essential WebGL extensions (updated for better compatibility)
        const optionalExtensions = [
            'EXT_color_buffer_float',
            'OES_texture_float_linear',
            'EXT_texture_filter_anisotropic'
        ];

        // Check if at least some extensions are available, but don't fail if missing
        const availableExtensions = optionalExtensions.filter(ext => gl.getExtension(ext));

        console.log('📊 Available WebGL2 extensions:', availableExtensions);

        // WebGL2 basic functionality check
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            return {
                supported: false,
                reason: 'Failed to create WebGL buffer'
            };
        }

        // Clean up test resources
        gl.deleteBuffer(vertexBuffer);

        return {
            supported: true,
            extensions: availableExtensions
        };

    } catch (error) {
        return {
            supported: false,
            reason: `WebGL error: ${error.message}`
        };
    }
}

/**
 * Checks if Web Workers are supported (REQ-086)
 * Required for background video processing
 */
function checkWebWorkersSupport() {
    try {
        if (!window.Worker) {
            return {
                supported: false,
                reason: 'Web Workers not available'
            };
        }

        // Test worker creation with blob URL instead of data URL to avoid CSP issues
        const workerCode = `
            self.onmessage = function(e) {
                self.postMessage('worker-test-response');
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        const worker = new Worker(workerUrl);

        // Clean up immediately
        worker.terminate();
        URL.revokeObjectURL(workerUrl);

        return { supported: true };

    } catch (error) {
        return {
            supported: false,
            reason: `Web Workers error: ${error.message}`
        };
    }
}

/**
 * Checks if File API and Blob support is available (REQ-087)
 * Required for video file handling
 */
function checkFileAPISupport() {
    const requiredAPIs = {
        File: window.File,
        FileReader: window.FileReader,
        FileList: window.FileList,
        Blob: window.Blob,
        URL: window.URL || window.webkitURL
    };

    const missingAPIs = Object.entries(requiredAPIs)
        .filter(([name, api]) => !api)
        .map(([name]) => name);

    if (missingAPIs.length > 0) {
        return {
            supported: false,
            reason: `Missing File APIs: ${missingAPIs.join(', ')}`
        };
    }

    return { supported: true };
}

/**
 * Checks if WebAssembly is supported
 * Required for ffmpeg.wasm video processing
 */
function checkWebAssemblySupport() {
    try {
        if (!window.WebAssembly) {
            return {
                supported: false,
                reason: 'WebAssembly not available'
            };
        }

        // Test basic WebAssembly functionality
        const wasmCode = new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, // magic number
            0x01, 0x00, 0x00, 0x00  // version
        ]);

        if (!WebAssembly.validate(wasmCode)) {
            return {
                supported: false,
                reason: 'WebAssembly validation failed'
            };
        }

        return { supported: true };

    } catch (error) {
        return {
            supported: false,
            reason: `WebAssembly error: ${error.message}`
        };
    }
}

/**
 * Checks Canvas API support
 * Required for frame manipulation (REQ-046)
 */
function checkCanvasSupport() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return {
                supported: false,
                reason: 'Canvas 2D context not available'
            };
        }

        // Check for ImageData support
        if (!ctx.createImageData) {
            return {
                supported: false,
                reason: 'Canvas ImageData not supported'
            };
        }

        return { supported: true };

    } catch (error) {
        return {
            supported: false,
            reason: `Canvas error: ${error.message}`
        };
    }
}

/**
 * Checks browser memory capabilities
 * Estimates available memory for video processing
 */
function checkMemorySupport() {
    try {
        // Check if performance.memory is available (Chrome/Edge)
        if (performance.memory) {
            const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
            const availableMemory = jsHeapSizeLimit - usedJSHeapSize;

            // We need at least 512MB available for video processing
            const minRequiredMemory = 512 * 1024 * 1024; // 512MB in bytes

            if (availableMemory < minRequiredMemory) {
                return {
                    supported: false,
                    reason: `Insufficient memory. Available: ${Math.round(availableMemory / 1024 / 1024)}MB, Required: 512MB`
                };
            }
        }

        return { supported: true };

    } catch (error) {
        // Memory info not available, assume it's sufficient
        return { supported: true };
    }
}

/**
 * Detects the browser and version
 * Used for specific browser compatibility checks (REQ-084)
 */
function detectBrowser() {
    const userAgent = navigator.userAgent;

    // Chrome detection
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
        const version = parseInt(userAgent.match(/Chrome\/(\d+)/)[1]);
        return { name: 'Chrome', version, supported: version >= 90 };
    }

    // Firefox detection
    if (userAgent.includes('Firefox/')) {
        const version = parseInt(userAgent.match(/Firefox\/(\d+)/)[1]);
        return { name: 'Firefox', version, supported: version >= 88 };
    }

    // Safari detection
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
        const versionMatch = userAgent.match(/Version\/(\d+)/);
        const version = versionMatch ? parseInt(versionMatch[1]) : 0;
        return { name: 'Safari', version, supported: version >= 14 };
    }

    // Edge detection
    if (userAgent.includes('Edg/')) {
        const version = parseInt(userAgent.match(/Edg\/(\d+)/)[1]);
        return { name: 'Edge', version, supported: version >= 90 };
    }

    return { name: 'Unknown', version: 0, supported: false };
}

/**
 * Checks device capabilities for video processing
 * Estimates device performance for processing requirements
 */
function checkDeviceCapabilities() {
    try {
        const capabilities = {
            cores: navigator.hardwareConcurrency || 2,
            platform: navigator.platform,
            mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };

        // Mobile devices might have performance limitations
        if (capabilities.mobile && capabilities.cores < 4) {
            return {
                supported: true,
                warning: 'Mobile device detected. Video processing may be slower than on desktop.'
            };
        }

        return { supported: true, capabilities };

    } catch (error) {
        return { supported: true }; // Assume compatible if we can't detect
    }
}

/**
 * Main compatibility check function
 * Runs all compatibility tests and returns a comprehensive report
 * 
 * @returns {Object} Compatibility report with support status and details
 */
export function checkBrowserCompatibility() {
    console.log('🔍 Running comprehensive browser compatibility check...');

    const checks = {
        browser: detectBrowser(),
        webgl2: checkWebGL2Support(),
        webWorkers: checkWebWorkersSupport(),
        fileAPI: checkFileAPISupport(),
        webAssembly: checkWebAssemblySupport(),
        canvas: checkCanvasSupport(),
        memory: checkMemorySupport(),
        device: checkDeviceCapabilities()
    };

    // Collect all failed checks
    const failures = [];
    const warnings = [];

    // Check browser version (make this a warning instead of failure for development)
    if (!checks.browser.supported) {
        warnings.push(`Browser version: ${checks.browser.name} ${checks.browser.version} (recommended: newer version)`);
    }

    // Check required features - be more lenient for development
    const criticalFeatures = ['fileAPI', 'canvas', 'webAssembly'];
    const optionalFeatures = ['webgl2', 'webWorkers', 'memory'];

    // Critical features must work
    criticalFeatures.forEach(feature => {
        const result = checks[feature];
        if (result.supported === false) {
            failures.push(`${feature}: ${result.reason}`);
        }
    });

    // Optional features generate warnings instead of failures
    optionalFeatures.forEach(feature => {
        const result = checks[feature];
        if (result.supported === false) {
            warnings.push(`${feature}: ${result.reason} (may impact performance)`);
        } else if (result.warning) {
            warnings.push(`${feature}: ${result.warning}`);
        }
    });

    // In development mode, be more lenient
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    const isSupported = isDevelopment ? failures.length === 0 : (failures.length === 0 && warnings.length < 3);

    const report = {
        isSupported,
        browser: checks.browser,
        missingFeatures: failures,
        warnings,
        details: checks,
        isDevelopment,
        recommendations: isSupported ? [] : [
            'Please update to a modern browser:',
            '• Chrome 90+ (recommended)',
            '• Firefox 88+',
            '• Safari 14+',
            '• Edge 90+'
        ]
    };

    // Log results with more detail
    if (isSupported) {
        console.log('✅ Browser compatibility check passed:', report);
        if (warnings.length > 0) {
            console.warn('⚠️ Compatibility warnings (non-critical):', warnings);
        }
    } else {
        console.error('❌ Browser compatibility check failed:', report);
    }

    return report;
}

/**
 * Quick feature check for specific requirements
 * Used throughout the app to conditionally enable features
 */
export function hasFeature(feature) {
    switch (feature) {
        case 'webgl2':
            return checkWebGL2Support().supported;
        case 'webWorkers':
            return checkWebWorkersSupport().supported;
        case 'fileAPI':
            return checkFileAPISupport().supported;
        case 'webAssembly':
            return checkWebAssemblySupport().supported;
        case 'canvas':
            return checkCanvasSupport().supported;
        default:
            return false;
    }
}

/**
 * Get performance recommendations based on device capabilities
 */
export function getPerformanceRecommendations() {
    const device = checkDeviceCapabilities();
    const webgl = checkWebGL2Support();
    const memory = checkMemorySupport();

    const recommendations = [];

    if (device.capabilities?.mobile) {
        recommendations.push({
            type: 'device',
            message: 'Mobile device detected. Consider shorter videos for better performance.',
            impact: 'medium'
        });
    }

    if (device.capabilities?.cores < 4) {
        recommendations.push({
            type: 'performance',
            message: 'Limited CPU cores detected. Processing may take longer.',
            impact: 'medium'
        });
    }

    if (!webgl.supported) {
        recommendations.push({
            type: 'acceleration',
            message: 'GPU acceleration unavailable. Processing will use CPU only.',
            impact: 'high'
        });
    }

    return recommendations;
} 