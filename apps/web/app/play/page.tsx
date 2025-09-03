'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Toy } from '../../lib/game';

export default function PlayPage() {
  const gameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<Toy[]>([]);
  const [availableToys, setAvailableToys] = useState<Toy[]>([]);
  const [showTeamSelect, setShowTeamSelect] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [gameInitialized, setGameInitialized] = useState(false);

  useEffect(() => {
    // Load toys from localStorage or create starters
    const loadToys = () => {
      const startersKey = 'tbb_starters_v1';
      let starters = localStorage.getItem(startersKey);
      
      if (!starters) {
        // Create default starter toys
        const newStarters: Toy[] = [
          {
            id: 'robot_1',
            name: 'Wind-Up Robot',
            rarity: 'common',
            stats: { hp: 30, maxHp: 30, atk: 22, def: 18, speed: 20, critChance: 10 },
            sprite: 'robot.png',
            moves: [],
            statusEffects: [],
            statusDuration: 0
          },
          {
            id: 'dino_1',
            name: 'Plastic Dino',
            rarity: 'common',
            stats: { hp: 35, maxHp: 35, atk: 25, def: 15, speed: 15, critChance: 10 },
            sprite: 'dino.png',
            moves: [],
            statusEffects: [],
            statusDuration: 0
          },
          {
            id: 'duck_1',
            name: 'Squeaky Duck',
            rarity: 'common',
            stats: { hp: 28, maxHp: 28, atk: 15, def: 12, speed: 35, critChance: 10 },
            sprite: 'duck.png',
            moves: [],
            statusEffects: [],
            statusDuration: 0
          }
        ];
        localStorage.setItem(startersKey, JSON.stringify(newStarters));
        setAvailableToys(newStarters);
      } else {
        setAvailableToys(JSON.parse(starters));
      }
    };

    loadToys();
  }, []);

  const startBattle = async () => {
    if (selectedTeam.length !== 3) {
      alert('Please select 3 toys for your team!');
      return;
    }
    
    // Save selected team to localStorage for the game to access
    localStorage.setItem('tbb_selected_team', JSON.stringify(selectedTeam));

    setShowTeamSelect(false);
    setIsLoading(true);
    
    // Simulate loading progress
    const loadingSteps = [
      { progress: 20, message: 'Loading game engine...' },
      { progress: 40, message: 'Preparing battle arena...' },
      { progress: 60, message: 'Loading toy sprites...' },
      { progress: 80, message: 'Setting up AI opponent...' },
      { progress: 95, message: 'Starting battle!' }
    ];
    
    for (const step of loadingSteps) {
      setLoadingProgress(step.progress);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setLoadingProgress(100);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simply hide loading screen - game will initialize via useEffect
    setIsLoading(false);
  };

  const toggleToySelection = (toy: Toy) => {
    if (selectedTeam.find(t => t.id === toy.id)) {
      setSelectedTeam(selectedTeam.filter(t => t.id !== toy.id));
    } else if (selectedTeam.length < 3) {
      setSelectedTeam([...selectedTeam, toy]);
    }
  };

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        console.log('Cleaning up Phaser game');
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Initialize game when ready
  useEffect(() => {
    if (!showTeamSelect && !isLoading && !gameInitialized) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (containerRef.current && !gameRef.current) {
          console.log('Initializing game...');
          import('../../lib/game').then(({ createGame }) => {
            if (containerRef.current && !gameRef.current) {
              try {
                gameRef.current = createGame(containerRef.current);
                setGameInitialized(true);
                console.log('Game initialized successfully');
              } catch (error) {
                console.error('Error creating game:', error);
              }
            }
          }).catch(error => {
            console.error('Failed to import game module:', error);
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showTeamSelect, isLoading, gameInitialized]);

  if (showTeamSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-orange-800">
            Select Your Team
          </h1>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Available Toys ({availableToys.length})
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {availableToys.map(toy => {
                const isSelected = selectedTeam.find(t => t.id === toy.id);
                return (
                  <button
                    key={toy.id}
                    onClick={() => toggleToySelection(toy)}
                    className={`
                      relative p-4 rounded-xl border-3 transition-all
                      ${isSelected 
                        ? 'border-green-500 bg-green-50 scale-105' 
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                      }
                      ${selectedTeam.length >= 3 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={selectedTeam.length >= 3 && !isSelected}
                  >
                    <div className={`w-16 h-16 rounded-lg mb-2 shadow-lg ${
                      toy.rarity === 'mythic' ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse' :
                      toy.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                      toy.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
                      toy.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {toy.name.includes('Robot') ? '🤖' :
                         toy.name.includes('Dino') ? '🦕' :
                         toy.name.includes('Duck') ? '🦆' :
                         '🎮'}
                      </div>
                    </div>
                    <p className="text-xs font-bold">{toy.name}</p>
                    <p className={`text-[10px] font-semibold capitalize ${
                      toy.rarity === 'mythic' ? 'text-red-500' :
                      toy.rarity === 'legendary' ? 'text-yellow-600' :
                      toy.rarity === 'epic' ? 'text-purple-600' :
                      toy.rarity === 'rare' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {toy.rarity}
                    </p>
                    <p className="text-[10px] text-gray-700">
                      ⚔️{toy.stats.atk} 🛡️{toy.stats.def}
                    </p>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Your Team ({selectedTeam.length}/3)
            </h2>
            
            <div className="flex gap-4 mb-6 min-h-[100px]">
              {[0, 1, 2].map(slot => {
                const toy = selectedTeam[slot];
                return (
                  <div
                    key={slot}
                    className="flex-1 border-3 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center"
                  >
                    {toy ? (
                      <>
                        <div className={`w-16 h-16 rounded-lg mb-2 shadow-lg ${
                          toy.rarity === 'mythic' ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse' :
                          toy.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                          toy.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
                          toy.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {toy.name.includes('Robot') ? '🤖' :
                             toy.name.includes('Dino') ? '🦕' :
                             toy.name.includes('Duck') ? '🦆' :
                             '🎮'}
                          </div>
                        </div>
                        <p className="text-sm font-bold">{toy.name}</p>
                        <p className="text-xs text-gray-600">❤️ {toy.stats.hp}</p>
                      </>
                    ) : (
                      <p className="text-gray-400">Empty Slot</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={startBattle}
              disabled={selectedTeam.length !== 3}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all
                ${selectedTeam.length === 3
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {selectedTeam.length === 3 ? 'Start Battle!' : `Select ${3 - selectedTeam.length} more toy${3 - selectedTeam.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Loading Battle Arena</h2>
            <p className="text-xl text-white/80">Preparing your toys for combat...</p>
          </div>
          
          <div className="w-80 mx-auto">
            <div className="bg-gray-700 rounded-full h-4 overflow-hidden mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-white/60">{loadingProgress}%</p>
          </div>
          
          <div className="mt-8 flex justify-center space-x-8">
            {selectedTeam.map((toy, i) => (
              <div key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className={`w-16 h-16 rounded-lg shadow-2xl ${
                  toy.rarity === 'mythic' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                  toy.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                  toy.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
                  toy.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
                  'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {toy.name.includes('Robot') ? '🤖' :
                     toy.name.includes('Dino') ? '🦕' :
                     toy.name.includes('Duck') ? '🦆' :
                     '🎮'}
                  </div>
                </div>
                <p className="text-white text-xs mt-2 font-bold">{toy.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="bg-black/50 p-4 text-center">
        <h1 className="text-2xl font-bold text-white">Toy Box Brawl - Battle Mode</h1>
      </div>
      
      {/* Game Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div 
          ref={containerRef} 
          className="w-full max-w-[960px] bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
          style={{ 
            aspectRatio: '960/640',
            maxHeight: 'calc(100vh - 120px)',
            minHeight: '400px'
          }}
        >
          {/* Fallback content if game doesn't load */}
          {!gameInitialized && (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <p className="text-white mb-4">Initializing battle arena...</p>
                <button 
                  onClick={async () => {
                    console.log('Manual start clicked');
                    try {
                      const { createGame } = await import('../../lib/game');
                      if (containerRef.current) {
                        console.log('Creating game manually...');
                        gameRef.current = createGame(containerRef.current);
                        setGameInitialized(true);
                      }
                    } catch (error) {
                      console.error('Manual start failed:', error);
                      alert('Failed to start game. Please refresh the page.');
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Game Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Controls hint */}
      {!showTeamSelect && !isLoading && (
        <div className="bg-black/50 p-4 text-center space-x-4">
          <p className="text-white/60 inline">Battle Demo - Auto-battling</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}