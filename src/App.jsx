import React, { useState, useEffect } from 'react'
import { SolanaWalletProvider } from './components/SolanaWalletProvider'
import { SocketProvider } from './contexts/SocketContext'
import MainMenu from './components/MainMenu'
import TeamSelect from './components/TeamSelect'
import AutoBattleScreen from './components/AutoBattleScreen'
import ResultsScreen from './components/ResultsScreen'
import PvPLobby from './components/PvPLobby'
import LoadingScreen from './components/LoadingScreen'
import musicManager from './utils/musicManager'

const GAME_STATES = {
  MENU: 'menu',
  TEAM_SELECT: 'team_select',
  TEAM_BATTLE: 'team_battle',
  RESULTS: 'results',
  PVP_LOBBY: 'pvp_lobby',
  PVP_TEAM_SELECT: 'pvp_team_select'
}

function App() {
  const [gameState, setGameState] = useState(GAME_STATES.MENU)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [isMusicMuted, setIsMusicMuted] = useState(false)
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const [volume, setVolume] = useState(30)
  const [pvpBattleData, setPvpBattleData] = useState(null)

  const handleStartGame = () => {
    setGameState(GAME_STATES.TEAM_SELECT)
  }

  const handleStartPvP = () => {
    setGameState(GAME_STATES.PVP_TEAM_SELECT)
  }

  const handlePvPTeamSelected = (team) => {
    setSelectedTeam(team)
    setGameState(GAME_STATES.PVP_LOBBY)
  }

  const handlePvPBattleStart = (battleData) => {
    setPvpBattleData(battleData)
    setGameState(GAME_STATES.TEAM_BATTLE)
  }

  const [showLoadingScreen, setShowLoadingScreen] = useState(false)

  const handleTeamSelected = (team) => {
    setSelectedTeam(team)
    setShowLoadingScreen(true)
    // Start loading the battle screen immediately
    setGameState(GAME_STATES.TEAM_BATTLE)
  }

  const handleLoadingComplete = () => {
    // Just hide the loading screen
    setShowLoadingScreen(false)
  }

  const handleBattleEnd = (result) => {
    setBattleResult(result)
    setGameState(GAME_STATES.RESULTS)
  }

  const handlePlayAgain = () => {
    setSelectedTeam(null)
    setBattleResult(null)
    setGameState(GAME_STATES.TEAM_SELECT)
  }

  const handleBackToMenu = () => {
    setSelectedTeam(null)
    setBattleResult(null)
    setGameState(GAME_STATES.MENU)
  }

  // Add touch event handlers to prevent scroll
  useEffect(() => {
    const preventDefault = (e) => {
      e.preventDefault()
    }

    document.addEventListener('touchmove', preventDefault, { passive: false })
    document.addEventListener('touchstart', preventDefault, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventDefault)
      document.removeEventListener('touchstart', preventDefault)
    }
  }, [])

  const toggleMusic = () => {
    const muted = musicManager.toggleMute()
    setIsMusicMuted(muted)
  }
  
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
    musicManager.setVolume(newVolume / 100)
    if (isMusicMuted && newVolume > 0) {
      setIsMusicMuted(false)
      musicManager.toggleMute()
    }
  }

  return (
    <SolanaWalletProvider>
      <SocketProvider>
        <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        {/* Music Controls - Discreet corner placement */}
        <div 
          className="fixed bottom-4 right-4 z-50"
          onMouseEnter={() => setShowVolumeControl(true)}
          onMouseLeave={() => setShowVolumeControl(false)}
        >
          {/* Volume Slider */}
          <div className={`absolute bottom-12 right-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 transition-all duration-300 ${
            showVolumeControl ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-white text-xs">🔇</span>
              <input
                type="range"
                min="0"
                max="100"
                value={isMusicMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${isMusicMuted ? 0 : volume}%, #4b5563 ${isMusicMuted ? 0 : volume}%, #4b5563 100%)`
                }}
              />
              <span className="text-white text-xs">🔊</span>
            </div>
            <div className="text-white text-xs text-center mt-1 opacity-70">
              {isMusicMuted ? 'Muted' : `${volume}%`}
            </div>
          </div>
          
          {/* Mute Button */}
          <button
            onClick={toggleMusic}
            className="bg-gray-900 bg-opacity-30 backdrop-blur-sm text-white p-2 rounded-full hover:bg-opacity-50 transition-all duration-300 group"
            title={isMusicMuted ? 'Unmute Sound' : 'Mute Sound'}
            style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="text-lg group-hover:scale-110 transition-transform">
              {isMusicMuted ? '🔇' : volume > 50 ? '🔊' : '🔉'}
            </div>
          </button>
        </div>
        {gameState === GAME_STATES.MENU && (
          <MainMenu 
            onStartGame={handleStartGame}
            onStartPvP={handleStartPvP}
          />
        )}
        
        {gameState === GAME_STATES.TEAM_SELECT && (
          <TeamSelect
            onTeamSelected={handleTeamSelected}
            onBack={handleBackToMenu}
          />
        )}
        
        {gameState === GAME_STATES.PVP_TEAM_SELECT && (
          <TeamSelect
            onTeamSelected={handlePvPTeamSelected}
            onBack={handleBackToMenu}
            isPvP={true}
          />
        )}
        
        {gameState === GAME_STATES.PVP_LOBBY && (
          <PvPLobby
            onBattleStart={handlePvPBattleStart}
            selectedTeam={selectedTeam}
            onBack={() => setGameState(GAME_STATES.PVP_TEAM_SELECT)}
          />
        )}
        
        {gameState === GAME_STATES.TEAM_BATTLE && (
          <>
            <AutoBattleScreen
              playerTeam={selectedTeam}
              opponentTeam={pvpBattleData?.opponentTeam}
              onBattleEnd={handleBattleEnd}
              onBack={() => setGameState(pvpBattleData ? GAME_STATES.PVP_LOBBY : GAME_STATES.TEAM_SELECT)}
              isPvP={!!pvpBattleData}
              pvpData={pvpBattleData}
            />
            
            {/* Loading screen overlay */}
            {showLoadingScreen && (
              <LoadingScreen
                onLoadComplete={handleLoadingComplete}
                battleType={pvpBattleData ? 'pvp' : 'single'}
              />
            )}
          </>
        )}
        
        {gameState === GAME_STATES.RESULTS && (
          <ResultsScreen 
            result={battleResult}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
      </SocketProvider>
    </SolanaWalletProvider>
  )
}

export default App