import React, { useState, useEffect } from 'react';

const InitialLoadingScreen = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    // Simulate loading progress - slower for longer duration
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Start fade out after loading completes
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              onLoadComplete();
            }, 800); // Wait for fade animation
          }, 500);
          return 100;
        }
        return prev + Math.random() * 8 + 2; // Smaller increments for longer loading
      });
    }, 150); // Slower interval

    return () => clearInterval(interval);
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
        {progress < 20 && "Initializing ToyBox Arena..."}
        {progress >= 20 && progress < 40 && "Loading legendary toys..."}
        {progress >= 40 && progress < 60 && "Preparing battlefield..."}
        {progress >= 60 && progress < 80 && "Charging special abilities..."}
        {progress >= 80 && progress < 95 && "Syncing battle systems..."}
        {progress >= 95 && "Ready to battle!"}
      </div>

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