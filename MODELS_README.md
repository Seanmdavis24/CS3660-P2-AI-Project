# TensorFlow.js Models Guide

This document explains how the TensorFlow.js models are managed in this project.

## 🧠 **Model Architecture**

The application uses **Magenta's Arbitrary Image Stylization** models for neural style transfer:

- **Style Model**: Extracts style features from reference images
- **Transformer Model**: Applies extracted styles to content images
- **Fallback**: TensorFlow Hub models for runtime loading

## 📥 **Automatic Model Management**

### **During Installation**
```bash
npm install  # Automatically downloads models via postinstall hook
```

### **Manual Download**
```bash
npm run download-models  # Force re-download models
```

### **What Happens**
1. **Script checks** if models already exist
2. **Downloads** from official TensorFlow.js releases (~60MB)
3. **Extracts** to `public/models/` directory
4. **Creates fallback** structure for TensorFlow Hub models
5. **Graceful degradation** if download fails

## 🗂️ **Directory Structure**

```
public/models/
├── arbitrary-image-stylization-tfjs-master/
│   ├── saved_model_style_js/
│   │   ├── model.json
│   │   └── *.bin files
│   └── saved_model_transformer_js/
│       ├── model.json
│       └── *.bin files
├── style_network/          (fallback)
└── transformer_network/    (fallback)
```

## 🚫 **Why Models Aren't in Git**

- **Size**: Models are 60-120MB (exceeds GitHub limits)
- **Best Practice**: Large binaries should be downloaded as dependencies
- **Flexibility**: Easy to update models without repo bloat
- **Industry Standard**: Similar to node_modules approach

## ⚡ **Performance & Fallbacks**

### **Loading Priority**
1. **Local models** (fastest - downloaded during install)
2. **TensorFlow Hub** (fallback - loaded at runtime)
3. **Enhanced filters** (final fallback - always available)

### **Error Handling**
- Network issues → TensorFlow Hub fallback
- TensorFlow Hub issues → Enhanced filter fallback
- All failures → Graceful degradation with user notification

## 🔧 **Troubleshooting**

### **Models Failed to Download**
```bash
# Clear and re-download
rm -rf public/models/
npm run download-models
```

### **Disk Space Issues**
```bash
# Check model sizes
du -sh public/models/*

# Manual cleanup
rm -rf public/models/
```

### **Network/Firewall Issues**
- App automatically falls back to TensorFlow Hub
- Still provides full functionality
- Slightly slower initial load time

## 🎯 **For Developers**

### **Adding New Models**
1. Update `scripts/download-models.js`
2. Add new model configuration
3. Update fallback structure creation
4. Test download and extraction

### **Model Format Requirements**
- TensorFlow.js Graph Model format (.json + .bin files)
- Compatible with `tf.loadGraphModel()`
- Proper input/output tensor shapes for style transfer

### **Testing Model Changes**
```bash
# Clear existing models
rm -rf public/models/

# Test download script
npm run download-models

# Test app with new models
npm start
```

---

📝 **Note**: This approach follows industry best practices for managing large ML models in web applications, ensuring fast cloning and reliable deployment. 