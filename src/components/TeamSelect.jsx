import React, { useState, useEffect } from 'react'
import { ENHANCED_CHARACTERS } from '../game/enhancedCharacters.js'
import ParticleEffects from './ParticleEffects'
import { useWallet } from '@solana/wallet-adapter-react'
import { playClickSound, playHoverSound } from '../utils/soundEffects'
import CardPreview from './CardPreview'

const TeamSelect = ({ onTeamSelected, onBack }) => {
  const { publicKey } = useWallet()
  const [hoveredCharacter, setHoveredCharacter] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [nftCollection, setNftCollection] = useState([])
  const [previewCharacter, setPreviewCharacter] = useState(null)
  const [previewPosition, setPreviewPosition] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [hoverDelayTimer, setHoverDelayTimer] = useState(null)
  const [touchStartTime, setTouchStartTime] = useState(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  const [selectedTeam, setSelectedTeam] = useState([])
  
  useEffect(() => {
    // Detect if touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    
    // Simulate loading NFT collection
    // In production, this would fetch actual NFTs from the wallet
    loadNFTCollection()
    
    // Cleanup timers on unmount
    return () => {
      if (hoverDelayTimer) {
        clearTimeout(hoverDelayTimer)
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [publicKey])
  
  
  const loadNFTCollection = () => {
    // For demo, we'll use all characters as available NFTs
    // In production, this would fetch from blockchain
    const collection = Object.values(ENHANCED_CHARACTERS).map(char => ({
      ...char,
      nftId: `nft_${char.id}_${Date.now()}`,
      level: Math.floor(Math.random() * 10) + 1,
      owned: true,
      // Add ability preview
      ultimateAbility: char.abilities.find(a => a.isUltimate)
    }))
    
    setNftCollection(collection)
  }
  
  // Group characters by rarity
  const groupedByRarity = () => {
    const groups = {
      mythic: [],
      legendary: [],
      epic: [],
      rare: [],
      common: []
    }
    
    nftCollection.forEach(char => {
      const rarity = char.rarity || 'common'
      if (groups[rarity]) {
        groups[rarity].push(char)
      }
    })
    
    return groups
  }
  
  const getRarityHeader = (rarity) => {
    const headers = {
      mythic: { text: 'MYTHIC', color: 'from-red-600 to-orange-500', glow: 'text-red-500' },
      legendary: { text: 'LEGENDARY', color: 'from-yellow-500 to-amber-500', glow: 'text-yellow-500' },
      epic: { text: 'EPIC', color: 'from-purple-500 to-pink-500', glow: 'text-purple-500' },
      rare: { text: 'RARE', color: 'from-blue-500 to-cyan-500', glow: 'text-blue-500' },
      common: { text: 'COMMON', color: 'from-gray-500 to-gray-600', glow: 'text-gray-400' }
    }
    return headers[rarity] || headers.common
  }
  
  const handleCharacterClick = (character) => {
    if (!character.owned) {
      return
    }
    
    // Play card selection sound
    const selectSound = new Audio('/selectcard.wav')
    selectSound.volume = 0.3
    selectSound.play().catch(err => console.log('Could not play select sound:', err))
    
    // Play character-specific sound if available
    if (!selectedTeam.find(c => c.nftId === character.nftId)) {
      // Check for selectSound property first
      if (character.selectSound) {
        const charSound = new Audio(character.selectSound)
        charSound.volume = 0.5
        charSound.play().catch(err => console.log(`Could not play ${character.name} sound:`, err))
      } 
      // Keep legacy sound support for wizard and pirate
      else if (character.name === 'Wizard Toy') {
        const wizardSound = new Audio('/wizarditsplaytime.mp3')
        wizardSound.volume = 0.5
        wizardSound.play().catch(err => console.log('Could not play wizard sound:', err))
      }
      else if (character.name === 'Pirate Captain') {
        const pirateSound = new Audio('/pirate.mp3')
        pirateSound.volume = 0.5
        pirateSound.play().catch(err => console.log('Could not play pirate sound:', err))
      }
    }
    
    if (selectedTeam.find(c => c.nftId === character.nftId)) {
      // Remove from team
      setSelectedTeam(prev => prev.filter(c => c.nftId !== character.nftId))
      setIsConfirming(false)
    } else if (selectedTeam.length < 3) {
      // Add to team
      setSelectedTeam(prev => [...prev, character])
      
      if (selectedTeam.length === 2) {
        // Team complete
        setIsConfirming(true)
      }
    }
  }
  
  const handleConfirmTeam = () => {
    if (selectedTeam.length === 3) {
      playClickSound()
      onTeamSelected(selectedTeam)
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
  
  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'rgba(255, 0, 0, 0.6)'
      case 'legendary': return 'rgba(255, 215, 0, 0.5)'
      case 'epic': return 'rgba(147, 51, 234, 0.5)'
      case 'rare': return 'rgba(59, 130, 246, 0.5)'
      default: return 'rgba(156, 163, 175, 0.3)'
    }
  }

  return (
    <div className="team-select h-full flex flex-col relative overflow-hidden">
      {/* Static Background */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: 'url(/assets/backgrounds/toyboxarena.png)' }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50">
        <ParticleEffects type="stars" count={60} />
      </div>
      
      {/* Title */}
      <div className="relative z-10 text-center py-6">
        <h1 className="text-5xl font-bold text-white mb-2 font-toy">
          <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Build Your Dream Team!
          </span>
        </h1>
        <p className="text-white text-xl font-comic opacity-90">
          Select 3 NFT Toys for Battle
        </p>
      </div>
      
      {/* Team Preview */}
      <div className="relative z-10 bg-black bg-opacity-40 backdrop-blur rounded-xl mb-4 team-preview-bar">
        <div className="team-preview-label text-white font-toy">Your Team:</div>
        <div className="team-preview-slots">
          {[0, 1, 2].map(index => {
            const member = selectedTeam[index]
            return (
              <div
                key={index}
                className={`
                  team-preview-slot rounded-xl border-2 border-dashed
                  flex items-center justify-center transition-all
                  ${member ? 'border-yellow-400 bg-gradient-to-br from-purple-800/50 to-indigo-800/50' : 'border-gray-600'}
                `}
              >
                {member ? (
                  <div className="w-full h-full relative">
                    {member.image ? (
                      <img 
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center emoji-container">
                        <div className="text-4xl" style={{ color: member.color }}>
                          {member.emoji}
                        </div>
                      </div>
                    )}
                    <div className="character-name bg-black/70 text-white rounded-b-lg">
                      {member.name}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-3xl">?</div>
                )}
              </div>
            )
          })}
        </div>
        {selectedTeam.length === 3 && (
          <div className="battle-button-container">
            <button
              onClick={handleConfirmTeam}
              onTouchStart={(e) => {
                e.preventDefault();
                handleConfirmTeam();
              }}
              className="enhanced-toy-button text-base px-5 py-2 font-toy animate-pulse"
            >
              Battle! ⚔️
            </button>
          </div>
        )}
      </div>
      
      {/* NFT Collection Grid - Organized by Rarity */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {Object.entries(groupedByRarity()).map(([rarity, characters]) => {
            if (characters.length === 0) return null
            const header = getRarityHeader(rarity)
            
            return (
              <div key={rarity} className={`mb-8 relative ${rarity === 'mythic' ? 'mythic-section' : rarity === 'legendary' ? 'legendary-section' : ''}`}>
                {/* Special glow for mythic/legendary sections */}
                {rarity === 'mythic' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-orange-900/10 to-red-900/10 rounded-lg -m-4 animate-pulse" />
                )}
                {rarity === 'legendary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/10 via-amber-900/10 to-yellow-900/10 rounded-lg -m-4" />
                )}
                
                {/* Rarity Header */}
                <div className="mb-4 relative">
                  <div className="flex items-center gap-4">
                    <div className={`
                      text-2xl font-bold font-toy px-6 py-2 rounded-lg
                      bg-gradient-to-r ${header.color} text-white
                      shadow-lg transform -skew-x-12
                      ${rarity === 'mythic' ? 'animate-pulse shadow-red-500/50' : ''}
                      ${rarity === 'legendary' ? 'shadow-yellow-500/50' : ''}
                    `}>
                      <span className="block transform skew-x-12">{header.text}</span>
                    </div>
                    <div className={`flex-1 h-1 rounded ${
                      rarity === 'mythic' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
                      rarity === 'legendary' ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' :
                      'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
                    }`} />
                    <div className={`text-sm ${header.glow} font-bold uppercase tracking-wider`}>
                      {characters.length} {characters.length === 1 ? 'TOY' : 'TOYS'}
                    </div>
                  </div>
                </div>
                
                {/* Characters Grid for this Rarity */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {characters.map((character) => {
                    const isSelected = selectedTeam.find(c => c.nftId === character.nftId)
                    const teamPosition = selectedTeam.findIndex(c => c.nftId === character.nftId) + 1
                    
                    return (
              <div
                key={character.nftId}
                onClick={(e) => {
                  // Only handle click on non-touch devices
                  if (!isTouchDevice) {
                    e.preventDefault()
                    handleCharacterClick(character)
                  }
                }}
                onMouseEnter={() => {
                  // Only for non-touch devices
                  if (!isTouchDevice) {
                    setHoveredCharacter(character)
                    playHoverSound()
                    
                    // Clear any existing hover timer
                    if (hoverDelayTimer) {
                      clearTimeout(hoverDelayTimer)
                    }
                    
                    // Set new timer for 0.9 seconds
                    const timer = setTimeout(() => {
                      setPreviewCharacter(character)
                    }, 900) // 0.9 second delay
                    
                    setHoverDelayTimer(timer)
                  }
                }}
                onMouseLeave={() => {
                  if (!isTouchDevice) {
                    setHoveredCharacter(null)
                    setPreviewCharacter(null)
                    
                    // Clear hover delay timer
                    if (hoverDelayTimer) {
                      clearTimeout(hoverDelayTimer)
                      setHoverDelayTimer(null)
                    }
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault() // Prevent mouse events from firing
                  setTouchStartTime(Date.now())
                  
                  // Start long press timer
                  const timer = setTimeout(() => {
                    setPreviewCharacter(character)
                    // Vibrate if available
                    if (navigator.vibrate) {
                      navigator.vibrate(50)
                    }
                  }, 500) // Show after 500ms hold
                  setLongPressTimer(timer)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault() // Prevent mouse events from firing
                  
                  // Clear long press timer
                  if (longPressTimer) {
                    clearTimeout(longPressTimer)
                    setLongPressTimer(null)
                  }
                  
                  const touchDuration = Date.now() - touchStartTime
                  
                  if (touchDuration < 400 && !previewCharacter) {
                    // Quick tap - select/deselect
                    handleCharacterClick(character)
                  } else if (previewCharacter) {
                    // Was showing preview - just close it
                    setPreviewCharacter(null)
                  }
                  
                  setTouchStartTime(null)
                }}
                onTouchCancel={() => {
                  // Cancel any ongoing timers if touch is cancelled
                  if (longPressTimer) {
                    clearTimeout(longPressTimer)
                    setLongPressTimer(null)
                  }
                  setTouchStartTime(null)
                  setPreviewCharacter(null)
                }}
                className={`
                  character-select-card relative cursor-pointer transition-all duration-300 group
                  ${isSelected ? 'scale-95' : 'hover:scale-105'}
                  ${!character.owned ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{ touchAction: 'manipulation' }}
              >
                {/* NFT Card - Redesigned to match preview */}
                <div 
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    border: '2px solid transparent',
                    backgroundClip: 'padding-box',
                    borderImage: character.rarity === 'mythic' ? 'linear-gradient(135deg, #FF006E, #8338EC, #3A86FF, #06FFB4, #FFBE0B)' :
                                character.rarity === 'legendary' ? 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)' :
                                character.rarity === 'epic' ? 'linear-gradient(135deg, #B794F4, #9F7AEA, #B794F4)' :
                                character.rarity === 'rare' ? 'linear-gradient(135deg, #63B3ED, #4299E1, #63B3ED)' :
                                'linear-gradient(135deg, #CBD5E0, #A0AEC0, #CBD5E0)',
                    borderImageSlice: 1,
                    boxShadow: character.rarity !== 'common' 
                      ? `0 20px 40px ${getRarityGlow(character.rarity)}`
                      : hoveredCharacter?.nftId === character.nftId 
                        ? `0 20px 40px ${getRarityGlow(character.rarity)}`
                        : '0 10px 30px rgba(0,0,0,0.5)',
                    filter: character.rarity !== 'common'
                      ? `drop-shadow(0 0 20px ${getRarityGlow(character.rarity)})`
                      : hoveredCharacter?.nftId === character.nftId 
                        ? `drop-shadow(0 0 20px ${getRarityGlow(character.rarity)})`
                        : 'none'
                  }}
                >
                  {/* Rarity Badge */}
                  <div className={`
                    absolute top-0 left-0 right-0 h-6 opacity-90
                    ${character.rarity === 'mythic' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500' :
                      character.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400' :
                      character.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                      character.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      'bg-gradient-to-r from-gray-400 to-gray-600'}
                  `}>
                    <div className="flex items-center justify-center h-full">
                      <span className="text-white font-bold text-[10px] tracking-widest uppercase">
                        {character.rarity}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`pt-8 pb-4 px-3 ${isSelected ? 'opacity-70' : ''}`}>
                    {/* Team Position Indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg animate-bounce z-10">
                        {teamPosition}
                      </div>
                    )}
                    
                    {/* Character Image/Emoji */}
                    <div className="relative mx-auto w-24 h-24 mb-3">
                      <div className="absolute inset-0 rounded-full"
                           style={{
                             background: `radial-gradient(circle, ${getRarityGlow(character.rarity)} 0%, transparent 70%)`,
                             animation: 'rotate-slow 10s linear infinite',
                             opacity: 0.5
                           }} />
                      <div className="relative flex items-center justify-center h-full">
                        {character.image ? (
                          <img
                            src={character.image}
                            alt={character.name}
                            className={`w-20 h-20 object-cover rounded-xl ${isSelected ? 'character-selected' : ''}`}
                            style={{ 
                              filter: isSelected 
                                ? 'grayscale(100%) brightness(0.6)'
                                : `drop-shadow(0 5px 15px ${getRarityGlow(character.rarity)})`
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const emojiDiv = e.target.nextSibling;
                              if (emojiDiv) emojiDiv.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`text-6xl ${isSelected ? 'character-selected' : ''}`}
                          style={{ 
                            filter: isSelected 
                              ? 'grayscale(100%) brightness(0.6)'
                              : `drop-shadow(0 5px 15px ${getRarityGlow(character.rarity)})`,
                            display: character.image ? 'none' : 'block'
                          }}
                        >
                          {character.emoji}
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Character Name */}
                    <h3 className={`text-sm font-bold text-center mb-2 font-toy tracking-wide`}
                        style={{
                          color: character.rarity === 'mythic' ? '#FF006E' :
                                character.rarity === 'legendary' ? '#FFD700' :
                                character.rarity === 'epic' ? '#B794F4' :
                                character.rarity === 'rare' ? '#63B3ED' :
                                '#CBD5E0',
                          textShadow: `0 0 10px ${getRarityGlow(character.rarity)}, 1px 1px 2px rgba(0,0,0,0.8)`
                        }}>
                      {character.name}
                    </h3>
                    
                    {/* Stats Display - Simple emoji with numbers */}
                    <div className="flex justify-around mb-3 px-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">❤️</span>
                        <span className="text-xs text-white font-bold">{character.maxHealth || 100}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">⚔️</span>
                        <span className="text-xs text-white font-bold">{character.stats?.attack || 5}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🛡️</span>
                        <span className="text-xs text-white font-bold">{character.stats?.defense || 5}</span>
                      </div>
                    </div>
                    
                    {/* Abilities Preview - All 3 abilities */}
                    {character.abilities && (
                      <div className="space-y-1.5">
                        {character.abilities.slice(0, 3).map((ability, idx) => {
                          const isUltimate = ability.isUltimate || idx === 2
                          
                          return (
                            <div key={idx} 
                                 className={`relative ${
                                   isUltimate 
                                     ? 'bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-red-900/60' 
                                     : 'bg-gradient-to-r from-gray-800/40 to-gray-900/40'
                                 } backdrop-blur rounded px-2 py-1.5 border ${
                                   isUltimate ? 'border-purple-500/50' : 'border-gray-700/30'
                                 }`}
                                 style={{
                                   boxShadow: isUltimate ? '0 2px 10px rgba(168, 85, 247, 0.3)' : 'none'
                                 }}>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <span className={`font-bold text-[10px] ${isUltimate ? 'text-yellow-400' : 'text-white'}`}>
                                    {ability.name}
                                  </span>
                                </div>
                                
                                <div className={`text-right ${isUltimate ? 'animate-pulse' : ''}`}>
                                  <div className={`text-xs font-black ${
                                    isUltimate ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500' : 
                                    'text-white/80'
                                  }`}>
                                    {Math.round((ability.chance || 0) * 100)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Not Owned Overlay */}
                    {!character.owned && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-2xl flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-2xl mb-2">🔒</div>
                          <div className="text-xs">Not Owned</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-black bg-opacity-50 backdrop-blur p-3 text-center relative z-10">
        <p className="text-white text-sm font-comic">
          💡 Tip: Build a balanced team with different abilities! Mix attackers, defenders, and support characters.
        </p>
      </div>
      
      {/* Back Button */}
      <button
        onClick={onBack}
        onTouchEnd={(e) => {
          e.preventDefault()
          onBack()
        }}
        className="fixed top-4 left-4 bg-gray-800/80 backdrop-blur hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-toy text-sm transition-all hover:scale-105"
        style={{ 
          zIndex: 9999, 
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>
      
      {/* Card Preview Modal */}
      <CardPreview 
        character={previewCharacter}
        isVisible={!!previewCharacter}
        position={previewPosition}
        onClose={() => setPreviewCharacter(null)}
      />
    </div>
  )
}

export default TeamSelect