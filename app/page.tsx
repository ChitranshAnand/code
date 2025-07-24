
'use client';

import { useState } from 'react';
import CardGlass from '../components/ui/CardGlass';
import Dropzone from '../components/ui/Dropzone';
import HowItWorksItem from '../components/ui/HowItWorksItem';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-400/20"></div>
      
      <CardGlass className="w-full max-w-4xl p-16 text-center relative z-10">
        <h1 className="text-5xl font-bold text-white mb-6 font-inter leading-tight drop-shadow-lg">
          Friendship Analyzer
        </h1>
        <h2 className="text-xl text-white/90 mb-16 font-inter font-medium">
          Upload your WhatsApp chat (.zip) to begin
        </h2>
        
        <div className="flex justify-center mb-20">
          <Dropzone onFileUpload={handleFileUpload} />
        </div>

        <div className="border-t border-white/20 pt-20">
          <h3 className="text-white text-2xl font-bold mb-12 font-inter">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <HowItWorksItem
              number={1}
              title="Upload Chat"
              description="Export your WhatsApp chat as a .zip file and upload it securely"
            />
            <HowItWorksItem
              number={2}
              title="AI Analysis"
              description="Our advanced A.I. analyzes patterns, timings, and conversation dynamics"
            />
            <HowItWorksItem
              number={3}
              title="Get Insights"
              description="Discover unique insights about your friendship dynamics and strengths"
            />
          </div>
        </div>
      </CardGlass>
    </div>
  );
}
// to do is