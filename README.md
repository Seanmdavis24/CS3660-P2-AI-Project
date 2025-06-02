# CartoonizeMe - AI Video Style Transfer

> Transform your videos into artistic animations using AI-powered neural style transfer

CartoonizeMe is a cutting-edge web application that applies AI-powered neural style transfer to short video clips, transforming real-world footage into stylized animations. The application processes videos entirely in the browser using TensorFlow.js and ffmpeg.wasm for complete privacy and security.

## ✨ Features

### 🎬 Video Processing
- **Upload & Validation**: Support for .mp4, .webm, .mov, .avi files up to 30 seconds and 100MB
- **AI Style Transfer**: Transform videos using 5+ artistic styles (cartoon, anime, oil painting, watercolor, sketch)
- **Real-time Progress**: Live progress tracking with estimated time remaining
- **Privacy First**: All processing happens in your browser - videos never leave your device

### 🎨 Artistic Styles
- **Cartoon Style**: Transform videos into colorful cartoon animations
- **Anime Style**: Create anime-inspired video transformations
- **Oil Painting**: Apply classic oil painting effects
- **Watercolor**: Soft, flowing watercolor artistic style
- **Sketch**: Pencil sketch and line art effects

### 💻 Technical Features
- **Client-side Processing**: No server uploads required
- **GPU Acceleration**: WebGL-powered processing for better performance
- **Progressive Web App**: Install and use offline
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- At least 4GB RAM for optimal performance
- WebGL 2.0 support for GPU acceleration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cartoonizeme.git
   cd cartoonizeme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npx serve -s dist
```

## 📖 How to Use

### 1. Upload Your Video
- Drag and drop a video file or click to browse
- Supported formats: MP4, WebM, MOV, AVI
- Maximum duration: 30 seconds
- Maximum file size: 100MB

### 2. Choose Your Style
- Browse the style gallery
- Preview styles on your video thumbnail
- Click to select your preferred artistic style

### 3. Process Your Video
- Click "Start Processing" to begin transformation
- Watch real-time progress updates
- Processing typically takes 1-2 minutes for 10-second videos

### 4. Download Results
- Preview your transformed video
- Compare original vs. stylized versions
- Download in MP4 or WebM format

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18**: Modern UI framework with hooks and context
- **TensorFlow.js 4.0+**: AI/ML processing in the browser
- **ffmpeg.wasm**: Video processing and manipulation
- **Webpack**: Module bundling and optimization
- **CSS3**: Modern styling with custom properties

### Key Technologies
- **Neural Style Transfer**: AI-powered artistic transformation
- **WebGL 2.0**: GPU-accelerated processing
- **Web Workers**: Background processing for UI responsiveness
- **WebAssembly**: High-performance video processing
- **Service Workers**: Progressive Web App capabilities

### Browser Compatibility
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## 📁 Project Structure

```
cartoonizeme/
├── public/                 # Static assets and HTML template
│   ├── index.html         # Main HTML template
│   ├── manifest.json      # PWA manifest
│   └── assets/            # Icons and images
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── VideoUpload/   # Video upload interface
│   │   ├── StyleSelector/ # Style selection gallery
│   │   ├── ProcessingEngine/ # Video processing logic
│   │   └── ResultsViewer/ # Results display and download
│   ├── context/           # React context for state management
│   ├── utils/             # Utility functions
│   │   ├── browserCheck.js # Browser compatibility
│   │   ├── performance.js  # Performance monitoring
│   │   └── videoProcessor.js # Video processing logic
│   ├── styles/            # CSS styles
│   ├── workers/           # Web Workers for background processing
│   └── models/            # TensorFlow.js model definitions
├── webpack.config.js      # Webpack configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Development/Production mode
NODE_ENV=development

# Enable/disable features
REACT_APP_ENABLE_GPU=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_MAX_VIDEO_SIZE=104857600  # 100MB in bytes
REACT_APP_MAX_VIDEO_DURATION=30     # 30 seconds
```

### Performance Tuning
- **Memory Limit**: Processes videos in chunks to stay under 2GB RAM usage
- **GPU Acceleration**: Automatically detects and uses WebGL when available
- **Model Optimization**: Uses quantized models for faster loading and processing

## 📊 Performance Requirements

### Minimum System Requirements
- 4GB RAM
- Modern CPU (2+ cores recommended)
- WebGL 2.0 compatible graphics
- 500MB free disk space

### Performance Targets
- Application load time: < 3 seconds
- Video processing: < 2 minutes per 10-second video (720p)
- Memory usage: < 2GB during processing
- UI responsiveness: Maintained during processing

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Browser Testing
```bash
# Test across different browsers
npm run test:browsers

# Performance testing
npm run test:performance
```

## 🚀 Deployment

### Static Hosting (Recommended)
Deploy to any static hosting service:

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Deploy to Vercel
vercel --prod

# Deploy to GitHub Pages
npm run deploy:github
```

### CDN Configuration
For optimal performance, configure your CDN to cache:
- JavaScript bundles: 1 year
- CSS files: 1 year
- TensorFlow.js models: 1 month
- HTML files: No cache

## 🔒 Privacy & Security

### Data Privacy
- **No Server Processing**: All video processing happens locally in your browser
- **No Data Collection**: Videos and personal data never leave your device
- **No Tracking**: No user analytics or behavior tracking
- **Secure Processing**: Uses modern web security standards

### Content Security Policy
The application implements strict CSP headers:
```
default-src 'self';
script-src 'self' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
worker-src 'self' blob:;
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

### Code Style
- Use ESLint and Prettier for code formatting
- Follow React best practices and hooks patterns
- Write comprehensive JSDoc comments
- Include unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TensorFlow.js Team**: For making AI accessible in browsers
- **ffmpeg.wasm Project**: For bringing video processing to the web
- **Open Source Community**: For the amazing tools and libraries

## 📞 Support

### Documentation
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)
- [API Reference](docs/api-reference.md)

### Community
- [GitHub Issues](https://github.com/your-username/cartoonizeme/issues)
- [Discussions](https://github.com/your-username/cartoonizeme/discussions)

### Browser Support Issues
If you encounter browser compatibility issues:
1. Check the [Browser Requirements](#browser-compatibility)
2. Update your browser to the latest version
3. Enable hardware acceleration in browser settings
4. Try using Chrome for best compatibility

---

**Made with ❤️ by the CartoonizeMe Team**

Transform your memories into art with the power of AI! 