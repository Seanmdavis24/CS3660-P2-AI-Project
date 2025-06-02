const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        // Entry point for the application
        entry: './src/index.js',

        // Output configuration
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? '[name].[contenthash].js' : '[name].js',
            chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
            clean: true, // Clean the output directory before emit
            publicPath: '/',
        },

        // Module resolution
        resolve: {
            extensions: ['.js', '.jsx'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@components': path.resolve(__dirname, 'src/components'),
                '@utils': path.resolve(__dirname, 'src/utils'),
                '@styles': path.resolve(__dirname, 'src/styles'),
                '@workers': path.resolve(__dirname, 'src/workers'),
            },
        },

        // Module rules for different file types
        module: {
            rules: [
                // JavaScript and JSX files
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', { targets: 'defaults' }],
                                ['@babel/preset-react', { runtime: 'automatic' }],
                            ],
                        },
                    },
                },
                // CSS files
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                // Asset files (images, fonts, etc.)
                {
                    test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/[name].[hash][ext]',
                    },
                },
                // Worker files
                {
                    test: /\.worker\.js$/,
                    use: { loader: 'worker-loader' },
                },
            ],
        },

        // Code splitting optimization
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // Separate TensorFlow.js into its own chunk for lazy loading (REQ-052)
                    tensorflow: {
                        test: /[\\/]node_modules[\\/]@tensorflow/,
                        name: 'tensorflow',
                        chunks: 'all',
                        priority: 30,
                    },
                    // Separate ffmpeg into its own chunk
                    ffmpeg: {
                        test: /[\\/]node_modules[\\/]@ffmpeg/,
                        name: 'ffmpeg',
                        chunks: 'all',
                        priority: 25,
                    },
                    // React and other vendor libraries
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 20,
                    },
                    // Common code shared between components
                    common: {
                        name: 'common',
                        chunks: 'all',
                        minChunks: 2,
                        priority: 10,
                    },
                },
            },
            // Runtime chunk for better caching
            runtimeChunk: 'single',
        },

        // Plugins
        plugins: [
            // Generate HTML file with script tags
            new HtmlWebpackPlugin({
                template: './public/index.html',
                filename: 'index.html',
                inject: true,
                minify: isProduction ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                } : false,
            }),

            // Progressive Web App support (REQ-053)
            ...(isProduction ? [
                new InjectManifest({
                    swSrc: './src/sw.js',
                    swDest: 'sw.js',
                    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for TensorFlow models
                }),
            ] : []),
        ],

        // Development server configuration
        devServer: {
            static: {
                directory: path.join(__dirname, 'public'),
            },
            port: 3000,
            open: true,
            hot: true,
            historyApiFallback: true,
            headers: {
                // CORS headers for development
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
                // Content Security Policy headers (REQ-092) - Updated for better Web Worker support
                'Content-Security-Policy': isProduction ?
                    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob: data:; connect-src 'self' https:; img-src 'self' data: blob:;" :
                    "default-src 'self' 'unsafe-eval' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob: data:; connect-src 'self' ws: wss: http: https:; img-src 'self' data: blob:;"
            },
        },

        // Performance hints
        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 512000, // 500KB
            maxAssetSize: 512000, // 500KB
        },

        // Source maps for debugging
        devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

        // External dependencies that should not be bundled
        externals: {
            // Keep TensorFlow.js models as external for dynamic loading
        },

        // Experiments for advanced features
        experiments: {
            // Enable WebAssembly support for ffmpeg.wasm
            asyncWebAssembly: true,
        },
    };
}; 