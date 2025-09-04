import React, { useState } from 'react'

const BuffIndicator = ({ 
  characterId, 
  shields, 
  damageBuff, 
  criticalBuff, 
  frozen, 
  debuffed 
}) => {
  const [hoveredBuff, setHoveredBuff] = useState(null)
  const buffs = []
  
  // Collect all active buffs/debuffs
  if (shields && shields.amount > 0) {
    buffs.push({
      id: 'shield',
      icon: '🛡️',
      color: 'bg-blue-500',
      borderColor: 'border-blue-400',
      glowColor: 'rgba(59, 130, 246, 0.5)',
      tooltip: `Shield: ${shields.amount} damage`,
      value: shields.amount
    })
  }
  
  if (damageBuff && damageBuff.amount > 0) {
    buffs.push({
      id: 'damage',
      icon: '⚔️',
      color: 'bg-orange-500',
      borderColor: 'border-orange-400',
      glowColor: 'rgba(251, 146, 60, 0.5)',
      tooltip: `Attack Buff: +${damageBuff.amount} damage`,
      value: `+${damageBuff.amount}`
    })
  }
  
  if (criticalBuff && criticalBuff.boost > 0) {
    buffs.push({
      id: 'critical',
      icon: '💥',
      color: 'bg-red-500',
      borderColor: 'border-red-400',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      tooltip: `Critical Buff: +${Math.round(criticalBuff.boost * 100)}% crit chance`,
      value: `+${Math.round(criticalBuff.boost * 100)}%`,
      permanent: criticalBuff.permanent
    })
  }
  
  if (frozen) {
    buffs.push({
      id: 'frozen',
      icon: '❄️',
      color: 'bg-cyan-500',
      borderColor: 'border-cyan-400',
      glowColor: 'rgba(6, 182, 212, 0.5)',
      tooltip: 'Frozen: Skip next turn',
      isDebuff: true
    })
  }
  
  if (debuffed && debuffed.type === 'accuracy') {
    buffs.push({
      id: 'accuracy_debuff',
      icon: '👁️',
      color: 'bg-purple-500',
      borderColor: 'border-purple-400',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      tooltip: 'Accuracy Debuff: Reduced hit chance',
      isDebuff: true
    })
  }
  
  if (buffs.length === 0) return null
  
  return (
    <div className="absolute -top-2 -right-2 flex gap-1 z-20">
      {buffs.map((buff, index) => (
        <div
          key={buff.id}
          className="relative"
          onMouseEnter={() => setHoveredBuff(buff.id)}
          onMouseLeave={() => setHoveredBuff(null)}
          style={{
            animation: `float-buff ${2 + index * 0.2}s ease-in-out infinite`,
            animationDelay: `${index * 0.1}s`
          }}
        >
          {/* Buff Icon Container */}
          <div 
            className={`
              relative w-8 h-8 rounded-full flex items-center justify-center
              ${buff.color} ${buff.borderColor} border-2
              ${buff.isDebuff ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
              ${buff.permanent ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
              transition-all duration-200 hover:scale-110
            `}
            style={{
              boxShadow: `0 0 15px ${buff.glowColor}, 0 2px 8px rgba(0,0,0,0.3)`,
              background: buff.isDebuff 
                ? `linear-gradient(135deg, rgba(0,0,0,0.3), transparent), var(--tw-gradient-from)`
                : buff.permanent
                ? `linear-gradient(135deg, rgba(255,215,0,0.3), transparent), var(--tw-gradient-from)`
                : undefined
            }}
          >
            <span className="text-sm" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
              {buff.icon}
            </span>
            
            {/* Value Display (for shields and buffs with values) */}
            {buff.value && (
              <div 
                className="absolute -bottom-1 -right-1 bg-black bg-opacity-80 rounded-full px-1 text-white"
                style={{ fontSize: '9px', minWidth: '18px', textAlign: 'center' }}
              >
                {buff.value}
              </div>
            )}
            
            {/* Permanent Indicator */}
            {buff.permanent && (
              <div className="absolute -top-1 -left-1">
                <div 
                  className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
                  style={{ boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}
                />
              </div>
            )}
          </div>
          
          {/* Tooltip */}
          {hoveredBuff === buff.id && (
            <div 
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                         bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap
                         pointer-events-none z-50"
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: `1px solid ${buff.glowColor}`,
                minWidth: '120px',
                textAlign: 'center'
              }}
            >
              <div className="font-bold mb-0.5">{buff.tooltip}</div>
              {buff.permanent && (
                <div className="text-yellow-400 text-[10px]">Permanent</div>
              )}
              {/* Arrow pointing down */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `4px solid ${buff.glowColor}`,
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes float-buff {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  )
}

export default BuffIndicator