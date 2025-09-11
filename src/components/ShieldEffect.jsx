import React from 'react'

const ShieldEffect = ({ isActive, shieldType = 'arcane' }) => {
  if (!isActive) return null
  
  const getShieldStyle = () => {
    switch (shieldType) {
      case 'arcane':
        return {
          gradient: 'from-purple-400 via-blue-500 to-purple-400',
          pulseColor: 'rgba(147, 51, 234, 0.4)',
          glowColor: '#8B5CF6'
        }
      case 'holy':
        return {
          gradient: 'from-yellow-300 via-white to-yellow-300',
          pulseColor: 'rgba(251, 191, 36, 0.4)',
          glowColor: '#FCD34D'
        }
      case 'nature':
        return {
          gradient: 'from-green-400 via-emerald-500 to-green-400',
          pulseColor: 'rgba(34, 197, 94, 0.4)',
          glowColor: '#22C55E'
        }
      case 'energy':
        return {
          gradient: 'from-cyan-400 via-blue-500 to-cyan-400',
          pulseColor: 'rgba(0, 255, 255, 0.4)',
          glowColor: '#00FFFF'
        }
      default:
        return {
          gradient: 'from-blue-400 via-cyan-500 to-blue-400',
          pulseColor: 'rgba(59, 130, 246, 0.4)',
          glowColor: '#3B82F6'
        }
    }
  }
  
  const style = getShieldStyle()
  
  return (
    <>
    <div className="absolute pointer-events-none" 
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '180px',
        height: '180px',
        zIndex: 30
      }}
    >
        {/* Outer Shield Bubble with strong glow */}
        <div 
          className="absolute rounded-full"
          style={{
            left: '-10px',
            right: '-10px',
            top: '-10px',
            bottom: '-10px',
            background: `radial-gradient(circle at center, transparent 35%, ${style.pulseColor} 55%, ${style.pulseColor} 70%, transparent 90%)`,
            animation: 'shieldPulse 3s ease-in-out infinite',
            filter: `drop-shadow(0 0 30px ${style.glowColor}) drop-shadow(0 0 50px ${style.glowColor})`,
            boxShadow: `0 0 60px ${style.glowColor}, inset 0 0 40px ${style.pulseColor}`
          }}
        />
        
        {/* Inner Shield Ring with enhanced visibility */}
        <div 
          className="absolute rounded-full inset-0"
          style={{
            borderColor: style.glowColor,
            borderWidth: '3px',
            borderStyle: 'solid',
            opacity: 0.8,
            animation: 'shieldRotate 4s linear infinite',
            background: `conic-gradient(from 0deg, ${style.glowColor}44, transparent, ${style.glowColor}44, transparent, ${style.glowColor}44)`,
            boxShadow: `0 0 30px ${style.glowColor}, inset 0 0 20px ${style.pulseColor}`
          }}
        />
      
        {/* Hexagonal Pattern */}
        <svg className="absolute inset-0 w-full h-full" style={{ animation: 'shieldRotate 8s linear infinite reverse' }}>
          <defs>
            <pattern id="hexagon" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <polygon 
                points="20,5 35,15 35,25 20,35 5,25 5,15" 
                fill="none" 
                stroke={style.glowColor}
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <circle cx="50%" cy="50%" r="45%" fill="url(#hexagon)" />
        </svg>
        
        {/* Energy Particles - Positioned relative to circle center */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: '10px',
              height: '10px',
              background: style.glowColor,
              borderRadius: '50%',
              left: '50%',
              top: '50%',
              marginLeft: '-5px',
              marginTop: '-5px',
              transform: `rotate(${i * 60}deg) translateX(85px)`,
              transformOrigin: '5px 5px',
              animation: `orbitParticle${i} 3s linear infinite`,
              animationDelay: `${i * 0.5}s`,
              boxShadow: `0 0 20px ${style.glowColor}, 0 0 40px ${style.glowColor}`,
              filter: `brightness(1.5)`
            }}
          />
        ))}
        
        {/* Center Glow */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, ${style.pulseColor} 0%, transparent 50%)`,
            animation: 'centerGlow 2s ease-in-out infinite'
          }}
        />
        
        {/* Shield Icon */}
        <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '-25px' }}>
          <div 
            className="text-2xl"
            style={{
              color: style.glowColor,
              textShadow: `0 0 20px ${style.glowColor}`,
              animation: 'iconFloat 2s ease-in-out infinite'
            }}
          >
            🛡️
          </div>
        </div>
    </div>
      
      <style jsx>{`
        @keyframes shieldPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }
        
        @keyframes shieldRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes orbitParticle0 {
          from {
            transform: rotate(0deg) translateX(85px);
          }
          to {
            transform: rotate(360deg) translateX(85px);
          }
        }
        @keyframes orbitParticle1 {
          from {
            transform: rotate(60deg) translateX(85px);
          }
          to {
            transform: rotate(420deg) translateX(85px);
          }
        }
        @keyframes orbitParticle2 {
          from {
            transform: rotate(120deg) translateX(85px);
          }
          to {
            transform: rotate(480deg) translateX(85px);
          }
        }
        @keyframes orbitParticle3 {
          from {
            transform: rotate(180deg) translateX(85px);
          }
          to {
            transform: rotate(540deg) translateX(85px);
          }
        }
        @keyframes orbitParticle4 {
          from {
            transform: rotate(240deg) translateX(85px);
          }
          to {
            transform: rotate(600deg) translateX(85px);
          }
        }
        @keyframes orbitParticle5 {
          from {
            transform: rotate(300deg) translateX(85px);
          }
          to {
            transform: rotate(660deg) translateX(85px);
          }
        }
        
        @keyframes centerGlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes iconFloat {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-5px);
          }
        }
      `}</style>
    </>
  )
}

export default ShieldEffect