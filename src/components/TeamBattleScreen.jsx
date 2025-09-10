import React, { useState, useEffect, useRef } from 'react'
import { CHARACTERS } from '../game/characters'
import { POWER_UPS, ARENAS, getRandomPowerUp } from '../game/powerups'
import ParticleEffects from './ParticleEffects'
import SpellEffects from './SpellEffects'
import HugAnimation from './HugAnimation'
import CardPreview from './CardPreview'
import { useWallet } from '@solana/wallet-adapter-react'
import musicManager from '../utils/musicManager'
import {
  playHitSound,
  playHealSound,
  playPowerUpSound,
  playComboSound,
  playCriticalSound,
  playVictorySound,
  playDefeatSound,
  startBattleMusic
} from '../utils/soundEffects'

const TeamBattleScreen = ({ playerTeam, onBattleEnd, onBack }) => {
  const { publicKey } = useWallet()
  const [hoveredCharacter, setHoveredCharacter] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  // Team states
  const [playerTeamState, setPlayerTeamState] = useState(() => 
    playerTeam.map(char => ({
      ...char,
      currentHealth: char.maxHealth || 100,
      health: char.currentHealth || char.maxHealth || 100, // Add for CardPreview
      mana: 100,
      maxMana: 100,
      cooldowns: {},
      buffs: [],
      isActive: false,
      position: { x: 0, y: 0 },
      stats: char.stats || { attack: 5, defense: 5, speed: 5 }, // Ensure stats exist
      abilities: char.abilities || [] // Ensure abilities exist
    }))
  )
  
  const [aiTeamState, setAiTeamState] = useState(() => {
    // Generate AI team
    const aiTeam = []
    const availableChars = Object.values(CHARACTERS)
    for (let i = 0; i < 3; i++) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)]
      aiTeam.push({
        ...randomChar,
        instanceId: `ai-${randomChar.id}-${i}`, // Unique instance ID
        currentHealth: randomChar.maxHealth || 100,
        health: randomChar.maxHealth || 100, // Add for CardPreview
        mana: 100,
        maxMana: 100,
        cooldowns: {},
        buffs: [],
        isActive: false,
        position: { x: 0, y: 0 },
        stats: randomChar.stats || { attack: 5, defense: 5, speed: 5 }, // Ensure stats exist
        abilities: randomChar.abilities || [] // Ensure abilities exist
      })
    }
    return aiTeam
  })
  
  // Battle states
  const [currentTurn, setCurrentTurn] = useState('player')
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)
  const [activeAIIndex, setActiveAIIndex] = useState(0)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [selectedAbility, setSelectedAbility] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [battleLog, setBattleLog] = useState([])
  const [turnPhase, setTurnPhase] = useState('selecting') // selecting, casting, resolving
  const [activeSpell, setActiveSpell] = useState(null)
  const [comboCounter, setComboCounter] = useState(0)
  const [score, setScore] = useState(0)
  const [turnCounter, setTurnCounter] = useState(0)
  
  // Visual states
  const [currentArena] = useState(() => Object.values(ARENAS)[Math.floor(Math.random() * Object.values(ARENAS).length)])
  const [damageNumbers, setDamageNumbers] = useState([])
  const [cardAnimations, setCardAnimations] = useState([])
  const [highlightedTargets, setHighlightedTargets] = useState([])
  const [hugAnimation, setHugAnimation] = useState(null)
  
  const battleLogRef = useRef(null)
  const damageNumberId = useRef(0)

  // Initialize battle
  useEffect(() => {
    // Battle music disabled - only sound effects
    // musicManager.crossFade('/battlemusic.mp3', 'battle', 1000)
    
    addToBattleLog('⚔️ Team Battle Begins!')
    addToBattleLog(`📍 Arena: ${currentArena.name}`)
    
    // Set initial positions for characters - properly centered on screen
    const viewportHeight = Math.min(window.innerHeight, 800) // Cap height for better scaling
    const viewportWidth = Math.min(window.innerWidth, 1400) // Cap width for better scaling
    
    const centerY = viewportHeight * 0.45 // Slightly higher than center
    const leftX = viewportWidth * 0.2  // 20% from left
    const rightX = viewportWidth * 0.8  // 80% from left
    const spacing = Math.min(100, viewportHeight / 6) // Responsive vertical spacing
    
    setPlayerTeamState(prev => prev.map((char, i) => ({
      ...char,
      position: { 
        x: leftX, 
        y: centerY - spacing + (i * spacing) 
      },
      isActive: i === 0
    })))
    
    setAiTeamState(prev => prev.map((char, i) => ({
      ...char,
      position: { 
        x: rightX, 
        y: centerY - spacing + (i * spacing)
      }
    })))
  }, [])

  // Auto-scroll battle log
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  const addToBattleLog = (message) => {
    setBattleLog(prev => [...prev.slice(-6), message])
  }

  const showDamageNumber = (amount, type, position, isCritical = false) => {
    const id = ++damageNumberId.current
    const newNumber = {
      id,
      amount,
      type,
      isCritical,
      x: position.x + (Math.random() - 0.5) * 50,
      y: position.y + (Math.random() - 0.5) * 30
    }
    
    setDamageNumbers(prev => [...prev, newNumber])
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(num => num.id !== id))
    }, 2000)
  }

  const handleAbilitySelect = (ability) => {
    if (turnPhase !== 'selecting' || isAnimating) return
    if (!canUseAbility(ability)) return
    
    setSelectedAbility(ability)
    
    // Highlight valid targets
    if (ability.effect === 'damage') {
      setHighlightedTargets(aiTeamState.filter(char => char.currentHealth > 0).map(char => char.id))
    } else if (ability.effect === 'heal') {
      setHighlightedTargets(playerTeamState.filter(char => char.currentHealth > 0).map(char => char.id))
    }
    
    playHoverSound()
  }

  const handleTargetSelect = (target, isPlayerTeam) => {
    if (!selectedAbility || turnPhase !== 'selecting' || isAnimating) return
    
    const activeChar = playerTeamState[activePlayerIndex]
    
    // Validate target
    if (selectedAbility.effect === 'damage' && isPlayerTeam) return
    if (selectedAbility.effect === 'heal' && !isPlayerTeam) return
    if (target.currentHealth <= 0) return
    
    // Start casting animation
    setTurnPhase('casting')
    setIsAnimating(true)
    setHighlightedTargets([])
    
    // Create spell effect
    // Check if this is a hug animation
    if (selectedAbility.animation === 'hug') {
      // Use special hug animation
      setIsAnimating(true)
      setTurnPhase('casting')
      setHugAnimation({
        attacker: activeChar,
        target: target
      })
      
      // Show ability card
      showAbilityCard(selectedAbility, activeChar)
      addToBattleLog(`${activeChar.name} uses ${selectedAbility.name}!`)
      
      // Deduct mana
      const manaCost = selectedAbility.manaCost || 20
      setPlayerTeamState(prev => prev.map((char, i) => 
        i === activePlayerIndex 
          ? { ...char, mana: Math.max(0, char.mana - manaCost) }
          : char
      ))
      
      // Apply damage after animation
      setTimeout(() => {
        const damage = calculateDamage(selectedAbility.damage, activeChar)
        applyDamage(target, damage, false)
        playHitSound()
        
        if (damage.isCritical) {
          playCriticalSound()
        }
        
        // Update cooldowns
        setPlayerTeamState(prev => prev.map((char, i) => 
          i === activePlayerIndex 
            ? {
                ...char,
                cooldowns: {
                  ...char.cooldowns,
                  [selectedAbility.id]: selectedAbility.cooldown || 0
                }
              }
            : char
        ))
        
        setHugAnimation(null)
        setSelectedAbility(null)
        setTurnPhase('resolving')
        
        setTimeout(() => {
          endPlayerTurn()
        }, 1000)
      }, 2400)
      
      return
    }
    
    const spell = {
      type: selectedAbility.animation || 'default',
      startX: activeChar.position.x,
      startY: activeChar.position.y,
      endX: target.position.x,
      endY: target.position.y,
      color: activeChar.color,
      ability: selectedAbility,
      caster: activeChar,
      target: target
    }
    
    // Show ability card animation
    showAbilityCard(selectedAbility, activeChar)
    
    // Cast the spell after a delay
    setTimeout(() => {
      setActiveSpell(spell)
      addToBattleLog(`${activeChar.name} casts ${selectedAbility.name}!`)
      
      // Deduct mana
      const manaCost = selectedAbility.manaCost || 20
      setPlayerTeamState(prev => prev.map((char, i) => 
        i === activePlayerIndex 
          ? { ...char, mana: Math.max(0, char.mana - manaCost) }
          : char
      ))
    }, 800)
  }

  const handleSpellComplete = (spell) => {
    // Apply spell effects
    if (spell.ability.effect === 'damage') {
      const damage = calculateDamage(spell.ability.damage, spell.caster)
      applyDamage(spell.target, damage, false)
      playHitSound()
      
      if (damage.isCritical) {
        playCriticalSound()
      }
    } else if (spell.ability.effect === 'heal') {
      const healAmount = spell.ability.heal || 0
      applyHealing(spell.target, healAmount, true)
      playHealSound()
    }
    
    // Update cooldowns
    setPlayerTeamState(prev => prev.map((char, i) => 
      i === activePlayerIndex 
        ? {
            ...char,
            cooldowns: {
              ...char.cooldowns,
              [spell.ability.id]: spell.ability.cooldown || 0
            }
          }
        : char
    ))
    
    // Clear spell and end turn
    setActiveSpell(null)
    setSelectedAbility(null)
    setTurnPhase('resolving')
    
    setTimeout(() => {
      endPlayerTurn()
    }, 1000)
  }

  const showAbilityCard = (ability, caster) => {
    const card = {
      id: Date.now(),
      ability,
      caster,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    }
    
    setCardAnimations(prev => [...prev, card])
    
    setTimeout(() => {
      setCardAnimations(prev => prev.filter(c => c.id !== card.id))
    }, 2000)
  }

  const calculateDamage = (baseDamage, attacker) => {
    let damage = baseDamage
    
    // Apply buffs/debuffs
    const damageBuffs = attacker.buffs.filter(b => b.type === 'damage_boost')
    damageBuffs.forEach(buff => {
      damage *= buff.multiplier
    })
    
    // Critical hit chance
    const isCritical = Math.random() < 0.2
    if (isCritical) {
      damage *= 1.5
    }
    
    // Combo bonus
    if (comboCounter > 2) {
      damage *= 1 + (comboCounter * 0.1)
    }
    
    return {
      amount: Math.round(damage),
      isCritical
    }
  }

  const applyDamage = (target, damage, isPlayerTeam) => {
    const teamSetter = isPlayerTeam ? setPlayerTeamState : setAiTeamState
    
    teamSetter(prev => prev.map(char => {
      if (char.id === target.id) {
        const newHealth = Math.max(0, char.currentHealth - damage.amount)
        showDamageNumber(damage.amount, 'damage', char.position, damage.isCritical)
        
        if (newHealth === 0) {
          addToBattleLog(`💀 ${char.name} has been defeated!`)
        } else {
          addToBattleLog(`${char.name} takes ${damage.amount} damage!`)
        }
        
        return { ...char, currentHealth: newHealth }
      }
      return char
    }))
    
    // Update score and combo
    if (!isPlayerTeam) {
      setScore(prev => prev + damage.amount * 10)
      setComboCounter(prev => prev + 1)
      
      if (comboCounter > 0 && comboCounter % 3 === 0) {
        playComboSound(comboCounter)
      }
    }
  }

  const applyHealing = (target, amount, isPlayerTeam) => {
    const teamSetter = isPlayerTeam ? setPlayerTeamState : setAiTeamState
    
    teamSetter(prev => prev.map(char => {
      if (char.id === target.id) {
        const actualHeal = Math.min(amount, char.maxHealth - char.currentHealth)
        const newHealth = char.currentHealth + actualHeal
        
        if (actualHeal > 0) {
          showDamageNumber(actualHeal, 'heal', char.position)
          addToBattleLog(`${char.name} heals for ${actualHeal} HP!`)
        }
        
        return { ...char, currentHealth: newHealth }
      }
      return char
    }))
  }

  const canUseAbility = (ability) => {
    const activeChar = playerTeamState[activePlayerIndex]
    const manaCost = ability.manaCost || 20
    const cooldown = activeChar.cooldowns[ability.id] || 0
    
    return activeChar.mana >= manaCost && cooldown === 0
  }

  const endPlayerTurn = () => {
    // Move to next alive character
    let nextIndex = (activePlayerIndex + 1) % playerTeamState.length
    while (playerTeamState[nextIndex].currentHealth <= 0 && nextIndex !== activePlayerIndex) {
      nextIndex = (nextIndex + 1) % playerTeamState.length
    }
    
    if (playerTeamState[nextIndex].currentHealth <= 0) {
      // All player characters defeated
      checkBattleEnd()
      return
    }
    
    // Update active character
    setPlayerTeamState(prev => prev.map((char, i) => ({
      ...char,
      isActive: i === nextIndex
    })))
    setActivePlayerIndex(nextIndex)
    
    // Regenerate mana
    setPlayerTeamState(prev => prev.map(char => ({
      ...char,
      mana: Math.min(char.maxMana, char.mana + 20)
    })))
    
    // Reduce cooldowns
    setPlayerTeamState(prev => prev.map(char => ({
      ...char,
      cooldowns: Object.entries(char.cooldowns).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: Math.max(0, value - 1)
      }), {})
    })))
    
    // Switch to AI turn
    setCurrentTurn('ai')
    setTurnPhase('selecting')
    setIsAnimating(false)
    setTurnCounter(prev => prev + 1)
  }

  // AI Turn Logic
  useEffect(() => {
    if (currentTurn === 'ai' && !isAnimating && turnPhase === 'selecting') {
      const timer = setTimeout(() => {
        executeAITurn()
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [currentTurn, isAnimating, turnPhase])

  const executeAITurn = () => {
    // Find alive AI character
    const aliveAI = aiTeamState.filter(char => char.currentHealth > 0)
    if (aliveAI.length === 0) {
      checkBattleEnd()
      return
    }
    
    const activeAI = aliveAI[0]
    const abilities = activeAI.abilities.filter(a => 
      !activeAI.cooldowns[a.id] && activeAI.mana >= (a.manaCost || 20)
    )
    
    if (abilities.length === 0) {
      // No abilities available, skip turn
      endAITurn()
      return
    }
    
    // Choose ability
    const ability = abilities[Math.floor(Math.random() * abilities.length)]
    
    // Choose target
    let target
    if (ability.effect === 'damage') {
      const aliveEnemies = playerTeamState.filter(char => char.currentHealth > 0)
      target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
    } else {
      const aliveAllies = aiTeamState.filter(char => char.currentHealth > 0 && char.currentHealth < char.maxHealth)
      target = aliveAllies.length > 0 
        ? aliveAllies[Math.floor(Math.random() * aliveAllies.length)]
        : activeAI
    }
    
    if (!target) {
      endAITurn()
      return
    }
    
    // Cast spell
    setTurnPhase('casting')
    setIsAnimating(true)
    
    // Check if this is a hug animation
    if (ability.animation === 'hug') {
      setHugAnimation({
        attacker: activeAI,
        target: target
      })
      
      showAbilityCard(ability, activeAI)
      addToBattleLog(`${activeAI.name} uses ${ability.name}!`)
      
      // Apply damage after animation
      setTimeout(() => {
        if (ability.effect === 'damage') {
          const damage = calculateDamage(ability.damage, activeAI)
          applyDamage(target, damage, true)
        } else if (ability.effect === 'heal') {
          applyHealing(target, ability.heal, false)
        }
        
        setHugAnimation(null)
        endAITurn()
      }, 2400)
      
      return
    }
    
    const spell = {
      type: ability.animation || 'default',
      startX: activeAI.position.x,
      startY: activeAI.position.y,
      endX: target.position.x,
      endY: target.position.y,
      color: activeAI.color,
      ability: ability,
      caster: activeAI,
      target: target,
      isAI: true
    }
    
    showAbilityCard(ability, activeAI)
    
    setTimeout(() => {
      setActiveSpell(spell)
      addToBattleLog(`${activeAI.name} casts ${ability.name}!`)
      
      // Apply AI spell effect after animation
      setTimeout(() => {
        if (ability.effect === 'damage') {
          const damage = calculateDamage(ability.damage, activeAI)
          applyDamage(target, damage, true)
        } else if (ability.effect === 'heal') {
          applyHealing(target, ability.heal, false)
        }
        
        setActiveSpell(null)
        endAITurn()
      }, 2000)
    }, 800)
  }

  const endAITurn = () => {
    // Reset combo if player didn't attack
    setComboCounter(0)
    
    // Switch back to player
    setCurrentTurn('player')
    setTurnPhase('selecting')
    setIsAnimating(false)
  }

  const checkBattleEnd = () => {
    const alivePlayerChars = playerTeamState.filter(char => char.currentHealth > 0).length
    const aliveAIChars = aiTeamState.filter(char => char.currentHealth > 0).length
    
    if (alivePlayerChars === 0 || aliveAIChars === 0) {
      const winner = alivePlayerChars > 0 ? 'player' : 'ai'
      
      // Pause background music for victory sounds
      musicManager.pauseMusic()
      
      // Play team-specific victory sound first with slight delay
      setTimeout(() => {
        const teamSound = new Audio(winner === 'player' ? '/blueteamwins.mp3' : '/redteamwins.mp3')
        teamSound.volume = 0.7  // Increased volume since music is paused
        teamSound.play().then(() => {
          console.log(`Playing ${winner === 'player' ? 'blue' : 'red'} team victory sound`)
        }).catch(err => console.log('Team victory sound failed:', err))
        
        // Play player win/lose sound after team sound finishes (always player perspective in single player)
        teamSound.addEventListener('ended', () => {
          const playerResultSound = new Audio(winner === 'player' ? '/gamewin.wav' : '/gamelose.wav')
          playerResultSound.volume = 0.6  // Also increased volume
          playerResultSound.play().then(() => {
            console.log(`Playing ${winner === 'player' ? 'win' : 'lose'} sound`)
            // Resume music after victory sounds finish
            setTimeout(() => {
              musicManager.resumeMusic()
            }, 2000)
          }).catch(err => console.log('Player result sound failed:', err))
        })
      }, 200) // Small delay to ensure music pause takes effect
      
      const result = {
        winner,
        playerTeam: playerTeamState,
        aiTeam: aiTeamState,
        score,
        turns: turnCounter
      }
      
      setTimeout(() => {
        // Menu music disabled - only sound effects
        // musicManager.crossFade('/menumusic.mp3', 'menu', 1000)
        onBattleEnd(result)
      }, 2000)
    }
  }

  return (
    <div 
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url(${currentArena.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Particle Effects */}
      <ParticleEffects type={currentArena.particleEffect || 'stars'} count={30} />
      
      {/* Spell Effects Layer */}
      {activeSpell && (
        <SpellEffects 
          activeSpell={activeSpell}
          onComplete={currentTurn === 'player' ? handleSpellComplete : () => {}}
        />
      )}
      
      {/* Hug Animation Layer */}
      {hugAnimation && (
        <HugAnimation
          attacker={hugAnimation.attacker}
          target={hugAnimation.target}
          onComplete={() => setHugAnimation(null)}
        />
      )}
      
      {/* Ambient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, transparent 40%, ${currentArena.ambientColor}88 100%)`
        }}
      />
      
      {/* Score and Turn Display */}
      <div className="absolute top-4 right-4 text-white z-20">
        <div className="text-2xl font-bold font-toy mb-2">
          Score: {score.toLocaleString()}
        </div>
        <div className="text-lg font-toy">
          Turn {turnCounter}
        </div>
        {comboCounter > 0 && (
          <div className="text-xl font-toy text-yellow-400 animate-pulse mt-2">
            Combo x{comboCounter}
          </div>
        )}
      </div>
      
      {/* Damage Numbers */}
      {damageNumbers.map(number => (
        <div
          key={number.id}
          className={`
            absolute z-50
            ${number.type === 'damage' ? 'text-red-500' : 'text-green-500'}
            ${number.isCritical ? 'text-4xl text-yellow-400' : 'text-3xl'}
            font-bold animate-float-up pointer-events-none
          `}
          style={{
            left: `${number.x}px`,
            top: `${number.y}px`,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {number.type === 'damage' ? '-' : '+'}{number.amount}
          {number.isCritical && ' CRIT!'}
        </div>
      ))}
      
      {/* Ability Card Animations */}
      {cardAnimations.map(card => (
        <div
          key={card.id}
          className="absolute z-40 animate-card-reveal"
          style={{
            left: `${card.x}px`,
            top: `${card.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-4 rounded-xl border-2 border-yellow-400 shadow-2xl">
            <div className="text-white font-bold text-xl mb-2">{card.ability.name}</div>
            <div className="text-yellow-300 text-sm">{card.ability.description}</div>
            <div className="text-white mt-2">
              {card.ability.damage && `⚔️ ${card.ability.damage} damage`}
              {card.ability.heal && `❤️ ${card.ability.heal} heal`}
            </div>
          </div>
        </div>
      ))}
      
      {/* Battle Arena */}
      <div className="flex-1 relative z-10">
        {/* Player Team */}
        {playerTeamState.map((char, index) => (
          <div
            key={char.id}
            className={`
              absolute transition-all duration-300 cursor-pointer z-10
              ${char.isActive && currentTurn === 'player' ? 'scale-110' : ''}
              ${char.currentHealth <= 0 ? 'opacity-50 grayscale' : ''}
              ${highlightedTargets.includes(char.id) ? 'ring-4 ring-green-400 animate-pulse' : ''}
            `}
            onClick={() => handleTargetSelect(char, true)}
            onMouseEnter={() => setHoveredCharacter({...char, health: char.currentHealth})}
            onMouseLeave={() => setHoveredCharacter(null)}
            onTouchStart={() => {
              const timer = setTimeout(() => {
                setHoveredCharacter({...char, health: char.currentHealth})
                if (navigator.vibrate) navigator.vibrate(50)
              }, 500)
              setLongPressTimer(timer)
            }}
            onTouchEnd={() => {
              if (longPressTimer) {
                clearTimeout(longPressTimer)
                setLongPressTimer(null)
              }
              if (hoveredCharacter) {
                setHoveredCharacter(null)
              }
            }}
            style={{
              left: `${char.position.x}px`,
              top: `${char.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
              {/* Character */}
              <div 
                className="text-5xl md:text-6xl lg:text-7xl"
                style={{ 
                  color: char.color,
                  filter: char.isActive ? `drop-shadow(0 0 20px ${char.color})` : 'none'
                }}
              >
                {char.emoji}
              </div>
              
              {/* Health Bar */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24">
                <div className="text-white text-xs text-center font-bold mb-1">
                  {char.name}
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${(char.currentHealth / char.maxHealth) * 100}%` }}
                  />
                </div>
                <div className="text-white text-xs text-center">
                  {char.currentHealth}/{char.maxHealth}
                </div>
              </div>
              
              {/* Mana Bar */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                    style={{ width: `${(char.mana / char.maxMana) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Active Indicator */}
              {char.isActive && currentTurn === 'player' && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-yellow-400 text-sm font-bold animate-bounce">
                  ▼
                </div>
              )}
            </div>
          ))}
        
        {/* VS Indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
          <div className="text-6xl font-toy text-white opacity-80 animate-pulse">
            VS
          </div>
        </div>
        
        {/* AI Team */}
        {aiTeamState.map((char, index) => (
          <div
            key={char.instanceId || `ai-${char.id}-${index}`}
            className={`
              absolute transition-all duration-300 cursor-pointer z-10
              ${char.currentHealth <= 0 ? 'opacity-50 grayscale' : ''}
              ${highlightedTargets.includes(char.id) ? 'ring-4 ring-red-400 animate-pulse' : ''}
            `}
            onClick={() => handleTargetSelect(char, false)}
            onMouseEnter={() => setHoveredCharacter({...char, health: char.currentHealth})}
            onMouseLeave={() => setHoveredCharacter(null)}
            onTouchStart={() => {
              const timer = setTimeout(() => {
                setHoveredCharacter({...char, health: char.currentHealth})
                if (navigator.vibrate) navigator.vibrate(50)
              }, 500)
              setLongPressTimer(timer)
            }}
            onTouchEnd={() => {
              if (longPressTimer) {
                clearTimeout(longPressTimer)
                setLongPressTimer(null)
              }
              if (hoveredCharacter) {
                setHoveredCharacter(null)
              }
            }}
            style={{
              left: `${char.position.x}px`,
              top: `${char.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
              {/* Character */}
              <div 
                className="text-5xl md:text-6xl lg:text-7xl"
                style={{ 
                  color: char.color,
                  filter: currentTurn === 'ai' && index === activeAIIndex && char.currentHealth > 0
                    ? `drop-shadow(0 0 20px ${char.color})` 
                    : 'none'
                }}
              >
                {char.emoji}
              </div>
              
              {/* Health Bar */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24">
                <div className="text-white text-xs text-center font-bold mb-1">
                  {char.name}
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${(char.currentHealth / char.maxHealth) * 100}%` }}
                  />
                </div>
                <div className="text-white text-xs text-center">
                  {char.currentHealth}/{char.maxHealth}
                </div>
              </div>
              
              {/* Mana Bar */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                    style={{ width: `${(char.mana / char.maxMana) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
      
      {/* Battle Log */}
      <div className="bg-black bg-opacity-60 backdrop-blur mx-4 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto" ref={battleLogRef}>
        {battleLog.map((message, index) => (
          <p key={index} className="text-white text-sm font-comic mb-1">
            {message}
          </p>
        ))}
      </div>
      
      {/* Ability Cards */}
      {currentTurn === 'player' && !isAnimating && (
        <div className="bg-gradient-to-t from-black to-transparent p-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-white text-center mb-2 font-toy text-lg">
              {playerTeamState[activePlayerIndex]?.name}'s Turn
            </div>
            <div className="flex gap-3 justify-center">
              {playerTeamState[activePlayerIndex]?.abilities.map((ability) => {
                const canUse = canUseAbility(ability)
                const isSelected = selectedAbility?.id === ability.id
                
                return (
                  <div
                    key={ability.id}
                    onClick={() => handleAbilitySelect(ability)}
                    className={`
                      bg-gradient-to-br from-purple-700 to-indigo-800 
                      rounded-xl p-4 cursor-pointer transition-all
                      ${canUse ? 'hover:scale-105 hover:shadow-2xl' : 'opacity-50 cursor-not-allowed'}
                      ${isSelected ? 'ring-4 ring-yellow-400 scale-105' : ''}
                      min-w-[150px] border-2 border-purple-500
                    `}
                  >
                    <div className="text-white font-bold text-lg mb-1">
                      {ability.name}
                    </div>
                    <div className="text-gray-300 text-xs mb-2">
                      {ability.description}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {ability.damage && <span className="text-red-400">⚔️ {ability.damage}</span>}
                        {ability.heal && <span className="text-green-400">❤️ {ability.heal}</span>}
                      </div>
                      <div className="text-xs text-blue-300">
                        💧 {ability.manaCost || 20}
                      </div>
                    </div>
                    {playerTeamState[activePlayerIndex]?.cooldowns[ability.id] > 0 && (
                      <div className="text-xs text-red-300 mt-1">
                        Cooldown: {playerTeamState[activePlayerIndex].cooldowns[ability.id]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-toy text-sm z-20 transition-all hover:scale-105"
      >
        ← Back
      </button>
      
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px);
          }
        }
        
        @keyframes card-reveal {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5) rotateY(90deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2) rotateY(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1) rotateY(0deg);
          }
        }
        
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
        
        .animate-card-reveal {
          animation: card-reveal 2s ease-out forwards;
        }
      `}</style>
      
      {/* Card Preview on Hover */}
      <CardPreview 
        character={hoveredCharacter}
        isVisible={!!hoveredCharacter}
        onClose={() => setHoveredCharacter(null)}
      />
    </div>
  )
}

export default TeamBattleScreen