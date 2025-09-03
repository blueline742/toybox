import React, { useState } from 'react'
import { CHARACTERS } from '../game/characters'
import CardPreview from './CardPreview'

const CharacterSelect = ({ onCharacterSelected, onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [hoveredCharacter, setHoveredCharacter] = useState(null)
  const [previewCharacter, setPreviewCharacter] = useState(null)
  const [previewPosition, setPreviewPosition] = useState(null)

  const handleSelectCharacter = (character, event) => {
    // Show preview on click
    const rect = event.currentTarget.getBoundingClientRect()
    setPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    })
    setPreviewCharacter(character)
  }

  const handleConfirmSelection = (character) => {
    setSelectedCharacter(character)
    setPreviewCharacter(null)
    // Add a small delay for visual feedback
    setTimeout(() => {
      onCharacterSelected(character)
    }, 300)
  }

  const characterList = Object.values(CHARACTERS)

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 bg-toy-blue rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-toy-pink rounded-full animate-bounce"></div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-toy text-white mb-2 text-center drop-shadow-2xl animate-bounce-in">
        CHOOSE YOUR
      </h1>
      <h2 className="text-3xl md:text-5xl font-toy text-toy-yellow mb-8 text-center drop-shadow-xl animate-bounce-in">
        TOY FIGHTER!
      </h2>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl w-full">
        {characterList.map((character) => (
          <div
            key={character.id}
            className={`relative bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:bg-opacity-30 ${
              selectedCharacter?.id === character.id ? 'ring-4 ring-toy-yellow scale-105' : ''
            } ${hoveredCharacter?.id === character.id ? 'shadow-2xl' : 'shadow-lg'}`}
            onClick={(e) => handleSelectCharacter(character, e)}
            onMouseEnter={() => setHoveredCharacter(character)}
            onMouseLeave={() => setHoveredCharacter(null)}
          >
            {/* Character Icon */}
            <div className="text-center mb-4">
              <div 
                className="text-6xl md:text-8xl mx-auto mb-2 inline-block p-4 rounded-full"
                style={{ backgroundColor: character.color + '20' }}
              >
                {character.emoji}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white font-comic">
                {character.name}
              </h3>
              <p className="text-sm text-white opacity-80 font-comic mt-1">
                {character.description}
              </p>
            </div>

            {/* Stats */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-white text-sm font-comic mb-1">
                <span>Health</span>
                <span>{character.maxHealth}</span>
              </div>
              <div className="flex justify-between items-center text-white text-sm font-comic mb-1">
                <span>Attack</span>
                <span>{'⭐'.repeat(character.stats.attack)}</span>
              </div>
              <div className="flex justify-between items-center text-white text-sm font-comic mb-1">
                <span>Defense</span>
                <span>{'🛡️'.repeat(character.stats.defense)}</span>
              </div>
              <div className="flex justify-between items-center text-white text-sm font-comic">
                <span>Speed</span>
                <span>{'⚡'.repeat(character.stats.speed)}</span>
              </div>
            </div>

            {/* Abilities Preview */}
            <div>
              <h4 className="text-white font-comic text-sm mb-2">Special Abilities:</h4>
              <div className="space-y-1">
                {character.abilities.slice(0, 2).map((ability) => (
                  <div key={ability.id} className="text-xs text-white opacity-80 font-comic">
                    • {ability.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Selection indicator */}
            {selectedCharacter?.id === character.id && (
              <div className="absolute inset-0 bg-toy-yellow bg-opacity-20 rounded-2xl pointer-events-none animate-pulse-glow">
                <div className="absolute top-2 right-2 text-toy-yellow text-2xl">
                  ✓
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full font-comic transform transition-all duration-150 active:scale-95"
        >
          Back
        </button>
        
        {selectedCharacter && (
          <button
            onClick={() => handleConfirmSelection(selectedCharacter)}
            className="toy-button text-xl font-comic px-8 py-3 animate-pulse-glow"
          >
            START BATTLE!
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-white opacity-60 text-center mt-4 font-comic text-sm">
        Click a character to view details and select your fighter!
      </p>

      {/* Card Preview Modal */}
      <CardPreview 
        character={previewCharacter}
        isVisible={!!previewCharacter}
        position={previewPosition}
        onClose={() => {
          setPreviewCharacter(null)
          if (previewCharacter) {
            handleConfirmSelection(previewCharacter)
          }
        }}
      />
    </div>
  )
}

export default CharacterSelect