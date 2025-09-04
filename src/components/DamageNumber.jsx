import React, { useEffect, useState } from 'react'

const DamageNumber = ({ number, index = 0 }) => {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 2500)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (!visible) return null
  
  const isCrit = number.isCritical
  const isDamage = number.type === 'damage'
  const isHeal = number.type === 'heal'
  
  // Different styles for different types
  const getNumberStyle = () => {
    if (isCrit) {
      return {
        fontSize: '3.5rem',
        color: '#FFD700',
        textShadow: `
          0 0 20px #FFD700,
          0 0 40px #FFA500,
          0 0 60px #FF6347,
          2px 2px 4px rgba(0,0,0,1),
          -2px -2px 4px rgba(0,0,0,1),
          2px -2px 4px rgba(0,0,0,1),
          -2px 2px 4px rgba(0,0,0,1)
        `,
        fontWeight: '900',
        letterSpacing: '2px'
      }
    } else if (isDamage) {
      return {
        fontSize: '2.5rem',
        color: '#FF4444',
        textShadow: `
          0 0 10px #FF0000,
          0 0 20px #CC0000,
          2px 2px 3px rgba(0,0,0,1),
          -2px -2px 3px rgba(0,0,0,1),
          2px -2px 3px rgba(0,0,0,1),
          -2px 2px 3px rgba(0,0,0,1)
        `,
        fontWeight: '800'
      }
    } else {
      return {
        fontSize: '2.5rem',
        color: '#44FF44',
        textShadow: `
          0 0 10px #00FF00,
          0 0 20px #00CC00,
          2px 2px 3px rgba(0,0,0,1),
          -2px -2px 3px rgba(0,0,0,1),
          2px -2px 3px rgba(0,0,0,1),
          -2px 2px 3px rgba(0,0,0,1)
        `,
        fontWeight: '800'
      }
    }
  }
  
  const style = getNumberStyle()
  
  // Stagger animation for multiple numbers
  const animationDelay = `${index * 100}ms`
  
  // Random horizontal offset to prevent overlap
  const xOffset = (index % 3 - 1) * 40
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: '-60px',
        left: '50%',
        transform: `translateX(calc(-50% + ${xOffset}px))`,
        zIndex: 9999,
        animation: `epicDamageFloat 2.5s ease-out forwards`,
        animationDelay
      }}
    >
      {/* Background glow effect */}
      {isCrit && (
        <div 
          className="absolute inset-0 blur-xl"
          style={{
            background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)',
            transform: 'scale(2)',
            opacity: 0.6,
            animation: 'critPulse 0.5s ease-out'
          }}
        />
      )}
      
      {/* Main number */}
      <div
        style={{
          ...style,
          position: 'relative',
          fontFamily: 'Impact, sans-serif',
          transform: isCrit ? 'scale(1)' : 'scale(1)',
          animation: isCrit ? 'critBounce 0.5s ease-out' : 'numberPop 0.3s ease-out'
        }}
      >
        {isDamage && '-'}{number.amount}
        {isCrit && (
          <span 
            style={{
              display: 'block',
              fontSize: '1.2rem',
              color: '#FFAA00',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              marginTop: '-10px',
              animation: 'critTextGlow 0.5s ease-out infinite alternate'
            }}
          >
            CRITICAL!
          </span>
        )}
      </div>
      
      {/* Extra particles for critical hits */}
      {isCrit && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '6px',
                height: '6px',
                background: '#FFD700',
                borderRadius: '50%',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animation: `critSpark 0.8s ease-out forwards`,
                animationDelay: `${i * 50}ms`,
                '--angle': `${i * 60}deg`
              }}
            />
          ))}
        </>
      )}
      
      <style jsx>{`
        @keyframes epicDamageFloat {
          0% {
            opacity: 0;
            transform: translateX(calc(-50% + ${xOffset}px)) translateY(20px) scale(0.5);
          }
          15% {
            opacity: 1;
            transform: translateX(calc(-50% + ${xOffset}px)) translateY(-10px) scale(1.2);
          }
          30% {
            transform: translateX(calc(-50% + ${xOffset}px)) translateY(-30px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(calc(-50% + ${xOffset}px)) translateY(-120px) scale(0.8);
          }
        }
        
        @keyframes critBounce {
          0% {
            transform: scale(0) rotate(-10deg);
          }
          50% {
            transform: scale(1.3) rotate(5deg);
          }
          75% {
            transform: scale(0.95) rotate(-2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes numberPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes critPulse {
          0% {
            transform: scale(2);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        @keyframes critTextGlow {
          0% {
            textShadow: 0 0 10px #FFAA00, 0 0 20px #FF6600;
          }
          100% {
            textShadow: 0 0 20px #FFAA00, 0 0 30px #FF6600, 0 0 40px #FF3300;
          }
        }
        
        @keyframes critSpark {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(0deg) translateX(0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(60px);
          }
        }
      `}</style>
    </div>
  )
}

export default DamageNumber