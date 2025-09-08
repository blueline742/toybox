import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

const GameOverScreen = ({ 
  winner, 
  battleStats = {}, 
  onContinue, 
  playerTeam = [], 
  enemyTeam = [],
  betAmount = 0,
  isPvP = false
}) => {
  const [showStats, setShowStats] = useState(false)
  const [animatingRewards, setAnimatingRewards] = useState(false)
  const isVictory = winner === 'player'
  
  // Calculate rewards
  const winAmount = betAmount * 1.8 // 90% after 10% burn
  
  useEffect(() => {
    // Victory confetti
    if (isVictory) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        
        if (timeLeft <= 0) {
          return clearInterval(interval)
        }
        
        const particleCount = 50 * (timeLeft / duration)
        
        // Shoot confetti from sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        })
      }, 250)
      
      return () => clearInterval(interval)
    }
  }, [isVictory])
  
  useEffect(() => {
    // Show stats after initial animation
    const timer = setTimeout(() => {
      setShowStats(true)
      if (betAmount > 0) {
        setTimeout(() => setAnimatingRewards(true), 500)
      }
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [betAmount])
  
  // Find MVP (Most Valuable Player)
  const getMVP = () => {
    if (!battleStats || !battleStats.damageDealt) return null
    
    let mvp = null
    let maxDamage = 0
    
    Object.entries(battleStats.damageDealt || {}).forEach(([characterId, damage]) => {
      if (damage > maxDamage) {
        maxDamage = damage
        const character = [...playerTeam, ...enemyTeam].find(c => c.id === characterId)
        if (character) {
          mvp = { character, damage }
        }
      }
    })
    
    return mvp
  }
  
  const mvp = getMVP()
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative max-w-4xl w-full mx-4"
        >
          {/* Main Container */}
          <div className={`
            relative rounded-3xl overflow-hidden
            ${isVictory 
              ? 'bg-gradient-to-br from-yellow-900/90 via-amber-800/90 to-orange-900/90'
              : 'bg-gradient-to-br from-gray-900/90 via-red-950/90 to-black/90'
            }
            border-2 ${isVictory ? 'border-yellow-400' : 'border-red-600'}
            shadow-2xl
          `}
          style={{
            boxShadow: isVictory 
              ? '0 0 100px rgba(255, 215, 0, 0.5), 0 0 200px rgba(255, 215, 0, 0.2)'
              : '0 0 100px rgba(220, 38, 38, 0.5), 0 0 200px rgba(220, 38, 38, 0.2)'
          }}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className={`absolute inset-0 ${isVictory ? 'bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600' : 'bg-gradient-to-r from-red-600 via-purple-600 to-red-600'} animate-gradient-shift`} />
            </div>
            
            {/* Victory/Defeat Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative pt-8 pb-4 text-center"
            >
              <motion.h1
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: isVictory ? [0, 5, -5, 0] : [0, -2, 2, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`
                  text-6xl md:text-8xl font-black font-toy tracking-wider
                  ${isVictory 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600'
                  }
                `}
                style={{
                  textShadow: isVictory
                    ? '0 0 40px rgba(255, 215, 0, 0.8), 0 10px 20px rgba(0,0,0,0.5)'
                    : '0 0 40px rgba(220, 38, 38, 0.8), 0 10px 20px rgba(0,0,0,0.5)'
                }}
              >
                {isVictory ? 'VICTORY!' : 'DEFEAT'}
              </motion.h1>
              
              {isPvP && (
                <p className="text-white/80 text-lg mt-2">
                  {isVictory ? 'You dominated the battlefield!' : 'Better luck next time!'}
                </p>
              )}
            </motion.div>
            
            {/* Battle Statistics */}
            <AnimatePresence>
              {showStats && battleStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="px-6 pb-4"
                >
                  {/* MVP Section */}
                  {mvp && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-5xl animate-pulse">🏆</div>
                          <div>
                            <p className="text-yellow-400 font-bold text-sm">MVP</p>
                            <p className="text-white text-xl font-bold">{mvp.character.name}</p>
                            <p className="text-orange-400 text-sm">{mvp.damage} Total Damage</p>
                          </div>
                        </div>
                        <div className="text-6xl">
                          {mvp.character.emoji}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Battle Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Total Damage */}
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-red-900/30 to-orange-900/30 p-4 rounded-xl border border-red-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">⚔️</div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase">Total Damage</p>
                          <p className="text-white text-2xl font-bold">
                            {battleStats.totalDamage || 0}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Ultimates Used */}
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-4 rounded-xl border border-purple-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">💥</div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase">Ultimates</p>
                          <p className="text-white text-2xl font-bold">
                            {battleStats.ultimatesUsed || 0}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Battle Duration */}
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-4 rounded-xl border border-blue-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">⏱️</div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase">Rounds</p>
                          <p className="text-white text-2xl font-bold">
                            {battleStats.rounds || 0}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Character Performance */}
                  {playerTeam && playerTeam.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mb-6"
                  >
                    <h3 className="text-white font-bold text-lg mb-3">Battle Performance</h3>
                    <div className="space-y-2">
                      {playerTeam.map((character, idx) => {
                        const damage = battleStats.damageDealt?.[character.id] || 0
                        const healing = battleStats.healingDone?.[character.id] || 0
                        const kills = battleStats.kills?.[character.id] || 0
                        const maxDamage = Math.max(...Object.values(battleStats.damageDealt || {}), 1)
                        
                        return (
                          <motion.div
                            key={character.id}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8 + idx * 0.1 }}
                            className="bg-black/30 rounded-lg p-3 border border-gray-700/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{character.emoji}</div>
                                <div>
                                  <p className="text-white font-bold text-sm">{character.name}</p>
                                  <div className="flex gap-4 text-xs">
                                    <span className="text-red-400">⚔️ {damage}</span>
                                    {healing > 0 && <span className="text-green-400">💚 {healing}</span>}
                                    {kills > 0 && <span className="text-yellow-400">💀 {kills}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Damage Bar */}
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(damage / maxDamage) * 100}%` }}
                                transition={{ delay: 1 + idx * 0.1, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                  )}
                  
                  {/* Rewards Section */}
                  {betAmount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.5, type: "spring" }}
                      className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30"
                    >
                      <h3 className="text-white font-bold text-lg mb-4 text-center">
                        {isVictory ? '💰 REWARDS 💰' : '💸 LOSSES 💸'}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bet Amount */}
                        <div className="text-center">
                          <p className="text-gray-400 text-sm">Bet Amount</p>
                          <p className="text-white text-2xl font-bold">{betAmount} SOL</p>
                        </div>
                        
                        {/* Win/Loss Amount */}
                        <div className="text-center">
                          <p className="text-gray-400 text-sm">
                            {isVictory ? 'Winnings' : 'Lost'}
                          </p>
                          <motion.p
                            animate={animatingRewards ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.5 }}
                            className={`text-2xl font-bold ${isVictory ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {isVictory ? `+${winAmount}` : `-${betAmount}`} SOL
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="p-6 text-center"
            >
              <button
                onClick={() => {
                  if (isPvP) {
                    // Refresh the page to return to lobby for PvP
                    window.location.reload()
                  } else {
                    // Use the normal continue function for single player
                    onContinue()
                  }
                }}
                className={`
                  px-8 py-4 rounded-xl font-bold text-lg transition-all
                  transform hover:scale-105 active:scale-95
                  ${isVictory
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white'
                  }
                  shadow-lg
                `}
                style={{
                  boxShadow: isVictory
                    ? '0 10px 30px rgba(255, 215, 0, 0.3)'
                    : '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
              >
                {isPvP ? 'Return to Lobby' : 'Continue Adventure'}
              </button>
            </motion.div>
          </div>
        </motion.div>
        
        <style jsx>{`
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animate-gradient-shift {
            background-size: 200% 200%;
            animation: gradient-shift 3s ease infinite;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  )
}

export default GameOverScreen