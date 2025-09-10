import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import musicManager from '../utils/musicManager'
import NFTShowcase from './NFTShowcase'
import MyToyboxCollection from './MyToyboxCollection'
import WalletButtonPortal from './WalletButtonPortal'
import { useTouchClick } from '../hooks/useTouchClick'

const MainMenu = ({ onStartGame, onViewToys, onStartPvP }) => {
  const [showNFTSection, setShowNFTSection] = useState(false)
  const [showToyboxCollection, setShowToyboxCollection] = useState(false)
  const { connected } = useWallet()
  const [floatingToys, setFloatingToys] = useState([])

  useEffect(() => {
    // Menu music disabled - only sound effects
    // musicManager.playMenuMusic()
    
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

  const playButtonSound = () => {
    const buttonSound = new Audio('/button.wav')
    buttonSound.volume = 0.5
    buttonSound.play().catch(err => console.log('Button sound failed:', err))
  }

  const handlePlayForSol = () => {
    playButtonSound()
    if (connected) {
      onStartPvP()
    }
  }

  const handleViewToys = () => {
    playButtonSound()
    setShowToyboxCollection(true)
  }

  const scrollToNFTSection = () => {
    playButtonSound()
    setShowNFTSection(true)
    setTimeout(() => {
      document.getElementById('nft-showcase')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }
  
  // Touch-click handlers for mobile compatibility
  const pvpBattleHandlers = useTouchClick(handlePlayForSol)
  const freePlayHandlers = useTouchClick(() => {
    playButtonSound()
    onStartGame()
  })
  const mintToysHandlers = useTouchClick(scrollToNFTSection)
  const myToyboxHandlers = useTouchClick(handleViewToys)

  // Function to handle scrolling back to top (used by NFT section)
  window.scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen relative overflow-y-auto">
      <div id="main-menu" className="main-menu-container h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Static Background */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/backgrounds/toyboxarena.png)' }}
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none" />
        
        {/* Subtle Floating Toy Emojis */}
        {floatingToys.map(toy => (
          <div
            key={toy.id}
            className="floating-particles absolute opacity-10 pointer-events-none text-2xl md:text-4xl"
            style={{
              left: `${toy.x}%`,
              top: `${toy.y}%`,
              animation: `float-around ${toy.duration}s ${toy.delay}s infinite ease-in-out`
            }}
          >
            {toy.emoji}
          </div>
        ))}

        {/* Wallet Connection Portal - Renders outside any scaled containers */}
        <WalletButtonPortal />

        {/* Game wrapper for scaling on mobile */}
        <div id="game-wrapper" className="text-center z-10 max-w-4xl mx-auto">
          {/* Main Title - Smaller for better fit */}
          <h1 className="game-title text-3xl sm:text-4xl md:text-6xl font-toy mb-1"
              style={{
                animation: 'title-dance 6s ease-in-out infinite',
                display: 'inline-block'
              }}>
            <span className="text-yellow-400" style={{ textShadow: '3px 3px 0 #ff6b35, 6px 6px 0 #ff4500' }}>TOY</span>
            {' '}
            <span className="text-orange-500" style={{ textShadow: '3px 3px 0 #ff1493, 6px 6px 0 #ff69b4' }}>BOX</span>
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-toy mb-8 text-pink-500"
              style={{
                textShadow: '2px 2px 0 #ff69b4, 4px 4px 0 #ff1493',
                animation: 'pulse 3s ease-in-out infinite'
              }}>
            BRAWL
          </h2>

          {/* Game Buttons - Refined Toy Style with No Spacing */}
          <div className="flex flex-col gap-2 sm:gap-0 items-center w-full max-w-xs sm:max-w-sm mx-auto px-4 sm:px-0">
            
            {/* PvP Battle Button - Custom Image */}
            <button
              {...pvpBattleHandlers}
              className="menu-button w-full relative group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              disabled={!connected}
            >
              {/* Button Image */}
              <img 
                src="/pvpbattlebutton.svg" 
                alt="PvP Battle" 
                className="w-full h-auto drop-shadow-xl"
              />
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-orange-500/20 to-purple-600/20 rounded-2xl blur-xl" />
              </div>
            </button>
            
            {/* Free Play Button - Custom Image */}
            <button
              {...freePlayHandlers}
              className="menu-button w-full relative group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              disabled={!connected}
            >
              {/* Button Image */}
              <img 
                src="/freeplaybutton.svg" 
                alt="Free Play" 
                className="w-full h-auto drop-shadow-lg"
              />
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl" />
              </div>
              
              {/* Connect Wallet Overlay (when not connected) */}
              {!connected && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold uppercase">Connect Wallet First</span>
                </div>
              )}
            </button>
            
            {/* Utility Buttons - Smaller Size */}
            <div className="flex flex-col md:flex-row gap-2 w-full mt-2">
              {/* Mint Toys Button - Custom Image */}
              <button
                {...mintToysHandlers}
                className="flex-1 relative group transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              >
                <img 
                  src="/minttoysbutton.svg" 
                  alt="Mint Toys" 
                  className="w-full h-auto drop-shadow-md"
                />
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg blur-xl" />
                </div>
                
                {/* NEW Badge */}
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-[10px] font-black rounded-full shadow-md animate-pulse">
                  NEW
                </div>
              </button>
              
              {/* Collection Button - Custom Image */}
              <button
                {...myToyboxHandlers}
                className="flex-1 relative group transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              >
                <img 
                  src="/mytoyboxbutton.svg" 
                  alt="My Toybox" 
                  className="w-full h-auto drop-shadow-md"
                />
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg blur-xl" />
                </div>
              </button>
            </div>
            
            {/* Game Slogan - Moved to bottom */}
            <div className="flex justify-center gap-4 mt-6 text-white/80">
              <span className="text-sm uppercase tracking-wider font-bold">Battle</span>
              <span className="text-white/60">•</span>
              <span className="text-sm uppercase tracking-wider font-bold">Win</span>
              <span className="text-white/60">•</span>
              <span className="text-sm uppercase tracking-wider font-bold">Collect</span>
            </div>
          </div>
          
          {/* Wallet Status - Subtle Pill Button */}
          {connected && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10 hover:bg-black/30 transition-colors">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">
                  👛 Connected
                </span>
              </button>
            </div>
          )}
        </div> {/* End of game-wrapper */}

        {/* Version - Bottom corner - Outside wrapper so it doesn't scale */}
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
      
      {/* My Toybox Collection Modal */}
      {showToyboxCollection && (
        <MyToyboxCollection onClose={() => setShowToyboxCollection(false)} />
      )}
    </div>
  )
}

export default MainMenu