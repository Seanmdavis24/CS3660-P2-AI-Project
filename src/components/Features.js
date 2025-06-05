import React from "react";
import { Link } from "react-router-dom";

function Features() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-8 text-primary-600 hover:text-primary-700"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Features</h1>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🎬 Video Processing
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li>
                • Support for multiple video formats (MP4, WebM, MOV, AVI)
              </li>
              <li>• Process videos up to 30 seconds in length</li>
              <li>• Maximum file size of 100MB</li>
              <li>• Real-time processing progress tracking</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🎨 Artistic Styles
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li>
                • Cartoon Style: Transform videos into colorful cartoon
                animations
              </li>
              <li>
                • Anime Style: Create anime-inspired video transformations
              </li>
              <li>• Oil Painting: Apply classic oil painting effects</li>
              <li>• Watercolor: Soft, flowing watercolor artistic style</li>
              <li>• Sketch: Pencil sketch and line art effects</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              💻 Technical Features
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li>• Client-side Processing: No server uploads required</li>
              <li>
                • GPU Acceleration: WebGL-powered processing for better
                performance
              </li>
              <li>• Progressive Web App: Install and use offline</li>
              <li>
                • Responsive Design: Works on desktop, tablet, and mobile
                devices
              </li>
              <li>• Accessibility: WCAG 2.1 AA compliant</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🔒 Privacy & Security
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li>• All processing happens locally in your browser</li>
              <li>• Videos never leave your device</li>
              <li>• No data collection or tracking</li>
              <li>• Secure processing using modern web security standards</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Features;
