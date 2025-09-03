import React, { useState, useEffect } from 'react';

const LOADING_TIPS = [
  "Mythic toys have the most powerful special abilities!",
  "Legendary toys can turn the tide of battle with unique ultimates.",
  "Building a balanced team creates powerful synergies.",
  "Epic toys have higher chances to trigger special abilities.",
  "Some toys have hidden combo attacks when paired together!",
  "The rarer the toy, the more damage their abilities deal.",
  "Speed stat determines who attacks first in combat.",
  "Tank toys protect your damage dealers in battle.",
  "Critical hits deal double damage - luck matters!",
  "Each toy has unique stats affecting battle performance.",
  "Ultimate abilities can hit multiple enemies at once.",
  "The Phoenix Dragon is one of the most powerful mythic toys!",
  "Rare toys have better base stats than common ones.",
  "Collecting full sets of toys unlocks special bonuses.",
  "Your toys gain experience with each battle!",
  "Some toys are only available during special events.",
  "Combine strategy and luck to dominate the arena!",
  "Watch for enemy patterns to predict their moves.",
  "Save your ultimate abilities for critical moments!",
  "Different toy types counter each other in battle."
];

const BACKGROUND_IMAGES = [
  '/assets/images/cosmicjack.jpeg',
  '/assets/images/duckie.jpeg',
  '/assets/images/mechadino.jpeg',
  '/assets/images/rockinghorse.jpeg',
  '/assets/images/windupsoldier.jpeg'
];

const LoadingScreen = ({ onLoadComplete, battleType = 'single', playerAddress = null, opponentAddress = null }) => {
  const [countdown, setCountdown] = useState(5);
  const [currentTip] = useState(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
  const [showVS, setShowVS] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show VS animation after 500ms
    const vsTimer = setTimeout(() => setShowVS(true), 500);

    // Background image cycling
    const bgInterval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 1000); // Change every second

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        // Start fade at 3 seconds
        if (prev === 3 && !fadeOut) {
          setFadeOut(true);
        }
        
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(bgInterval);
          // Wait for fade to complete then notify parent
          setTimeout(() => onLoadComplete(), 2500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Play sound effect
    const battleStartSound = new Audio('/battlestart.wav');
    battleStartSound.volume = 0.3;
    battleStartSound.play().catch(err => console.log('Could not play sound:', err));

    return () => {
      clearTimeout(vsTimer);
      clearInterval(countdownInterval);
      clearInterval(bgInterval);
    };
  }, [onLoadComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100]"
      style={{
        backgroundColor: 'black',
        filter: fadeOut ? 'blur(40px)' : 'blur(0px)',
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'scale(1.2)' : 'scale(1)',
        transition: fadeOut ? 'all 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        pointerEvents: fadeOut ? 'none' : 'auto'
      }}
    >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Cycling Background Images */}
        <div className="absolute inset-0">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={img}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === currentBgIndex ? 1 : 0
            }}
          />
        ))}
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-indigo-900/80" />
      </div>
      
      {/* Animated particles overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* VS Animation */}
        {showVS && (
          <div className="mb-8 animate-vs-zoom">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-5xl md:text-6xl mb-2 animate-pulse shadow-2xl">
                  ⚔️
                </div>
                <p className="text-white font-black text-lg md:text-xl">
                  {battleType === 'pvp' && playerAddress ? (
                    <span className="text-cyan-300">
                      {playerAddress.slice(0, 4)}...{playerAddress.slice(-4)}
                    </span>
                  ) : (
                    'YOU'
                  )}
                </p>
              </div>
              
              <div className="text-4xl md:text-6xl font-black text-yellow-400 animate-pulse-slow">
                VS
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-5xl md:text-6xl mb-2 animate-pulse shadow-2xl">
                  {battleType === 'pvp' ? '⚔️' : '🤖'}
                </div>
                <p className="text-white font-black text-lg md:text-xl">
                  {battleType === 'pvp' && opponentAddress ? (
                    <span className="text-orange-300">
                      {opponentAddress.slice(0, 4)}...{opponentAddress.slice(-4)}
                    </span>
                  ) : battleType === 'pvp' ? (
                    'OPPONENT'
                  ) : (
                    'AI'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Battle Starting Text */}
        <h1 className="text-4xl md:text-6xl font-black text-white mb-8 animate-pulse">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500">
            BATTLE STARTING
          </span>
        </h1>

        {/* Countdown */}
        <div className="mb-8">
          {countdown > 0 && (
            <div className="relative inline-block">
              <div className="text-8xl md:text-9xl font-black text-white animate-countdown">
                {countdown}
              </div>
              <div className="absolute inset-0 text-8xl md:text-9xl font-black text-yellow-400 opacity-50 animate-ping">
                {countdown}
              </div>
            </div>
          )}
        </div>

        {/* Game Tip */}
        <div className="mb-4 px-6 py-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl border border-cyan-400/30 max-w-2xl mx-auto animate-slide-up">
          <p className="text-sm md:text-base text-cyan-300 font-bold uppercase tracking-wider mb-2">
            💡 Battle Tip
          </p>
          <p className="text-base md:text-lg text-white/90 font-medium">
            {currentTip}
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-1000 animate-pulse"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }

        @keyframes vs-zoom {
          0% { 
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes countdown {
          0% {
            transform: scale(1.5);
            opacity: 0;
          }
          20% {
            transform: scale(1);
            opacity: 1;
          }
          80% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-vs-zoom {
          animation: vs-zoom 0.8s ease-out;
        }

        .animate-countdown {
          animation: countdown 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
      </div>
    </div>
  );
};

export default LoadingScreen;