// LoadingScreen.jsx - Shows loading progress while preloading assets
import React, { useEffect, useState } from 'react';
import assetPreloader, { gameAssets } from '../utils/AssetPreloader';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    // Set up progress tracking
    assetPreloader.onProgress((percent, loaded, total) => {
      setProgress(Math.round(percent));
      setLoadedCount(loaded);
      setTotalCount(total);
      
      // Update status message based on progress
      if (percent < 30) {
        setStatus('Loading toy sprites...');
      } else if (percent < 60) {
        setStatus('Loading spell effects...');
      } else if (percent < 90) {
        setStatus('Loading audio...');
      } else {
        setStatus('Almost ready...');
      }
    });

    assetPreloader.onLoadComplete(async (assets) => {
      setStatus('Creating texture atlas...');
      
      // Create texture atlas for better performance
      await assetPreloader.createAtlasFromLoadedImages();
      
      setStatus('Ready to play!');
      setIsComplete(true);
      
      // Small delay to show completion
      setTimeout(() => {
        if (onComplete) onComplete(assets);
      }, 500);
    });

    // Filter assets that actually exist
    const existingAssets = gameAssets.filter(asset => {
      // For now, we'll attempt to load all defined assets
      // In production, you'd check if files exist first
      return true;
    });

    // Start loading
    setStatus('Loading game assets...');
    setTotalCount(existingAssets.length);
    
    try {
      await assetPreloader.loadAssets(existingAssets);
    } catch (error) {
      console.error('Some assets failed to load:', error);
      setStatus('Loading complete (some assets failed)');
      setIsComplete(true);
      setTimeout(() => {
        if (onComplete) onComplete(assetPreloader.assets);
      }, 1000);
    }
  };

  return (
    <div className="loading-screen fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-purple-900 flex items-center justify-center z-50">
      <div className="loading-content text-center max-w-md mx-auto p-8">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold font-toy mb-2">
            <span className="text-yellow-400" style={{ textShadow: '3px 3px 0 #ff6b35' }}>TOY</span>
            {' '}
            <span className="text-orange-500" style={{ textShadow: '3px 3px 0 #ff1493' }}>BOX</span>
          </h1>
          <h2 className="text-4xl font-toy text-pink-500" style={{ textShadow: '2px 2px 0 #ff69b4' }}>
            BRAWL
          </h2>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation mb-8">
          <div className="flex justify-center space-x-2">
            {['🧸', '🎮', '🚀', '🤖', '🦖'].map((emoji, index) => (
              <div
                key={index}
                className="text-4xl animate-bounce"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1s'
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="progress-container mb-4">
          <div className="bg-gray-800 rounded-full h-8 overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="h-full bg-repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.1) 10px,
                rgba(255,255,255,0.1) 20px
              )" />
            </div>
            
            {/* Progress bar fill */}
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 transition-all duration-300 ease-out relative"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
              }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine" />
            </div>
            
            {/* Progress text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg drop-shadow-lg">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="status-text mb-2">
          <p className="text-white text-lg font-medium animate-pulse">
            {status}
          </p>
        </div>

        {/* Asset Counter */}
        <div className="asset-counter">
          <p className="text-gray-400 text-sm">
            {loadedCount} / {totalCount} assets loaded
          </p>
        </div>

        {/* Tips (shown while loading) */}
        {!isComplete && (
          <div className="tips mt-8 p-4 bg-black bg-opacity-30 rounded-lg">
            <p className="text-gray-300 text-sm italic">
              💡 Tip: Each toy has unique abilities - experiment to find your favorite combo!
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .loading-screen {
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 20, 147, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(0, 255, 255, 0.2) 0%, transparent 50%);
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;