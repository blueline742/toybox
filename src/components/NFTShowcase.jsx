import React, { useState } from 'react'

const NFT_PACKS = [
  {
    id: 'starter',
    name: 'TOY PACK NFT',
    image: '/assets/nft/toypacknft.jpg',
    price: '0.15 SOL',
    rarity: 'Common',
    rarityColor: 'from-green-400 to-blue-500',
    glowColor: 'green',
    description: 'Start your collection! Contains 1 random toy to begin your adventure.',
    features: [
      '1 Random Toy',
      'Basic Abilities',
      'Starter Bonus',
      'Growth Potential',
      'Tradeable'
    ],
    dropRate: '20% Uncommon Chance',
    sparkleCount: 15
  },
  {
    id: 'mystic',
    name: 'MYSTIC CHEST',
    image: '/assets/nft/mysticchest.jpg',
    price: '0.3 SOL',
    rarity: 'Epic',
    rarityColor: 'from-blue-500 to-purple-600',
    glowColor: 'blue',
    description: 'Mystical treasures await! Contains 3 epic toys with magical powers.',
    features: [
      '3 Epic Toys',
      'Magic Abilities',
      'Special Effects',
      'Power Boosts',
      'Unique Skins'
    ],
    dropRate: '5% Rare Drops',
    sparkleCount: 30
  },
  {
    id: 'legendary',
    name: 'LEGENDARY TOY CRATE',
    image: '/assets/nft/legendarytoycrate.jpg',
    price: '0.5 SOL',
    rarity: 'Legendary',
    rarityColor: 'from-purple-600 to-yellow-500',
    glowColor: 'purple',
    description: 'The ultimate collector\'s dream! Contains 5 guaranteed legendary toys with unique abilities.',
    features: [
      '5 Legendary Toys',
      'Exclusive Abilities',
      'Limited Edition',
      'Battle Bonuses',
      'Rare Cosmetics'
    ],
    dropRate: '0.1% Ultra Rare Drops',
    sparkleCount: 50
  }
]

const NFTShowcase = ({ onMintClick }) => {
  const [selectedPack, setSelectedPack] = useState(null)
  const [hoveredPack, setHoveredPack] = useState(null)

  const handleMintClick = (pack) => {
    if (onMintClick) {
      onMintClick(pack)
    } else {
      alert(`Minting ${pack.name} - Coming Soon! Web3 integration will be added.`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900 py-16 px-4 relative overflow-hidden" id="nft-showcase">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          >
            <div className="text-4xl opacity-20">
              {['🎁', '💎', '⭐', '🏆', '🎯'][Math.floor(Math.random() * 5)]}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold font-toy mb-4"
              style={{
                background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00FFFF, #FFD700)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'rainbow-text 3s ease-in-out infinite',
                textShadow: '0 0 40px rgba(255,255,255,0.5)'
              }}>
            🎁 MINT NEW TOYS! 🎁
          </h2>
          <p className="text-xl text-gray-300 font-comic">
            Unlock exclusive NFT toy packs and build your ultimate collection!
          </p>
        </div>

        {/* Back to Menu Button - positioned to avoid audio button */}
        <button
          onClick={() => {
            // Scroll back to the menu at the top
            const menuElement = document.getElementById('main-menu')
            if (menuElement) {
              menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
              // Fallback methods
              window.scrollTo({ top: 0, behavior: 'smooth' })
              document.documentElement.scrollTop = 0
              document.body.scrollTop = 0
            }
          }}
          className="fixed bottom-20 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all"
          title="Back to Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>

        {/* NFT Cards Grid - Responsive with scroll on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 px-4 md:px-0">
          {NFT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative group cursor-pointer transform transition-all duration-500 ${
                hoveredPack === pack.id ? 'scale-105 -translate-y-4' : ''
              }`}
              onMouseEnter={() => setHoveredPack(pack.id)}
              onMouseLeave={() => setHoveredPack(null)}
              onClick={() => setSelectedPack(pack)}
            >
              {/* Card Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${pack.rarityColor} opacity-50 blur-xl group-hover:opacity-75 transition-opacity rounded-2xl`} />
              
              {/* Card Content */}
              <div className="relative bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-gray-700 group-hover:border-yellow-400 transition-all">
                {/* Rarity Badge */}
                <div className={`absolute top-4 right-4 z-20 bg-gradient-to-r ${pack.rarityColor} px-4 py-2 rounded-full text-white font-bold text-sm animate-pulse`}>
                  {pack.rarity}
                </div>

                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={pack.image} 
                    alt={pack.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Sparkle Effects */}
                  {hoveredPack === pack.id && [...Array(pack.sparkleCount)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-sparkle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    >
                      ✨
                    </div>
                  ))}
                  
                  {/* Pack Name Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <h3 className="text-2xl font-bold text-white font-toy tracking-wider">
                      {pack.name}
                    </h3>
                  </div>
                </div>

                {/* Pack Details */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-3xl font-bold text-yellow-400">{pack.price}</span>
                    <span className="text-sm text-gray-400">{pack.dropRate}</span>
                  </div>

                  <p className="text-gray-300 mb-4 text-sm">
                    {pack.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {pack.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-400 text-sm">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Mint Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMintClick(pack)
                    }}
                    className={`w-full py-3 px-6 rounded-full font-bold text-white bg-gradient-to-r ${pack.rarityColor} 
                      hover:shadow-2xl transform hover:scale-105 transition-all duration-300
                      animate-pulse hover:animate-none`}
                    style={{
                      boxShadow: `0 10px 30px rgba(${pack.glowColor === 'purple' ? '147, 51, 234' : 
                                                     pack.glowColor === 'blue' ? '59, 130, 246' : 
                                                     '34, 197, 94'}, 0.5)`
                    }}
                  >
                    MINT NOW
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="text-center mt-16 p-8 bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-2xl border border-gray-700">
          <h3 className="text-3xl font-bold text-yellow-400 mb-4 font-toy">
            🏆 Collect • Battle • Trade • Win 🏆
          </h3>
          <p className="text-gray-300 max-w-3xl mx-auto mb-6">
            Each NFT toy pack contains unique, tradeable toys with special abilities. 
            Build your dream team, dominate the arena, and earn rewards! 
            Rarer packs have higher chances of legendary toys with game-changing powers.
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <div>
              <span className="text-2xl">🎮</span>
              <p>Play to Earn</p>
            </div>
            <div>
              <span className="text-2xl">💎</span>
              <p>True Ownership</p>
            </div>
            <div>
              <span className="text-2xl">🔄</span>
              <p>Trade Freely</p>
            </div>
            <div>
              <span className="text-2xl">🚀</span>
              <p>Level Up</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Selected Pack */}
      {selectedPack && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPack(null)}
        >
          <div 
            className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full transform animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedPack.image} 
              alt={selectedPack.name}
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
            <h3 className="text-3xl font-bold text-white mb-4">{selectedPack.name}</h3>
            <p className="text-gray-300 mb-6">{selectedPack.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-yellow-400">{selectedPack.price}</span>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPack(null)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMintClick(selectedPack)}
                  className={`px-8 py-3 bg-gradient-to-r ${selectedPack.rarityColor} text-white font-bold rounded-full hover:shadow-2xl transform hover:scale-105 transition-all`}
                >
                  MINT NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default NFTShowcase