import React, { useEffect, useState } from 'react'

const HugAnimation = ({ attacker, target, onComplete }) => {
  const [phase, setPhase] = useState('pulling') // pulling, hugging, releasing
  
  useEffect(() => {
    if (!attacker || !target) return
    
    // Start animation phases
    const timer1 = setTimeout(() => {
      setPhase('hugging')
    }, 800)
    
    const timer2 = setTimeout(() => {
      setPhase('releasing')
    }, 1600)
    
    const timer3 = setTimeout(() => {
      onComplete()
    }, 2400)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [attacker, target, onComplete])
  
  if (!attacker || !target) return null
  
  // Calculate middle point
  const midX = (attacker.position.x + target.position.x) / 2
  const midY = (attacker.position.y + target.position.y) / 2
  
  // Calculate animated positions based on phase
  let attackerX = attacker.position.x
  let attackerY = attacker.position.y
  let targetX = target.position.x
  let targetY = target.position.y
  
  if (phase === 'hugging') {
    // Both move to middle
    attackerX = midX - 30
    attackerY = midY
    targetX = midX + 30
    targetY = midY
  } else if (phase === 'releasing') {
    // Return to original positions
    attackerX = attacker.position.x
    attackerY = attacker.position.y
    targetX = target.position.x
    targetY = target.position.y
  }
  
  return (
    <>
      {/* Animated Attacker */}
      <div
        className="absolute transition-all duration-700 z-50"
        style={{
          left: `${attackerX}px`,
          top: `${attackerY}px`,
          transform: `translate(-50%, -50%) ${phase === 'hugging' ? 'scale(1.2)' : 'scale(1)'}`
        }}
      >
        <div 
          className="text-7xl"
          style={{ color: attacker.color }}
        >
          {attacker.emoji}
        </div>
      </div>
      
      {/* Animated Target */}
      <div
        className="absolute transition-all duration-700 z-50"
        style={{
          left: `${targetX}px`,
          top: `${targetY}px`,
          transform: `translate(-50%, -50%) ${phase === 'hugging' ? 'scale(0.9)' : 'scale(1)'}`
        }}
      >
        <div 
          className="text-7xl"
          style={{ color: target.color }}
        >
          {target.emoji}
        </div>
      </div>
      
      {/* Hug effect overlay */}
      {phase === 'hugging' && (
        <div
          className="absolute z-40 animate-pulse"
          style={{
            left: `${midX}px`,
            top: `${midY}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="text-8xl animate-bounce">
            💖
          </div>
        </div>
      )}
    </>
  )
}

export default HugAnimation