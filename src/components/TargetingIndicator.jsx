import React from 'react'

const TargetingIndicator = ({ isActive, isDamage = true }) => {
  if (!isActive) return null
  
  const color = isDamage ? '#FF4444' : '#00FF88'
  const pulseColor = isDamage ? 'rgba(255, 68, 68, 0.4)' : 'rgba(0, 255, 136, 0.4)'
  
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Targeting Reticle */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer Ring */}
        <div 
          className="absolute"
          style={{
            width: '180px',
            height: '180px',
            border: `3px solid ${color}`,
            borderRadius: '50%',
            animation: 'targetPulse 1s ease-in-out infinite',
            boxShadow: `0 0 30px ${color}`
          }}
        />
        
        {/* Inner Ring */}
        <div 
          className="absolute"
          style={{
            width: '120px',
            height: '120px',
            border: `2px solid ${color}`,
            borderRadius: '50%',
            animation: 'targetRotate 2s linear infinite',
            opacity: 0.8
          }}
        />
        
        {/* Crosshair Lines */}
        <div className="absolute flex items-center justify-center">
          <div 
            className="absolute"
            style={{
              width: '200px',
              height: '2px',
              background: `linear-gradient(90deg, transparent 30%, ${color} 45%, ${color} 55%, transparent 70%)`,
              boxShadow: `0 0 10px ${color}`
            }}
          />
          <div 
            className="absolute"
            style={{
              width: '2px',
              height: '200px',
              background: `linear-gradient(180deg, transparent 30%, ${color} 45%, ${color} 55%, transparent 70%)`,
              boxShadow: `0 0 10px ${color}`
            }}
          />
        </div>
        
        {/* Corner Brackets */}
        {[0, 90, 180, 270].map(rotation => (
          <div
            key={rotation}
            className="absolute"
            style={{
              width: '60px',
              height: '60px',
              transform: `rotate(${rotation}deg)`,
              animation: 'bracketPulse 1.5s ease-in-out infinite'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '20px',
                height: '3px',
                background: color,
                boxShadow: `0 0 10px ${color}`
              }}
            />
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '3px',
                height: '20px',
                background: color,
                boxShadow: `0 0 10px ${color}`
              }}
            />
          </div>
        ))}
        
        {/* Center Dot */}
        <div 
          className="absolute"
          style={{
            width: '10px',
            height: '10px',
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 20px ${color}`,
            animation: 'centerPulse 0.5s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Danger/Heal Text */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div 
          className="text-xl font-bold uppercase tracking-wider"
          style={{
            color: color,
            textShadow: `0 0 20px ${color}`,
            animation: 'textFlash 0.5s ease-in-out infinite'
          }}
        >
          {isDamage ? 'TARGETED' : 'HEALING'}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes targetPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        
        @keyframes targetRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bracketPulse {
          0%, 100% {
            transform: rotate(var(--rotation)) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: rotate(var(--rotation)) scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes centerPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.5);
          }
        }
        
        @keyframes textFlash {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default TargetingIndicator