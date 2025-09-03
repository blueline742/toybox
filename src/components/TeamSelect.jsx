import React, { useState, useEffect } from 'react'
import { ENHANCED_CHARACTERS } from '../game/enhancedCharacters.js'
import ParticleEffects from './ParticleEffects'
import { useWallet } from '@solana/wallet-adapter-react'
import { playClickSound, playHoverSound } from '../utils/soundEffects'
import CardPreview from './CardPreview'

const TeamSelect = ({ onTeamSelected, onBack }) => {
  const { publicKey } = useWallet()
  const [selectedTeam, setSelectedTeam] = useState([])
  const [hoveredCharacter, setHoveredCharacter] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [nftCollection, setNftCollection] = useState([])
  const [previewCharacter, setPreviewCharacter] = useState(null)
  const [previewPosition, setPreviewPosition] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  useEffect(() => {
    // Simulate loading NFT collection
    // In production, this would fetch actual NFTs from the wallet
    loadNFTCollection()
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
      mythic: { text: '🔥 MYTHIC', color: 'from-red-600 to-orange-500', glow: 'text-red-500' },
      legendary: { text: '⭐ LEGENDARY', color: 'from-yellow-500 to-amber-500', glow: 'text-yellow-500' },
      epic: { text: '💎 EPIC', color: 'from-purple-500 to-pink-500', glow: 'text-purple-500' },
      rare: { text: '💙 RARE', color: 'from-blue-500 to-cyan-500', glow: 'text-blue-500' },
      common: { text: '⚪ COMMON', color: 'from-gray-500 to-gray-600', glow: 'text-gray-400' }
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
    <div className="h-full flex flex-col relative overflow-hidden">
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
      <div className="relative z-10 bg-black bg-opacity-40 backdrop-blur p-4 mx-8 rounded-xl mb-4">
        <div className="flex justify-center items-center gap-8">
          <div className="text-white font-toy text-lg">Your Team:</div>
          {[0, 1, 2].map(index => {
            const member = selectedTeam[index]
            return (
              <div
                key={index}
                className={`
                  w-24 h-24 rounded-xl border-2 border-dashed
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
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-5xl" style={{ color: member.color }}>
                          {member.emoji}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-white text-center py-1 rounded-b-lg">
                      {member.name}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-4xl">?</div>
                )}
              </div>
            )
          })}
          {selectedTeam.length === 3 && (
            <button
              onClick={handleConfirmTeam}
              className="ml-4 enhanced-toy-button text-lg px-6 py-3 font-toy animate-pulse"
            >
              Battle! ⚔️
            </button>
          )}
        </div>
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
                onClick={() => handleCharacterClick(character)}
                onMouseEnter={() => {
                  setHoveredCharacter(character)
                  setPreviewCharacter(character)
                  playHoverSound()
                }}
                onMouseLeave={() => {
                  setHoveredCharacter(null)
                  setPreviewCharacter(null)
                  if (longPressTimer) {
                    clearTimeout(longPressTimer)
                    setLongPressTimer(null)
                  }
                }}
                onTouchStart={() => {
                  // Mobile long press to show preview
                  const timer = setTimeout(() => {
                    setPreviewCharacter(character)
                    // Vibrate if available
                    if (navigator.vibrate) {
                      navigator.vibrate(50)
                    }
                  }, 500) // Show after 500ms hold
                  setLongPressTimer(timer)
                }}
                onTouchEnd={() => {
                  if (longPressTimer) {
                    clearTimeout(longPressTimer)
                    setLongPressTimer(null)
                  }
                  // If preview is not showing, treat as click
                  if (!previewCharacter) {
                    handleCharacterClick(character)
                  } else {
                    setPreviewCharacter(null)
                  }
                }}
                className={`
                  relative cursor-pointer transition-all duration-300 group
                  ${isSelected ? 'scale-95' : 'hover:scale-105'}
                  ${!character.owned ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* NFT Card */}
                <div 
                  className={`
                    bg-gradient-to-br ${getRarityColor(character.rarity)}
                    rounded-xl p-1 shadow-2xl relative
                    ${character.rarity === 'legendary' ? 'rarity-legendary' : ''}
                    ${character.rarity === 'epic' ? 'rarity-epic' : ''}
                    ${character.rarity === 'rare' ? 'rarity-rare' : ''}
                  `}
                  style={{
                    boxShadow: hoveredCharacter?.nftId === character.nftId 
                      ? `0 20px 40px ${getRarityGlow(character.rarity)}`
                      : '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                >
                  <div className={`bg-gray-900 rounded-lg p-4 ${isSelected ? 'opacity-70' : ''}`}>
                    {/* Sparkle Effects for Legendary */}
                    {character.rarity === 'legendary' && !isSelected && (
                      <>
                        <div className="absolute top-2 left-2 text-yellow-400 animate-pulse text-xl">✨</div>
                        <div className="absolute bottom-2 right-2 text-yellow-400 animate-pulse text-xl" style={{animationDelay: '0.5s'}}>✨</div>
                        <div className="absolute top-1/2 right-2 text-yellow-400 animate-pulse text-xl" style={{animationDelay: '1s'}}>⭐</div>
                      </>
                    )}
                    
                    {/* Team Position Indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg animate-bounce">
                        {teamPosition}
                      </div>
                    )}
                    
                    {/* Character Emoji */}
                    {/* Character Image/Emoji */}
                    {character.image ? (
                      <img
                        src={character.image}
                        alt={character.name}
                        className={`w-24 h-24 object-cover rounded-xl mb-2 mx-auto transition-all duration-300 ${isSelected ? 'character-selected' : ''}`}
                        style={{ 
                          filter: isSelected 
                            ? 'grayscale(100%) brightness(0.6)'
                            : hoveredCharacter?.nftId === character.nftId 
                              ? `drop-shadow(0 0 20px ${character.color})` 
                              : 'none',
                          transform: hoveredCharacter?.nftId === character.nftId 
                            ? 'rotate(5deg) scale(1.05)' 
                            : 'rotate(0deg) scale(1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const emojiDiv = e.target.nextSibling;
                          if (emojiDiv) emojiDiv.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`text-6xl mb-2 text-center transition-all duration-300 ${isSelected ? 'character-selected' : ''}`}
                      style={{ 
                        color: isSelected ? '#666' : character.color,
                        filter: isSelected 
                          ? 'grayscale(100%) brightness(0.6)'
                          : hoveredCharacter?.nftId === character.nftId 
                            ? `drop-shadow(0 0 20px ${character.color})` 
                            : 'none',
                        transform: hoveredCharacter?.nftId === character.nftId 
                          ? 'rotate(5deg)' 
                          : 'rotate(0deg)',
                        display: character.image ? 'none' : 'block'
                      }}
                    >
                      {character.emoji}
                    </div>
                    
                    {/* Character Name */}
                    <h3 className={`text-sm font-bold text-center mb-2 ${isSelected ? 'text-gray-400' : 'text-white'}`}>
                      {character.name}
                    </h3>
                    
                    {/* Stats Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 w-8">HP</span>
                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${(character.maxHealth / 120) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white w-8 text-right">{character.maxHealth}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 w-8">ATK</span>
                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500"
                            style={{ width: `${(character.stats.attack / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white w-8 text-right">{character.stats.attack}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 w-8">DEF</span>
                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${(character.stats.defense / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white w-8 text-right">{character.stats.defense}</span>
                      </div>
                    </div>
                    
                    {/* Ultimate Ability Preview */}
                    {character.ultimateAbility && (
                      <div className="mt-2 p-1 bg-gradient-to-r from-red-900 to-purple-900 rounded text-center">
                        <div className="text-xs text-yellow-400 font-bold">ULTIMATE</div>
                        <div className="text-xs text-white">{character.ultimateAbility.name}</div>
                        <div className="text-xs text-gray-300">{character.ultimateAbility.chance * 100}% chance</div>
                      </div>
                    )}
                    
                    {/* Not Owned Overlay */}
                    {!character.owned && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg flex items-center justify-center">
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
        className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-toy text-sm z-20 transition-all hover:scale-105"
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