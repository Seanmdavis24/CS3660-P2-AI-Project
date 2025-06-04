import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import UploadSection from './components/UploadSection/UploadSection';
import StyleControls from './components/StyleControls/StyleControls';
import PreviewSection from './components/PreviewSection/PreviewSection';
import Footer from './components/Footer/Footer';
import { VideoProcessorProvider } from './hooks/useVideoProcessor';

function App() {
  return (
    <VideoProcessorProvider>
      <div className="app">
        <div className="container">
          <Header />
          
          <div className="main-grid">
            <UploadSection />
            <StyleControls />
            <PreviewSection />
          </div>

          <Footer />
        </div>
      </div>
    </VideoProcessorProvider>
  );
}

export default App;