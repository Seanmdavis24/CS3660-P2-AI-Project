import React from "react";
import { Link } from "react-router-dom";

function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-8 text-primary-600 hover:text-primary-700"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">How It Works</h1>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Upload Your Video
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>Start by uploading your video through our simple interface:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Drag and drop your video file into the upload zone</li>
                <li>Or click to browse and select your video</li>
                <li>Supported formats: MP4, WebM, MOV, AVI</li>
                <li>Maximum duration: 30 seconds</li>
                <li>Maximum file size: 100MB</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Choose Your Style
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>Select from our collection of artistic styles:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Browse through our style gallery</li>
                <li>Preview how each style looks on a sample frame</li>
                <li>Mix and match styles to find your perfect look</li>
                <li>Each style is powered by unique AI models</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Process Your Video
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>Watch as AI transforms your video:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Processing happens entirely in your browser</li>
                <li>GPU acceleration for faster results</li>
                <li>Real-time progress tracking</li>
                <li>Typically takes 1-2 minutes for a 10-second video</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Download and Share
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>Get your transformed video:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Preview the transformed video</li>
                <li>Compare original and stylized versions</li>
                <li>Download in MP4 or WebM format</li>
                <li>Share directly to social media</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Behind the Scenes
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>Our technology stack:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>TensorFlow.js for AI processing</li>
                <li>WebGL acceleration for optimal performance</li>
                <li>Client-side processing for privacy</li>
                <li>Progressive Web App capabilities</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
