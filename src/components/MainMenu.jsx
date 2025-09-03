import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import musicManager from '../utils/musicManager'
import NFTShowcase from './NFTShowcase'

const MainMenu = ({ onStartGame, onViewToys, onStartPvP }) => {
  const [showNFTSection, setShowNFTSection] = useState(false)
  const { connected } = useWallet()
  const [floatingToys, setFloatingToys] = useState([])

  useEffect(() => {
    // Start menu music
    musicManager.playMenuMusic()
    
    // Generate floating toy emojis (fewer for cleaner look)
    const toys = ['🧸', '🎮', '🚀', '🤖', '🦖', '🎨', '⚽', '🎯']
    const newFloatingToys = []
    for (let i = 0; i < 8; i++) {
      newFloatingToys.push({
        id: i,
        emoji: toys[i % toys.length],
        x: 10 + (i * 12),
        y: 10 + (i % 2) * 80,
        delay: i * 0.5,
        duration: 20 + (i * 2)
      })
    }
    setFloatingToys(newFloatingToys)
  }, [])

  // Enable/disable scrolling when NFT section is shown/hidden
  useEffect(() => {
    if (showNFTSection) {
      document.body.style.overflow = 'auto'
      document.documentElement.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }
  }, [showNFTSection])

  const handlePlayForSol = () => {
    if (connected) {
      onStartPvP()
    }
  }

  const handleViewToys = () => {
    if (onViewToys) {
      onViewToys()
    } else {
      alert('Toy collection viewer coming soon!')
    }
  }

  const scrollToNFTSection = () => {
    setShowNFTSection(true)
    setTimeout(() => {
      document.getElementById('nft-showcase')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Function to handle scrolling back to top (used by NFT section)
  window.scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen relative overflow-y-auto">
      <div id="main-menu" className="h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Static Background */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/backgrounds/toyboxarena.png)' }}
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        
        {/* Subtle Floating Toy Emojis */}
        {floatingToys.map(toy => (
          <div
            key={toy.id}
            className="absolute opacity-10 pointer-events-none text-4xl"
            style={{
              left: `${toy.x}%`,
              top: `${toy.y}%`,
              animation: `float-around ${toy.duration}s ${toy.delay}s infinite ease-in-out`
            }}
          >
            {toy.emoji}
          </div>
        ))}

        <div className="text-center z-10 max-w-4xl mx-auto">
          {/* Main Title - Slower animation */}
          <h1 className="text-6xl md:text-8xl font-toy mb-2"
              style={{
                animation: 'title-dance 6s ease-in-out infinite', // Doubled from 3s to 6s
                display: 'inline-block'
              }}>
            <span className="text-yellow-400" style={{ textShadow: '3px 3px 0 #ff6b35, 6px 6px 0 #ff4500' }}>TOY</span>
            {' '}
            <span className="text-orange-500" style={{ textShadow: '3px 3px 0 #ff1493, 6px 6px 0 #ff69b4' }}>BOX</span>
          </h1>
          
          <h2 className="text-4xl md:text-6xl font-toy mb-4 text-pink-500"
              style={{
                textShadow: '2px 2px 0 #ff69b4, 4px 4px 0 #ff1493',
                animation: 'pulse 3s ease-in-out infinite'
              }}>
            BRAWL
          </h2>


          {/* Wallet Connection - Toy-themed */}
          <div className="mb-6 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-full blur opacity-75 animate-pulse"></div>
            <div className="relative">
              <WalletMultiButton 
                className="!bg-gradient-to-r !from-yellow-400 !via-pink-400 !to-purple-500 hover:!from-yellow-500 hover:!via-pink-500 hover:!to-purple-600 !text-white !font-bold !text-lg !px-8 !py-4 !rounded-full transform hover:scale-110 hover:rotate-3 transition-all !border-2 !border-white/50"
                style={{
                  fontFamily: 'Comic Sans MS, cursive',
                  boxShadow: '0 4px 0 #c026d3, 0 8px 20px rgba(0,0,0,0.3)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f472b6 50%, #a855f7 100%)'
                }}
              />
            </div>
          </div>

          {/* Game Buttons - AAA Game Style */}
          <div className="flex flex-col gap-4 items-center max-w-xl mx-auto">
            {/* Free Play Button */}
            <button
              onClick={onStartGame}
              className="w-full relative group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connected}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 animate-gradient-x opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative px-12 py-5 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm border-2 border-white/30 rounded-lg">
                <div className="flex flex-col items-center">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-wider drop-shadow-lg">
                    {connected ? 'FREE PLAY' : 'CONNECT WALLET FIRST'}
                  </span>
                  <span className="text-xs text-green-200/80 mt-1 uppercase tracking-widest">Single Player Mode</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
            
            {/* PvP Battle Button */}
            <button
              onClick={handlePlayForSol}
              className="w-full relative group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connected}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 animate-gradient-x opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative px-12 py-5 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm border-2 border-white/30 rounded-lg">
                <div className="flex flex-col items-center">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-wider drop-shadow-lg">
                    PVP BATTLE
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-200/80 uppercase tracking-widest">Wager</span>
                    <span className="text-xs font-bold text-yellow-300">◎ SOL</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
            
            {/* View Your Toys Button */}
            <button
              onClick={handleViewToys}
              className="w-full relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 animate-gradient-x opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative px-12 py-5 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm border-2 border-white/30 rounded-lg">
                <div className="flex flex-col items-center">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-wider drop-shadow-lg">
                    YOUR COLLECTION
                  </span>
                  <span className="text-xs text-yellow-200/80 mt-1 uppercase tracking-widest">View & Manage Toys</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
            
            {/* Mint New Toys Button */}
            <button
              onClick={scrollToNFTSection}
              className="w-full relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 animate-gradient-x opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative px-12 py-5 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm border-2 border-white/30 rounded-lg">
                <div className="flex flex-col items-center">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-wider drop-shadow-lg">
                    MINT NEW TOYS
                  </span>
                  <span className="text-xs text-purple-200/80 mt-1 uppercase tracking-widest">NFT Pack Store</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {/* Premium Badge */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg animate-pulse">
                NEW
              </div>
            </button>
          </div>

          {/* Game Info - Simplified */}
          <div className="flex justify-center gap-8 mt-8">
            <span className="text-sm uppercase tracking-wider text-white/60 font-bold">Battle</span>
            <span className="text-white/40">•</span>
            <span className="text-sm uppercase tracking-wider text-white/60 font-bold">Win</span>
            <span className="text-white/40">•</span>
            <span className="text-sm uppercase tracking-wider text-white/60 font-bold">Collect</span>
          </div>
          
          {connected && (
            <p className="text-xs uppercase tracking-widest text-green-400/80 mt-4 font-bold">
              Wallet Connected
            </p>
          )}
        </div>

        {/* Version - Bottom corner */}
        <div className="absolute bottom-4 right-4 text-white opacity-30 text-xs">
          v1.0.0 MVP
        </div>
      </div>
      
      {/* NFT Showcase Section */}
      {showNFTSection && (
        <NFTShowcase onMintClick={(pack) => {
          console.log('Minting pack:', pack)
          // Web3 integration will be added here
        }} />
      )}
    </div>
  )
}

export default MainMenu