import React, { useState, useEffect, useRef } from 'react'
import { ENHANCED_CHARACTERS } from '../game/enhancedCharacters.js'
import ParticleEffects from './ParticleEffects'
import { useWallet } from '@solana/wallet-adapter-react'
import { playClickSound, playHoverSound } from '../utils/soundEffects'
import CardPreview from './CardPreview'
import CardFlyAnimation from './CardFlyAnimation'

// The 8 available NFT toys mapped to their character data
const AVAILABLE_NFTS = {
  'wizardnft.png': 'Wizard Toy',
  'archwizardnft.png': 'Arch Wizard',
  'robotnft.png': 'Robot Guardian',
  'duckienft.png': 'Rubber Duckie',
  'brickdudenft.png': 'Brick Dude',
  'voodoonft.png': 'Cursed Marionette',
  'dinonft.png': 'Mecha Dino',
  'winduptoynft.png': 'Wind-Up Soldier'
};

const PvPTeamSelect = ({ onTeamSelected, onBack, maxTeamSize = 4 }) => {
  const { publicKey } = useWallet()
  const [hoveredCharacter, setHoveredCharacter] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [nftCollection, setNftCollection] = useState([])
  const [previewCharacter, setPreviewCharacter] = useState(null)
  const [previewPosition, setPreviewPosition] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState([])
  const [flyAnimations, setFlyAnimations] = useState([])
  const cardRefs = useRef({})
  const teamSlotRefs = useRef({})

  useEffect(() => {
    loadNFTCollection()
  }, [publicKey])

  const loadNFTCollection = () => {
    // Get all characters and mark which ones are available as NFTs
    const allCharacters = Object.values(ENHANCED_CHARACTERS);
    const availableNames = Object.values(AVAILABLE_NFTS);

    const collection = allCharacters.map(char => ({
      ...char,
      nftId: `nft_${char.id}_${Date.now()}`,
      level: Math.floor(Math.random() * 10) + 1,
      // Mark as owned only if it's one of our 8 NFTs
      owned: availableNames.includes(char.name),
      // Add the NFT image path
      nftImage: Object.entries(AVAILABLE_NFTS).find(([_, name]) => name === char.name)?.[0],
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

  const [animatingCharacters, setAnimatingCharacters] = useState(new Set())

  const handleCharacterClick = (character, event) => {
    if (!character.owned) {
      // Show coming soon message for unavailable NFTs
      return
    }

    // Check if this character is already animating
    if (animatingCharacters.has(character.nftId)) {
      return // Prevent double animation
    }

    // Play card selection sound
    const selectSound = new Audio('/selectcard.wav')
    selectSound.volume = 0.3
    selectSound.play().catch(err => console.log('Could not play select sound:', err))

    if (selectedTeam.find(c => c.nftId === character.nftId)) {
      // Remove from team
      setSelectedTeam(prev => prev.filter(c => c.nftId !== character.nftId))
      setIsConfirming(false)
    } else if (selectedTeam.length < maxTeamSize) {
      // Get position for animation
      const cardElement = cardRefs.current[character.nftId]

      if (cardElement && character.nftImage) {
        // Mark as animating
        setAnimatingCharacters(prev => new Set([...prev, character.nftId]))

        const startRect = cardElement.getBoundingClientRect()

        // Add new animation to array
        const animationId = Date.now() + Math.random()
        setFlyAnimations(prev => [...prev, {
          id: animationId,
          isAnimating: true,
          startRect,
          imageUrl: `/assets/nft/newnft/${character.nftImage}`,
          character
        }])

        // Add to team and clean up after animation
        setTimeout(() => {
          addToTeam(character)
          // Clean up immediately
          setFlyAnimations(prev => prev.filter(a => a.id !== animationId))
          setAnimatingCharacters(prev => {
            const newSet = new Set(prev)
            newSet.delete(character.nftId)
            return newSet
          })
        }, 1400) // Complete before fade finishes
      } else {
        // Fallback if no animation possible
        addToTeam(character)
      }
    }
  }

  const addToTeam = (character) => {
    setSelectedTeam(prev => [...prev, character])
    if (selectedTeam.length === maxTeamSize - 1) {
      setIsConfirming(true)
    }
  }

  const handleConfirmTeam = () => {
    if (selectedTeam.length === maxTeamSize) {
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

  const handleMouseEnter = (character) => {
    setHoveredCharacter(character)
    playHoverSound()
  }

  const handleMouseLeave = () => {
    setHoveredCharacter(null)
  }

  const groups = groupedByRarity()

  return (
    <div className="relative h-screen overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Fixed Background */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: 'url(/assets/backgrounds/toyboxarena.png)' }}
      />

      {/* Fixed Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50">
        <ParticleEffects type="stars" count={60} />
      </div>

      <div className="relative z-10 p-4 pb-32 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="text-center mb-8 py-6">
        <h1 className="text-5xl font-bold text-white mb-2 font-toy">
          <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Build Your PvP Team!
          </span>
        </h1>
        <p className="text-white text-xl font-comic opacity-90">
          Choose {maxTeamSize} NFT Toys for Battle
        </p>
      </div>

      {/* Selected Team Display */}
      <div className="bg-black/50 backdrop-blur-md rounded-lg p-4 mb-6 max-w-6xl mx-auto border border-white/20">
        <h3 className="text-xl font-bold text-white mb-3">
          Your Team ({selectedTeam.length}/{maxTeamSize})
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(maxTeamSize)].map((_, index) => {
            const character = selectedTeam[index]
            return (
              <div
                key={index}
                ref={el => teamSlotRefs.current[index] = el}
                className={`
                  aspect-[2/3] rounded-lg border-2 transition-all
                  ${character ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800/20'}
                `}
              >
                {character && (
                  <div
                    className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-red-900/20 rounded-lg overflow-hidden"
                    onClick={() => handleCharacterClick(character)}
                  >
                    {character.nftImage ? (
                      <img
                        src={`/assets/nft/newnft/${character.nftImage}`}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl">{character.emoji}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Character Selection Grid by Rarity */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {Object.entries(groups).map(([rarity, characters]) => {
          if (characters.length === 0) return null

          const header = getRarityHeader(rarity)

          return (
            <div key={rarity} className="mb-8 relative">
              {/* Rarity Header - Same as TeamSelect */}
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {characters.map(character => {
                  const isSelected = selectedTeam.find(c => c.nftId === character.nftId)
                  const isAvailable = character.owned

                  const isAnimating = animatingCharacters.has(character.nftId)

                  return (
                    <div
                      key={character.nftId}
                      ref={el => cardRefs.current[character.nftId] = el}
                      className={`
                        relative group cursor-pointer transform transition-all duration-200
                        ${isAvailable && !isAnimating ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}
                        ${isSelected ? 'scale-105' : ''}
                        ${isAnimating ? 'pointer-events-none opacity-50' : ''}
                      `}
                      onClick={(e) => isAvailable && !isAnimating && handleCharacterClick(character, e)}
                      onMouseEnter={() => isAvailable && !isAnimating && handleMouseEnter(character)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Card */}
                      <div className={`
                        relative rounded-lg overflow-hidden border-2 transition-all
                        ${isSelected ? 'border-green-500 shadow-lg shadow-green-500/50' :
                          isAvailable ? 'border-gray-600 hover:border-white' : 'border-gray-700'}
                      `}>
                        {/* Character Display - Full Image */}
                        <div className="relative w-full h-full">
                          {/* Show NFT image if available, otherwise emoji with background */}
                          {character.nftImage ? (
                            <img
                              src={`/assets/nft/newnft/${character.nftImage}`}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getRarityColor(character.rarity)} flex items-center justify-center`}>
                              <div className="text-6xl">{character.emoji}</div>
                            </div>
                          )}

                          {/* Selected indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg">
                              ✓
                            </div>
                          )}

                          {/* Not Available overlay */}
                          {!isAvailable && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                              <span className="text-gray-300 text-lg font-bold">COMING SOON</span>
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

      {/* Back Button - Same style as TeamSelect */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 bg-gray-800/80 backdrop-blur hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full font-toy text-sm transition-all hover:scale-105 z-20"
      >
        ← Back
      </button>

      {/* Confirm Button */}
      {selectedTeam.length === maxTeamSize && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={handleConfirmTeam}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 animate-pulse"
          >
            Confirm Team
          </button>
        </div>
      )}

      {/* Card Preview */}
      {previewCharacter && (
        <CardPreview
          character={previewCharacter}
          position={previewPosition}
          onClose={() => setPreviewCharacter(null)}
        />
      )}

      {/* Card Fly Animations - Multiple can be active */}
      {flyAnimations.map(animation => (
        <CardFlyAnimation
          key={animation.id}
          isAnimating={animation.isAnimating}
          startRect={animation.startRect}
          imageUrl={animation.imageUrl}
          onComplete={() => {
            // Animation cleanup handled by timeout
          }}
        />
      ))}
      </div>
    </div>
  )
}

export default PvPTeamSelect