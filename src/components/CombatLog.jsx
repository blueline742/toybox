import React, { useEffect, useState } from 'react'

const CombatLog = ({ entries = [] }) => {
  const [currentEntry, setCurrentEntry] = useState(null)
  
  useEffect(() => {
    // Show only the latest entry
    if (entries.length > 0) {
      const latestEntry = entries[entries.length - 1]
      if (!currentEntry || currentEntry.id !== latestEntry.id) {
        setCurrentEntry({
          ...latestEntry,
          addedAt: Date.now()
        })
      }
    }
  }, [entries])
  
  // Remove entry after 3 seconds
  useEffect(() => {
    if (currentEntry) {
      const timer = setTimeout(() => {
        setCurrentEntry(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [currentEntry])
  
  const getActionIcon = (type) => {
    switch(type) {
      case 'damage': return '⚔️'
      case 'heal': return '💚'
      case 'shield': return '🛡️'
      case 'buff': return '✨'
      case 'multi_damage': return '💥'
      case 'damage_all': return '🌪️'
      case 'heal_all': return '🌟'
      default: return '⚡'
    }
  }
  
  const getActionColor = (type) => {
    switch(type) {
      case 'damage':
      case 'multi_damage':
      case 'damage_all':
        return 'from-red-500 to-orange-500'
      case 'heal':
      case 'heal_all':
        return 'from-green-500 to-emerald-500'
      case 'shield':
        return 'from-blue-500 to-cyan-500'
      case 'buff':
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-yellow-500 to-amber-500'
    }
  }
  
  if (!currentEntry) return null
  
  const age = Date.now() - currentEntry.addedAt
  const opacity = age > 2000 ? Math.max(0, 1 - (age - 2000) / 1000) : 1
  
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div
        className="flex items-center justify-center"
        style={{
          animation: 'slide-in 0.5s ease-out',
          opacity: opacity,
          transition: 'opacity 0.5s ease-out'
        }}
      >
        <div className="bg-black/70 backdrop-blur-md rounded-full px-4 md:px-6 py-2 md:py-3 border border-white/30 shadow-2xl">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Caster Portrait */}
            <div className={`
              w-10 h-10 md:w-12 md:h-12 rounded-full 
              bg-gradient-to-br ${currentEntry.casterTeam === 'player' ? 'from-blue-500 to-cyan-500' : 'from-red-500 to-orange-500'}
              p-0.5 animate-pulse shadow-lg
            `}>
              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-base md:text-lg">{currentEntry.casterEmoji}</span>
              </div>
            </div>
            
            {/* Action Icon & Arrow */}
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-lg md:text-xl animate-bounce">
                {getActionIcon(currentEntry.actionType)}
              </span>
              <div className={`
                text-xs md:text-sm font-bold text-white
                bg-gradient-to-r ${getActionColor(currentEntry.actionType)}
                bg-clip-text text-transparent
              `}>
                {currentEntry.abilityName}
              </div>
              {currentEntry.targets && currentEntry.targets.length > 0 && (
                <>
                  <span className="text-white/70 text-base md:text-lg">→</span>
                </>
              )}
            </div>
            
            {/* Target(s) */}
            {currentEntry.targets && currentEntry.targets.length > 0 && (
              <div className="flex items-center gap-1">
                {currentEntry.targets.slice(0, 3).map((target, idx) => (
                  <div key={idx} className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-full 
                    bg-gradient-to-br ${target.team === 'player' ? 'from-blue-500 to-cyan-500' : 'from-red-500 to-orange-500'}
                    p-0.5 shadow-lg
                    ${currentEntry.actionType.includes('damage') ? 'animate-shake' : 'animate-pulse'}
                  `}>
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-base md:text-lg">{target.emoji}</span>
                    </div>
                  </div>
                ))}
                {currentEntry.targets.length > 3 && (
                  <div className="text-xs text-white/60">
                    +{currentEntry.targets.length - 3}
                  </div>
                )}
              </div>
            )}
            
            {/* Damage/Heal Amount */}
            {currentEntry.value && (
              <div className={`
                text-base md:text-lg font-bold
                ${currentEntry.actionType.includes('damage') ? 'text-red-400' : 
                  currentEntry.actionType.includes('heal') ? 'text-green-400' : 'text-yellow-400'}
              `}>
                {currentEntry.actionType.includes('damage') ? '-' : '+'}
                {currentEntry.value}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-in {
          0% {
            transform: translateY(-30px) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default CombatLog