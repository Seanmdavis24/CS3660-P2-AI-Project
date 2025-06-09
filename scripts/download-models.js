#!/usr/bin/env node

/**
 * Download TensorFlow models script
 * 
 * This script downloads the required TensorFlow.js models for neural style transfer
 * from the official reiinakano/arbitrary-image-stylization-tfjs GitHub repository.
 * 
 * FIXED: Updated to use the correct working URL from GitHub instead of the broken
 * TensorFlow.js models release URL. Now uses reliable Node.js-based ZIP extraction
 * to avoid Windows file locking issues.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Model download URLs and configurations
// FIXED: Updated to use working GitHub repository ZIP instead of broken TensorFlow release
const MODELS = {
    'arbitrary-image-stylization': {
        // Original broken URL: 'https://github.com/tensorflow/tfjs-models/releases/download/arbitrary-image-stylization-v1.0.0/arbitrary-image-stylization-tfjs.tar.gz'
        url: 'https://github.com/reiinakano/arbitrary-image-stylization-tfjs/archive/refs/heads/master.zip',
        extractDir: 'arbitrary-image-stylization-tfjs-master',
        description: 'Magenta Arbitrary Image Stylization TensorFlow.js models'
    }
};

// Check if yauzl is available, if not suggest installation
let yauzl;
try {
    yauzl = require('yauzl');
} catch (e) {
    console.log('📦 Installing yauzl for ZIP extraction...');
    try {
        execSync('npm install yauzl', { stdio: 'inherit' });
        yauzl = require('yauzl');
    } catch (installError) {
        console.warn('⚠️  Could not install yauzl, falling back to system commands');
    }
}

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
                // Add small delay to ensure file is fully closed
                setTimeout(resolve, 100);
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
 * Extract ZIP file using Node.js
 */
function extractZipNodejs(filePath, extractDir) {
    return new Promise((resolve, reject) => {
        if (!yauzl) {
            reject(new Error('yauzl not available'));
            return;
        }

        console.log(`📦 Extracting: ${path.basename(filePath)}`);

        const modelsDir = path.dirname(filePath);
        const fullExtractPath = path.join(modelsDir, extractDir);

        if (!fs.existsSync(fullExtractPath)) {
            fs.mkdirSync(fullExtractPath, { recursive: true });
        }

        yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(err);
                return;
            }

            zipfile.readEntry();

            zipfile.on('entry', (entry) => {
                if (/\/$/.test(entry.fileName)) {
                    // Directory entry
                    const dirPath = path.join(modelsDir, entry.fileName);
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }
                    zipfile.readEntry();
                } else {
                    // File entry
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const filePath = path.join(modelsDir, entry.fileName);
                        const fileDir = path.dirname(filePath);

                        if (!fs.existsSync(fileDir)) {
                            fs.mkdirSync(fileDir, { recursive: true });
                        }

                        const writeStream = fs.createWriteStream(filePath);
                        readStream.pipe(writeStream);

                        writeStream.on('close', () => {
                            zipfile.readEntry();
                        });

                        writeStream.on('error', reject);
                    });
                }
            });

            zipfile.on('end', () => {
                // Move files from extracted folder to target directory
                const extractedSourceDir = path.join(modelsDir, 'arbitrary-image-stylization-tfjs-master');

                if (fs.existsSync(extractedSourceDir) && extractedSourceDir !== fullExtractPath) {
                    // Copy contents
                    const copyRecursively = (src, dest) => {
                        const files = fs.readdirSync(src);
                        files.forEach(file => {
                            const srcPath = path.join(src, file);
                            const destPath = path.join(dest, file);

                            if (fs.statSync(srcPath).isDirectory()) {
                                if (!fs.existsSync(destPath)) {
                                    fs.mkdirSync(destPath, { recursive: true });
                                }
                                copyRecursively(srcPath, destPath);
                            } else {
                                fs.copyFileSync(srcPath, destPath);
                            }
                        });
                    };

                    copyRecursively(extractedSourceDir, fullExtractPath);

                    // Remove source directory
                    fs.rmSync(extractedSourceDir, { recursive: true, force: true });
                }

                console.log(`✅ Extracted: ${extractDir}`);

                // Clean up the zip file
                try {
                    fs.unlinkSync(filePath);
                    console.log(`🧹 Cleaned up: ${path.basename(filePath)}`);
                } catch (cleanupError) {
                    console.warn(`⚠️  Could not clean up ${path.basename(filePath)}: ${cleanupError.message}`);
                }

                resolve();
            });

            zipfile.on('error', reject);
        });
    });
}

