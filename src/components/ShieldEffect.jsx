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
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Outer Shield Bubble */}
      <div 
        className="absolute inset-[-20px] rounded-full"
        style={{
          background: `radial-gradient(circle at center, transparent 40%, ${style.pulseColor} 60%, ${style.pulseColor} 70%, transparent 100%)`,
          animation: 'shieldPulse 3s ease-in-out infinite',
          filter: `drop-shadow(0 0 30px ${style.glowColor})`
        }}
      />
      
      {/* Inner Shield Ring */}
      <div 
        className={`absolute inset-[-15px] rounded-full border-2 bg-gradient-to-r ${style.gradient}`}
        style={{
          borderColor: style.glowColor,
          opacity: 0.6,
          animation: 'shieldRotate 4s linear infinite',
          background: `conic-gradient(from 0deg, ${style.glowColor}22, transparent, ${style.glowColor}22, transparent, ${style.glowColor}22)`
        }}
      />
      
      {/* Hexagonal Pattern */}
      <svg className="absolute inset-[-20px] w-full h-full" style={{ animation: 'shieldRotate 8s linear infinite reverse' }}>
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
      
      {/* Energy Particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: '4px',
            height: '4px',
            background: style.glowColor,
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: `rotate(${i * 60}deg) translateX(60px)`,
            animation: `orbitParticle 3s linear infinite`,
            animationDelay: `${i * 0.5}s`,
            boxShadow: `0 0 10px ${style.glowColor}`
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
      <div className="absolute top-[-30px] left-1/2 transform -translate-x-1/2">
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
        
        @keyframes orbitParticle {
          from {
            transform: rotate(var(--rotation)) translateX(60px) scale(1);
            opacity: 1;
          }
          to {
            transform: rotate(calc(var(--rotation) + 360deg)) translateX(60px) scale(1);
            opacity: 1;
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
    </div>
  )
}

export default ShieldEffect