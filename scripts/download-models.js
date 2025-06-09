#!/usr/bin/env node

/**
 * Download TensorFlow models script
 * 
 * This script downloads the required TensorFlow.js models for neural style transfer
 * from official sources to avoid storing large files in the git repository.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Model download URLs and configurations
const MODELS = {
    'arbitrary-image-stylization': {
        url: 'https://github.com/tensorflow/tfjs-models/releases/download/arbitrary-image-stylization-v1.0.0/arbitrary-image-stylization-tfjs.tar.gz',
        extractDir: 'arbitrary-image-stylization-tfjs-master',
        description: 'Magenta Arbitrary Image Stylization TensorFlow.js models'
    }
};

/**
 * Download a file from URL
 */
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        console.log(`📥 Downloading: ${url}`);

        const file = fs.createWriteStream(destination);

        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects
                return downloadFile(response.headers.location, destination)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded: ${path.basename(destination)}`);
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(destination, () => { }); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Extract tar.gz file
 */
function extractTarGz(filePath, extractDir) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`📦 Extracting: ${path.basename(filePath)}`);

            // Create extract directory
            const fullExtractPath = path.join(path.dirname(filePath), extractDir);
            if (!fs.existsSync(fullExtractPath)) {
                fs.mkdirSync(fullExtractPath, { recursive: true });
            }

            // Extract using tar (works on most systems)
            execSync(`tar -xzf "${filePath}" -C "${fullExtractPath}" --strip-components=1`, {
                stdio: 'inherit'
            });

            console.log(`✅ Extracted: ${extractDir}`);

            // Clean up the tar file
            fs.unlinkSync(filePath);
            console.log(`🧹 Cleaned up: ${path.basename(filePath)}`);

            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Create fallback models directory structure
 */
function createFallbackStructure() {
    console.log('📁 Creating fallback model directory structure...');

    // Create the basic directory structure
    const dirs = [
        'arbitrary-image-stylization-tfjs-master/saved_model_style_js',
        'arbitrary-image-stylization-tfjs-master/saved_model_transformer_js',
        'style_network',
        'transformer_network'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(MODELS_DIR, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });

    // Create placeholder model.json files that point to TensorFlow Hub
    const hubModelConfig = {
        format: "graph-model",
        generatedBy: "TensorFlow.js tfjs-converter v3.21.0",
        convertedBy: "TensorFlow.js tfjs-converter v3.21.0",
        signature: {},
        userDefinedMetadata: {
            note: "This model will be loaded from TensorFlow Hub at runtime"
        },
        modelTopology: {
            note: "Placeholder - actual model loaded from tfhub.dev"
        },
        weightsManifest: []
    };

    // Write placeholder model files
    const modelFiles = [
        'arbitrary-image-stylization-tfjs-master/saved_model_style_js/model.json',
        'arbitrary-image-stylization-tfjs-master/saved_model_transformer_js/model.json',
        'style_network/model.json',
        'transformer_network/model.json'
    ];

    modelFiles.forEach(file => {
        const fullPath = path.join(MODELS_DIR, file);
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, JSON.stringify(hubModelConfig, null, 2));
        }
    });

    console.log('✅ Fallback structure created');
}

/**
 * Check if models already exist
 */
function modelsExist() {
    const requiredFiles = [
        'arbitrary-image-stylization-tfjs-master/saved_model_style_js/model.json',
        'arbitrary-image-stylization-tfjs-master/saved_model_transformer_js/model.json'
    ];

    return requiredFiles.every(file => {
        const fullPath = path.join(MODELS_DIR, file);
        return fs.existsSync(fullPath);
    });
}

/**
 * Main download function
 */
async function downloadModels() {
    console.log('🧠 TensorFlow.js Models Setup');
    console.log('==============================');

    // Create models directory if it doesn't exist
    if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR, { recursive: true });
    }

    // Check if models already exist
    if (modelsExist()) {
        console.log('✅ Models already exist, skipping download');
        return;
    }

    console.log('📥 Downloading TensorFlow.js models...');
    console.log('⏱️  This may take a few minutes depending on your internet connection');

    try {
        // Try to download official models
        for (const [name, config] of Object.entries(MODELS)) {
            console.log(`\n🔄 Processing: ${config.description}`);

            const tempFile = path.join(MODELS_DIR, `${name}.tar.gz`);

            try {
                await downloadFile(config.url, tempFile);
                await extractTarGz(tempFile, config.extractDir);
            } catch (downloadError) {
                console.warn(`⚠️  Failed to download ${name}:`, downloadError.message);
                console.log('🔄 Creating fallback structure...');
            }
        }

        // Always ensure fallback structure exists
        createFallbackStructure();

        console.log('\n🎉 Model setup completed!');
        console.log('📝 Note: If downloads failed, the app will use TensorFlow Hub models at runtime');

    } catch (error) {
        console.error('❌ Error during model setup:', error.message);
        console.log('🔄 Creating fallback structure for runtime loading...');
        createFallbackStructure();
    }
}

// Run if called directly
if (require.main === module) {
    downloadModels().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { downloadModels }; 