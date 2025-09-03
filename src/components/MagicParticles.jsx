import React, { useEffect, useState } from 'react'

const MagicParticles = ({ type = 'magic', intensity = 'normal', color = '#FFD700' }) => {
  const [particles, setParticles] = useState([])
  
  useEffect(() => {
    const particleCount = intensity === 'high' ? 50 : intensity === 'normal' ? 30 : 15
    const initialParticles = []
    
    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: Math.random(),
        pulse: Math.random() * Math.PI * 2,
        type: type
      })
    }
    
    setParticles(initialParticles)
  }, [type, intensity])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => {
          let newX = particle.x + particle.speedX
          let newY = particle.y + particle.speedY
          let newPulse = particle.pulse + 0.05
          
          // Wrap around screen
          if (newX < 0) newX = window.innerWidth
          if (newX > window.innerWidth) newX = 0
          if (newY < 0) newY = window.innerHeight
          if (newY > window.innerHeight) newY = 0
          
          return {
            ...particle,
            x: newX,
            y: newY,
            pulse: newPulse,
            opacity: (Math.sin(newPulse) + 1) / 2
          }
        })
      )
    }, 30)
    
    return () => clearInterval(interval)
  }, [])
  
  const getParticleStyle = (particle) => {
    switch (type) {
      case 'fire':
        return {
          background: `radial-gradient(circle, #FF6B35 0%, #FF3333 50%, transparent 70%)`,
          boxShadow: `0 0 ${particle.size * 2}px #FF6B35`
        }
      case 'ice':
        return {
          background: `radial-gradient(circle, #00D4FF 0%, #0099CC 50%, transparent 70%)`,
          boxShadow: `0 0 ${particle.size * 2}px #00D4FF`
        }
      case 'nature':
        return {
          background: `radial-gradient(circle, #00FF88 0%, #00CC44 50%, transparent 70%)`,
          boxShadow: `0 0 ${particle.size * 2}px #00FF88`
        }
      case 'dark':
        return {
          background: `radial-gradient(circle, #8B00FF 0%, #4B0082 50%, transparent 70%)`,
          boxShadow: `0 0 ${particle.size * 2}px #8B00FF`
        }
      case 'holy':
        return {
          background: `radial-gradient(circle, #FFFFAA 0%, #FFD700 50%, transparent 70%)`,
          boxShadow: `0 0 ${particle.size * 2}px #FFFFAA`
        }
      default:
        return {
          background: `radial-gradient(circle, ${color} 0%, ${color}88 50%, transparent 70%)`,
          boxShadow: `0 0 ${particle.size * 2}px ${color}`
        }
    }
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity * 0.7,
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(particle.pulse) * 0.2})`,
            ...getParticleStyle(particle)
          }}
        >
          {/* Inner glow */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'white',
              opacity: 0.5,
              transform: 'scale(0.3)'
            }}
          />
        </div>
      ))}
      
      {/* Ambient Glow Effect */}
      {intensity === 'high' && (
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${color}11 0%, transparent 60%)`,
            animation: 'ambient-pulse 4s ease-in-out infinite'
          }}
        />
      )}
      
      <style jsx>{`
        @keyframes ambient-pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  )
}

export default MagicParticles