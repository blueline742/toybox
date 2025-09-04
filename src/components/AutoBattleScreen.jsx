import React, { useState, useEffect, useRef } from 'react'
import { 
  ENHANCED_CHARACTERS, 
  selectRandomAbility, 
  selectRandomTarget,
  selectAllTargets,
  calculateDamageWithRarity,
  calculateDefenseReduction,
  generateAITeam 
} from '../game/enhancedCharacters.js'
import SeededRandom, { createBattleSeed } from '../utils/seededRandom'
import { ARENAS } from '../game/powerups'
import ParticleEffects from './ParticleEffects'
import MagicParticles from './MagicParticles'
import UltimateSpellOverlay from './UltimateSpellOverlay'
import EnhancedSpellEffects from './EnhancedSpellEffects'
import UnicornSpellEffects from './UnicornSpellEffects'
import PhoenixDragonEffects from './PhoenixDragonEffects'
import RoboFighterEffects from './RoboFighterEffects'
import WizardEffects from './WizardEffects'
import PirateEffects from './PirateEffects'
import RubberDuckieEffects from './RubberDuckieEffects'
import BrickDudeEffects from './BrickDudeEffects'
import WindUpSoldierEffects from './WindUpSoldierEffects'
import SpellNotification from './SpellNotification'
import CastingBar from './CastingBar'
import CharacterCard from './CharacterCard'
import HealingGlow from './HealingGlow'
// import TargetingIndicator from './TargetingIndicator' // DISABLED
import ShieldEffect from './ShieldEffect'
// import AttackLine from './AttackLine' // DISABLED
import GameOverScreen from './GameOverScreen'
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

