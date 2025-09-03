import React, { useState, useEffect, useRef } from 'react'
import { CHARACTERS, getRandomAICharacter, getAIPattern } from '../game/characters'
import { useWallet } from '@solana/wallet-adapter-react'

const BattleScreen = ({ playerCharacter, onBattleEnd, onBack }) => {
  const { publicKey, signTransaction } = useWallet()
  const [aiCharacter] = useState(() => getRandomAICharacter(playerCharacter.id))
  const [playerHealth, setPlayerHealth] = useState(playerCharacter.maxHealth)
  const [aiHealth, setAiHealth] = useState(aiCharacter.maxHealth)
  const [currentTurn, setCurrentTurn] = useState('player')
  const [selectedAbility, setSelectedAbility] = useState(null)
  const [battleLog, setBattleLog] = useState([])
  const [playerCooldowns, setPlayerCooldowns] = useState({})
  const [aiCooldowns, setAiCooldowns] = useState({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [damageNumbers, setDamageNumbers] = useState([])
  const [battleStarted, setBattleStarted] = useState(false)
  
  const battleLogRef = useRef(null)
  const damageNumberId = useRef(0)

  // Start battle animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setBattleStarted(true)
      addToBattleLog(`${playerCharacter.name} vs ${aiCharacter.name} - FIGHT!`)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll battle log
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Screen shake effect
  const triggerScreenShake = () => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 500)
  }

  // Show damage/heal numbers
  const showDamageNumber = (amount, type, isPlayer = true) => {
    const id = ++damageNumberId.current
    const newNumber = {
      id,
      amount,
      type, // 'damage' or 'heal'
      isPlayer,
      x: Math.random() * 100,
      y: Math.random() * 50 + 25
    }
    
    setDamageNumbers(prev => [...prev, newNumber])
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(num => num.id !== id))
    }, 1000)
  }

  const addToBattleLog = (message) => {
    setBattleLog(prev => [...prev.slice(-4), message])
  }

  const handleAbilityUse = async (ability, isPlayer = true) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const character = isPlayer ? playerCharacter : aiCharacter
    const targetCharacter = isPlayer ? aiCharacter : playerCharacter
    
    addToBattleLog(`${character.name} uses ${ability.name}!`)

    // Simulate animation delay
    await new Promise(resolve => setTimeout(resolve, 600))

    let damage = 0
    let heal = 0

    if (ability.effect === 'damage' || ability.effect === 'both') {
      damage = ability.damage || 0
      const targetHealth = isPlayer ? aiHealth : playerHealth
      const actualDamage = Math.min(damage, targetHealth)
      
      if (isPlayer) {
        setAiHealth(prev => Math.max(0, prev - actualDamage))
      } else {
        setPlayerHealth(prev => Math.max(0, prev - actualDamage))
        triggerScreenShake()
      }
      
      showDamageNumber(actualDamage, 'damage', !isPlayer)
      addToBattleLog(`${targetCharacter.name} takes ${actualDamage} damage!`)
    }

    if (ability.effect === 'heal' || ability.effect === 'both') {
      heal = ability.heal || 0
      const currentHealth = isPlayer ? playerHealth : aiHealth
      const maxHealth = character.maxHealth
      const actualHeal = Math.min(heal, maxHealth - currentHealth)
      
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
    }

    setIsAnimating(false)
    setCurrentTurn(isPlayer ? 'ai' : 'player')
  }

  // AI Turn Logic
  useEffect(() => {
    if (currentTurn === 'ai' && !isAnimating && battleStarted) {
      const aiPattern = getAIPattern(aiCharacter)
      const availableAbilities = aiCharacter.abilities.filter(
        ability => !aiCooldowns[ability.id] || aiCooldowns[ability.id] <= 0
      )

      const timer = setTimeout(() => {
        // AI decision making
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
  }, [currentTurn, aiHealth, isAnimating, battleStarted])

  // Update cooldowns each turn
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
        finalAiHealth: aiHealth
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
    <div className={`h-full flex flex-col relative overflow-hidden ${screenShake ? 'screen-shake' : ''}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800"></div>
      
      {/* Damage Numbers */}
      {damageNumbers.map(number => (
        <div
          key={number.id}
          className={number.type === 'damage' ? 'damage-number' : 'heal-number'}
          style={{
            left: `${number.x}%`,
            top: `${number.y}%`
          }}
        >
          {number.type === 'damage' ? '-' : '+'}{number.amount}
        </div>
      ))}

      {/* Battle Arena */}
      <div className="flex-1 flex items-center justify-between p-4 relative z-10">
        {/* Player Side */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-center mb-4">
            <h3 className="text-white font-bold text-lg font-comic">{playerCharacter.name}</h3>
            <div className="w-32 h-3 health-bar mb-2">
              <div 
                className="health-fill" 
                style={{ width: `${(playerHealth / playerCharacter.maxHealth) * 100}%` }}
              ></div>
            </div>
            <p className="text-white text-sm">{playerHealth}/{playerCharacter.maxHealth}</p>
          </div>
          
          <div 
            className={`text-8xl transition-all duration-300 ${
              currentTurn === 'player' && battleStarted ? 'toy-glow scale-110' : ''
            } ${playerHealth <= 0 ? 'grayscale opacity-50' : ''}`}
            style={{ color: playerCharacter.color }}
          >
            {playerCharacter.emoji}
          </div>
          
          {currentTurn === 'player' && playerHealth > 0 && (
            <div className="text-white text-center mt-2 animate-pulse">
              <span className="font-comic">Your Turn!</span>
            </div>
          )}
        </div>

        {/* VS Indicator */}
        <div className="text-center px-4">
          <div className="text-6xl font-toy text-white opacity-80 animate-pulse">
            VS
          </div>
          {(playerHealth <= 0 || aiHealth <= 0) && (
            <div className="text-2xl font-toy text-toy-yellow mt-2 animate-bounce">
              {playerHealth > 0 ? 'YOU WIN!' : 'YOU LOSE!'}
            </div>
          )}
        </div>

        {/* AI Side */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-center mb-4">
            <h3 className="text-white font-bold text-lg font-comic">{aiCharacter.name}</h3>
            <div className="w-32 h-3 health-bar mb-2">
              <div 
                className="health-fill" 
                style={{ width: `${(aiHealth / aiCharacter.maxHealth) * 100}%` }}
              ></div>
            </div>
            <p className="text-white text-sm">{aiHealth}/{aiCharacter.maxHealth}</p>
          </div>
          
          <div 
            className={`text-8xl transition-all duration-300 ${
              currentTurn === 'ai' && battleStarted ? 'toy-glow scale-110' : ''
            } ${aiHealth <= 0 ? 'grayscale opacity-50' : ''}`}
            style={{ color: aiCharacter.color }}
          >
            {aiCharacter.emoji}
          </div>
          
          {currentTurn === 'ai' && aiHealth > 0 && (
            <div className="text-white text-center mt-2 animate-pulse">
              <span className="font-comic">AI Turn...</span>
            </div>
          )}
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-black bg-opacity-30 mx-4 rounded-lg p-3 mb-4 max-h-20 overflow-y-auto" ref={battleLogRef}>
        {battleLog.map((message, index) => (
          <p key={index} className="text-white text-sm font-comic mb-1">
            {message}
          </p>
        ))}
      </div>

      {/* Player Actions */}
      {currentTurn === 'player' && playerHealth > 0 && aiHealth > 0 && (
        <div className="grid grid-cols-3 gap-2 p-4 bg-black bg-opacity-20">
          {playerCharacter.abilities.map((ability) => (
            <button
              key={ability.id}
              onClick={() => handleAbilityUse(ability, true)}
              disabled={!isAbilityAvailable(ability)}
              className={`toy-button text-sm p-3 font-comic ${
                !isAbilityAvailable(ability) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div>{ability.name}</div>
              <div className="text-xs">
                {ability.damage && `${ability.damage} dmg`}
                {ability.heal && `${ability.heal} heal`}
              </div>
              {playerCooldowns[ability.id] > 0 && (
                <div className="text-xs text-red-200">
                  Cooldown: {playerCooldowns[ability.id]}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-comic text-sm z-20"
      >
        ← Back
      </button>
    </div>
  )
}

export default BattleScreen