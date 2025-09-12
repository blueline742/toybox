import React from 'react'

const ActiveCharacterGlow = ({ isActive, teamColor = 'blue' }) => {
  if (!isActive) return null
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  
  const colorScheme = teamColor === 'blue' 
    ? {
        primary: '#00ffff',
        secondary: '#00ddff',
        glow: '0 0 40px #00ffff, 0 0 80px #0099ff, 0 0 120px #0066ff',
        mobileGlow: '0 0 20px #00ffff, 0 0 40px #0099ff',
        bgGlow: 'rgba(0, 255, 255, 0.4)'
      }
    : {
        primary: '#ff6600',
        secondary: '#ff9900',
        glow: '0 0 40px #ff6600, 0 0 80px #ff3300, 0 0 120px #ff0000',
        mobileGlow: '0 0 20px #ff6600, 0 0 40px #ff3300',
        bgGlow: 'rgba(255, 102, 0, 0.4)'
      }
  
  return (
    <>
      {/* Bright Background Glow - Adjusted for mobile */}
      <div 
        className={`absolute ${isMobile ? '-inset-2' : '-inset-8'} rounded-3xl pointer-events-none animate-pulse`}
        style={{
          background: `radial-gradient(circle, ${colorScheme.bgGlow} 0%, transparent 70%)`,
          filter: isMobile ? 'blur(10px)' : 'blur(20px)',
          animation: 'glow-pulse 1.5s ease-in-out infinite'
        }}
      />
      
      {/* Intense Border Glow - Adjusted for mobile */}
      <div 
        className={`absolute ${isMobile ? '-inset-0.5' : '-inset-2'} rounded-xl pointer-events-none`}
        style={{
          boxShadow: isMobile ? colorScheme.mobileGlow : colorScheme.glow,
          animation: 'glow-pulse 1.5s ease-in-out infinite'
        }}
      />
      
      {/* Bright Animated Border */}
      <div className="absolute -inset-0.5 rounded-xl pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, 
              transparent, 
              ${colorScheme.primary}, 
              ${colorScheme.secondary}, 
              ${colorScheme.primary}, 
              transparent)`,
            animation: 'border-slide 2s linear infinite'
          }}
        />
      </div>
      
      {/* Inner Card Border */}
      <div 
        className="absolute inset-0 rounded-lg md:rounded-xl pointer-events-none"
        style={{
          border: `3px solid ${colorScheme.primary}`,
          boxShadow: `inset 0 0 20px ${colorScheme.bgGlow}`,
          animation: 'border-pulse 1s ease-in-out infinite'
        }}
      />
      
      {/* Corner Accents */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left Corner */}
        <div 
          className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 rounded-tl-lg"
          style={{
            borderColor: colorScheme.secondary,
            filter: `drop-shadow(0 0 10px ${colorScheme.primary})`,
            animation: 'corner-flash 1.5s ease-in-out infinite'
          }}
        />
        {/* Top Right Corner */}
        <div 
          className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 rounded-tr-lg"
          style={{
            borderColor: colorScheme.secondary,
            filter: `drop-shadow(0 0 10px ${colorScheme.primary})`,
            animation: 'corner-flash 1.5s ease-in-out infinite 0.375s'
          }}
        />
        {/* Bottom Left Corner */}
        <div 
          className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 rounded-bl-lg"
          style={{
            borderColor: colorScheme.secondary,
            filter: `drop-shadow(0 0 10px ${colorScheme.primary})`,
            animation: 'corner-flash 1.5s ease-in-out infinite 0.75s'
          }}
        />
        {/* Bottom Right Corner */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 rounded-br-lg"
          style={{
            borderColor: colorScheme.secondary,
            filter: `drop-shadow(0 0 10px ${colorScheme.primary})`,
            animation: 'corner-flash 1.5s ease-in-out infinite 1.125s'
          }}
        />
      </div>
      
      {/* Light Rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {[...Array(4)].map((_, i) => (
          <div
            key={`ray-${i}`}
            className="absolute top-1/2 left-1/2 w-full h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${colorScheme.primary}, transparent)`,
              transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
              opacity: 0.6,
              animation: `light-ray ${2 + i * 0.2}s ease-in-out infinite`
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes border-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes border-pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes corner-flash {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes light-ray {
          0%, 100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--rotation)) scaleX(0);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) rotate(var(--rotation)) scaleX(1);
          }
        }
      `}</style>
    </>
  )
}

export default ActiveCharacterGlow