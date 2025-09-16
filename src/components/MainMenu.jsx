import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import musicManager from '../utils/musicManager'
import NFTShowcase from './NFTShowcase'
import MyToyboxCollection from './MyToyboxCollection'
import WalletButtonPortal from './WalletButtonPortal'
import { useTouchClick } from '../hooks/useTouchClick'

const MainMenu = ({ onStartGame, onViewToys, onStartPvP, onTest3D, onTestBoardgame }) => {
  const [showNFTSection, setShowNFTSection] = useState(false)
  const [showToyboxCollection, setShowToyboxCollection] = useState(false)
  const { connected } = useWallet()
  const [floatingToys, setFloatingToys] = useState([])
  const [titleSize, setTitleSize] = useState('5rem')
  const [subtitleSize, setSubtitleSize] = useState('4rem')

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
    
    // Set initial font sizes based on window width
    const updateFontSizes = () => {
      const width = window.innerWidth
      if (width <= 480) {
        setTitleSize('3.5rem')
        setSubtitleSize('3rem')
      } else if (width <= 768) {
        setTitleSize('4rem')
        setSubtitleSize('3.5rem')
      } else {
        setTitleSize('5rem')
        setSubtitleSize('4rem')
      }
    }
    
    updateFontSizes()
    window.addEventListener('resize', updateFontSizes)
    
    return () => window.removeEventListener('resize', updateFontSizes)
  }, [])

  // Enable scrolling when NFT section is shown
  useEffect(() => {
    if (showNFTSection) {
      // Force enable scrolling
      document.body.style.overflow = 'visible'
      document.documentElement.style.overflow = 'visible'
      document.body.style.height = 'auto'
      document.body.style.position = 'static'
      // Remove any height restrictions
      const root = document.getElementById('root')
      if (root) {
        root.style.height = 'auto'
        root.style.overflow = 'visible'
      }
    }
    
    // Cleanup - don't restore overflow hidden on cleanup
    return () => {
      // Let other components handle their own overflow
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
  const test3DHandlers = useTouchClick(() => {
    playButtonSound()
    if (onTest3D) onTest3D()
  })
  const boardgameHandlers = useTouchClick(() => {
    playButtonSound()
    if (onTestBoardgame) onTestBoardgame()
  })

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
          {/* Main Title - Larger size */}
          <h1 className="game-title font-toy mb-1"
              style={{
                fontSize: titleSize,
                animation: 'title-dance 6s ease-in-out infinite',
                display: 'inline-block'
              }}>
            <span className="text-yellow-400" style={{ textShadow: '3px 3px 0 #ff6b35, 6px 6px 0 #ff4500' }}>TOY</span>
            {' '}
            <span className="text-orange-500" style={{ textShadow: '3px 3px 0 #ff1493, 6px 6px 0 #ff69b4' }}>BOX</span>
          </h1>
          
          <h2 className="game-subtitle font-toy mb-8 text-pink-500"
              style={{
                fontSize: subtitleSize,
                textShadow: '2px 2px 0 #ff69b4, 4px 4px 0 #ff1493',
                animation: 'pulse 3s ease-in-out infinite'
              }}>
            BRAWL
          </h2>

          {/* Game Buttons - Refined Toy Style with Responsive Spacing */}
          <div className="flex flex-col items-center justify-center w-full mx-auto px-4 space-y-8 md:space-y-4">
            
            {/* PvP Battle Button - Custom Image */}
            <button
              {...pvpBattleHandlers}
              className="menu-button w-full max-w-[280px] sm:max-w-[340px] relative group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              disabled={!connected}
            >
              {/* Button Image */}
              <img 
                src="/pvpbattlebutton.svg" 
                alt="PvP Battle" 
                className="w-full h-auto block drop-shadow-xl"
              />
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-orange-500/20 to-purple-600/20 rounded-2xl blur-xl" />
              </div>
            </button>
            
            {/* Free Play Button - Custom Image */}
            <button
              {...freePlayHandlers}
              className="menu-button w-full max-w-[280px] sm:max-w-[340px] relative group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              disabled={!connected}
            >
              {/* Button Image */}
              <img 
                src="/freeplaybutton.svg" 
                alt="Free Play" 
                className="w-full h-auto block drop-shadow-lg"
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
            <div className="flex flex-col md:flex-row gap-10 md:gap-2 w-full max-w-[280px] sm:max-w-[340px] mb-20 md:mb-0">
              {/* Mint Toys Button - Custom Image */}
              <button
                {...mintToysHandlers}
                className="flex-1 relative group transform hover:scale-[1.05] active:scale-[0.96] transition-transform duration-200"
              >
                <img 
                  src="/minttoysbutton.svg" 
                  alt="Mint Toys" 
                  className="w-full h-auto block drop-shadow-md"
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
                  className="w-full h-auto block drop-shadow-md"
                />
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg blur-xl" />
                </div>
              </button>
              
              {/* Development Test Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  {...test3DHandlers}
                  className="menu-button bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all text-sm"
                >
                  🎮 3D Test
                </button>
                <button
                  {...boardgameHandlers}
                  className="menu-button bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:from-green-700 hover:to-teal-700 transform hover:scale-105 transition-all text-sm"
                >
                  🎲 Boardgame.io
                </button>
              </div>
            </div>
            
            {/* Game Slogan - Moved to bottom */}
            <div className="flex justify-center gap-4 pt-8 md:pt-0 mt-6 md:mt-6 mb-10 md:mb-0 text-white/80">
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
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-purple-900 via-black to-purple-900">
          <NFTShowcase 
            onClose={() => setShowNFTSection(false)}
            onMintClick={(pack) => {
              console.log('Minting pack:', pack)
              // Web3 integration will be added here
            }} 
          />
        </div>
      )}
      
      {/* My Toybox Collection Modal */}
      {showToyboxCollection && (
        <MyToyboxCollection onClose={() => setShowToyboxCollection(false)} />
      )}
    </div>
  )
}

export default MainMenu