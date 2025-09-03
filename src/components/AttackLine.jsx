import React, { useEffect, useState } from 'react'

const AttackLine = ({ casterPosition, targetPositions, isActive }) => {
  const [lines, setLines] = useState([])
  
  useEffect(() => {
    if (!casterPosition || !targetPositions || targetPositions.length === 0 || !isActive) {
      setLines([])
      return
    }
    
    // Calculate lines from caster to each target
    const newLines = targetPositions.map((target, index) => {
      const dx = target.x - casterPosition.x
      const dy = target.y - casterPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      
      return {
        id: index,
        x: casterPosition.x,
        y: casterPosition.y,
        width: distance,
        angle: angle,
        targetX: target.x,
        targetY: target.y
      }
    })
    
    setLines(newLines)
  }, [casterPosition, targetPositions, isActive])
  
  if (!isActive || lines.length === 0) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {lines.map((line) => (
        <React.Fragment key={line.id}>
          {/* Attack Line */}
          <div
            className="absolute bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 opacity-80"
            style={{
              left: `${line.x}px`,
              top: `${line.y}px`,
              width: `${line.width}px`,
              height: '3px',
              transform: `rotate(${line.angle}deg)`,
              transformOrigin: '0 50%',
              animation: 'pulse 0.5s ease-in-out infinite',
              boxShadow: '0 0 10px rgba(255, 100, 0, 0.8)'
            }}
          />
          
          {/* Energy particles along the line */}
          <div
            className="absolute"
            style={{
              left: `${line.x}px`,
              top: `${line.y}px`,
              width: `${line.width}px`,
              height: '20px',
              transform: `rotate(${line.angle}deg)`,
              transformOrigin: '0 50%',
            }}
          >
            <div 
              className="w-4 h-4 bg-yellow-300 rounded-full absolute"
              style={{
                animation: `slide-along ${0.5}s linear infinite`,
                boxShadow: '0 0 10px yellow'
              }}
            />
          </div>
          
          {/* Target Indicator */}
          <div
            className="absolute"
            style={{
              left: `${line.targetX - 30}px`,
              top: `${line.targetY - 30}px`,
              width: '60px',
              height: '60px',
              animation: 'spin 2s linear infinite'
            }}
          >
            <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-yellow-400 rounded-full animate-pulse" />
            <div className="absolute inset-4 border border-white rounded-full" />
          </div>
        </React.Fragment>
      ))}
      
      <style jsx>{`
        @keyframes slide-along {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default AttackLine