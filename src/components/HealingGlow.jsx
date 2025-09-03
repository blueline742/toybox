import React from 'react'

const HealingGlow = ({ isActive, targetId }) => {
  if (!isActive) return null
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Soft Green Glow */}
      <div 
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.4) 0%, rgba(0, 255, 136, 0.2) 50%, transparent 70%)',
          animation: 'healPulse 2s ease-in-out infinite',
          filter: 'blur(20px)'
        }}
      />
      
      {/* Inner Healing Light */}
      <div 
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3) 0%, transparent 60%)',
          animation: 'healPulse 2s ease-in-out infinite',
          animationDelay: '0.5s'
        }}
      />
      
      {/* Healing Sparkles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: '4px',
            height: '4px',
            background: '#00FF88',
            borderRadius: '50%',
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            boxShadow: '0 0 10px #00FF88',
            animation: `floatUp ${2 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
      
      {/* Healing Cross */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div 
          className="text-6xl text-green-400 font-bold opacity-60"
          style={{
            textShadow: '0 0 30px #00FF88',
            animation: 'healCross 2s ease-in-out infinite'
          }}
        >
          +
        </div>
      </div>
      
      <style jsx>{`
        @keyframes healPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(-30px) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes healCross {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.8) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

export default HealingGlow