import React, { useState, useEffect } from 'react';
import assetPreloader, { gameAssets } from '../utils/AssetPreloader';

const InitialLoadingScreen = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing ToyBox Arena...');
  const [isReallyLoading, setIsReallyLoading] = useState(true);
  
  useEffect(() => {
    // REAL asset loading
    const loadRealAssets = async () => {
      // Set up progress tracking
      assetPreloader.onProgress((percent, loaded, total) => {
        setProgress(Math.round(percent));
        
        // Update status based on real progress
        if (percent < 20) {
          setLoadingStatus("Initializing ToyBox Arena...");
        } else if (percent < 40) {
          setLoadingStatus("Loading legendary toys...");
        } else if (percent < 60) {
          setLoadingStatus("Preparing battlefield...");
        } else if (percent < 80) {
          setLoadingStatus("Charging special abilities...");
        } else if (percent < 95) {
          setLoadingStatus("Syncing battle systems...");
        } else {
          setLoadingStatus("Ready to battle!");
        }
      });

      assetPreloader.onLoadComplete(async (assets) => {
        // Create texture atlas (now excludes large images automatically)
        setLoadingStatus("Creating texture atlas...");
        await assetPreloader.createAtlasFromLoadedImages();
        
        setProgress(100);
        setLoadingStatus("Ready to battle!");
        setIsReallyLoading(false);
        
        // Start fade out
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            onLoadComplete();
          }, 800);
        }, 500);
      });

      // All assets should now exist, so we can load them all
      const assetsToLoad = gameAssets;
      
      console.log(`Starting to preload ${assetsToLoad.length} assets...`);

      try {
        await assetPreloader.loadAssets(assetsToLoad);
      } catch (error) {
        console.error('Asset loading failed, falling back to simulation:', error);
        simulateLoading();
      }
    };

    // Fallback simulated loading (for when assets don't exist)
    const simulateLoading = () => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsReallyLoading(false);
            // Start fade out after loading completes
            setTimeout(() => {
              setFadeOut(true);
              setTimeout(() => {
                onLoadComplete();
              }, 800);
            }, 500);
            return 100;
          }
          
          const newProgress = prev + Math.random() * 8 + 2;
          
          // Update status based on simulated progress
          if (newProgress < 20) {
            setLoadingStatus("Initializing ToyBox Arena...");
          } else if (newProgress < 40) {
            setLoadingStatus("Loading legendary toys...");
          } else if (newProgress < 60) {
            setLoadingStatus("Preparing battlefield...");
          } else if (newProgress < 80) {
            setLoadingStatus("Charging special abilities...");
          } else if (newProgress < 95) {
            setLoadingStatus("Syncing battle systems...");
          } else {
            setLoadingStatus("Ready to battle!");
          }
          
          return newProgress;
        });
      }, 150);

      return () => clearInterval(interval);
    };

    // Start loading real assets
    loadRealAssets();
  }, [onLoadComplete]);

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center z-[9999] transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-black"
        style={{ 
          backgroundImage: 'url(/finalwebpbackground.webp)',
          backgroundSize: window.innerWidth < 768 ? '150% auto' : 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Top and bottom fade gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
      
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Main Logo/Icon Container */}
      <div className="relative z-10">
        {/* Controller Icon with Spinning Rings */}
        <div className="relative w-40 h-40 mb-8">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 border-r-pink-400 animate-spin" />
          
          {/* Middle spinning ring - opposite direction */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-cyan-400 border-l-green-400 animate-spin-reverse" />
          
          {/* Center controller icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl animate-bounce-slow">
              🎮
            </div>
          </div>
          
        </div>
      </div>

      {/* Loading Bar Container */}
      <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Loading Text */}
      <div className="mt-4 text-white/90 text-base font-medium">
        {loadingStatus}
      </div>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-white/50 text-xs">
          {isReallyLoading ? 'Loading real assets...' : 'Simulated loading'}
        </div>
      )}

      {/* Fun Loading Tips - Under loading bar */}
      <div className="mt-6 text-center max-w-md px-4">
        <p className="text-white/70 text-sm font-medium animate-fade-in-out">
          {progress < 33 && "💡 Tip: Mythic toys have the most powerful ultimate abilities!"}
          {progress >= 33 && progress < 66 && "⚔️ Tip: Build a balanced team with tanks and damage dealers!"}
          {progress >= 66 && "🎮 Tip: Critical hits can turn the tide of battle!"}
        </p>
      </div>

      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.1);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateX(60px) scale(0);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation)) translateX(60px) scale(1);
          }
        }

        @keyframes fade-in-out {
          0%, 100% {
            opacity: 0;
          }
          10%, 90% {
            opacity: 1;
          }
        }

        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-fade-in-out {
          animation: fade-in-out 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default InitialLoadingScreen;