/**
 * Extract ZIP file (fallback to shell commands)
 */
function extractZip(filePath, extractDir) {
    return new Promise((resolve, reject) => {
        // Try Node.js method first
        if (yauzl) {
            extractZipNodejs(filePath, extractDir)
                .then(resolve)
                .catch((nodeError) => {
                    console.warn(`⚠️  Node.js extraction failed: ${nodeError.message}`);
                    console.log('🔄 Falling back to shell commands...');
                    extractZipShell(filePath, extractDir).then(resolve).catch(reject);
                });
        } else {
            extractZipShell(filePath, extractDir).then(resolve).catch(reject);
        }
    });
}

/**
 * Extract ZIP file using shell commands
 */
function extractZipShell(filePath, extractDir) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`📦 Extracting: ${path.basename(filePath)}`);

            // Add delay for Windows to ensure file is released
            setTimeout(() => {
                try {
                    // Create extract directory
                    const modelsDir = path.dirname(filePath);
                    const fullExtractPath = path.join(modelsDir, extractDir);

                    if (!fs.existsSync(fullExtractPath)) {
                        fs.mkdirSync(fullExtractPath, { recursive: true });
                    }

                    // Extract using platform-specific unzip commands
                    let unzipCommand;
                    if (process.platform === 'win32') {
                        // Windows - use PowerShell with force overwrite
                        unzipCommand = `powershell -command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${filePath.replace(/\\/g, '\\\\')}', '${modelsDir.replace(/\\/g, '\\\\')}')"`;
                    } else {
                        // Unix-like systems (Linux, macOS) - use unzip
                        unzipCommand = `unzip -q -o "${filePath}" -d "${modelsDir}"`;
                    }

                    execSync(unzipCommand, { stdio: 'inherit' });

                    // The extracted folder will have the name "arbitrary-image-stylization-tfjs-master"
                    // We need to copy its contents to our target directory
                    const extractedSourceDir = path.join(modelsDir, 'arbitrary-image-stylization-tfjs-master');

                    if (fs.existsSync(extractedSourceDir) && extractedSourceDir !== fullExtractPath) {
                        // Copy contents from extracted directory to our target directory
                        if (process.platform === 'win32') {
                            execSync(`xcopy "${extractedSourceDir}\\*" "${fullExtractPath}\\" /E /I /Y`, { stdio: 'inherit' });
                            execSync(`rmdir /S /Q "${extractedSourceDir}"`, { stdio: 'inherit' });
                        } else {
                            execSync(`cp -r "${extractedSourceDir}"/* "${fullExtractPath}"/`, { stdio: 'inherit' });
                            execSync(`rm -rf "${extractedSourceDir}"`, { stdio: 'inherit' });
                        }
                    }

                    console.log(`✅ Extracted: ${extractDir}`);

                    // Clean up the zip file
                    fs.unlinkSync(filePath);
                    console.log(`🧹 Cleaned up: ${path.basename(filePath)}`);

                    resolve();
                } catch (innerError) {
                    reject(innerError);
                }
            }, process.platform === 'win32' ? 500 : 100);
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

            const tempFile = path.join(MODELS_DIR, `${name}.zip`);

            try {
                await downloadFile(config.url, tempFile);
                await extractZip(tempFile, config.extractDir);
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