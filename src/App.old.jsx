import React, { useState, useEffect } from 'react'
import { SolanaWalletProvider } from './components/SolanaWalletProvider'
import MainMenu from './components/MainMenu'
import EnhancedCharacterSelect from './components/EnhancedCharacterSelect'
import EnhancedBattleScreen from './components/EnhancedBattleScreen'
import TeamSelect from './components/TeamSelect'
import AutoBattleScreen from './components/AutoBattleScreen'
import ResultsScreen from './components/ResultsScreen'

const GAME_STATES = {
  MENU: 'menu',
  MODE_SELECT: 'mode_select',
  CHARACTER_SELECT: 'character_select',
  TEAM_SELECT: 'team_select',
  BATTLE: 'battle',
  TEAM_BATTLE: 'team_battle',
  RESULTS: 'results'
}

function App() {
  const [gameState, setGameState] = useState(GAME_STATES.MENU)
  const [gameMode, setGameMode] = useState(null) // 'solo' or 'team'
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [battleResult, setBattleResult] = useState(null)

  const handleStartGame = () => {
    setGameState(GAME_STATES.MODE_SELECT)
  }

  const handleModeSelect = (mode) => {
    setGameMode(mode)
    if (mode === 'solo') {
      setGameState(GAME_STATES.CHARACTER_SELECT)
    } else if (mode === 'team') {
      setGameState(GAME_STATES.TEAM_SELECT)
    }
  }

  const handleCharacterSelected = (character) => {
    setSelectedCharacter(character)
    setGameState(GAME_STATES.BATTLE)
  }

  const handleTeamSelected = (team) => {
    setSelectedTeam(team)
    setGameState(GAME_STATES.TEAM_BATTLE)
  }

  const handleBattleEnd = (result) => {
    setBattleResult(result)
    setGameState(GAME_STATES.RESULTS)
  }

  const handlePlayAgain = () => {
    setSelectedCharacter(null)
    setSelectedTeam(null)
    setBattleResult(null)
    if (gameMode === 'solo') {
      setGameState(GAME_STATES.CHARACTER_SELECT)
    } else {
      setGameState(GAME_STATES.TEAM_SELECT)
    }
  }

  const handleBackToMenu = () => {
    setSelectedCharacter(null)
    setSelectedTeam(null)
    setBattleResult(null)
    setGameMode(null)
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

  return (
    <SolanaWalletProvider>
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        {gameState === GAME_STATES.MENU && (
          <MainMenu onStartGame={handleStartGame} />
        )}
        
        {gameState === GAME_STATES.MODE_SELECT && (
          <div className="h-full flex flex-col items-center justify-center relative">
            <h1 className="text-6xl font-bold text-white mb-12 font-toy">Choose Game Mode</h1>
            <div className="flex gap-8">
              <button
                onClick={() => handleModeSelect('solo')}
                className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold py-6 px-12 rounded-xl text-2xl font-toy transform transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="text-6xl mb-2">⚔️</div>
                <div>Solo Battle</div>
                <div className="text-sm mt-2 opacity-80">1v1 Classic Mode</div>
              </button>
              <button
                onClick={() => handleModeSelect('team')}
                className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold py-6 px-12 rounded-xl text-2xl font-toy transform transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="text-6xl mb-2">👥</div>
                <div>Team Battle</div>
                <div className="text-sm mt-2 opacity-80">3v3 NFT Mode</div>
              </button>
            </div>
            <button
              onClick={handleBackToMenu}
              className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-full font-toy"
            >
              ← Back
            </button>
          </div>
        )}
        
        {gameState === GAME_STATES.CHARACTER_SELECT && (
          <EnhancedCharacterSelect 
            onCharacterSelected={handleCharacterSelected}
            onBack={() => setGameState(GAME_STATES.MODE_SELECT)}
          />
        )}
        
        {gameState === GAME_STATES.TEAM_SELECT && (
          <TeamSelect
            onTeamSelected={handleTeamSelected}
            onBack={() => setGameState(GAME_STATES.MODE_SELECT)}
          />
        )}
        
        {gameState === GAME_STATES.BATTLE && (
          <EnhancedBattleScreen 
            playerCharacter={selectedCharacter}
            onBattleEnd={handleBattleEnd}
            onBack={() => setGameState(GAME_STATES.MODE_SELECT)}
          />
        )}
        
        {gameState === GAME_STATES.TEAM_BATTLE && (
          <AutoBattleScreen
            playerTeam={selectedTeam}
            onBattleEnd={handleBattleEnd}
            onBack={() => setGameState(GAME_STATES.MODE_SELECT)}
          />
        )}
        
        {gameState === GAME_STATES.RESULTS && (
          <ResultsScreen 
            result={battleResult}
            gameMode={gameMode}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
    </SolanaWalletProvider>
  )
}

export default App