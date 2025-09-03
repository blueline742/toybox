import React, { useState, useEffect, useRef } from 'react'
import { CHARACTERS, getRandomAICharacter, getAIPattern } from '../game/characters'
import { POWER_UPS, ARENAS, getRandomPowerUp, checkCombo } from '../game/powerups'
import ParticleEffects from './ParticleEffects'
import { useWallet } from '@solana/wallet-adapter-react'

const EnhancedBattleScreen = ({ playerCharacter, onBattleEnd, onBack }) => {
  const { publicKey } = useWallet()
  const [aiCharacter] = useState(() => getRandomAICharacter(playerCharacter.id))
  const [playerHealth, setPlayerHealth] = useState(playerCharacter.maxHealth)
  const [aiHealth, setAiHealth] = useState(aiCharacter.maxHealth)
  const [currentTurn, setCurrentTurn] = useState('player')
  const [battleLog, setBattleLog] = useState([])
  const [playerCooldowns, setPlayerCooldowns] = useState({})
  const [aiCooldowns, setAiCooldowns] = useState({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [damageNumbers, setDamageNumbers] = useState([])
  const [battleStarted, setBattleStarted] = useState(false)
  
  // New enhanced features
  const [currentArena] = useState(() => Object.values(ARENAS)[Math.floor(Math.random() * Object.values(ARENAS).length)])
  const [playerPowerUps, setPlayerPowerUps] = useState([])
  const [aiPowerUps, setAiPowerUps] = useState([])
  const [comboCounter, setComboCounter] = useState(0)
  const [moveHistory, setMoveHistory] = useState([])
  const [specialEffects, setSpecialEffects] = useState([])
  const [score, setScore] = useState(0)
  const [turnCounter, setTurnCounter] = useState(0)
  
  const battleLogRef = useRef(null)
  const damageNumberId = useRef(0)
  const effectId = useRef(0)

  // Start battle with epic intro
  useEffect(() => {
    const timer = setTimeout(() => {
      setBattleStarted(true)
      addToBattleLog(`⚔️ ${playerCharacter.name} vs ${aiCharacter.name} - FIGHT!`)
      addToBattleLog(`📍 Arena: ${currentArena.name}`)
      triggerSpecialEffect('battle_start')
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll battle log
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Power-up spawning
  useEffect(() => {
    if (turnCounter > 0 && turnCounter % 3 === 0) {
      const powerUp = getRandomPowerUp()
      addToBattleLog(`✨ Power-up available: ${powerUp.name}!`)
      if (Math.random() > 0.5) {
        setPlayerPowerUps(prev => [...prev, powerUp])
      }
    }
  }, [turnCounter])

  // Screen shake effect
  const triggerScreenShake = (intensity = 'normal') => {
    setScreenShake(intensity)
    setTimeout(() => setScreenShake(false), intensity === 'heavy' ? 800 : 500)
  }

  // Special visual effects
  const triggerSpecialEffect = (type) => {
    const id = ++effectId.current
    const effect = {
      id,
      type,
      timestamp: Date.now()
    }
    setSpecialEffects(prev => [...prev, effect])
    setTimeout(() => {
      setSpecialEffects(prev => prev.filter(e => e.id !== id))
    }, 2000)
  }

  // Show damage/heal numbers with enhanced effects
  const showDamageNumber = (amount, type, isPlayer = true, isCritical = false) => {
    const id = ++damageNumberId.current
    const newNumber = {
      id,
      amount,
      type,
      isPlayer,
      isCritical,
      x: Math.random() * 80 + 10,
      y: Math.random() * 40 + 30
    }
    
    setDamageNumbers(prev => [...prev, newNumber])
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(num => num.id !== id))
    }, 1500)
  }

  const addToBattleLog = (message) => {
    setBattleLog(prev => [...prev.slice(-5), message])
  }

  const calculateDamage = (baseDamage, attacker, isPlayer) => {
    let damage = baseDamage
    
    // Apply power-up multipliers
    const powerUps = isPlayer ? playerPowerUps : aiPowerUps
    const damageBoost = powerUps.find(p => p.effect.damageMultiplier)
    if (damageBoost) {
      damage *= damageBoost.effect.damageMultiplier
    }
    
    // Critical hit chance
    const isCritical = Math.random() < 0.15
    if (isCritical) {
      damage *= 1.5
      triggerSpecialEffect('critical')
    }
    
    // Arena effects
    if (currentArena.specialEffect.type === 'tech_boost' && attacker.id === 'robo_fighter') {
      damage *= 1.1
    }
    
    return { damage: Math.round(damage), isCritical }
  }

  const handleAbilityUse = async (ability, isPlayer = true) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setTurnCounter(prev => prev + 1)
    
    const character = isPlayer ? playerCharacter : aiCharacter
    const targetCharacter = isPlayer ? aiCharacter : playerCharacter
    
    addToBattleLog(`${character.name} uses ${ability.name}!`)
    
    // Add to move history for combo tracking
    setMoveHistory(prev => [...prev, { 
      type: ability.effect, 
      hit: true, 
      timestamp: Date.now() 
    }])

    // Trigger ability animation
    triggerSpecialEffect(ability.animation || 'default')
    
    await new Promise(resolve => setTimeout(resolve, 600))

    if (ability.effect === 'damage' || ability.effect === 'both') {
      const { damage, isCritical } = calculateDamage(ability.damage || 0, character, isPlayer)
      const targetHealth = isPlayer ? aiHealth : playerHealth
      const actualDamage = Math.min(damage, targetHealth)
      
      if (isPlayer) {
        setAiHealth(prev => Math.max(0, prev - actualDamage))
        setScore(prev => prev + actualDamage * 10)
      } else {
        setPlayerHealth(prev => Math.max(0, prev - actualDamage))
        triggerScreenShake(isCritical ? 'heavy' : 'normal')
      }
      
      showDamageNumber(actualDamage, 'damage', !isPlayer, isCritical)
      
      if (isCritical) {
        addToBattleLog(`💥 CRITICAL HIT! ${targetCharacter.name} takes ${actualDamage} damage!`)
      } else {
        addToBattleLog(`${targetCharacter.name} takes ${actualDamage} damage!`)
      }
      
      // Update combo counter
      if (isPlayer) {
        setComboCounter(prev => prev + 1)
        if (comboCounter >= 2) {
          triggerSpecialEffect('combo')
          setScore(prev => prev + 500 * comboCounter)
        }
      }
    }

    if (ability.effect === 'heal' || ability.effect === 'both') {
      const heal = ability.heal || 0
      const currentHealth = isPlayer ? playerHealth : aiHealth
      const maxHealth = character.maxHealth
      
      // Apply healing boost from arena
      let actualHeal = heal
      if (currentArena.specialEffect.type === 'magic_amplify') {
        actualHeal *= 1.2
      }
      
      actualHeal = Math.min(Math.round(actualHeal), maxHealth - currentHealth)
      
      if (actualHeal > 0) {
        if (isPlayer) {
          setPlayerHealth(prev => Math.min(maxHealth, prev + actualHeal))
        } else {
          setAiHealth(prev => Math.min(maxHealth, prev + actualHeal))
        }
        
        showDamageNumber(actualHeal, 'heal', isPlayer)
        addToBattleLog(`${character.name} heals for ${actualHeal} HP!`)
      }
    }

    // Check for combo moves
    const combo = checkCombo(moveHistory)
    if (combo && isPlayer) {
      addToBattleLog(`🌟 COMBO! ${combo.name} activated!`)
      triggerSpecialEffect('ultimate')
      setScore(prev => prev + 1000)
      
      if (combo.damage) {
        setAiHealth(prev => Math.max(0, prev - combo.damage))
        showDamageNumber(combo.damage, 'damage', false, true)
      }
      if (combo.heal) {
        setPlayerHealth(prev => Math.min(playerCharacter.maxHealth, prev + combo.heal))
        showDamageNumber(combo.heal, 'heal', true)
      }
    }

    // Update cooldowns
    if (isPlayer) {
      setPlayerCooldowns(prev => ({
        ...prev,
        [ability.id]: ability.cooldown
      }))
    } else {
      setAiCooldowns(prev => ({
        ...prev,
        [ability.id]: ability.cooldown
      }))
      setComboCounter(0) // Reset player combo on AI turn
    }

    setIsAnimating(false)
    setCurrentTurn(isPlayer ? 'ai' : 'player')
  }

  const usePowerUp = (powerUp, isPlayer = true) => {
    if (isAnimating) return
    
    addToBattleLog(`${isPlayer ? playerCharacter.name : aiCharacter.name} uses ${powerUp.name}!`)
    triggerSpecialEffect('powerup')
    
    if (powerUp.effect.instantHeal) {
      const heal = powerUp.effect.instantHeal
      if (isPlayer) {
        setPlayerHealth(prev => Math.min(playerCharacter.maxHealth, prev + heal))
      } else {
        setAiHealth(prev => Math.min(aiCharacter.maxHealth, prev + heal))
      }
      showDamageNumber(heal, 'heal', isPlayer)
    }
    
    if (powerUp.effect.randomDamage) {
      const { min, max } = powerUp.effect.randomDamage
      const damage = Math.floor(Math.random() * (max - min + 1)) + min
      if (isPlayer) {
        setAiHealth(prev => Math.max(0, prev - damage))
      } else {
        setPlayerHealth(prev => Math.max(0, prev - damage))
      }
      showDamageNumber(damage, 'damage', !isPlayer)
    }
    
    if (powerUp.effect.resetCooldowns) {
      if (isPlayer) {
        setPlayerCooldowns({})
      } else {
        setAiCooldowns({})
      }
    }
    
    // Remove used power-up
    if (isPlayer) {
      setPlayerPowerUps(prev => prev.filter(p => p.id !== powerUp.id))
    } else {
      setAiPowerUps(prev => prev.filter(p => p.id !== powerUp.id))
    }
  }

  // Enhanced AI Turn Logic
  useEffect(() => {
    if (currentTurn === 'ai' && !isAnimating && battleStarted) {
      const timer = setTimeout(() => {
        // Check if AI has power-ups
        if (aiPowerUps.length > 0 && Math.random() < 0.3) {
          usePowerUp(aiPowerUps[0], false)
          return
        }
        
        const aiPattern = getAIPattern(aiCharacter)
        const availableAbilities = aiCharacter.abilities.filter(
          ability => !aiCooldowns[ability.id] || aiCooldowns[ability.id] <= 0
        )

        let chosenAbility
        const needsHealing = aiHealth < aiCharacter.maxHealth * 0.4
        const canHeal = availableAbilities.some(a => a.effect === 'heal' || a.effect === 'both')

        if (needsHealing && canHeal && Math.random() < aiPattern.healChance) {
          chosenAbility = availableAbilities.find(a => a.effect === 'heal' || a.effect === 'both')
        } else {
          const damageAbilities = availableAbilities.filter(a => a.effect === 'damage' || a.effect === 'both')
          chosenAbility = damageAbilities[Math.floor(Math.random() * damageAbilities.length)]
        }

        if (chosenAbility) {
          handleAbilityUse(chosenAbility, false)
        }
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [currentTurn, aiHealth, isAnimating, battleStarted, aiPowerUps])

  // Update cooldowns
  useEffect(() => {
    if (currentTurn === 'player') {
      setPlayerCooldowns(prev => {
        const updated = {}
        Object.keys(prev).forEach(abilityId => {
          updated[abilityId] = Math.max(0, prev[abilityId] - 1)
        })
        return updated
      })
      setAiCooldowns(prev => {
        const updated = {}
        Object.keys(prev).forEach(abilityId => {
          updated[abilityId] = Math.max(0, prev[abilityId] - 1)
        })
        return updated
      })
    }
  }, [currentTurn])

  // Check win conditions
  useEffect(() => {
    if (playerHealth <= 0 || aiHealth <= 0) {
      const winner = playerHealth > 0 ? 'player' : 'ai'
      const result = {
        winner,
        playerCharacter,
        aiCharacter,
        finalPlayerHealth: playerHealth,
        finalAiHealth: aiHealth,
        score,
        turns: turnCounter,
        combos: Math.floor(comboCounter / 3)
      }
      
      setTimeout(() => {
        onBattleEnd(result)
      }, 2000)
    }
  }, [playerHealth, aiHealth])

  const isAbilityAvailable = (ability) => {
    return currentTurn === 'player' && !isAnimating && 
           (!playerCooldowns[ability.id] || playerCooldowns[ability.id] <= 0)
  }

  return (
    <div 
      className={`h-full flex flex-col relative overflow-hidden ${
        screenShake === 'heavy' ? 'heavy-shake' : screenShake ? 'screen-shake' : ''
      }`}
      style={{
        backgroundImage: `url(${currentArena.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Particle Effects */}
      <ParticleEffects type={currentArena.particleEffect || 'stars'} count={30} />
      
      {/* Ambient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, transparent 40%, ${currentArena.ambientColor}88 100%)`
        }}
      />
      
      {/* Special Effects Layer */}
      {specialEffects.map(effect => (
        <div key={effect.id} className={`special-effect ${effect.type}`} />
      ))}
      
      {/* Score and Combo Display */}
      <div className="absolute top-4 right-4 text-white z-20">
        <div className="text-2xl font-bold font-toy mb-2">
          Score: {score.toLocaleString()}
        </div>
        {comboCounter > 0 && (
          <div className="text-xl font-toy text-toy-yellow animate-pulse">
            Combo x{comboCounter}
          </div>
        )}
      </div>
      
      {/* Damage Numbers */}
      {damageNumbers.map(number => (
        <div
          key={number.id}
          className={`
            ${number.type === 'damage' ? 'damage-number' : 'heal-number'}
            ${number.isCritical ? 'critical-damage' : ''}
          `}
          style={{
            left: `${number.x}%`,
            top: `${number.y}%`,
            fontSize: number.isCritical ? '3rem' : '2rem'
          }}
        >
          {number.type === 'damage' ? '-' : '+'}{number.amount}
          {number.isCritical && ' CRIT!'}
        </div>
      ))}

      {/* Battle Arena */}
      <div className="flex-1 flex items-center justify-between p-4 relative z-10">
        {/* Player Side */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-center mb-4">
            <h3 className="text-white font-bold text-xl font-toy drop-shadow-lg">
              {playerCharacter.name}
            </h3>
            <div className="w-40 h-4 health-bar-enhanced mb-2">
              <div 
                className="health-fill-enhanced" 
                style={{ 
                  width: `${(playerHealth / playerCharacter.maxHealth) * 100}%`,
                  background: `linear-gradient(90deg, #00ff00, #ffff00, #ff0000)`
                }}
              />
            </div>
            <p className="text-white text-sm font-bold">{playerHealth}/{playerCharacter.maxHealth}</p>
          </div>
          
          <div 
            className={`text-9xl transition-all duration-300 ${
              currentTurn === 'player' && battleStarted ? 'toy-glow-enhanced scale-110' : ''
            } ${playerHealth <= 0 ? 'grayscale opacity-50' : ''}`}
            style={{ 
              color: playerCharacter.color,
              filter: `drop-shadow(0 0 20px ${playerCharacter.color})`
            }}
          >
            {playerCharacter.emoji}
          </div>
          
          {/* Player Power-ups */}
          {playerPowerUps.length > 0 && (
            <div className="flex gap-2 mt-4">
              {playerPowerUps.map(powerUp => (
                <button
                  key={powerUp.id}
                  onClick={() => usePowerUp(powerUp, true)}
                  className="power-up-button"
                  disabled={!currentTurn === 'player' || isAnimating}
                  title={powerUp.effect.description}
                >
                  <span className="text-2xl">{powerUp.icon}</span>
                </button>
              ))}
            </div>
          )}
          
          {currentTurn === 'player' && playerHealth > 0 && (
            <div className="text-white text-center mt-2 animate-pulse">
              <span className="font-toy text-xl">Your Turn!</span>
            </div>
          )}
        </div>

        {/* VS Indicator */}
        <div className="text-center px-4">
          <div className="text-7xl font-toy text-white opacity-90 animate-pulse drop-shadow-2xl">
            VS
          </div>
          <div className="text-sm text-white mt-2 font-comic">
            Turn {turnCounter}
          </div>
          {(playerHealth <= 0 || aiHealth <= 0) && (
            <div className="text-3xl font-toy text-toy-yellow mt-2 animate-bounce drop-shadow-lg">
              {playerHealth > 0 ? 'VICTORY!' : 'DEFEAT!'}
            </div>
          )}
        </div>

        {/* AI Side */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-center mb-4">
            <h3 className="text-white font-bold text-xl font-toy drop-shadow-lg">
              {aiCharacter.name}
            </h3>
            <div className="w-40 h-4 health-bar-enhanced mb-2">
              <div 
                className="health-fill-enhanced" 
                style={{ 
                  width: `${(aiHealth / aiCharacter.maxHealth) * 100}%`,
                  background: `linear-gradient(90deg, #00ff00, #ffff00, #ff0000)`
                }}
              />
            </div>
            <p className="text-white text-sm font-bold">{aiHealth}/{aiCharacter.maxHealth}</p>
          </div>
          
          <div 
            className={`text-9xl transition-all duration-300 ${
              currentTurn === 'ai' && battleStarted ? 'toy-glow-enhanced scale-110' : ''
            } ${aiHealth <= 0 ? 'grayscale opacity-50' : ''}`}
            style={{ 
              color: aiCharacter.color,
              filter: `drop-shadow(0 0 20px ${aiCharacter.color})`
            }}
          >
            {aiCharacter.emoji}
          </div>
          
          {/* AI Power-ups */}
          {aiPowerUps.length > 0 && (
            <div className="flex gap-2 mt-4">
              {aiPowerUps.map(powerUp => (
                <div key={powerUp.id} className="power-up-indicator">
                  <span className="text-2xl opacity-60">{powerUp.icon}</span>
                </div>
              ))}
            </div>
          )}
          
          {currentTurn === 'ai' && aiHealth > 0 && (
            <div className="text-white text-center mt-2 animate-pulse">
              <span className="font-toy text-xl">AI Turn...</span>
            </div>
          )}
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-black bg-opacity-50 backdrop-blur mx-4 rounded-lg p-3 mb-4 max-h-24 overflow-y-auto border border-white/20" ref={battleLogRef}>
        {battleLog.map((message, index) => (
          <p key={index} className="text-white text-sm font-comic mb-1 drop-shadow">
            {message}
          </p>
        ))}
      </div>

      {/* Player Actions */}
      {currentTurn === 'player' && playerHealth > 0 && aiHealth > 0 && (
        <div className="grid grid-cols-3 gap-2 p-4 bg-black/40 backdrop-blur">
          {playerCharacter.abilities.map((ability) => (
            <button
              key={ability.id}
              onClick={() => handleAbilityUse(ability, true)}
              disabled={!isAbilityAvailable(ability)}
              className={`enhanced-toy-button text-sm p-3 font-comic ${
                !isAbilityAvailable(ability) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="font-bold">{ability.name}</div>
              <div className="text-xs mt-1">
                {ability.damage && `⚔️ ${ability.damage}`}
                {ability.heal && ` ❤️ ${ability.heal}`}
              </div>
              {playerCooldowns[ability.id] > 0 && (
                <div className="text-xs text-red-300 mt-1">
                  ⏱️ {playerCooldowns[ability.id]}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-toy text-sm z-20 transition-all hover:scale-105"
      >
        ← Back
      </button>
    </div>
  )
}

export default EnhancedBattleScreen