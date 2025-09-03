import React, { useState } from 'react'
import { CHARACTERS } from '../game/characters'
import ParticleEffects from './ParticleEffects'

const EnhancedCharacterSelect = ({ onCharacterSelected, onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [hoveredCharacter, setHoveredCharacter] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleCharacterClick = (character) => {
    if (selectedCharacter?.id === character.id) {
      setIsConfirming(true)
      setTimeout(() => {
        onCharacterSelected(character)
      }, 500)
    } else {
      setSelectedCharacter(character)
      setIsConfirming(false)
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <ParticleEffects type="stars" count={50} />
      </div>
      
      {/* Title */}
      <div className="relative z-10 text-center py-8">
        <h1 className="menu-title-epic">Choose Your Fighter!</h1>
        <p className="text-white text-xl font-comic opacity-90">
          {selectedCharacter ? 'Click again to confirm!' : 'Select your toy warrior'}
        </p>
      </div>

      {/* Characters Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {Object.values(CHARACTERS).map((character) => (
            <div
              key={character.id}
              onClick={() => handleCharacterClick(character)}
              onMouseEnter={() => setHoveredCharacter(character)}
              onMouseLeave={() => setHoveredCharacter(null)}
              className={`
                character-card-enhanced cursor-pointer relative
                ${selectedCharacter?.id === character.id ? 'ring-4 ring-yellow-400 scale-105' : ''}
                ${isConfirming && selectedCharacter?.id === character.id ? 'animate-pulse' : ''}
              `}
            >
              {/* Character Emoji */}
              <div 
                className="text-7xl mb-4 text-center transition-all duration-300"
                style={{ 
                  color: character.color,
                  filter: hoveredCharacter?.id === character.id 
                    ? `drop-shadow(0 0 30px ${character.color})` 
                    : 'none',
                  transform: hoveredCharacter?.id === character.id 
                    ? 'scale(1.2) rotate(5deg)' 
                    : 'scale(1)'
                }}
              >
                {character.emoji}
              </div>

              {/* Character Name */}
              <h3 className="text-xl font-bold text-center mb-2 text-white font-toy">
                {character.name}
              </h3>

              {/* Character Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">HP</span>
                  <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{ width: `${(character.maxHealth / 120) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-bold">{character.maxHealth}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">ATK</span>
                  <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-red-600"
                      style={{ width: `${(character.stats.attack / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-bold">{character.stats.attack}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">DEF</span>
                  <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${(character.stats.defense / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-bold">{character.stats.defense}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">SPD</span>
                  <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                      style={{ width: `${(character.stats.speed / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-bold">{character.stats.speed}</span>
                </div>
              </div>

              {/* Character Description */}
              <p className="text-gray-300 text-xs text-center italic">
                {character.description}
              </p>

              {/* Abilities Preview */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-xs font-bold mb-2">Abilities:</p>
                <div className="space-y-1">
                  {character.abilities.map((ability, index) => (
                    <div key={ability.id} className="text-xs text-gray-300">
                      <span className="text-white">• {ability.name}</span>
                      {ability.damage && <span className="text-red-400 ml-1">({ability.damage} dmg)</span>}
                      {ability.heal && <span className="text-green-400 ml-1">({ability.heal} heal)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedCharacter?.id === character.id && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full p-2 animate-bounce">
                  <span className="text-2xl">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Character Details */}
      {selectedCharacter && (
        <div className="bg-black bg-opacity-50 backdrop-blur p-4 relative z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="text-5xl"
                style={{ color: selectedCharacter.color }}
              >
                {selectedCharacter.emoji}
              </div>
              <div>
                <h3 className="text-white font-bold text-xl font-toy">
                  {selectedCharacter.name}
                </h3>
                <p className="text-gray-300 text-sm">{selectedCharacter.description}</p>
              </div>
            </div>
            
            <button
              onClick={() => onCharacterSelected(selectedCharacter)}
              className="enhanced-toy-button text-lg px-8 py-3 font-toy animate-pulse"
            >
              {isConfirming ? 'Starting...' : 'Battle!'}
            </button>
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
    </div>
  )
}

export default EnhancedCharacterSelect