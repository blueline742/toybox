import React, { useEffect, useState } from 'react'

const UltimateSpellOverlay = ({ isActive, spellName, casterName }) => {
  const [showEffect, setShowEffect] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  
  useEffect(() => {
    if (isActive) {
      setShowEffect(true)
      // Screen shake DISABLED
      // setScreenShake(true)
      
      // Stop screen shake after 1 second - DISABLED
      // const shakeTimer = setTimeout(() => {
      //   setScreenShake(false)
      // }, 1000)
      
      // Hide everything after 3 seconds (same as spell notification)
      const hideTimer = setTimeout(() => {
        setShowEffect(false)
      }, 3000)
      
      return () => {
        // clearTimeout(shakeTimer) // DISABLED
        clearTimeout(hideTimer)
      }
    } else {
      setShowEffect(false)
      setScreenShake(false)
    }
  }, [isActive])
  
  // Apply screen shake to the whole viewport - DISABLED
  // useEffect(() => {
  //   if (screenShake) {
  //     document.body.classList.add('screen-shake')
  //   } else {
  //     document.body.classList.remove('screen-shake')
  //   }
  //   
  //   return () => {
  //     document.body.classList.remove('screen-shake')
  //   }
  // }, [screenShake])
  
  if (!showEffect) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Epic Dark Flash with Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.9) 100%)',
          animation: 'epic-dark-flash 0.6s ease-out forwards'
        }}
      />
      
      {/* Lightning Bolts */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`lightning-${i}`}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${i * 45}deg, transparent 49%, #FFD700 49.5%, #FFD700 50.5%, transparent 51%)`,
            animation: `lightning-strike ${0.3 + i * 0.05}s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
            filter: 'blur(1px)',
            opacity: 0.8
          }}
        />
      ))}
      
      {/* Ultimate Text with Epic Animation */}
      <div 
        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          animation: 'ultimate-slam 0.8s ease-out forwards'
        }}
      >
        <div className="text-center">
          {/* ULTIMATE Text with Glow */}
          <div 
            className="text-5xl md:text-8xl font-black font-toy mb-2 md:mb-4"
            style={{
              background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B35, #FFD700)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: `
                0 0 40px #FFD700,
                0 0 80px #FFA500,
                0 0 120px #FF6B35,
                0 0 160px #FFD700
              `,
              animation: 'ultimate-text-glow 1.5s ease-in-out infinite, text-gradient-shift 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 30px #FFD700)'
            }}
          >
            ULTIMATE
          </div>
          
          {/* Character Name */}
          <div 
            className="text-3xl md:text-5xl font-bold text-white mb-1 md:mb-2"
            style={{
              textShadow: '0 0 30px rgba(255,255,255,0.9), 0 5px 20px rgba(0,0,0,0.8)',
              animation: 'name-slide-in 0.6s ease-out forwards 0.2s',
              opacity: 0
            }}
          >
            {casterName}
          </div>
          
          {/* Spell Name with Fire Effect */}
          <div 
            className="text-4xl md:text-6xl font-black font-toy"
            style={{
              background: 'linear-gradient(45deg, #FF6B35, #FFD700, #FFA500)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px #FF6B35',
              animation: 'spell-name-impact 0.8s ease-out forwards 0.3s, fire-text 2s ease-in-out infinite',
              opacity: 0,
              filter: 'drop-shadow(0 5px 15px rgba(255, 107, 53, 0.8))'
            }}
          >
            {spellName}
          </div>
        </div>
      </div>
      
      {/* Energy Shockwaves */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {[...Array(5)].map((_, i) => (
          <div
            key={`shockwave-${i}`}
            className="absolute"
            style={{
              width: '100vw',
              height: '100vh',
              left: '-50vw',
              top: '-50vh',
              border: '4px solid',
              borderColor: i % 2 === 0 ? '#FFD700' : '#FF6B35',
              borderRadius: '50%',
              opacity: 0,
              animation: `shockwave-expand 2s ease-out forwards`,
              animationDelay: `${i * 0.15}s`,
              filter: 'blur(2px)'
            }}
          />
        ))}
      </div>
      
      {/* Power Burst Particles */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-4 h-4 rounded-full"
            style={{
              background: i % 2 === 0 ? '#FFD700' : '#FF6B35',
              left: '0',
              top: '0',
              animation: `particle-explode 2s ease-out forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
              filter: 'blur(1px)',
              boxShadow: '0 0 20px currentColor'
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes epic-dark-flash {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes lightning-strike {
          0% {
            opacity: 0;
            transform: scale(0.8) rotate(0deg) translateY(-100vh);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(5deg) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(1.2) rotate(10deg) translateY(100vh);
          }
        }
        
        @keyframes ultimate-slam {
          0% {
            opacity: 0;
            transform: translate(-50%, -200%) scale(3) rotate(-15deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.3) rotate(5deg);
          }
          70% {
            transform: translate(-50%, -45%) scale(0.95) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
        }
        
        @keyframes ultimate-text-glow {
          0%, 100% {
            filter: drop-shadow(0 0 30px #FFD700) brightness(1);
          }
          50% {
            filter: drop-shadow(0 0 60px #FFD700) brightness(1.3);
          }
        }
        
        @keyframes text-gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes name-slide-in {
          0% {
            opacity: 0;
            transform: translateX(-100px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes spell-name-impact {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.5);
          }
          70% {
            transform: translateY(-5px) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fire-text {
          0%, 100% {
            filter: drop-shadow(0 5px 15px rgba(255, 107, 53, 0.8)) hue-rotate(0deg);
          }
          50% {
            filter: drop-shadow(0 8px 25px rgba(255, 215, 0, 1)) hue-rotate(20deg);
          }
        }
        
        @keyframes shockwave-expand {
          0% {
            transform: scale(0);
            opacity: 1;
            border-width: 8px;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
            border-width: 1px;
          }
        }
        
        @keyframes particle-explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(${Math.random() * 200 - 100}px * 5),
              calc(${Math.random() * 200 - 100}px * 5)
            ) scale(0);
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Global styles for screen shake */}
      <style jsx global>{`
        .screen-shake {
          animation: screen-shake 0.8s ease-in-out !important;
        }
        
        @keyframes screen-shake {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          10% {
            transform: translate(-10px, -10px) rotate(-0.5deg);
          }
          20% {
            transform: translate(10px, -5px) rotate(0.5deg);
          }
          30% {
            transform: translate(-8px, 8px) rotate(-0.3deg);
          }
          40% {
            transform: translate(8px, -8px) rotate(0.3deg);
          }
          50% {
            transform: translate(-5px, 5px) rotate(-0.2deg);
          }
          60% {
            transform: translate(5px, -3px) rotate(0.2deg);
          }
          70% {
            transform: translate(-3px, 3px) rotate(-0.1deg);
          }
          80% {
            transform: translate(3px, -2px) rotate(0.1deg);
          }
          90% {
            transform: translate(-2px, 2px) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}

export default UltimateSpellOverlay