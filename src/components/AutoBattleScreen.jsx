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
import { getAnimationQueue } from '../utils/AnimationQueue'
import { ARENAS } from '../game/powerups'
import ParticleEffects from './ParticleEffects'
import MagicParticles from './MagicParticles'
// Landscape mode enforcement removed - works in both portrait and landscape
// import UltimateSpellOverlay from './UltimateSpellOverlay' // Removed - custom animations for each ultimate
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
import IceCubeOverlay from './IceCubeOverlay'
import MobileShieldOverlay from './MobileShieldOverlay'
import FrostyScreenOverlay from './FrostyScreenOverlay'
import CharacterCard from './CharacterCard'
import HealingGlow from './HealingGlow'
import SimpleTargetingArrow from './SimpleTargetingArrow'
import ShieldEffect from './ShieldEffect'
// import AttackLine from './AttackLine' // DISABLED
import GameOverScreen from './GameOverScreen'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSocket } from '../contexts/SocketContext'
import musicManager from '../utils/musicManager'
import { getElementCenter } from '../utils/mobilePositioning'
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
  const { socket } = useSocket()
  
  // Initialize animation queue
  const animationQueue = useRef(getAnimationQueue())
  
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
  const [playerTeamState, setPlayerTeamState] = useState(() => {
    console.log('Player team being initialized:', playerTeam.map(c => c.name))
    return playerTeam.map((char, index) => ({
      ...char,
      instanceId: `player-${char.id}-${index}`, // Unique instance ID
      team: 'player',
      currentHealth: char.maxHealth,
      isAlive: true,
      position: { x: 0, y: 0 }
    }))
  })
  
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
  const [playerCharacterIndex, setPlayerCharacterIndex] = useState(0)
  const [aiCharacterIndex, setAiCharacterIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [spellNotification, setSpellNotification] = useState(null)
  const [activeSpell, setActiveSpell] = useState(null)
  const [spellPositions, setSpellPositions] = useState(null)
  const [comboCounter, setComboCounter] = useState(0)
  const [turnCounter, setTurnCounter] = useState(0)
  const [serverTurnOrder, setServerTurnOrder] = useState('player1') // Track server's actual turn for PvP
  const [battleSpeed] = useState(0.7) // Increased speed by 40% (was 0.5)
  const [turnDelay] = useState(1500) // Delay between turns in PvP for better visibility (in ms)
  const [activeAttacker, setActiveAttacker] = useState(null) // Track the attacking character
  const [activeTargets, setActiveTargets] = useState([]) // Track who's being targeted
  const [healingTargets, setHealingTargets] = useState([]) // Track who's being healed
  const [attackInProgress, setAttackInProgress] = useState(false) // Track if attack animation is happening
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map()) // Track active shields
  const [frozenCharacters, setFrozenCharacters] = useState(new Map()) // Track frozen characters
  const [frostyScreenTrigger, setFrostyScreenTrigger] = useState(0) // Trigger frosty screen effect
  const [debuffedCharacters, setDebuffedCharacters] = useState(new Map()) // Track accuracy debuffs
  const [damageBuffedCharacters, setDamageBuffedCharacters] = useState(new Map()) // Track damage buffs
  const [criticalBuffedCharacters, setCriticalBuffedCharacters] = useState(new Map()) // Track critical buffs
  const [isPaused] = useState(false) // Remove pause functionality
  
  // Targeting system states
  const [isTargeting, setIsTargeting] = useState(false)
  const [targetingCaster, setTargetingCaster] = useState(null)
  const [targetingAbility, setTargetingAbility] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [validTargets, setValidTargets] = useState([])
  const [targetingTimer, setTargetingTimer] = useState(10)
  const targetingIntervalRef = useRef(null)
  const [hoveredTarget, setHoveredTarget] = useState(null)
  const [casterElement, setCasterElement] = useState(null)
  
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
  // const [ultimateSpell, setUltimateSpell] = useState(null) // Removed - custom animations for each ultimate
  
  // Landscape mode removed - no longer enforced
  
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
  
  // Orientation check removed - app works in both portrait and landscape
  
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
    // Battle music disabled - only sound effects
    // musicManager.crossFade('/battlemusic.mp3', 'battle', 1000)
    
    // Setup PvP socket listeners if in PvP mode
    if (isPvP && socket && pvpData) {
      const { battleId } = pvpData
      
      console.log('AutoBattleScreen PvP mode: Setting up socket listeners')
      
      // Listen for battle initialization from server
      socket.on('battle_initialized', ({ state, seed }) => {
        console.log('Battle initialized with state:', state)
        // Initialize turn tracking
        setTurnCounter(0)
        setCurrentTurn(pvpData.playerNumber === 1 ? 'player' : 'ai')
        
        // Update teams from server state, ensuring character IDs and shields are preserved
        const processTeam = (team) => team.map(char => ({
          ...char,
          id: char.id || char.instanceId?.split('-')[1], // Ensure id is set
          shields: char.shields || 0 // Preserve shield values from server
        }))
        
        const playerTeam = processTeam(pvpData.playerNumber === 1 ? state.player1Team : state.player2Team)
        const aiTeam = processTeam(pvpData.playerNumber === 1 ? state.player2Team : state.player1Team)
        
        setPlayerTeamState(playerTeam)
        setAiTeamState(aiTeam)
        
        // Update shield visuals based on server state
        const newShieldedChars = new Map()
        const allTeamMembers = [...playerTeam, ...aiTeam]
        allTeamMembers.forEach(char => {
          if (char.shields > 0) {
            newShieldedChars.set(char.instanceId, {
              amount: char.shields,
              type: 'normal'
            })
          }
        })
        setShieldedCharacters(newShieldedChars)
      })
      
      // Listen for battle actions from server
      // Listen for target requests from server (PvP mode)
      socket.on('request_target', ({ ability, caster, validTargets, timeout }) => {
        console.log('Server requesting target selection:', { ability, caster, validTargets })
        
        // Show spell notification first (like in single player)
        setSpellNotification({
          ability: ability,
          caster: caster
        })
        
        // Clear notification after 2 seconds but keep targeting active
        setTimeout(() => setSpellNotification(null), 2000)
        
        // Find the caster element using the instanceId directly
        const casterEl = document.getElementById(`char-${caster.instanceId}`)
        
        // Start targeting mode
        setIsTargeting(true)
        setCasterElement(casterEl)
        setTargetingTimer(timeout / 1000) // Convert to seconds
        
        // Store valid targets for validation
        window.pvpValidTargets = validTargets.map(t => t.instanceId)
        window.pvpAbility = ability
        window.pvpCaster = caster
        
        // Start timer countdown
        const interval = setInterval(() => {
          setTargetingTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              // Auto-select random target if time runs out
              if (validTargets.length > 0) {
                const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)]
                socket.emit('select_target', {
                  battleId: pvpData.battleId,
                  targetId: randomTarget.instanceId,
                  wallet: publicKey?.toString()
                })
              }
              setIsTargeting(false)
              setCasterElement(null)
              setHoveredTarget(null)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        // Store interval ID for cleanup
        window.pvpTargetingInterval = interval
      })
      
      socket.on('battle_action', ({ action, state }) => {
        console.log('Received battle action from server:', action)
        console.log('New state from server:', state)
        
        // Clear any active targeting when action is received
        if (window.pvpTargetingInterval) {
          clearInterval(window.pvpTargetingInterval)
          window.pvpTargetingInterval = null
        }
        setIsTargeting(false)
        setCasterElement(null)
        setHoveredTarget(null)
        setTargetingTimer(0)
        
        // Immediately clear any stuck animations from previous turn
        setActiveAttacker(null)
        setAttackInProgress(false)
        setActiveTargets([])
        setHealingTargets([])
        
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
        
        // Update shield visuals based on the new state
        const newShieldedChars = new Map()
        const allChars = [...updatedPlayerTeam, ...updatedAiTeam]
        allChars.forEach(char => {
          if (char.shields > 0) {
            newShieldedChars.set(char.instanceId, {
              amount: char.shields,
              type: 'normal'
            })
          }
        })
        setShieldedCharacters(newShieldedChars)
        
        // Update frozen status
        const newFrozenChars = new Map()
        allChars.forEach(char => {
          if (char.status?.frozen) {
            newFrozenChars.set(char.instanceId, { frozen: true, turnsRemaining: 1 })
          }
        })
        setFrozenCharacters(newFrozenChars)
        
        // Display the action with animations
        setTimeout(() => {
          displayServerAction(action)
        }, 100)
      })
      
      socket.on('battle_complete', ({ winner, finalState }) => {
        console.log('AutoBattleScreen: Received battle_complete event!')
        console.log('Battle complete, winner:', winner)
        console.log('My public key:', publicKey?.toString())
        const won = winner === publicKey?.toString()
        console.log('Did I win?', won)
        
        // Use the tracked battle stats and add final round count
        const finalStats = {
          ...battleStats,
          rounds: finalState?.currentTurn || 0
        }
        
        // Show the game over screen with stats
        console.log('Setting game over data with tracked stats:', finalStats)
        setGameOverData({
          winner: won ? 'player' : 'ai',
          battleStats: finalStats,
          playerTeam: playerTeamState,
          enemyTeam: aiTeamState,
          betAmount: pvpData.wagerAmount || 0,
          isPvP: true
        })
        console.log('Setting showGameOver to true...')
        setShowGameOver(true)
        console.log('GameOver should now be visible!')
        
        // Play victory or defeat sound
        if (won) {
          const victorySound = new Audio('/victory.mp3')
          victorySound.volume = 0.5
          victorySound.play().catch(e => console.log('Could not play victory sound'))
        } else {
          const defeatSound = new Audio('/defeat.mp3')
          defeatSound.volume = 0.5
          defeatSound.play().catch(e => console.log('Could not play defeat sound'))
        }
      })
      
      socket.on('opponent_disconnected', () => {
        console.log('Opponent disconnected')
        // Auto-win after disconnect
        setTimeout(() => {
          // Use tracked stats for disconnect win
          const finalStats = {
            ...battleStats,
            rounds: turnCounter || 0
          }
          
          // Show victory screen for disconnect
          setGameOverData({
            winner: 'player',
            battleStats: finalStats,
            playerTeam: playerTeamState,
            enemyTeam: aiTeamState,
            betAmount: pvpData.wagerAmount || 0,
            isPvP: true
          })
          setShowGameOver(true)
          
          // Play victory sound
          const victorySound = new Audio('/victory.mp3')
          victorySound.volume = 0.5
          victorySound.play().catch(e => console.log('Could not play victory sound'))
        }, 1500)
      })
      
      // Notify ready
      console.log('Emitting battle_ready for PvP battle')
      socket.emit('battle_ready', { battleId, wallet: publicKey?.toString() })
      
      return () => {
        socket.off('battle_initialized')
        socket.off('request_target')
        socket.off('battle_action')
        socket.off('battle_complete')
        socket.off('opponent_disconnected')
        // Clean up any active targeting interval
        if (window.pvpTargetingInterval) {
          clearInterval(window.pvpTargetingInterval)
          window.pvpTargetingInterval = null
        }
      }
    }
  }, [isPvP, pvpData, socket, publicKey])


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
      // Queue skip turn notification with enhanced visibility
      animationQueue.current.add({
        type: 'notification',
        duration: 3500, // Increased from 2000ms to 3500ms for better visibility
        onStart: () => {
          // Set prominent frozen skip notification
          setSpellNotification({
            ability: { 
              name: '❄️ FROZEN - TURN SKIPPED ❄️', 
              description: `${action.caster?.name || 'Character'} is frozen solid and cannot act!`,
              isUltimate: true // Makes it use the ultimate styling for prominence
            },
            caster: action.caster
          })
          
          // Trigger the frosty screen overlay for extra visual impact
          setFrostyScreenTrigger(prev => prev + 1)
        },
        onComplete: () => {
          setSpellNotification(null)
          // Clear frozen status after skip turn
          if (action.reason === 'frozen' && isPvP) {
            setFrozenCharacters(prev => {
              const newMap = new Map(prev)
              newMap.delete(action.caster.instanceId)
              console.log(`🔥 Clearing frozen for ${action.caster.name} after skip turn`)
              return newMap
            })
          }
        }
      })
      return
    }
    
    if (action.type === 'ability_used') {
      // Find the caster and target elements
      const casterChar = [...playerTeamState, ...aiTeamState].find(
        c => c.instanceId === action.caster.instanceId
      )
      const targetChars = action.targets.map(t => 
        [...playerTeamState, ...aiTeamState].find(c => c.instanceId === t.instanceId)
      ).filter(Boolean)
      
      // Don't set any attack animation states - let the spell effects handle everything
      // Just set targets for highlighting
      if (targetChars.length > 0) {
        setActiveTargets(targetChars.map(t => t.instanceId))
      }
      
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
      
      // Track battle statistics for damage/healing
      if (action.effects) {
        setBattleStats(prev => {
          const newStats = { ...prev }
          
          action.effects.forEach(effect => {
            if (effect.type === 'damage') {
              // Track damage dealt by the caster
              const casterId = action.caster.id || action.caster.instanceId
              newStats.damageDealt[casterId] = (newStats.damageDealt[casterId] || 0) + effect.amount
              newStats.totalDamage = (newStats.totalDamage || 0) + effect.amount
            } else if (effect.type === 'heal') {
              // Track healing done by the caster
              const casterId = action.caster.id || action.caster.instanceId
              newStats.healingDone[casterId] = (newStats.healingDone[casterId] || 0) + effect.amount
            }
            
            // Track freeze effects for visual display in PvP mode
            if ((effect.type === 'freeze' || effect.freeze) && isPvP) {
              console.log('🧊 PvP FREEZE DETECTED in AutoBattleScreen:', {
                targetId: effect.targetId,
                effectType: effect.type,
                hasFreeze: effect.freeze,
                isPvP: isPvP
              })
              setFrozenCharacters(prev => {
                const newMap = new Map(prev)
                newMap.set(effect.targetId, { frozen: true, turnsRemaining: 1 })
                console.log('🧊 Updated frozen characters:', Array.from(newMap.keys()))
                return newMap
              })
            }
            
            // Track shield effects for visual display in PvP mode
            if (effect.type === 'shield' && isPvP) {
              console.log('🛡️ PvP SHIELD DETECTED:', {
                targetId: effect.targetId,
                amount: effect.amount
              })
              // Set healing targets to show the shield animation
              setHealingTargets(prev => {
                const prevArray = Array.isArray(prev) ? prev : []
                return [...new Set([...prevArray, effect.targetId])]
              })
              
              // Clear healing targets after animation
              setTimeout(() => {
                setHealingTargets(prev => {
                  const prevArray = Array.isArray(prev) ? prev : []
                  return prevArray.filter(id => id !== effect.targetId)
                })
              }, 2000)
            }
          })
          
          // Track ultimates
          if (action.ability.isUltimate) {
            newStats.ultimatesUsed = (newStats.ultimatesUsed || 0) + 1
          }
          
          return newStats
        })
      }
      
      // Calculate spell positions for animations
      const casterElement = document.getElementById(`char-${action.caster.instanceId}`)
      const targetElements = action.targets.map(t => 
        document.getElementById(`char-${t.instanceId}`)
      ).filter(Boolean)
      
      let positions = null
      if (casterElement && targetElements.length > 0) {
        const casterPos = getElementCenter(casterElement)
        
        const targetPositions = targetElements.map(el => {
          return getElementCenter(el)
        })
        
        positions = {
          caster: casterPos,
          targets: targetPositions
        }
      }
      
      // Queue the spell sequence from server
      animationQueue.current.queueSpellSequence({
          caster: action.caster,
          ability: action.ability,
          targets: action.targets,
          positions: positions,
          effects: action.effects || [],
          
          onCastStart: () => {
          // Clear previous animation state
          setActiveAttacker(null)
          setAttackInProgress(false)
          setActiveTargets([])
          setHealingTargets([])
          
          setIsAnimating(true)
          
          // Don't set any attack animation states - let the spell effects handle everything
          // Just set targets for highlighting
          if (targetChars.length > 0) {
            setActiveTargets(targetChars.map(t => t.instanceId))
          }
          
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
        },
        
        onProjectileStart: () => {
          if (positions) {
            setSpellPositions(positions)
            // Show spell effects with proper data
            setActiveSpell({
              ability: action.ability,
              caster: {
                ...(casterChar || action.caster),
                id: action.caster.id // Use the ID sent from server
              },
              targets: targetChars.length > 0 ? targetChars : action.targets
            })
          }
        },
        
        onImpact: () => {
          // Track battle statistics and effects
          if (action.effects) {
            setBattleStats(prev => {
              const newStats = { ...prev }
              
              action.effects.forEach(effect => {
                if (effect.type === 'damage') {
                  // Track damage dealt by the caster
                  const casterId = action.caster.id || action.caster.instanceId
                  newStats.damageDealt[casterId] = (newStats.damageDealt[casterId] || 0) + effect.amount
                  newStats.totalDamage = (newStats.totalDamage || 0) + effect.amount
                } else if (effect.type === 'heal') {
                  // Track healing done by the caster
                  const casterId = action.caster.id || action.caster.instanceId
                  newStats.healingDone[casterId] = (newStats.healingDone[casterId] || 0) + effect.amount
                }
                
                // Track freeze effects for visual display in PvP mode
                if ((effect.type === 'freeze' || effect.freeze) && isPvP) {
                  console.log('🧊 PvP FREEZE DETECTED in AutoBattleScreen:', {
                    targetId: effect.targetId,
                    effectType: effect.type,
                    hasFreeze: effect.freeze,
                    isPvP: isPvP
                  })
                  setFrozenCharacters(prev => {
                    const newMap = new Map(prev)
                    newMap.set(effect.targetId, { frozen: true, turnsRemaining: 1 })
                    console.log('🧊 Updated frozen characters:', Array.from(newMap.keys()))
                    return newMap
                  })
                }
                
                // Track shield effects for visual display in PvP mode
                if (effect.type === 'shield' && isPvP) {
                  console.log('🛡️ PvP SHIELD DETECTED:', {
                    targetId: effect.targetId,
                    amount: effect.amount
                  })
                  // Set healing targets to show the shield animation
                  setHealingTargets(prev => {
                    const prevArray = Array.isArray(prev) ? prev : []
                    return [...new Set([...prevArray, effect.targetId])]
                  })
                  
                  // Clear healing targets after animation
                  setTimeout(() => {
                    setHealingTargets(prev => {
                      const prevArray = Array.isArray(prev) ? prev : []
                      return prevArray.filter(id => id !== effect.targetId)
                    })
                  }, 2000)
                }
              })
              
              // Track ultimates
              if (action.ability.isUltimate) {
                newStats.ultimatesUsed = (newStats.ultimatesUsed || 0) + 1
              }
              
              return newStats
            })
          }
        },
        
        onDamageNumbers: () => {
          // Show damage numbers
          if (action.effects) {
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
          }
        }
      })
      
      // Set up animation complete handler for cleanup
      animationQueue.current.onAnimationComplete = (animation) => {
        if (animation.type === 'spell_impact') {
          // Clear attack animation states
          console.log('Clearing attack animation states in PvP')
          setActiveAttacker(null)
          setAttackInProgress(false)
          setActiveTargets([])
          setHealingTargets([])
          
          // Force reset any stuck transform and position styles
          const allCharElements = document.querySelectorAll('[id^="char-"]')
          allCharElements.forEach(el => {
            // Reset transform
            if (el.style.transform && el.style.transform !== 'scale(1)') {
              console.log('Force resetting stuck transform on:', el.id)
              el.style.transform = 'scale(1)'
            }
            // Reset any position changes
            if (el.style.position === 'absolute' || el.style.position === 'fixed') {
              el.style.position = ''
            }
            if (el.style.top) el.style.top = ''
            if (el.style.left) el.style.left = ''
            if (el.style.zIndex) el.style.zIndex = ''
          })
          
          // Clear other effects after a short delay
          setTimeout(() => {
            setSpellNotification(null)
            setActiveSpell(null)
            setSpellPositions(null)
            // Add turn delay for better visibility in PvP
            if (isPvP) {
              setTimeout(() => {
                setIsAnimating(false)
              }, turnDelay)
            } else {
              setIsAnimating(false)
            }
          }, 500)
        }
      }
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

  // New function to execute ability on selected target
  const executeAbilityOnTarget = (caster, ability, targets, isPlayerTurn) => {
    // Calculate positions for animations
    const casterElement = document.getElementById(`char-${caster.instanceId}`)
    const targetElements = targets.map(t => document.getElementById(`char-${t.instanceId}`))
    
    let positions = null
    if (casterElement && targetElements.length > 0) {
      const casterPos = getElementCenter(casterElement)
      
      const targetPositions = targetElements
        .filter(el => el !== null)
        .map(el => {
          return getElementCenter(el)
        })
      
      if (targetPositions.length > 0) {
        positions = {
          caster: casterPos,
          targets: targetPositions
        }
      }
    }
    
    // Queue the full spell sequence
    animationQueue.current.queueSpellSequence({
      caster: caster,
      ability: ability,
      targets: targets,
      positions: positions,
      effects: [], // Will be populated when damage is calculated
      
      // Animation callbacks
      onCastStart: () => {
        // Show spell notification
        setSpellNotification({ 
          ability: ability, 
          caster: caster,
          targets: targets.map(t => ({
            name: t.name,
            emoji: t.emoji,
            image: t.image,
            team: isPlayerTurn ? 'ai' : 'player'
          }))
        })
        
        // Reset all character transforms
        const allCharElements = document.querySelectorAll('[id^="char-"]')
        allCharElements.forEach(el => {
          el.style.transform = ''
          el.style.transition = ''
          el.style.zIndex = ''
          el.style.position = ''
        })
        
        // Set up attack focus
        const mainTarget = targets[0]
        if (mainTarget) {
          setActiveAttacker(caster)
          setAttackInProgress(true)
          setActiveTargets([])
          setHealingTargets([])
          
          // Set indicators based on ability type
          if (caster.id !== 'unicorn_warrior' && caster.id !== 'phoenix_dragon' && caster.id !== 'robo_fighter' && caster.id !== 'wizard_toy') {
            if (ability.effect === 'heal' || ability.effect === 'heal_shield') {
              setHealingTargets([mainTarget.instanceId])
            } else if (ability.effect === 'heal_all') {
              setHealingTargets(targets.map(t => t.instanceId))
            } else if (ability.effect === 'shield' || ability.effect === 'shield_all') {
              setHealingTargets(targets.map(t => t.instanceId))
            } else {
              setActiveTargets(targets.map(t => t.instanceId))
            }
          }
        }
      },
      
      onProjectileStart: () => {
        // Show spell positions and active spell
        if (positions) {
          setSpellPositions(positions)
          setActiveSpell({
            ability: ability,
            caster: caster,
            targets: targets
          })
          setIsAnimating(true)
        }
      },
      
      onImpact: () => {
        // Apply damage/healing effects
        applyAbilityEffects(ability, caster, targets, isPlayerTurn)
      },
      
      onDamageNumbers: () => {
        // Damage numbers are shown automatically by applyAbilityEffects
      }
    })
    
    // Set up animation complete handler
    animationQueue.current.onAnimationComplete = (animation) => {
      if (animation.type === 'spell_impact') {
        // Clear spell effects after impact
        setTimeout(() => {
          setActiveSpell(null)
          setSpellPositions(null)
          setSpellNotification(null)
          setParticleIntensity('normal')
          setActiveAttacker(null)
          setAttackInProgress(false)
          setActiveTargets([])
          setHealingTargets([])
          setIsAnimating(false)
        }, 500)
        
        // Handle multi-hit abilities
        if (ability.hits && ability.hits > 1) {
          let hitCount = 1
          const defendingTeam = isPlayerTurn ? aiTeamState : playerTeamState
          const hitInterval = setInterval(() => {
            if (hitCount >= ability.hits) {
              clearInterval(hitInterval)
              endTurn()
              return
            }
            
            const newTarget = selectRandomTarget(defendingTeam)
            if (newTarget) {
              applyAbilityEffects(ability, caster, [newTarget], isPlayerTurn)
            }
            hitCount++
          }, 300)
        } else {
          endTurn()
        }
      }
    }
  }
  
  // Handle player target selection
  const handleTargetSelect = (target, event) => {
    // Prevent any propagation
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    // Handle PvP targeting
    if (isPvP && window.pvpValidTargets) {
      console.log('PvP target selected:', target.instanceId, 'Event type:', event?.type)
      if (!isTargeting || !window.pvpValidTargets.includes(target.instanceId)) return
      
      // Clear PvP timer
      if (window.pvpTargetingInterval) {
        clearInterval(window.pvpTargetingInterval)
        window.pvpTargetingInterval = null
      }
      
      // Send target selection to server
      socket.emit('select_target', {
        battleId: pvpData.battleId,
        targetId: target.instanceId,
        wallet: publicKey?.toString()
      })
      
      // Clear targeting state
      setIsTargeting(false)
      setCasterElement(null)
      setHoveredTarget(null)
      setTargetingTimer(0)
      window.pvpValidTargets = null
      window.pvpAbility = null
      window.pvpCaster = null
      return
    }
    
    // Handle single-player targeting
    if (!isTargeting || !validTargets.includes(target)) return
    
    // Clear timer
    if (targetingIntervalRef.current) {
      clearInterval(targetingIntervalRef.current)
    }
    
    // Execute ability on selected target
    executeAbilityOnTarget(targetingCaster, targetingAbility, [target], true)
    
    // Clear targeting state
    setIsTargeting(false)
    setTargetingCaster(null)
    setTargetingAbility(null)
    setValidTargets([])
    setSelectedTarget(null)
    setHoveredTarget(null)
    setCasterElement(null)
  }

  const executeTurn = () => {
    const isPlayerTurn = currentTurn === 'player'
    const attackingTeam = isPlayerTurn ? playerTeamState : aiTeamState
    const defendingTeam = isPlayerTurn ? aiTeamState : playerTeamState
    
    // In PvP mode, emit actions to opponent
    if (isPvP && socket && isPlayerTurn) {
      const action = {
        type: 'turn',
        characterIndex: playerCharacterIndex,
        timestamp: Date.now()
      }
      socket.emit('battle_action', {
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
    
    // Use the appropriate index for the current team
    const currentIndex = isPlayerTurn ? playerCharacterIndex : aiCharacterIndex
    const characterToUse = currentIndex % aliveAttackers.length
    const activeCharacter = aliveAttackers[characterToUse]
    
    // Debug logging
    console.log(`Turn ${turnCounter}: ${isPlayerTurn ? 'PLAYER' : 'AI'} - Character ${characterToUse + 1}/${aliveAttackers.length}: ${activeCharacter.name} (${activeCharacter.id})`)
    
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
    
    // Track ultimate usage for stats only - no overlay
    if (selectedAbility.isUltimate) {
      trackUltimate() // Track ultimate usage for stats
      // Ultimate overlay removed - each ultimate has custom animations
    }
    
    // Calculate positions for spell effects
    // Use a timeout to ensure DOM is ready
    setTimeout(() => {
      const casterElement = document.getElementById(`char-${activeCharacter.instanceId}`)
      const targetElements = targets.map(t => document.getElementById(`char-${t.instanceId}`))
      
      if (casterElement && targetElements.length > 0) {
        const casterPos = getElementCenter(casterElement)
        const targetPositions = targetElements
          .filter(el => el !== null)
          .map(el => getElementCenter(el))
        
        if (targetPositions.length > 0) {
          setSpellPositions({
            caster: casterPos,
            targets: targetPositions
          })
        }
      }
    }, 100)
    
    // Determine valid targets based on ability effect
    const determineValidTargets = (ability) => {
      // Offensive abilities - target ENEMIES only
      if (ability.effect === 'damage' || ability.effect === 'multi_damage' || ability.effect === 'damage_burn') {
        return defendingTeam.filter(char => char.currentHealth > 0)
      } else if (ability.effect === 'damage_all' || ability.effect === 'damage_cascade' || ability.effect === 'freeze_all' || ability.effect === 'damage_chain') {
        return defendingTeam.filter(char => char.currentHealth > 0)
      }
      // Healing/Support abilities - target ALLIES only
      else if (ability.effect === 'heal' || ability.effect === 'shield' || ability.effect === 'heal_shield') {
        return attackingTeam.filter(char => char.currentHealth > 0)
      } else if (ability.effect === 'heal_all' || ability.effect === 'shield_all') {
        return attackingTeam.filter(char => char.currentHealth > 0)
      } else if (ability.effect === 'heal_revive_all') {
        return attackingTeam // Include dead allies for revival
      }
      // Default to enemies
      else {
        return defendingTeam.filter(char => char.currentHealth > 0)
      }
    }
    
    // Check if this is the player's turn and targeting is enabled
    // For now, only enable targeting in single player mode
    // PvP battles are server-controlled and would need major backend changes
    const shouldPlayerTarget = isPlayerTurn && !isPvP
    
    // Debug logging
    console.log('Targeting check:', {
      isPlayerTurn,
      isPvP,
      shouldPlayerTarget,
      ability: selectedAbility.name,
      effect: selectedAbility.effect,
      caster: activeCharacter.name
    })
    
    if (shouldPlayerTarget && (selectedAbility.effect === 'damage' || selectedAbility.effect === 'damage_burn' || selectedAbility.effect === 'multi_damage' || selectedAbility.effect === 'heal' || selectedAbility.effect === 'shield')) {
      // Single target abilities - let player choose
      const validTargetsForAbility = determineValidTargets(selectedAbility)
      
      console.log('Starting targeting mode for', selectedAbility.name, 'with targets:', validTargetsForAbility.map(t => t.name))
      
      if (validTargetsForAbility.length > 0) {
        // Start targeting mode
        setIsTargeting(true)
        setTargetingCaster(activeCharacter)
        setTargetingAbility(selectedAbility)
        setValidTargets(validTargetsForAbility)
        setTargetingTimer(10)
        
        // Set caster element for arrow
        setTimeout(() => {
          const casterEl = document.getElementById(`char-${activeCharacter.instanceId}`)
          setCasterElement(casterEl)
        }, 100)
        
        // Start countdown timer
        targetingIntervalRef.current = setInterval(() => {
          setTargetingTimer(prev => {
            if (prev <= 1) {
              // Time's up - select random target
              clearInterval(targetingIntervalRef.current)
              const randomTarget = validTargetsForAbility[Math.floor(Math.random() * validTargetsForAbility.length)]
              executeAbilityOnTarget(activeCharacter, selectedAbility, [randomTarget], isPlayerTurn)
              setIsTargeting(false)
              setTargetingCaster(null)
              setTargetingAbility(null)
              setValidTargets([])
              return 10
            }
            return prev - 1
          })
        }, 1000)
        
        return // Wait for player to select target
      }
    }
    
    // Auto-target for AI or AOE abilities
    let targets = []
    
    if (selectedAbility.effect === 'damage_all' || selectedAbility.effect === 'damage_cascade' || selectedAbility.effect === 'freeze_all') {
      targets = defendingTeam.filter(char => char.currentHealth > 0)
    } else if (selectedAbility.effect === 'damage_chain') {
      const validTargets = defendingTeam.filter(char => char.currentHealth > 0)
      targets = validTargets.slice(0, 3)
    } else if (selectedAbility.effect === 'heal_all' || selectedAbility.effect === 'shield_all') {
      targets = attackingTeam.filter(char => char.currentHealth > 0)
    } else if (selectedAbility.effect === 'heal_revive_all') {
      targets = attackingTeam
    } else if (selectedAbility.effect === 'both' || selectedAbility.effect === 'chaos' || selectedAbility.effect === 'supernova' || selectedAbility.effect === 'apocalypse') {
      const enemyTargets = defendingTeam.filter(char => char.currentHealth > 0)
      const allyTargets = attackingTeam.filter(char => char.currentHealth > 0)
      targets = [
        ...enemyTargets.map(t => ({ ...t, isDamage: true })),
        ...allyTargets.map(t => ({ ...t, isHeal: true }))
      ]
    } else {
      // Single target - random selection
      const validTargets = determineValidTargets(selectedAbility)
      if (validTargets.length > 0) {
        const target = validTargets[Math.floor(Math.random() * validTargets.length)]
        targets = [target]
      }
    }
    
    if (targets.length === 0) {
      endTurn()
      return
    }
    
    // Execute ability immediately for AI or AOE
    executeAbilityOnTarget(activeCharacter, selectedAbility, targets, isPlayerTurn)
    
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
            const casterPos = getElementCenter(casterElement)
            
            const targetPositions = targetElements
              .filter(el => el !== null)
              .map(el => {
                return getElementCenter(el)
              })
            
            if (targetPositions.length > 0) {
              setSpellPositions({
                caster: casterPos,
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
      
      console.log(`🛡️ Applying shield to ${targetAlly?.instanceId}, amount: ${shieldAmount}`);
      
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
    
    // Switch turns and increment the appropriate character index
    if (currentTurn === 'player') {
      // Player turn ends, increment player index for next time
      setPlayerCharacterIndex(prev => prev + 1)
      setCurrentTurn('ai')
    } else {
      // AI turn ends, increment AI index for next time
      setAiCharacterIndex(prev => prev + 1)
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
    // Menu music disabled - only sound effects
    // musicManager.crossFade('/menumusic.mp3', 'menu', 1000)
    
    if (gameOverData) {
      const result = {
        winner: gameOverData.winner,
        playerTeam: playerTeamState,
        aiTeam: aiTeamState,
        turns: turnCounter,
        stats: battleStats,
        survivingChars: gameOverData.winner === 'player' ? playerTeamState : aiTeamState,
        isPvP: gameOverData.isPvP || false,
        wagerAmount: gameOverData.betAmount || 0
      }
      
      onBattleEnd(result)
    } else {
      // Fallback if no game over data
      onBattleEnd({
        winner: 'player',
        survivingChars: playerTeamState,
        isPvP: isPvP,
        wagerAmount: pvpData?.wagerAmount || 0
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
    <div className="h-full flex flex-col relative overflow-hidden"
      style={{
        zoom: window.innerWidth <= 480 ? 1 : window.innerWidth <= 768 ? 1 : 1
      }}
    >
      {/* Battle Wrapper - All battle content */}
      <div id="battle-wrapper" className="h-full flex flex-col relative">
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
        
        {/* Turn Counter Bar - Fixed at top of screen */}
        <div className={`
          fixed top-0 left-0 right-0 h-10 sm:h-12 md:h-14 
          flex items-center justify-center 
          text-sm sm:text-base md:text-lg font-bold z-[100]
          transition-colors duration-300
          ${(isPvP ? serverTurnOrder === 'player1' : currentTurn === 'player') 
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
            : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'}
        `}>
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-xs sm:text-sm">Round</span>
            <span className="text-base sm:text-lg md:text-xl font-black">{Math.floor(turnCounter / 2) + 1}</span>
            <span className="mx-2 text-white/50">|</span>
            <span className="flex items-center gap-1">
              {(isPvP ? serverTurnOrder === 'player1' : currentTurn === 'player') 
                ? <><span className="text-lg">🔵</span> <span>Blue Turn</span></> 
                : <><span className="text-lg">🔴</span> <span>Red Turn</span></>
              }
            </span>
          </div>
        </div>
        
        {/* Critical Hit Flash Effect */}
        {criticalFlash && (
          <div className="absolute inset-0 bg-white animate-flash pointer-events-none z-50" />
        )}
      
      {/* Ultimate Spell Overlay - REMOVED 
          Each ultimate now has custom animations
      <UltimateSpellOverlay 
        isActive={!!ultimateSpell}
        spellName={ultimateSpell?.name}
        casterName={ultimateSpell?.caster}
      />
      */}
      
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
          onIceNovaCast={() => {
            // Trigger frosty screen effect
            setFrostyScreenTrigger(prev => prev + 1)
          }}
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
            // Reset the brick dude character element to prevent stuck positions
            const brickElement = document.getElementById(`char-${activeSpell.caster.instanceId}`)
            if (brickElement) {
              brickElement.style.transform = ''
              brickElement.style.transition = ''
              brickElement.style.zIndex = ''
              brickElement.style.position = ''
            }
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
                // Reset the wind-up soldier character element to prevent stuck positions
                const soldierElement = document.getElementById(`char-${activeSpell.caster.instanceId}`)
                if (soldierElement) {
                  soldierElement.style.transform = ''
                  soldierElement.style.transition = ''
                  soldierElement.style.zIndex = ''
                  soldierElement.style.position = ''
                }
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
      
      {/* Shield Overlay - Canvas-based for accurate mobile positioning */}
      <MobileShieldOverlay shieldedCharacters={shieldedCharacters} />
      
      {/* Ice Cube Overlay - Persistent ice cubes on frozen targets */}
      <IceCubeOverlay frozenCharacters={frozenCharacters} />
      
      {/* Frosty Screen Overlay - Shows frosty screen effect after Ice Nova */}
      <FrostyScreenOverlay triggerEffect={frostyScreenTrigger} duration={5000} />
      
      {/* Battle Arena */}
      <div className="flex-1 relative z-10 w-full overflow-hidden
                      flex sm:grid sm:grid-cols-2 items-center justify-evenly sm:justify-stretch gap-12
                      sm:gap-x-48 md:gap-x-64 lg:gap-x-80 pl-0 pr-2 sm:px-20 md:px-32 lg:px-40 
                      pt-8 sm:pt-14 md:pt-16 pb-2 sm:pb-4 max-w-full mx-auto">
        {/* Blue Team (Player) - left column */}
        <div className="blue-team relative w-[120px] sm:w-auto sm:flex sm:justify-end">
          {/* Atmospheric Blue Mist Background */}
          <div className="absolute -inset-10 sm:-inset-20 pointer-events-none hidden sm:block">
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
          <div className="hidden sm:block absolute -top-12 sm:-top-16 md:-top-20 left-1/2 transform -translate-x-1/2 z-20">
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
          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 items-start mr-0 sm:mr-0">
            {playerTeamState.map((char, index) => {
              const isAttacking = activeAttacker && activeAttacker.instanceId === char.instanceId
              const isBeingTargeted = activeTargets.includes(char.instanceId)
              const isBeingHealed = healingTargets.includes(char.instanceId)
              const hasShield = shieldedCharacters.has(char.instanceId)
              const isFrozen = frozenCharacters.has(char.instanceId)
              const shouldBlur = attackInProgress && !isAttacking && currentTurn === 'player'
              
              const isValidTarget = isTargeting && (isPvP ? window.pvpValidTargets?.includes(char.instanceId) : validTargets.includes(char))
              const isTargetingCaster = isTargeting && targetingCaster?.instanceId === char.instanceId
              
              return (
                <div 
                  key={char.instanceId} 
                  id={`char-${char.instanceId}`} 
                  className={`character-card-container relative w-[110px] sm:w-[140px] md:w-[160px] transition-all duration-500 ease-in-out ${
                    shouldBlur ? 'blur-sm opacity-50 scale-95' : ''
                  } ${isValidTarget ? 'valid-target' : ''} ${isTargetingCaster ? 'targeting-caster' : ''}`}
                  style={{
                    filter: shouldBlur ? 'blur(4px)' : 
                           isValidTarget ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8))' : 'none',
                    transform: shouldBlur ? 'scale(0.95)' : 
                              isValidTarget ? 'scale(1.02)' : 'scale(1)',
                    cursor: isValidTarget ? 'pointer' : 'default'
                  }}
                  onClick={(e) => isValidTarget && handleTargetSelect(char, e)}
                  onMouseEnter={() => {
                    if (isValidTarget && isTargeting) {
                      setHoveredTarget(document.getElementById(`char-${char.instanceId}`))
                    }
                  }}
                  onMouseLeave={() => {
                    if (isTargeting) {
                      setHoveredTarget(null)
                    }
                  }}
                >
                  <CharacterCard
                    character={char}
                    isActive={currentTurn === 'player' && playerTeamState.filter(c => c.currentHealth > 0).indexOf(char) === (playerCharacterIndex % playerTeamState.filter(c => c.currentHealth > 0).length)}
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
                  {/* Shield Effect - Moved to MobileShieldOverlay */}
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
                </div>
              )
            })}
          </div>
        </div>
        {/* End of Blue Team */}
        
        {/* Red Team (AI) - right column */}
        <div className="red-team relative w-[120px] sm:w-auto sm:flex sm:justify-start">
          {/* Atmospheric Fire Mist Background */}
          <div className="absolute -inset-10 sm:-inset-20 pointer-events-none hidden sm:block">
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
          <div className="hidden sm:block absolute -top-12 sm:-top-16 md:-top-20 left-1/2 transform -translate-x-1/2 z-20">
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
          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 items-start">
            {aiTeamState.map((char, index) => {
              const isAttacking = activeAttacker && activeAttacker.instanceId === char.instanceId
              const isBeingTargeted = activeTargets.includes(char.instanceId)
              const isBeingHealed = healingTargets.includes(char.instanceId)
              const hasShield = shieldedCharacters.has(char.instanceId)
              const isFrozen = frozenCharacters.has(char.instanceId)
              const shouldBlur = attackInProgress && !isAttacking && !isBeingTargeted && currentTurn === 'ai'
              
              const isValidTarget = isTargeting && (isPvP ? window.pvpValidTargets?.includes(char.instanceId) : validTargets.includes(char))
              const isTargetingCaster = isTargeting && targetingCaster?.instanceId === char.instanceId
              
              return (
                <div 
                  key={char.instanceId} 
                  id={`char-${char.instanceId}`} 
                  className={`character-card-container relative w-[110px] sm:w-[140px] md:w-[160px] transition-all duration-500 ease-in-out ${
                    isBeingTargeted ? 'scale-105 z-40' :
                    shouldBlur ? 'blur-sm opacity-50 scale-95' : ''
                  } ${isValidTarget ? 'valid-target' : ''} ${isTargetingCaster ? 'targeting-caster' : ''}`}
                  style={{
                    filter: shouldBlur ? 'blur(4px)' : 
                           isBeingTargeted ? 'drop-shadow(0 0 15px rgba(255,0,0,0.8))' : 
                           isValidTarget ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8))' : 'none',
                    transform: isBeingTargeted ? 'scale(1.05)' :
                              shouldBlur ? 'scale(0.95)' : 
                              isValidTarget ? 'scale(1.02)' : 'scale(1)',
                    cursor: isValidTarget ? 'pointer' : 'default'
                  }}
                  onClick={(e) => isValidTarget && handleTargetSelect(char, e)}
                  onMouseEnter={() => {
                    if (isValidTarget && isTargeting) {
                      setHoveredTarget(document.getElementById(`char-${char.instanceId}`))
                    }
                  }}
                  onMouseLeave={() => {
                    if (isTargeting) {
                      setHoveredTarget(null)
                    }
                  }}
                >
                  <CharacterCard
                    character={char}
                    isActive={currentTurn === 'ai' && aiTeamState.filter(c => c.currentHealth > 0).indexOf(char) === (aiCharacterIndex % aiTeamState.filter(c => c.currentHealth > 0).length)}
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
                  {/* Shield Effect - Moved to MobileShieldOverlay */}
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
                </div>
              )
            })}
          </div>
        </div>
        {/* End of Red Team */}
      </div>
      {/* End of Battle Arena */}
      </div>
      
      
      {/* Targeting UI Overlay */}
      {isTargeting && (
        <>
          {/* Targeting Timer */}
          <div className="absolute top-20 sm:top-32 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black/80 backdrop-blur-lg rounded-xl sm:rounded-2xl px-4 sm:px-8 py-2 sm:py-4 border-2 border-yellow-400 shadow-2xl">
              <div className="text-center">
                <div className="text-yellow-300 font-bold text-sm sm:text-lg mb-1 sm:mb-2">SELECT TARGET</div>
                <div className="text-2xl sm:text-4xl font-bold text-white">{targetingTimer}</div>
                <div className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2">
                  {(() => {
                    const ability = targetingAbility || window.pvpAbility
                    if (!ability) return 'Choose a target'
                    let description = ability.name || 'Choose a target'
                    if (ability.damage) description += ` (${ability.damage} damage)`
                    else if (ability.heal) description += ` (${ability.heal} heal)`
                    else if (ability.shield) description += ` (${ability.shield} shield)`
                    return description
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Highlight valid targets */}
          <style jsx>{`
            .valid-target {
              cursor: pointer !important;
              animation: targetPulse 1s ease-in-out infinite;
            }
            
            @keyframes targetPulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
              }
              50% {
                transform: scale(1.05);
                box-shadow: 0 0 40px rgba(255, 215, 0, 1);
              }
            }
          `}</style>
        </>
      )}
      
      {/* Background Dim During Attack */}
      {attackInProgress && (
        <div className="absolute inset-0 bg-black/20 z-5 transition-all duration-500" />
      )}
      
      {/* Targeting Arrow */}
      {isTargeting && casterElement && hoveredTarget && (
        <SimpleTargetingArrow 
          startElement={casterElement}
          endElement={hoveredTarget}
        />
      )}
      
      
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
        @keyframes physical-attack {
          0% {
            transform: scale(1) translateZ(0);
          }
          30% {
            transform: scale(1.1) translateZ(0);
          }
          50% {
            transform: scale(1.15) translateZ(0);
          }
          100% {
            transform: scale(1) translateZ(0);
          }
        }
        
        .physical-attacking {
          animation: physical-attack 1s ease-in-out forwards;
          z-index: 50;
          filter: drop-shadow(0 0 20px rgba(255,255,0,0.6));
        }
        
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
      
      {/* End of battle-wrapper */}
    </div>
  )
}

export default AutoBattleScreen