const AutoBattleScreen = ({ playerTeam, opponentTeam, onBattleEnd, onBack, isPvP = false, pvpData = null }) => {
  const { publicKey } = useWallet()
  
  // Randomly select arena background (50/50 chance)
  const [arenaBackground] = useState(() => {
    const arenas = ['/assets/backgrounds/toyboxare1na.png', '/assets/backgrounds/toyboxarena2.png']
    return arenas[Math.random() < 0.5 ? 0 : 1]
  })
  
  // Create seeded random for PvP battles
  const battleRandom = useRef(
    isPvP && pvpData?.battleId 
      ? new SeededRandom(createBattleSeed(pvpData.battleId))
      : null
  )
  
  // Team states with unique instance IDs
  const [playerTeamState, setPlayerTeamState] = useState(() => 
    playerTeam.map((char, index) => ({
      ...char,
      instanceId: `player-${char.id}-${index}`, // Unique instance ID
      team: 'player',
      currentHealth: char.maxHealth,
      isAlive: true,
      position: { x: 0, y: 0 }
    }))
  )
  
  const [aiTeamState, setAiTeamState] = useState(() => {
    // In PvP mode, use the opponent's actual team
    const aiTeam = isPvP && opponentTeam ? opponentTeam : generateAITeam('normal')
    return aiTeam.map((char, index) => ({
      ...char,
      instanceId: `ai-${char.id}-${index}`, // Unique instance ID
      team: 'ai',
      currentHealth: char.maxHealth || 100,
      maxHealth: char.maxHealth || 100,
      isAlive: true,
      position: { x: 0, y: 0 }
    }))
  })
  
  // Battle states
  const [currentTurn, setCurrentTurn] = useState('player')
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [spellNotification, setSpellNotification] = useState(null)
  const [castingInfo, setCastingInfo] = useState(null)
  const [castingProgress, setCastingProgress] = useState(0)
  const [activeSpell, setActiveSpell] = useState(null)
  const [spellPositions, setSpellPositions] = useState(null)
  const [comboCounter, setComboCounter] = useState(0)
  const [turnCounter, setTurnCounter] = useState(0)
  const [serverTurnOrder, setServerTurnOrder] = useState('player1') // Track server's actual turn for PvP
  const [battleSpeed] = useState(0.7) // Increased speed by 40% (was 0.5)
  const [activeAttacker, setActiveAttacker] = useState(null) // Track the attacking character
  const [activeTargets, setActiveTargets] = useState([]) // Track who's being targeted
  const [healingTargets, setHealingTargets] = useState([]) // Track who's being healed
  const [attackInProgress, setAttackInProgress] = useState(false) // Track if attack animation is happening
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map()) // Track active shields
  const [frozenCharacters, setFrozenCharacters] = useState(new Map()) // Track frozen characters
  const [debuffedCharacters, setDebuffedCharacters] = useState(new Map()) // Track accuracy debuffs
  const [damageBuffedCharacters, setDamageBuffedCharacters] = useState(new Map()) // Track damage buffs
  const [criticalBuffedCharacters, setCriticalBuffedCharacters] = useState(new Map()) // Track critical buffs
  const [isPaused] = useState(false) // Remove pause functionality
  
  // Battle Statistics Tracking
  const [battleStats, setBattleStats] = useState({
    damageDealt: {},
    healingDone: {},
    ultimatesUsed: 0,
    totalDamage: 0,
    rounds: 0,
    kills: {},
    startTime: Date.now()
  })
  
  // Game Over Screen
  const [showGameOver, setShowGameOver] = useState(false)
  const [gameOverData, setGameOverData] = useState(null)
  
  // Visual states
  const [currentArena] = useState(() => Object.values(ARENAS)[Math.floor(Math.random() * Object.values(ARENAS).length)])
  const [damageNumbers, setDamageNumbers] = useState([])
  const [ultimateAlert, setUltimateAlert] = useState(null)
  const [currentSpellType, setCurrentSpellType] = useState('magic')
  const [particleIntensity, setParticleIntensity] = useState('normal')
  const [ultimateSpell, setUltimateSpell] = useState(null)
  
  const damageNumberId = useRef(0)
  const videoRef = useRef(null)
  const [showVideo, setShowVideo] = useState(false) // Only show video during critical
  const [criticalFlash, setCriticalFlash] = useState(false)
  const videoTimeoutRef = useRef(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current)
      }
    }
  }, [])
  
  // Helper functions for battle statistics
  const trackDamage = (casterId, amount) => {
    setBattleStats(prev => ({
      ...prev,
      damageDealt: {
        ...prev.damageDealt,
        [casterId]: (prev.damageDealt[casterId] || 0) + amount
      },
      totalDamage: prev.totalDamage + amount
    }))
  }
  
  const trackHealing = (casterId, amount) => {
    setBattleStats(prev => ({
      ...prev,
      healingDone: {
        ...prev.healingDone,
        [casterId]: (prev.healingDone[casterId] || 0) + amount
      }
    }))
  }
  
  const trackKill = (killerId, victimId) => {
    setBattleStats(prev => ({
      ...prev,
      kills: {
        ...prev.kills,
        [killerId]: (prev.kills[killerId] || 0) + 1
      }
    }))
  }
  
  const trackUltimate = () => {
    setBattleStats(prev => ({
      ...prev,
      ultimatesUsed: prev.ultimatesUsed + 1
    }))
  }
  
  const trackRound = () => {
    setBattleStats(prev => ({
      ...prev,
      rounds: prev.rounds + 1
    }))
  }
  
  // Initialize battle
  useEffect(() => {
    // Start battle music with crossfade
    musicManager.crossFade('/battlemusic.mp3', 'battle', 1000)
    
    // Setup PvP socket listeners if in PvP mode
    if (isPvP && pvpData?.socket) {
      const { socket, battleId } = pvpData
      
      console.log('AutoBattleScreen PvP mode: Setting up socket listeners')
      
      // Listen for battle initialization from server
      socket.on('battle_initialized', ({ state, seed }) => {
        console.log('Battle initialized with state:', state)
        // Initialize turn tracking
        setTurnCounter(0)
        setCurrentTurn(pvpData.playerNumber === 1 ? 'player' : 'ai')
        
        // Update teams from server state, ensuring character IDs are preserved
        const processTeam = (team) => team.map(char => ({
          ...char,
          id: char.id || char.instanceId?.split('-')[1], // Ensure id is set
        }))
        
        setPlayerTeamState(processTeam(pvpData.playerNumber === 1 ? state.player1Team : state.player2Team))
        setAiTeamState(processTeam(pvpData.playerNumber === 1 ? state.player2Team : state.player1Team))
      })
      
      // Listen for battle actions from server
      socket.on('battle_action', ({ action, state }) => {
        console.log('Received battle action from server:', action)
        console.log('New state from server:', state)
        
        // Update turn tracking from server
        setTurnCounter(state.currentTurn)
        // Store server's actual turn order for display
        setServerTurnOrder(state.turnOrder)
        // Map server turn order to client perspective
        const serverTurn = state.turnOrder === 'player1' ? 1 : 2
        setCurrentTurn(serverTurn === pvpData.playerNumber ? 'player' : 'ai')
        
        // Update teams with proper mapping to maintain character data
        const updatedPlayerTeam = pvpData.playerNumber === 1 ? state.player1Team : state.player2Team
        const updatedAiTeam = pvpData.playerNumber === 1 ? state.player2Team : state.player1Team
        
        // Update health and status from server
        setPlayerTeamState(prev => prev.map(char => {
          const updated = updatedPlayerTeam.find(c => c.instanceId === char.instanceId)
          if (updated) {
            return {
              ...char,
              currentHealth: updated.currentHealth,
              isAlive: updated.isAlive,
              shields: updated.shields || 0,
              status: updated.status || char.status
            }
          }
          return char
        }))
        
        setAiTeamState(prev => prev.map(char => {
          const updated = updatedAiTeam.find(c => c.instanceId === char.instanceId)
          if (updated) {
            return {
              ...char,
              currentHealth: updated.currentHealth,
              isAlive: updated.isAlive,
              shields: updated.shields || 0,
              status: updated.status || char.status
            }
          }
          return char
        }))
        
        // Display the action with animations
        setTimeout(() => {
          displayServerAction(action)
        }, 100)
      })
      
      socket.on('battle_complete', ({ winner, finalState }) => {
        console.log('Battle complete, winner:', winner)
        const won = winner === publicKey?.toString()
        onBattleEnd({
          winner: won ? 'player' : 'ai',
          survivingChars: won ? playerTeamState : aiTeamState,
          isPvP: true,
          wagerAmount: pvpData.wagerAmount
        })
      })
      
      socket.on('opponent_disconnected', () => {
        console.log('Opponent disconnected')
        // Auto-win after disconnect
        setTimeout(() => {
          onBattleEnd({
            winner: 'player',
            survivingChars: playerTeamState,
            isPvP: true,
            reason: 'opponent_disconnected'
          })
        }, 3000)
      })
      
      // Notify ready
      console.log('Emitting battle_ready for PvP battle')
      socket.emit('battle_ready', { battleId, wallet: publicKey?.toString() })
      
      return () => {
        socket.off('battle_initialized')
        socket.off('battle_action')
        socket.off('battle_complete')
        socket.off('opponent_disconnected')
      }
    }
  }, [isPvP, pvpData])


  // Auto-battle loop (disabled in PvP mode)
  useEffect(() => {
    // Skip auto-battle in PvP mode - server controls everything
    if (isPvP) return
    
    if (isPaused || isAnimating) return
    
    // Check if battle is over
    const alivePlayerChars = playerTeamState.filter(char => char.currentHealth > 0).length
    const aliveAIChars = aiTeamState.filter(char => char.currentHealth > 0).length
    
    if (alivePlayerChars === 0 || aliveAIChars === 0) {
      checkBattleEnd()
      return
    }
    
    const timer = setTimeout(() => {
      executeTurn()
    }, 3000 * (1 / battleSpeed))
    
    return () => clearTimeout(timer)
  }, [currentTurn, isAnimating, isPaused, battleSpeed, turnCounter, playerTeamState, aiTeamState, isPvP, pvpData])


  const displayServerAction = (action) => {
    // Display action from server in PvP mode
    if (action.type === 'skip_turn') {
      setSpellNotification({
        ability: { name: 'FROZEN', description: 'Skips turn due to being frozen!' },
        caster: action.caster
      })
      setTimeout(() => setSpellNotification(null), 2000)
      return
    }
    
    if (action.type === 'ability_used') {
      setIsAnimating(true)
      
      // Find the caster and target elements
      const casterChar = [...playerTeamState, ...aiTeamState].find(
        c => c.instanceId === action.caster.instanceId
      )
      const targetChars = action.targets.map(t => 
        [...playerTeamState, ...aiTeamState].find(c => c.instanceId === t.instanceId)
      ).filter(Boolean)
      
      // Show spell notification - prefer server data which has the image
      const notificationCaster = action.caster.image ? action.caster : (casterChar || action.caster)
      console.log('Action caster from server:', action.caster)
      console.log('Local casterChar found:', casterChar)
      console.log('Final notification caster:', notificationCaster)
      console.log('Has image?', notificationCaster?.image)
      
      setSpellNotification({
        ability: action.ability,
        caster: notificationCaster,
        targets: targetChars.length > 0 ? targetChars.map((char, idx) => ({
          ...char,
          ...action.targets[idx]
        })) : action.targets
      })
      
      // Calculate spell positions for animations
      setTimeout(() => {
        const casterElement = document.getElementById(`char-${action.caster.instanceId}`)
        const targetElements = action.targets.map(t => 
          document.getElementById(`char-${t.instanceId}`)
        ).filter(Boolean)
        
        if (casterElement && targetElements.length > 0) {
          const casterCard = casterElement.querySelector('.w-40') || casterElement
          const casterRect = casterCard.getBoundingClientRect()
          
          const targetPositions = targetElements.map(el => {
            const targetCard = el.querySelector('.w-40') || el
            const rect = targetCard.getBoundingClientRect()
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            }
          })
          
          setSpellPositions({
            caster: {
              x: casterRect.left + casterRect.width / 2,
              y: casterRect.top + casterRect.height / 2
            },
            targets: targetPositions
          })
          
          // Show spell effects with proper data
          // The server now sends the character's id directly
          setActiveSpell({
            ability: action.ability,
            caster: {
              ...(casterChar || action.caster),
              id: action.caster.id // Use the ID sent from server
            },
            targets: targetChars.length > 0 ? targetChars : action.targets
          })
        }
      }, 100)
      
      // Show damage numbers
      if (action.effects) {
        setTimeout(() => {
          action.effects.forEach(effect => {
            let displayAmount = effect.amount
            let displayType = 'damage'
            
            if (effect.type === 'damage') {
              displayType = effect.isCritical ? 'critical' : 'damage'
            } else if (effect.type === 'heal') {
              displayType = 'heal'
            } else if (effect.type === 'shield') {
              displayType = 'shield'
            } else if (effect.type === 'revive') {
              displayType = 'heal'
              displayAmount = 'REVIVED!'
            }
            
            showDamageNumber(displayAmount, displayType, effect.targetId, effect.isCritical)
          })
        }, 500)
      }
      
      // Clear effects after animation
      setTimeout(() => {
        setSpellNotification(null)
        setActiveSpell(null)
        setSpellPositions(null)
        setIsAnimating(false)
      }, 3000)
    }
  }
  
  const handleOpponentAction = (action) => {
    // Process opponent's action in PvP mode
    console.log('Received opponent action:', action)
    
    if (action.type === 'ability_used') {
      const { ability, caster, targets, damage, healing } = action
      
      // Show the same ability notification
      setSpellNotification({ 
        ability, 
        caster,
        targets
      })
      
      // Apply damage/healing to match opponent's action
      if (damage) {
        damage.forEach(({ targetId, amount, isCritical }) => {
          // Apply damage to the target
          const isPlayerTeam = targetId.startsWith('player')
          if (isPlayerTeam) {
            setPlayerTeamState(prev => prev.map(char => 
              char.instanceId === targetId 
                ? { ...char, currentHealth: Math.max(0, char.currentHealth - amount) }
                : char
            ))
          } else {
            setAiTeamState(prev => prev.map(char => 
              char.instanceId === targetId 
                ? { ...char, currentHealth: Math.max(0, char.currentHealth - amount) }
                : char
            ))
          }
          showDamageNumber(amount, 'damage', targetId, isCritical)
        })
      }
      
      if (healing) {
        healing.forEach(({ targetId, amount }) => {
          // Apply healing to the target
          const isPlayerTeam = targetId.startsWith('player')
          if (isPlayerTeam) {
            setPlayerTeamState(prev => prev.map(char => 
              char.instanceId === targetId 
                ? { ...char, currentHealth: Math.min(char.maxHealth, char.currentHealth + amount) }
                : char
            ))
          } else {
            setAiTeamState(prev => prev.map(char => 
              char.instanceId === targetId 
                ? { ...char, currentHealth: Math.min(char.maxHealth, char.currentHealth + amount) }
                : char
            ))
          }
          showDamageNumber(amount, 'heal', targetId)
        })
      }
      
      // Play the animation
      setIsAnimating(true)
      setTimeout(() => {
        setIsAnimating(false)
        // Switch turns after animation
        setCurrentTurn(prev => prev === 'player' ? 'ai' : 'player')
      }, 2000)
    }
  }
  
  const showDamageNumber = (amount, type, targetId, isCritical = false) => {
    const id = ++damageNumberId.current
    const newNumber = {
      id,
      amount,
      type,
      isCritical,
      targetId
    }
    
    setDamageNumbers(prev => [...prev, newNumber])
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(num => num.id !== id))
    }, 2000)
  }

  const showUltimateAlert = (abilityName, casterName) => {
    setUltimateAlert({ name: abilityName, caster: casterName })
    playPowerUpSound()
    
    setTimeout(() => {
      setUltimateAlert(null)
    }, 3000)
  }

  const executeTurn = () => {
    const isPlayerTurn = currentTurn === 'player'
    const attackingTeam = isPlayerTurn ? playerTeamState : aiTeamState
    const defendingTeam = isPlayerTurn ? aiTeamState : playerTeamState
    
    // In PvP mode, emit actions to opponent
    if (isPvP && pvpData?.socket && isPlayerTurn) {
      const action = {
        type: 'turn',
        characterIndex: activeCharacterIndex,
        timestamp: Date.now()
      }
      pvpData.socket.emit('battle_action', {
        battleId: pvpData.battleId,
        action,
        wallet: publicKey?.toString()
      })
    }
    
    // Find next alive character
    const aliveAttackers = attackingTeam.filter(char => char.currentHealth > 0)
    if (aliveAttackers.length === 0) {
      checkBattleEnd()
      return
    }
    
    const activeCharacter = aliveAttackers[activeCharacterIndex % aliveAttackers.length]
    
    // Check if character is frozen - if so, skip their turn
    if (frozenCharacters.has(activeCharacter.instanceId)) {
      console.log(`${activeCharacter.name} is frozen and skips their turn!`)
      
      // Remove freeze after skipping turn
      setFrozenCharacters(prev => {
        const newMap = new Map(prev)
        newMap.delete(activeCharacter.instanceId)
        return newMap
      })
      
      // Show frozen notification
      setSpellNotification({ 
        ability: { name: 'FROZEN', description: 'Skips turn due to being frozen!', effect: 'frozen' }, 
        caster: activeCharacter 
      })
      
      setTimeout(() => {
        endTurn()
      }, 1500)
      return
    }
    
    // Select random ability based on weighted chances
    // Check if character has accuracy debuff (soap spray effect)
    const hasAccuracyDebuff = debuffedCharacters.has(activeCharacter.instanceId)
    const missChance = hasAccuracyDebuff ? 0.4 : 0 // 40% miss chance when debuffed
    
    // Check if attack misses due to debuff
    if (hasAccuracyDebuff && Math.random() < missChance) {
      // Attack missed!
      showDamageNumber('MISS', 'miss', activeCharacter.instanceId)
      
      // Remove debuff after it causes a miss
      setDebuffedCharacters(prev => {
        const next = new Map(prev)
        next.delete(activeCharacter.instanceId)
        return next
      })
      
      return // Skip this turn
    }
    
    // Use seeded random for ability selection in PvP
    const selectedAbility = isPvP && battleRandom.current 
      ? battleRandom.current.randomWeighted(activeCharacter.abilities)
      : selectRandomAbility(activeCharacter)
    
    // Show spell notification (will be updated with targets later)
    setSpellNotification({ ability: selectedAbility, caster: activeCharacter })
    
    // Play ability sound if available
    if (selectedAbility.isUltimate && activeCharacter.ultimateSound) {
      // Play ultimate sound for ultimate abilities
      const ultimateAudio = new Audio(activeCharacter.ultimateSound)
      ultimateAudio.volume = 0.6
      ultimateAudio.play().catch(err => console.log(`Could not play ultimate sound for ${activeCharacter.name}:`, err))
    } else if (activeCharacter.abilitySound) {
      // Play regular ability sound
      const abilityAudio = new Audio(activeCharacter.abilitySound)
      abilityAudio.volume = 0.5
      abilityAudio.play().catch(err => console.log(`Could not play ability sound for ${activeCharacter.name}:`, err))
    }
    
    // Update particle type based on spell
    if (selectedAbility.effect === 'damage' || selectedAbility.effect === 'damage_all') {
      setCurrentSpellType('fire')
    } else if (selectedAbility.effect === 'heal' || selectedAbility.effect === 'heal_all') {
      setCurrentSpellType('nature')
    } else if (selectedAbility.isUltimate) {
      setCurrentSpellType('holy')
    } else {
      setCurrentSpellType('magic')
    }
    
    setParticleIntensity(selectedAbility.isUltimate ? 'high' : 'normal')
    
    // Show ultimate overlay for ultimate abilities
    if (selectedAbility.isUltimate) {
      trackUltimate() // Track ultimate usage for stats
      setUltimateSpell({
        name: selectedAbility.name,
        caster: activeCharacter.name
      })
      setTimeout(() => setUltimateSpell(null), 3000)
    }
    
    // Start casting bar animation
    setCastingInfo({ caster: activeCharacter, ability: selectedAbility })
    setCastingProgress(0)
    
    // Animate casting progress
    let progress = 0
    const castingInterval = setInterval(() => {
      progress += 10
      if (progress >= 100) {
        clearInterval(castingInterval)
        setCastingInfo(null)
      } else {
        setCastingProgress(progress)
      }
    }, 150)
    
    // Calculate positions for spell effects
    // Use a timeout to ensure DOM is ready
    setTimeout(() => {
      const casterElement = document.getElementById(`char-${activeCharacter.instanceId}`)
      const targetElements = targets.map(t => document.getElementById(`char-${t.instanceId}`))
      
      if (casterElement && targetElements.length > 0) {
        const casterRect = casterElement.getBoundingClientRect()
        const targetRects = targetElements
          .filter(el => el !== null)
          .map(el => el.getBoundingClientRect())
        
        if (targetRects.length > 0) {
          setSpellPositions({
            caster: {
              x: casterRect.left + casterRect.width / 2,
              y: casterRect.top + casterRect.height / 2
            },
            targets: targetRects.map(rect => ({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            }))
          })
        }
      }
    }, 100)
    
    // Determine targets based on ability effect
    // IMPORTANT: Offensive spells target enemies, support spells target allies
    let targets = []
    
    // Offensive abilities - target ENEMIES only
    if (selectedAbility.effect === 'damage' || selectedAbility.effect === 'multi_damage' || selectedAbility.effect === 'damage_burn') {
      const validTargets = defendingTeam.filter(char => char.currentHealth > 0)
      if (validTargets.length > 0) {
        const target = validTargets[Math.floor(Math.random() * validTargets.length)]
        targets = [target]
      }
    } else if (selectedAbility.effect === 'damage_all' || selectedAbility.effect === 'damage_cascade') {
      targets = defendingTeam.filter(char => char.currentHealth > 0)
    } else if (selectedAbility.effect === 'freeze_all') {
      // Ice Nova - targets all living enemies
      targets = defendingTeam.filter(char => char.currentHealth > 0)
    } else if (selectedAbility.effect === 'damage_chain') {
      // Lightning chain - targets up to 3 enemies
      const validTargets = defendingTeam.filter(char => char.currentHealth > 0)
      targets = validTargets.slice(0, 3)
    } 
    // Healing/Support abilities - target ALLIES only
    else if (selectedAbility.effect === 'heal' || selectedAbility.effect === 'shield' || selectedAbility.effect === 'heal_shield') {
      const validTargets = attackingTeam.filter(char => char.currentHealth > 0)
      if (validTargets.length > 0) {
        // Prioritize low health allies for healing
        const sortedByHealth = validTargets.sort((a, b) => (a.currentHealth / a.maxHealth) - (b.currentHealth / b.maxHealth))
        const target = sortedByHealth[0]
        targets = [target]
      }
    } else if (selectedAbility.effect === 'heal_all') {
      targets = attackingTeam.filter(char => char.currentHealth > 0)
    } else if (selectedAbility.effect === 'shield_all') {
      // Shield all living allies
      targets = attackingTeam.filter(char => char.currentHealth > 0)
    } else if (selectedAbility.effect === 'heal_revive_all') {
      // Include ALL allies, dead or alive, for revival ultimate
      targets = attackingTeam
    } 
    // Mixed abilities
    else if (selectedAbility.effect === 'both') {
      const enemyTargets = defendingTeam.filter(char => char.currentHealth > 0)
      const allyTargets = attackingTeam.filter(char => char.currentHealth > 0)
      
      if (enemyTargets.length > 0) {
        const damageTarget = enemyTargets[Math.floor(Math.random() * enemyTargets.length)]
        targets.push({ ...damageTarget, isDamage: true })
      }
      if (allyTargets.length > 0) {
        const healTarget = allyTargets[Math.floor(Math.random() * allyTargets.length)]
        targets.push({ ...healTarget, isHeal: true })
      }
    } else if (selectedAbility.effect === 'chaos' || selectedAbility.effect === 'supernova' || selectedAbility.effect === 'apocalypse') {
      // Special ultimate effects - damage all enemies, heal all allies
      const enemyTargets = defendingTeam.filter(char => char.currentHealth > 0)
      const allyTargets = attackingTeam.filter(char => char.currentHealth > 0)
      
      targets = [
        ...enemyTargets.map(t => ({ ...t, isDamage: true })),
        ...allyTargets.map(t => ({ ...t, isHeal: true }))
      ]
    }
    
    // Default to damage effect if not specified
    else {
      const validTargets = defendingTeam.filter(char => char.currentHealth > 0)
      if (validTargets.length > 0) {
        const target = validTargets[Math.floor(Math.random() * validTargets.length)]
        targets = [target]
      }
    }
    
    if (targets.length === 0) {
      endTurn()
      return
    }
    
    // Update spell notification with targets
    setSpellNotification({ 
      ability: selectedAbility, 
      caster: activeCharacter,
      targets: targets.map(t => ({
        name: t.name,
        emoji: t.emoji,
        image: t.image,
        team: isPlayerTurn ? 'ai' : 'player'
      }))
    })
    
    // Set up attack focus - attacker stands out, others blur
    const mainTarget = targets[0]
    if (mainTarget) {
      setActiveAttacker(activeCharacter)
      setAttackInProgress(true)
      
      // Clear previous indicators
      setActiveTargets([])
      setHealingTargets([])
      
      // Set new indicators based on ability type - Skip for Unicorn and Phoenix Dragon
      // For single target abilities, only show indicator on the main target
      // For multi-target abilities, show indicators on all targets
      if (activeCharacter.id !== 'unicorn_warrior' && activeCharacter.id !== 'phoenix_dragon' && activeCharacter.id !== 'robo_fighter' && activeCharacter.id !== 'wizard_toy') {
        if (selectedAbility.effect === 'heal' || selectedAbility.effect === 'heal_shield') {
          // Single target heal - only show on main target
          setHealingTargets([mainTarget.instanceId])
        } else if (selectedAbility.effect === 'heal_all') {
          // Multi-target heal - show on all targets
          setHealingTargets(targets.map(t => t.instanceId))
        } else if (selectedAbility.effect === 'shield') {
          // Shield - typically single target
          setHealingTargets([mainTarget.instanceId])
        } else if (selectedAbility.effect === 'shield_all') {
          // Shield all - show on all allies
          setHealingTargets(targets.map(t => t.instanceId))
        } else if (selectedAbility.effect === 'damage' || selectedAbility.effect === 'damage_burn') {
          // Single target damage - only show on main target
          setActiveTargets([mainTarget.instanceId])
        } else if (selectedAbility.effect === 'damage_all' || selectedAbility.effect === 'multi_damage' || selectedAbility.effect === 'damage_cascade') {
          // Multi-target damage - show on all targets
          setActiveTargets(targets.map(t => t.instanceId))
        } else if (selectedAbility.effect === 'chaos' || selectedAbility.effect === 'supernova' || selectedAbility.effect === 'apocalypse') {
          // Ultimate abilities - show on all affected targets
          setActiveTargets(targets.map(t => t.instanceId))
        } else {
          // Default to single target damage indicator
          setActiveTargets([mainTarget.instanceId])
        }
      }
    }
    
    // Wait for characters to slide to center, then execute ability
    setTimeout(() => {
      // Only create spell effects if we have valid targets
      if (targets.length > 0) {
        // Calculate spell positions after slide animation completes
        setTimeout(() => {
          const casterElement = document.getElementById(`char-${activeCharacter.instanceId}`)
          const targetElements = targets.map(t => document.getElementById(`char-${t.instanceId}`))
          
          if (casterElement && targetElements.length > 0) {
            // Get the actual card element position
            const casterCard = casterElement.querySelector('.w-40') || casterElement
            const casterRect = casterCard.getBoundingClientRect()
            
            const targetPositions = targetElements
              .filter(el => el !== null)
              .map(el => {
                const targetCard = el.querySelector('.w-40') || el
                const rect = targetCard.getBoundingClientRect()
                return {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                }
              })
            
            if (targetPositions.length > 0) {
              setSpellPositions({
                caster: {
                  x: casterRect.left + casterRect.width / 2,
                  y: casterRect.top + casterRect.height / 2
                },
                targets: targetPositions
              })
              
              // Create spell effect only if we have positions
              setActiveSpell({
                ability: selectedAbility,
                caster: activeCharacter,
                targets: targets
              })
            }
          }
        }, 200) // Small delay to ensure DOM is updated
        
        // Execute ability
        setIsAnimating(true)
      }
    
    // Apply effects after animation
    setTimeout(() => {
      applyAbilityEffects(selectedAbility, activeCharacter, targets, isPlayerTurn)
      
      // Clear spell effects
      setTimeout(() => {
        setActiveSpell(null)
        setSpellPositions(null)
        setParticleIntensity('normal')
        // Clear all visual states
        setActiveAttacker(null)
        setAttackInProgress(false)
        setActiveTargets([])
        setHealingTargets([])
      }, 500)
      
      // Handle multi-hit abilities
      if (selectedAbility.hits && selectedAbility.hits > 1) {
        let hitCount = 1
        const hitInterval = setInterval(() => {
          if (hitCount >= selectedAbility.hits) {
            clearInterval(hitInterval)
            endTurn()
            return
          }
          
          const newTarget = selectRandomTarget(defendingTeam)
          if (newTarget) {
            applyAbilityEffects(selectedAbility, activeCharacter, [newTarget], isPlayerTurn)
          }
          hitCount++
        }, 300)
      } else {
        endTurn()
      }
    }, 1500 / battleSpeed)
    }, 1000) // Wait for slide animation
  }

  const applyAbilityEffects = (ability, caster, targets, isPlayerAttacking) => {
    // Handle damage buff for all allies (Wind Tension)
    if (ability.effect === 'buff_damage_all') {
      const buffAmount = ability.buffDamage || 15
      const allAllies = isPlayerAttacking ? playerTeamState : aiTeamState
      
      allAllies.forEach(ally => {
        if (ally.isAlive) {
          setDamageBuffedCharacters(prev => {
            const newMap = new Map(prev)
            newMap.set(ally.instanceId, { amount: buffAmount, turnsRemaining: 1 })
            return newMap
          })
          
          // Show buff notification
          showDamageNumber(`+${buffAmount} ATK`, 'buff', ally.id)
        }
      })
      
      return // Buff applied, no further processing needed
    }
    
    // Handle critical buff for all allies (Forward March)
    if (ability.effect === 'buff_critical_all') {
      const critBoost = ability.criticalBoost || 0.5
      const allAllies = isPlayerAttacking ? playerTeamState : aiTeamState
      
      allAllies.forEach(ally => {
        if (ally.isAlive) {
          setCriticalBuffedCharacters(prev => {
            const newMap = new Map(prev)
            // Permanent buff - no turns limit
            newMap.set(ally.instanceId, { boost: critBoost, permanent: true })
            return newMap
          })
          
          // Show buff notification
          showDamageNumber(`+${Math.round(critBoost * 100)}% CRIT`, 'buff', ally.id)
        }
      })
      
      // Track ultimate usage
      if (ability.isUltimate) {
        trackUltimate()
      }
      
      return // Buff applied, no further processing needed
    }
    
    // Check for accuracy debuff abilities (soap spray)
    if (ability.effect === 'debuff_accuracy') {
      const damageAmount = ability.damage || 10
      targets.forEach(target => {
        // Apply small damage
        if (damageAmount > 0) {
          const targetTeam = target.team === 'player' ? playerTeamState : aiTeamState
          const teamSetter = target.team === 'player' ? setPlayerTeamState : setAiTeamState
          
          teamSetter(prev => prev.map(char => {
            if (char.instanceId === target.instanceId) {
              const actualDamage = Math.min(damageAmount, char.currentHealth)
              showDamageNumber(actualDamage, 'damage', char.id)
              trackDamage(caster.id, actualDamage) // Track damage for stats
              return { ...char, currentHealth: Math.max(0, char.currentHealth - actualDamage) }
            }
            return char
          }))
        }
        
        // Apply accuracy debuff
        setDebuffedCharacters(prev => {
          const newMap = new Map(prev)
          newMap.set(target.instanceId, { type: 'accuracy', duration: 2 })
          return newMap
        })
        
        // Show debuff notification
        showDamageNumber('ACCURACY ↓', 'debuff', target.id)
      })
      return
    }
    
    // Check for shield abilities
    if (ability.effect === 'shield') {
      // Apply shield to target ally (first target in the targets array)
      const shieldAmount = ability.shield || 30
      const targetAlly = targets[0] // Shield is applied to the selected ally
      
      if (targetAlly) {
        setShieldedCharacters(prev => {
          const newMap = new Map(prev)
          const existingShield = newMap.get(targetAlly.instanceId) || { amount: 0 }
          newMap.set(targetAlly.instanceId, { 
            amount: existingShield.amount + shieldAmount,
            maxAmount: existingShield.amount + shieldAmount,
            type: 'energy' 
          })
          return newMap
        })
        
        // Show shield amount on the target
        showDamageNumber(shieldAmount, 'shield', targetAlly.id)
      }
      return // Shield doesn't need further processing
    }
    
    // Check for shield_all abilities
    if (ability.effect === 'shield_all') {
      // Apply shield to all living allies
      const shieldAmount = ability.shield || 15
      
      targets.forEach(ally => {
        setShieldedCharacters(prev => {
          const newMap = new Map(prev)
          const existingShield = newMap.get(ally.instanceId) || { amount: 0 }
          newMap.set(ally.instanceId, { 
            amount: Math.min(existingShield.amount + shieldAmount, 100), // Cap at 100
            maxAmount: Math.min(existingShield.amount + shieldAmount, 100),
            type: 'energy' 
          })
          return newMap
        })
        
        // Show shield amount on each ally
        showDamageNumber(shieldAmount, 'shield', ally.id)
      })
      
      return // Shield_all doesn't need further processing
    }
    
    // Handle heal_all effect for regular heal all abilities
    if (ability.effect === 'heal_all') {
      const healAmount = ability.healAll || 100
      const teamToHeal = isPlayerAttacking ? playerTeamState : aiTeamState
      const teamSetter = isPlayerAttacking ? setPlayerTeamState : setAiTeamState
      
      teamSetter(prev => prev.map(char => {
        if (char.currentHealth > 0) {
          const actualHeal = Math.min(healAmount, char.maxHealth - char.currentHealth)
          const newHealth = char.currentHealth + actualHeal
          
          if (actualHeal > 0) {
            showDamageNumber(actualHeal, 'heal', char.id)
          }
          
          return { ...char, currentHealth: newHealth }
        }
        return char
      }))
      
      playHealSound()
      return // heal_all doesn't need further processing
    }
    
    // Handle heal_revive_all effect for Recharge Batteries ultimate
    if (ability.effect === 'heal_revive_all') {
      const healAmount = ability.healAll || 50
      const teamToHeal = isPlayerAttacking ? playerTeamState : aiTeamState
      const teamSetter = isPlayerAttacking ? setPlayerTeamState : setAiTeamState
      
      teamSetter(prev => prev.map(char => {
        // Revive dead allies with 50% max health
        if (char.currentHealth === 0) {
          const reviveHealth = Math.floor(char.maxHealth * 0.5)
          showDamageNumber(reviveHealth, 'revive', char.id)
          return { ...char, currentHealth: reviveHealth, isAlive: true }
        }
        // Heal living allies
        else {
          const actualHeal = Math.min(healAmount, char.maxHealth - char.currentHealth)
          const newHealth = char.currentHealth + actualHeal
          
          if (actualHeal > 0) {
            showDamageNumber(actualHeal, 'heal', char.id)
          }
          
          return { ...char, currentHealth: newHealth }
        }
      }))
      
      playHealSound()
      playPowerUpSound() // Extra sound for revival
      return // heal_revive_all doesn't need further processing
    }
    
    // Handle freeze_all effect for Ice Nova
    if (ability.effect === 'freeze_all') {
      const freezeDamage = ability.damage || 50
      
      targets.forEach(target => {
        // Apply freeze damage with attack stat
        let damage = calculateDamageWithRarity(freezeDamage, caster.rarity, caster.stats?.attack)
        
        // Apply defense reduction
        damage = calculateDefenseReduction(damage, target.rarity, target.stats?.defense)
        
        // Check for shields
        const targetShield = shieldedCharacters.get(target.instanceId)
        if (targetShield && targetShield.amount > 0) {
          const shieldAbsorbed = Math.min(damage, targetShield.amount)
          damage = damage - shieldAbsorbed
          
          setShieldedCharacters(prev => {
            const newMap = new Map(prev)
            const shield = newMap.get(target.instanceId)
            if (shield) {
              const newAmount = shield.amount - shieldAbsorbed
              if (newAmount <= 0) {
                newMap.delete(target.instanceId)
              } else {
                newMap.set(target.instanceId, { ...shield, amount: newAmount })
              }
            }
            return newMap
          })
        }
        
        // Apply damage
        const teamSetter = isPlayerAttacking ? setAiTeamState : setPlayerTeamState
        teamSetter(prev => prev.map(char => {
          if (char.instanceId === target.instanceId) {
            const newHealth = Math.max(0, char.currentHealth - damage)
            showDamageNumber(damage, 'damage', char.id)
            trackDamage(caster.id, damage) // Track damage for stats
            if (newHealth === 0 && char.currentHealth > 0) {
              trackKill(caster.id, char.id) // Track kill
              // Play defeat sound when a toy is defeated
              const defeatSound = new Audio('/defeat.wav')
              defeatSound.volume = 0.5
              defeatSound.play().catch(err => console.log('Defeat sound failed:', err))
            }
            return { ...char, currentHealth: newHealth }
          }
          return char
        }))
        
        // Apply freeze status (only if target survives)
        if (target.currentHealth - damage > 0) {
          setFrozenCharacters(prev => {
            const newMap = new Map(prev)
            newMap.set(target.instanceId, { frozen: true, turnsRemaining: 1 })
            return newMap
          })
        }
      })
      
      return // freeze_all doesn't need further processing
    }
    
    // Handle damage_chain effect for Lightning Zap
    if (ability.effect === 'damage_chain') {
      const chainDamage = ability.damage || 30
      
      targets.forEach((target, index) => {
        // Reduce damage for each chain (100%, 75%, 50%)
        const damageMultiplier = index === 0 ? 1 : index === 1 ? 0.75 : 0.5
        let damage = calculateDamageWithRarity(chainDamage * damageMultiplier, caster.rarity, caster.stats?.attack)
        
        // Apply defense reduction
        damage = calculateDefenseReduction(damage, target.rarity, target.stats?.defense)
        
        // Apply damage (similar to normal damage but with chain reduction)
        const teamSetter = isPlayerAttacking ? setAiTeamState : setPlayerTeamState
        teamSetter(prev => prev.map(char => {
          if (char.instanceId === target.instanceId) {
            const newHealth = Math.max(0, char.currentHealth - damage)
            showDamageNumber(Math.round(damage), 'damage', char.id)
            trackDamage(caster.id, Math.round(damage)) // Track damage for stats
            if (newHealth === 0 && char.currentHealth > 0) {
              trackKill(caster.id, char.id) // Track kill
              // Play defeat sound when a toy is defeated
              const defeatSound = new Audio('/defeat.wav')
              defeatSound.volume = 0.5
              defeatSound.play().catch(err => console.log('Defeat sound failed:', err))
            }
            return { ...char, currentHealth: newHealth }
          }
          return char
        }))
      })
      
      return // damage_chain doesn't need further processing
    }
    
    // Combat log entry is now added when spell notification is shown (moved to earlier in the code)
    
    targets.forEach((target, targetIndex) => {
      if (target.isDamage || (!target.isHeal && (ability.effect === 'damage' || ability.effect === 'multi_damage' || ability.effect === 'damage_all' || ability.effect === 'damage_burn' || ability.effect === 'damage_cascade' || ability.effect === 'apocalypse'))) {
        // Apply damage with attack stat
        let damage = calculateDamageWithRarity(ability.damage || 0, caster.rarity, caster.stats?.attack)
        
        // Apply damage buff if active
        const damageBuff = damageBuffedCharacters.get(caster.instanceId)
        if (damageBuff && damageBuff.amount > 0) {
          damage += damageBuff.amount
          // Remove buff after use (one-time use)
          setDamageBuffedCharacters(prev => {
            const newMap = new Map(prev)
            newMap.delete(caster.instanceId)
            return newMap
          })
        }
        
        // Apply cascade multiplier if it's a cascade effect
        if (ability.effect === 'damage_cascade' && ability.cascadeDamage) {
          const multiplier = ability.cascadeDamage[targetIndex] || ability.cascadeDamage[ability.cascadeDamage.length - 1]
          damage = Math.floor(damage * multiplier)
        }
        
        // Apply defense reduction
        damage = calculateDefenseReduction(damage, target.rarity, target.stats?.defense)
        
        // Check if target has shield
        const targetShield = shieldedCharacters.get(target.instanceId)
        let damageAfterShield = damage
        let shieldAbsorbed = 0
        
        if (targetShield && targetShield.amount > 0) {
          shieldAbsorbed = Math.min(damage, targetShield.amount)
          damageAfterShield = damage - shieldAbsorbed
          
          // Update shield amount
          setShieldedCharacters(prev => {
            const newMap = new Map(prev)
            const shield = newMap.get(target.instanceId)
            if (shield) {
              const newAmount = shield.amount - shieldAbsorbed
              if (newAmount <= 0) {
                newMap.delete(target.instanceId)
              } else {
                newMap.set(target.instanceId, { ...shield, amount: newAmount })
              }
            }
            return newMap
          })
          
          // Show shield absorbed damage
          if (shieldAbsorbed > 0) {
            showDamageNumber(shieldAbsorbed, 'shield_absorb', target.id)
          }
        }
        
        damage = damageAfterShield
        
        // Critical hit chance with buffs
        let criticalChance = 0.15 // Base 15% chance
        const critBuff = criticalBuffedCharacters.get(caster.instanceId)
        if (critBuff && critBuff.boost > 0) {
          criticalChance += critBuff.boost // Add buff (e.g., +50% makes it 65%)
        }
        
        const isCritical = Math.random() < criticalChance
        if (isCritical) {
          damage = Math.round(damage * 1.5)
          playCriticalSound()
          
          // Show video background on critical hit
          setShowVideo(true)
          
          // Clear any existing timeout
          if (videoTimeoutRef.current) {
            clearTimeout(videoTimeoutRef.current)
          }
          
          // Play video from start
          if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.play()
          }
          
          // Return to static background after 6 seconds
          videoTimeoutRef.current = setTimeout(() => {
            setShowVideo(false)
          }, 6000)
          
          // Trigger flash effect
          setCriticalFlash(true)
          setTimeout(() => setCriticalFlash(false), 300)
        }
        
        // Combo multiplier
        if (isPlayerAttacking && comboCounter > 2) {
          damage = Math.round(damage * (1 + comboCounter * 0.1))
        }
        
        // Apply damage
        const teamSetter = target.isDamage === undefined 
          ? (isPlayerAttacking ? setAiTeamState : setPlayerTeamState)
          : (target.isHeal ? setPlayerTeamState : setAiTeamState)
        
        teamSetter(prev => prev.map(char => {
          if (char.id === target.id) {
            const newHealth = Math.max(0, char.currentHealth - damage)
            showDamageNumber(damage, 'damage', char.id, isCritical)
            trackDamage(caster.id, damage) // Track damage for stats
            
            if (newHealth === 0 && char.currentHealth > 0) {
              trackKill(caster.id, char.id) // Track kill
              // Play defeat sound when a toy is defeated
              const defeatSound = new Audio('/defeat.wav')
              defeatSound.volume = 0.5
              defeatSound.play().catch(err => console.log('Defeat sound failed:', err))
            }
            
            return { ...char, currentHealth: newHealth }
          }
          return char
        }))
        
        // Remove beeping sound
        // playHitSound()
        
        if (isPlayerAttacking) {
          setComboCounter(prev => prev + 1)
        }
      }
      
      if (target.isHeal || ability.effect === 'heal' || ability.effect === 'heal_all' || ability.effect === 'heal_shield' || ability.effect === 'apocalypse') {
        // Apply healing
        const healAmount = ability.heal || 0
        const teamSetter = target.isHeal === undefined
          ? (isPlayerAttacking ? setPlayerTeamState : setAiTeamState)
          : (target.isHeal ? setPlayerTeamState : setAiTeamState)
        
        teamSetter(prev => prev.map(char => {
          if (char.id === target.id && char.currentHealth > 0) {
            const actualHeal = Math.min(healAmount, char.maxHealth - char.currentHealth)
            const newHealth = char.currentHealth + actualHeal
            
            if (actualHeal > 0) {
              showDamageNumber(actualHeal, 'heal', char.id)
              trackHealing(caster.id, actualHeal) // Track healing for stats
            }
            
            return { ...char, currentHealth: newHealth }
          }
          return char
        }))
        
        // Remove beeping sound
        // playHealSound()
      }
    })
    
    // Play combo sound
    if (comboCounter > 0 && comboCounter % 3 === 0) {
      playComboSound(comboCounter)
    }
  }

  const endTurn = () => {
    setIsAnimating(false)
    setTurnCounter(prev => prev + 1)
    trackRound() // Track round for statistics
    
    // Check if battle should end
    const alivePlayerChars = playerTeamState.filter(char => char.currentHealth > 0).length
    const aliveAIChars = aiTeamState.filter(char => char.currentHealth > 0).length
    
    if (alivePlayerChars === 0 || aliveAIChars === 0) {
      checkBattleEnd()
      return
    }
    
    // Update active character index
    if (currentTurn === 'player') {
      setActiveCharacterIndex(prev => (prev + 1) % 3)
      setCurrentTurn('ai')
    } else {
      setActiveCharacterIndex(prev => (prev + 1) % 3)
      setCurrentTurn('player')
      setComboCounter(0) // Reset combo on AI turn
    }
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
        
        // Determine if the actual player won (important for multiplayer)
        const playerWon = isPvP ? 
          (pvpData?.playerNumber === 1 && winner === 'player') || (pvpData?.playerNumber === 2 && winner === 'ai') :
          winner === 'player'
        
        // Play player win/lose sound after team sound finishes
        teamSound.addEventListener('ended', () => {
          const playerResultSound = new Audio(playerWon ? '/gamewin.wav' : '/gamelose.wav')
          playerResultSound.volume = 0.6  // Also increased volume
          playerResultSound.play().then(() => {
            console.log(`Playing ${playerWon ? 'win' : 'lose'} sound`)
            // Resume music after victory sounds finish
            setTimeout(() => {
              musicManager.resumeMusic()
            }, 2000)
          }).catch(err => console.log('Player result sound failed:', err))
        })
      }, 200) // Small delay to ensure music pause takes effect
      
      // Show game over screen with battle stats
      setTimeout(() => {
        setGameOverData({
          winner,
          battleStats,
          playerTeam: playerTeamState,
          enemyTeam: aiTeamState,
          betAmount: isPvP && pvpData?.wagerAmount ? pvpData.wagerAmount : 0,
          isPvP
        })
        setShowGameOver(true)
      }, 1500)
    }
  }
  
  const handleGameOverContinue = () => {
    // Transition back to menu music
    musicManager.crossFade('/menumusic.mp3', 'menu', 1000)
    
    if (gameOverData) {
      const result = {
        winner: gameOverData.winner,
        playerTeam: playerTeamState,
        aiTeam: aiTeamState,
        turns: turnCounter,
        stats: battleStats,
        survivingChars: gameOverData.winner === 'player' ? playerTeamState : aiTeamState
      }
      
      onBattleEnd(result)
    } else {
      // Fallback if no game over data
      onBattleEnd({
        winner: 'player',
        survivingChars: playerTeamState
      })
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'from-red-500 to-yellow-500'
      case 'legendary': return 'from-yellow-400 to-orange-500'
      case 'epic': return 'from-purple-400 to-pink-500'
      case 'rare': return 'from-blue-400 to-cyan-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Static Background (always visible) - randomly selected arena */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${arenaBackground})` }}
      />
      
      {/* Video Background (only during critical hits, overlays static) */}
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={() => setShowVideo(false)} // Also end when video completes
        >
          <source src="/assets/backgrounds/moviebg.mp4" type="video/mp4" />
        </video>
      )}
      
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      
      {/* Critical Hit Flash Effect */}
      {criticalFlash && (
        <div className="absolute inset-0 bg-white animate-flash pointer-events-none z-50" />
      )}
      
      {/* Ultimate Spell Overlay */}
      <UltimateSpellOverlay 
        isActive={!!ultimateSpell}
        spellName={ultimateSpell?.name}
        casterName={ultimateSpell?.caster}
      />
      
      {/* Particle Effects */}
      <ParticleEffects type={currentArena.particleEffect || 'stars'} count={30} />
      
      {/* Magic Particles */}
      {activeSpell && (
        <MagicParticles 
          type={currentSpellType} 
          intensity={particleIntensity}
          color={activeSpell.caster.color}
        />
      )}
      
      {/* Attack Line Indicator - DISABLED
      {attackInProgress && spellPositions && activeAttacker?.id !== 'unicorn_warrior' && activeAttacker?.id !== 'phoenix_dragon' && activeAttacker?.id !== 'robo_fighter' && activeAttacker?.id !== 'wizard_toy' && activeAttacker?.id !== 'brick_dude' && (
        <AttackLine
          casterPosition={spellPositions.caster}
          targetPositions={spellPositions.targets}
          isActive={true}
        />
      )} */}
      
      {/* Enhanced Spell Effects Layer - Skip for special characters */}
      {activeSpell && spellPositions && activeSpell.caster?.id !== 'unicorn_warrior' && activeSpell.caster?.id !== 'phoenix_dragon' && activeSpell.caster?.id !== 'robo_fighter' && activeSpell.caster?.id !== 'wizard_toy' && (
        <EnhancedSpellEffects 
          activeSpell={activeSpell}
          casterPosition={spellPositions.caster}
          targetPositions={spellPositions.targets}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Unicorn Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'unicorn_warrior' && (
        <UnicornSpellEffects
          spell={activeSpell.ability.animation || activeSpell.ability.id}
          caster={spellPositions?.caster}
          target={spellPositions?.targets?.[0]}
          isActive={true}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Phoenix Dragon Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'phoenix_dragon' && (
        <PhoenixDragonEffects
          activeSpell={activeSpell}
          casterPosition={spellPositions?.caster}
          targetPositions={spellPositions?.targets}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Robo Fighter Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'robo_fighter' && (
        <RoboFighterEffects
          activeSpell={activeSpell}
          spellPositions={spellPositions}
          playerPositions={playerTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          opponentPositions={aiTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Wizard Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'wizard_toy' && (
        <WizardEffects
          activeSpell={activeSpell}
          spellPositions={spellPositions}
          playerPositions={playerTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          opponentPositions={aiTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Pirate Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'pirate_captain' && (
        <PirateEffects
          activeSpell={activeSpell}
          spellPositions={spellPositions}
          playerPositions={playerTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          opponentPositions={aiTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Rubber Duckie Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'rubber_duckie' && (
        <RubberDuckieEffects
          activeSpell={activeSpell}
          spellPositions={spellPositions}
          playerPositions={playerTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          opponentPositions={aiTeamState.map(char => ({ element: document.getElementById(`char-${char.instanceId}`) }))}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Brick Dude Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'brick_dude' && (
        <BrickDudeEffects
          spell={activeSpell}
          positions={spellPositions}
          onComplete={() => {
            setActiveSpell(null)
            setSpellPositions(null)
          }}
        />
      )}
      
      {/* Wind-Up Soldier Spell Effects */}
      {activeSpell && activeSpell.caster && activeSpell.caster.id === 'wind_up_soldier' && (
        <>
          {/* Use BrickDudeEffects for March Attack (sword slash) */}
          {activeSpell.ability && activeSpell.ability.id === 'march_attack' ? (
            <BrickDudeEffects
              spell={activeSpell}
              positions={spellPositions}
              onComplete={() => {
                setActiveSpell(null)
                setSpellPositions(null)
              }}
            />
          ) : (
            <WindUpSoldierEffects
              ability={activeSpell.ability}
              sourcePosition={spellPositions?.caster}
              targetPositions={spellPositions?.targets}
              activeCharacter={activeSpell.caster}
              onComplete={() => {
                setActiveSpell(null)
                setSpellPositions(null)
              }}
            />
          )}
        </>
      )}
      
      {/* Spell Notification Popup */}
      {spellNotification && (
        <SpellNotification
          ability={spellNotification.ability}
          caster={spellNotification.caster}
          targets={spellNotification.targets}
          onComplete={() => setSpellNotification(null)}
        />
      )}
      
      
      
      {/* Battle Arena */}
      <div className="flex-1 relative z-10 flex items-center justify-between px-2 md:px-8">
        {/* Blue Team (Player) */}
        <div className="relative">
          {/* Atmospheric Blue Mist Background */}
          <div className="absolute -inset-20 pointer-events-none">
            {/* Misty fog effect */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-400/20 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/30 to-transparent rounded-full blur-2xl" />
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`blue-particle-${i}`}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-float-particle"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.5}s`,
                  boxShadow: '0 0 10px #00ffff'
                }}
              />
            ))}
          </div>
          
          {/* Team Label */}
          <div className="absolute -top-16 md:-top-20 left-1/2 transform -translate-x-1/2 z-20">
            <div className="relative">
              {/* Glowing orb behind text */}
              <div className="absolute inset-0 bg-gradient-radial from-blue-400 to-transparent blur-2xl scale-150 animate-pulse" />
              
              {/* Ice crystal effect */}
              <div className="relative">
                <div className="text-center">
                  <div className="text-xs md:text-sm text-cyan-300 font-bold tracking-widest mb-1 drop-shadow-lg">TEAM</div>
                  <div className="relative">
                    <div className="text-2xl md:text-4xl font-black font-toy text-transparent bg-clip-text bg-gradient-to-b from-blue-300 via-cyan-400 to-blue-600"
                         style={{
                           textShadow: `
                             0 0 30px #00ffff,
                             0 0 60px #0099ff,
                             0 0 90px #0066ff`,
                           filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                         }}>
                      BLUE
                    </div>
                    {/* Frost effect lines */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Player Team Cards */}
          <div className="flex flex-col gap-2 md:gap-4">
            {playerTeamState.map((char, index) => {
              const isAttacking = activeAttacker && activeAttacker.instanceId === char.instanceId
              const isBeingTargeted = activeTargets.includes(char.instanceId)
              const isBeingHealed = healingTargets.includes(char.instanceId)
              const hasShield = shieldedCharacters.has(char.instanceId)
              const isFrozen = frozenCharacters.has(char.instanceId)
              const shouldBlur = attackInProgress && !isAttacking && currentTurn === 'player'
              
              return (
                <div 
                  key={char.instanceId} 
                  id={`char-${char.instanceId}`} 
                  className={`relative transition-all duration-500 ease-in-out ${
                    isAttacking ? 'scale-110 z-50' :
                    shouldBlur ? 'blur-sm opacity-50 scale-95' : ''
                  }`}
                  style={{
                    filter: shouldBlur ? 'blur(4px)' : isAttacking ? 'drop-shadow(0 0 20px rgba(255,255,0,0.6))' : 'none',
                    transform: isAttacking ? 'scale(1.1) translateZ(0)' : shouldBlur ? 'scale(0.95)' : 'scale(1)'
                  }}
                >
                  <CharacterCard
                    character={char}
                    isActive={currentTurn === 'player' && index === activeCharacterIndex % 3 && char.currentHealth > 0}
                    currentHealth={char.currentHealth}
                    maxHealth={char.maxHealth}
                    damageNumbers={damageNumbers.filter(n => n.targetId === char.id)}
                    teamColor="blue"
                    shields={shieldedCharacters.get(char.instanceId)}
                    damageBuff={damageBuffedCharacters.get(char.instanceId)}
                    criticalBuff={criticalBuffedCharacters.get(char.instanceId)}
                    frozen={frozenCharacters.has(char.instanceId)}
                    debuffed={debuffedCharacters.get(char.instanceId)}
                  />
                  {/* Targeting Indicator - DISABLED
                  {isBeingTargeted && (
                    <TargetingIndicator isActive={true} isDamage={true} />
                  )} */}
                  {/* Healing Glow */}
                  {isBeingHealed && (
                    <HealingGlow isActive={true} targetId={char.id} />
                  )}
                  {/* Shield Effect */}
                  {hasShield && (
                    <ShieldEffect isActive={true} shieldType={shieldedCharacters.get(char.instanceId)?.type} />
                  )}
                  {/* Frozen Effect */}
                  {isFrozen && (
                    <div className="absolute inset-0 pointer-events-none z-35">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-200/40 via-cyan-200/30 to-white/20 rounded-lg" />
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <pattern id="ice-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 0 L10 20 M0 10 L20 10 M5 5 L15 15 M15 5 L5 15" 
                                  stroke="rgba(173,216,230,0.6)" strokeWidth="0.5" fill="none"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#ice-pattern)" />
                      </svg>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <div className="text-cyan-300 text-xs font-bold animate-pulse">FROZEN</div>
                      </div>
                    </div>
                  )}
                  {/* Casting Bar */}
                  {castingInfo && castingInfo.caster.id === char.id && (
                    <CastingBar
                      caster={castingInfo.caster}
                      ability={castingInfo.ability}
                      progress={castingProgress}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Background Dim During Attack */}
        {attackInProgress && (
          <div className="absolute inset-0 bg-black/20 z-5 transition-all duration-500" />
        )}
        
        {/* Enhanced VS Indicator with Dynamic Colors */}
        <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 text-center z-25">
          <div className="relative">
            {/* Glowing background effect */}
            <div 
              className={`absolute inset-0 blur-3xl opacity-60 transition-all duration-700 ${
                (isPvP ? serverTurnOrder === 'player1' : currentTurn === 'player')
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                  : 'bg-gradient-to-r from-red-500 to-orange-500'
              }`}
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                transform: 'scale(1.5)'
              }}
            />
            
            {/* Main VS container */}
            <div 
              className={`relative px-8 py-4 rounded-2xl backdrop-blur-md border-2 transition-all duration-500 ${
                (isPvP ? serverTurnOrder === 'player1' : currentTurn === 'player')
                  ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-400 shadow-blue-500/50'
                  : 'bg-gradient-to-br from-red-600/30 to-orange-600/30 border-red-400 shadow-red-500/50'
              }`}
              style={{
                boxShadow: (isPvP ? serverTurnOrder === 'player1' : currentTurn === 'player')
                  ? '0 0 40px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2)'
                  : '0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2)',
                animation: 'vsFloat 3s ease-in-out infinite'
              }}
            >
              {/* VS Text */}
              <div 
                className={`text-5xl sm:text-6xl md:text-7xl font-black tracking-wider transition-all duration-500 ${
                  currentTurn === 'player'
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-orange-300'
                }`}
                style={{
                  textShadow: currentTurn === 'player'
                    ? '0 0 30px rgba(147, 197, 253, 0.8)'
                    : '0 0 30px rgba(252, 165, 165, 0.8)',
                  animation: 'vsPulse 1.5s ease-in-out infinite',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontStyle: 'italic'
                }}
              >
                VS
              </div>
              
              {/* Turn indicator */}
              <div 
                className={`text-sm md:text-base font-bold mt-2 tracking-wide transition-all duration-500 ${
                  currentTurn === 'player' ? 'text-blue-200' : 'text-red-200'
                }`}
                style={{
                  animation: 'fadeInOut 2s ease-in-out infinite'
                }}
              >
                {isPvP 
                  ? (serverTurnOrder === 'player1' ? '⚔️ BLUE TEAM TURN ⚔️' : '🔥 RED TEAM TURN 🔥')
                  : (currentTurn === 'player' ? '⚔️ BLUE TEAM TURN ⚔️' : '🔥 RED TEAM TURN 🔥')
                }
              </div>
              
              {/* Round Counter */}
              <div className="mt-1">
                <div 
                  className="text-xs md:text-sm font-medium tracking-widest uppercase"
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 0 15px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.3)',
                    letterSpacing: '0.15em'
                  }}
                >
                  ROUND {Math.floor(turnCounter / 2) + 1}
                </div>
              </div>
              
              {/* Animated dots */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      currentTurn === 'player' ? 'bg-blue-400' : 'bg-red-400'
                    }`}
                    style={{
                      animation: `dotPulse 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        
        {/* Red Team (AI) */}
        <div className="relative">
          {/* Atmospheric Fire Mist Background */}
          <div className="absolute -inset-20 pointer-events-none">
            {/* Fiery fog effect */}
            <div className="absolute inset-0 bg-gradient-radial from-red-400/20 via-orange-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 to-transparent rounded-full blur-2xl" />
            
            {/* Floating embers */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`red-particle-${i}`}
                className="absolute w-2 h-2 bg-orange-400 rounded-full animate-float-particle"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.5}s`,
                  boxShadow: '0 0 10px #ff6600'
                }}
              />
            ))}
          </div>
          
          {/* Team Label */}
          <div className="absolute -top-16 md:-top-20 left-1/2 transform -translate-x-1/2 z-20">
            <div className="relative">
              {/* Glowing orb behind text */}
              <div className="absolute inset-0 bg-gradient-radial from-red-400 to-transparent blur-2xl scale-150 animate-pulse" />
              
              {/* Fire effect */}
              <div className="relative">
                <div className="text-center">
                  <div className="text-xs md:text-sm text-orange-300 font-bold tracking-widest mb-1 drop-shadow-lg">TEAM</div>
                  <div className="relative">
                    <div className="text-2xl md:text-4xl font-black font-toy text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600"
                         style={{
                           textShadow: `
                             0 0 30px #ff6600,
                             0 0 60px #ff3300,
                             0 0 90px #ff0000`,
                           filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                         }}>
                      RED
                    </div>
                    {/* Fire effect lines */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Team Cards */}
          <div className="flex flex-col gap-2 md:gap-4">
            {aiTeamState.map((char, index) => {
              const isAttacking = activeAttacker && activeAttacker.instanceId === char.instanceId
              const isBeingTargeted = activeTargets.includes(char.instanceId)
              const isBeingHealed = healingTargets.includes(char.instanceId)
              const hasShield = shieldedCharacters.has(char.instanceId)
              const isFrozen = frozenCharacters.has(char.instanceId)
              const shouldBlur = attackInProgress && !isAttacking && !isBeingTargeted && currentTurn === 'ai'
              
              return (
                <div 
                  key={char.instanceId} 
                  id={`char-${char.instanceId}`} 
                  className={`relative transition-all duration-500 ease-in-out ${
                    isAttacking ? 'scale-110 z-50' :
                    isBeingTargeted ? 'scale-105 z-40' :
                    shouldBlur ? 'blur-sm opacity-50 scale-95' : ''
                  }`}
                  style={{
                    filter: shouldBlur ? 'blur(4px)' : 
                           isAttacking ? 'drop-shadow(0 0 20px rgba(255,255,0,0.6))' :
                           isBeingTargeted ? 'drop-shadow(0 0 15px rgba(255,0,0,0.8))' : 'none',
                    transform: isAttacking ? 'scale(1.1) translateZ(0)' : 
                              isBeingTargeted ? 'scale(1.05)' :
                              shouldBlur ? 'scale(0.95)' : 'scale(1)'
                  }}
                >
                  <CharacterCard
                    character={char}
                    isActive={currentTurn === 'ai' && index === activeCharacterIndex % 3 && char.currentHealth > 0}
                    currentHealth={char.currentHealth}
                    maxHealth={char.maxHealth}
                    damageNumbers={damageNumbers.filter(n => n.targetId === char.id)}
                    teamColor="red"
                    shields={shieldedCharacters.get(char.instanceId)}
                    damageBuff={damageBuffedCharacters.get(char.instanceId)}
                    criticalBuff={criticalBuffedCharacters.get(char.instanceId)}
                    frozen={frozenCharacters.has(char.instanceId)}
                    debuffed={debuffedCharacters.get(char.instanceId)}
                  />
                  {/* Targeting Indicator - DISABLED
                  {isBeingTargeted && (
                    <TargetingIndicator isActive={true} isDamage={true} />
                  )} */}
                  {/* Healing Glow */}
                  {isBeingHealed && (
                    <HealingGlow isActive={true} targetId={char.id} />
                  )}
                  {/* Shield Effect */}
                  {hasShield && (
                    <ShieldEffect isActive={true} shieldType={shieldedCharacters.get(char.instanceId)?.type} />
                  )}
                  {/* Frozen Effect */}
                  {isFrozen && (
                    <div className="absolute inset-0 pointer-events-none z-35">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-200/40 via-cyan-200/30 to-white/20 rounded-lg" />
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <pattern id="ice-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 0 L10 20 M0 10 L20 10 M5 5 L15 15 M15 5 L5 15" 
                                  stroke="rgba(173,216,230,0.6)" strokeWidth="0.5" fill="none"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#ice-pattern)" />
                      </svg>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <div className="text-cyan-300 text-xs font-bold animate-pulse">FROZEN</div>
                      </div>
                    </div>
                  )}
                  {/* Casting Bar */}
                  {castingInfo && castingInfo.caster.id === char.id && (
                    <CastingBar
                      caster={castingInfo.caster}
                      ability={castingInfo.ability}
                      progress={castingProgress}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-toy text-sm z-20 transition-all hover:scale-105"
      >
        ← Back
      </button>
      
      
      {/* Game Over Screen */}
      {showGameOver && gameOverData && (
        <GameOverScreen
          winner={gameOverData.winner}
          battleStats={gameOverData.battleStats}
          onContinue={handleGameOverContinue}
          playerTeam={gameOverData.playerTeam}
          enemyTeam={gameOverData.enemyTeam}
          betAmount={gameOverData.betAmount}
          isPvP={gameOverData.isPvP}
        />
      )}
      
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
        
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
        
        @keyframes vsFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes vsPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes dotPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-10px) translateX(-10px) scale(0.8);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-30px) translateX(5px) scale(1.1);
            opacity: 0.9;
          }
        }
        
        .animate-float-particle {
          animation: float-particle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default AutoBattleScreen