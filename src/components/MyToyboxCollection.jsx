import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ENHANCED_CHARACTERS } from '../game/enhancedCharacters'

// Mock NFT ownership data - In production, this would come from blockchain
const MOCK_OWNED_NFTS = {
  'wizard_toy': { 
    owned: true, 
    image: '/assets/nft/nftwizard.png',
    acquiredDate: '2024-01-15',
    rarity: 'legendary',
    power: 9500,
    wins: 42,
    losses: 8
  },
  'mecha_dino': { 
    owned: true, 
    image: '/assets/nft/nftmechadino.png',
    acquiredDate: '2024-01-20',
    rarity: 'mythic',
    power: 12000,
    wins: 68,
    losses: 3
  }
}

const MyToyboxCollection = ({ onClose }) => {
  const { publicKey, connected } = useWallet()
  const [selectedToy, setSelectedToy] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rarity')
  const [isLoading, setIsLoading] = useState(true)
  const [ownedNFTs, setOwnedNFTs] = useState({})

  useEffect(() => {
    // Simulate loading NFTs from blockchain
    setTimeout(() => {
      setOwnedNFTs(MOCK_OWNED_NFTS)
      setIsLoading(false)
    }, 1500)
  }, [publicKey])

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'from-red-500 via-orange-500 to-yellow-500'
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

  const getFilteredToys = () => {
    let toys = Object.values(ENHANCED_CHARACTERS)
    
    // Apply filter
    if (filter === 'owned') {
      toys = toys.filter(toy => ownedNFTs[toy.id]?.owned)
    } else if (filter === 'locked') {
      toys = toys.filter(toy => !ownedNFTs[toy.id]?.owned)
    }
    
    // Apply sorting
    toys.sort((a, b) => {
      if (sortBy === 'rarity') {
        const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 }
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'power') {
        const aPower = ownedNFTs[a.id]?.power || 0
        const bPower = ownedNFTs[b.id]?.power || 0
        return bPower - aPower
      }
      return 0
    })
    
    return toys
  }

  const totalToys = Object.values(ENHANCED_CHARACTERS).length
  const ownedCount = Object.values(ownedNFTs).filter(nft => nft.owned).length
  const collectionProgress = (ownedCount / totalToys) * 100

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background with blur effect */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative min-h-screen py-8 px-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-50"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-toy mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              MY TOYBOX
            </span>
          </h1>
          <p className="text-white/80 text-xl mb-4">
            Your Ultimate NFT Collection
          </p>
          
          {/* Collection Stats */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{ownedCount}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{totalToys - ownedCount}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Locked</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{totalToys}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {collectionProgress.toFixed(0)}%
                  </div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Complete</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 bg-black/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 transition-all duration-1000 rounded-full"
                  style={{ width: `${collectionProgress}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Filter and Sort Controls */}
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4 mb-6">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {['all', 'owned', 'locked'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-purple-500"
            >
              <option value="rarity">Sort by Rarity</option>
              <option value="name">Sort by Name</option>
              <option value="power">Sort by Power</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4" />
              <div className="text-white text-xl">Loading your collection...</div>
            </div>
          </div>
        ) : (
          /* NFT Grid */
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {getFilteredToys().map((toy) => {
                const isOwned = ownedNFTs[toy.id]?.owned
                const nftData = ownedNFTs[toy.id]
                
                return (
                  <div
                    key={toy.id}
                    onClick={() => isOwned && setSelectedToy({ ...toy, ...nftData })}
                    className={`relative group cursor-pointer transform transition-all duration-300 ${
                      isOwned ? 'hover:scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {/* NFT Card */}
                    <div 
                      className={`relative rounded-2xl overflow-hidden ${
                        isOwned ? '' : 'opacity-75'
                      }`}
                      style={{
                        background: isOwned 
                          ? `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
                          : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                        boxShadow: isOwned 
                          ? `0 20px 40px ${getRarityGlow(toy.rarity)}`
                          : '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                    >
                      {/* Rarity Banner */}
                      <div className={`
                        absolute top-0 left-0 right-0 h-8 z-10 opacity-90
                        bg-gradient-to-r ${getRarityColor(toy.rarity)}
                      `}>
                        <div className="flex items-center justify-center h-full">
                          <span className="text-white font-bold text-xs tracking-widest uppercase">
                            {toy.rarity}
                          </span>
                        </div>
                      </div>
                      
                      {/* NFT Image */}
                      <div className="relative aspect-square p-4 pt-12">
                        {isOwned ? (
                          <>
                            {/* Glow Effect for Owned NFTs */}
                            <div 
                              className="absolute inset-4 rounded-xl opacity-30"
                              style={{
                                background: `radial-gradient(circle, ${getRarityGlow(toy.rarity)} 0%, transparent 70%)`,
                                animation: 'pulse 3s ease-in-out infinite'
                              }}
                            />
                            
                            {/* NFT Image */}
                            {nftData?.image ? (
                              <img
                                src={nftData.image}
                                alt={toy.name}
                                className="w-full h-full object-contain rounded-xl relative z-10"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-7xl">{toy.emoji}</div>
                              </div>
                            )}
                            
                            {/* Sparkle Effects */}
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute animate-sparkle"
                                style={{
                                  left: `${20 + Math.random() * 60}%`,
                                  top: `${20 + Math.random() * 60}%`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              >
                                ✨
                              </div>
                            ))}
                          </>
                        ) : (
                          /* Locked/Mystery Card */
                          <div className="relative w-full h-full">
                            <img
                              src="/cardback.png"
                              alt="Locked"
                              className="w-full h-full object-contain opacity-50"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-4xl mb-2">🔒</div>
                                <div className="text-white/40 text-xs uppercase tracking-wider">Locked</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* NFT Info */}
                      <div className="p-4 pt-0">
                        <h3 className={`text-sm font-bold text-center mb-2 ${
                          isOwned ? 'text-white' : 'text-white/40'
                        }`}>
                          {toy.name}
                        </h3>
                        
                        {isOwned && nftData && (
                          <div className="space-y-2">
                            {/* Power Level */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white/60">Power</span>
                              <span className="text-yellow-400 font-bold">⚡ {nftData.power}</span>
                            </div>
                            
                            {/* Battle Stats */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-green-400">W: {nftData.wins}</span>
                              <span className="text-red-400">L: {nftData.losses}</span>
                            </div>
                          </div>
                        )}
                        
                        {!isOwned && (
                          <div className="text-center">
                            <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                              How to Unlock? →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Owned Badge */}
                    {isOwned && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2 shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Toy Detail Modal */}
        {selectedToy && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedToy(null)}
          >
            <div 
              className="bg-gradient-to-br from-purple-900/90 to-black/90 rounded-3xl p-8 max-w-2xl w-full backdrop-blur-xl border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* NFT Image */}
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 mx-auto">
                    <div 
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: `radial-gradient(circle, ${getRarityGlow(selectedToy.rarity)} 0%, transparent 70%)`,
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    />
                    {selectedToy.image ? (
                      <img
                        src={selectedToy.image}
                        alt={selectedToy.name}
                        className="w-full h-full object-contain rounded-2xl relative z-10"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-8xl">
                        {selectedToy.emoji}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* NFT Details */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedToy.name}</h2>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 bg-gradient-to-r ${getRarityColor(selectedToy.rarity)}`}>
                    {selectedToy.rarity}
                  </div>
                  
                  <p className="text-white/80 mb-4">{selectedToy.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-white/60 text-sm">Power Level</div>
                      <div className="text-2xl font-bold text-yellow-400">⚡ {selectedToy.power}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-sm">Win Rate</div>
                      <div className="text-2xl font-bold text-green-400">
                        {((selectedToy.wins / (selectedToy.wins + selectedToy.losses)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Battles Won</span>
                      <span className="text-green-400 font-bold">{selectedToy.wins}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Battles Lost</span>
                      <span className="text-red-400 font-bold">{selectedToy.losses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Acquired</span>
                      <span className="text-white">{selectedToy.acquiredDate}</span>
                    </div>
                  </div>
                  
                  {/* Abilities */}
                  {selectedToy.abilities && (
                    <div>
                      <div className="text-white/60 text-sm mb-2">Special Abilities</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedToy.abilities.slice(0, 3).map((ability, idx) => (
                          <div 
                            key={idx}
                            className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white"
                          >
                            {ability.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedToy(null)}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Toy Emojis Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            <div className="text-6xl">
              {['🧸', '🎮', '🚀', '🤖', '🦖', '🎨', '⚽', '🎯'][i % 8]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyToyboxCollection