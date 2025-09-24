import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSocket } from '../contexts/SocketContext';
import { useTouchClick } from '../hooks/useTouchClick';
import { isMobileDevice } from '../config/walletConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

const GAME_TIPS = [
  "Mythic toys have the most powerful special abilities in the game!",
  "Legendary toys can turn the tide of battle with their unique ultimates.",
  "Building a balanced team with different toy types creates powerful synergies.",
  "Epic toys have a higher chance to trigger their special abilities.",
  "Some toys have hidden combo attacks when paired together!",
  "The rarer the toy, the more damage their abilities can deal.",
  "Mythic NFT toys are the rarest and most sought after in the collection.",
  "Winning streaks increase your rewards multiplier!",
  "Each toy has unique stats that affect battle performance.",
  "Collecting full sets of toys unlocks special bonuses.",
  "PvP battles reward the winner with the entire wager pool.",
  "Your toys gain experience and become stronger with each battle!",
  "Legendary toys have exclusive animations and victory poses.",
  "Some toys are only available during special events.",
  "The Phoenix Dragon is one of the most powerful mythic toys!",
  "Rare toys have better base stats than common ones.",
  "Ultimate abilities can hit multiple enemies at once.",
  "Tank toys protect your damage dealers in battle.",
  "Speed stat determines who attacks first in combat.",
  "Critical hits deal double damage - luck matters!",
  "NFT toys can be traded on the marketplace for SOL.",
  "Limited edition toys never return once sold out.",
  "Each toy pack guarantees at least one rare or better toy!",
  "Mythic toys have less than 1% drop rate from packs.",
  "Combine strategy and luck to dominate the arena!"
];

const PvPLobby = ({ onBattleStart, selectedTeam, onBack }) => {
  const { publicKey, signTransaction, connected } = useWallet();
  const { socket, connected: socketConnected } = useSocket();
  const [matchmaking, setMatchmaking] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(0.025);
  const [queuePosition, setQueuePosition] = useState(0);
  const [opponent, setOpponent] = useState(null);
  const [battleId, setBattleId] = useState(null);
  const [stats, setStats] = useState({
    playersOnline: 0,
    activeBattles: 0,
    playersInQueue: 0
  });
  const [error, setError] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    if (!socket) {
      console.log('Socket not initialized');
      return;
    }
    
    // Authenticate on connection
    if (socketConnected && publicKey) {
      console.log('Socket connected, authenticating wallet:', publicKey.toString());
      socket.emit('authenticate', { wallet: publicKey.toString() });
      setError(''); // Clear any connection errors
    } else if (!socketConnected) {
      console.log('Waiting for socket connection...');
      setError('');
    }

    const handleQueued = ({ position }) => {
      setQueuePosition(position);
    };

    const handleMatchFound = async ({ battleId: id, opponent: opp, wagerAmount: wager, opponentTeam, playerNumber, credentials }) => {
      console.log('Match found! - MatchID:', id, 'Opponent team:', opponentTeam, 'Credentials:', credentials ? 'provided' : 'none');

      // Boardgame.io will create the match automatically when players connect

      setMatchFound(true);
      setMatchmaking(false);
      setBattleId(id);
      // Extract the actual opponent wallet address
      const opponentWallet = playerNumber === 1 ? opp.player2 : opp.player1;
      setOpponent(opponentWallet);

      // Play match found sound
      const matchSound = new Audio('/battlestart.wav');
      matchSound.volume = 0.5;
      matchSound.play().catch(err => console.log('Could not play sound:', err));

      // Auto-start battle after 3 seconds
      setTimeout(() => {
        onBattleStart({
          battleId: id,
          opponent: opponentWallet,
          opponentTeam: opponentTeam,
          wagerAmount: wager,
          socket: socket,
          playerNumber: playerNumber,
          playerAddress: publicKey?.toString(),
          opponentAddress: opponentWallet,
          credentials: credentials // Pass credentials from server
        });
      }, 3000);
    };

    const handleStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    socket.on('queued', handleQueued);
    socket.on('match_found', handleMatchFound);
    socket.on('stats_update', handleStatsUpdate);

    // Request initial stats
    socket.emit('get_stats');

    return () => {
      socket.off('queued', handleQueued);
      socket.off('match_found', handleMatchFound);
      socket.off('stats_update', handleStatsUpdate);
    };
  }, [socket, socketConnected, publicKey, onBattleStart]);

  // Search timer and tip rotation
  useEffect(() => {
    let interval;
    let tipInterval;
    if (matchmaking) {
      setSearchTime(0);
      // Set initial random tip
      setCurrentTip(GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)]);
      
      // Update timer every second
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
      
      // Change tip every 4 seconds
      tipInterval = setInterval(() => {
        setCurrentTip(GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)]);
      }, 4000);
    }
    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, [matchmaking]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const findMatch = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedTeam || selectedTeam.length === 0) {
      setError('Please select your team first');
      return;
    }

    setError('');
    
    try {
      // Simulate wager transaction for now
      console.log('Simulating wager transaction for', wagerAmount, 'SOL');
      
      setMatchmaking(true);
      setMatchFound(false);
      setQueuePosition(0);
      
      // Emit find_match event to server
      if (socket && socketConnected) {
        socket.emit('find_match', {
          wallet: publicKey.toString(),
          wagerAmount,
          teamData: selectedTeam
        });
        
        console.log('Matchmaking started for wallet:', publicKey.toString());
      } else {
        throw new Error('Socket not connected');
      }
    } catch (err) {
      console.error('Failed to start matchmaking:', err);
      setError('Failed to start matchmaking');
      setMatchmaking(false);
    }
  };

  const cancelMatchmaking = () => {
    if (socket && socketConnected) {
      socket.emit('cancel_matchmaking', {
        wallet: publicKey.toString(),
        wagerAmount
      });
      setMatchmaking(false);
      setQueuePosition(0);
      setSearchTime(0);
    }
  };

  // Touch handlers for mobile - must be after function definitions
  const backButtonHandlers = useTouchClick(onBack);
  const findMatchHandlers = useTouchClick(findMatch);
  const cancelMatchmakingHandlers = useTouchClick(cancelMatchmaking);

  return (
    <div className="pvp-lobby h-screen overflow-y-auto overflow-x-hidden relative">
      {/* Background Layer - Not scaled */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pointer-events-none">
        {/* Epic 3D Background - Add your AI generated background here */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Placeholder for AI background image */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'url(/pvp-arena-bg.jpg)', // Add your AI generated background here
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7)'
            }}
          />
          
          {/* Animated toy blocks falling */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-50px',
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 10}s`
                }}
              >
                <div 
                  className={`w-8 h-8 md:w-12 md:h-12 rounded-lg ${
                    ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][Math.floor(Math.random() * 6)]
                  } opacity-60 transform rotate-45`}
                  style={{
                    boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.5), 0 2px 20px rgba(0,0,0,0.3)'
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Lightning effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="lightning-container">
              <div className="lightning lightning-1" />
              <div className="lightning lightning-2" />
            </div>
          </div>

          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-purple-900/40 animate-gradient-shift" />
        </div>
      </div>

      {/* Content Layer - Scaled on mobile */}
      <div id="pvp-wrapper" className="min-h-screen relative z-10 pointer-events-auto">

      {/* Main Content */}
      <div className="relative z-10 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          {...backButtonHandlers}
          className="mb-4 md:mb-6 px-4 py-2 md:px-6 md:py-3 bg-black/50 backdrop-blur-md hover:bg-black/70 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-xl border border-white/20"
        >
          ← Back
        </button>

        {/* Epic Title with 3D Effect */}
        <div className="text-center mb-8 md:mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 animate-pulse-slow">
              BATTLE
            </h1>
            <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 animate-pulse-slow animation-delay-500">
              ARENA
            </h1>
            {/* 3D Shadow Effect */}
            <div className="absolute inset-0 transform translate-y-1 translate-x-1 opacity-30 blur-sm">
              <h1 className="text-5xl md:text-8xl font-black text-black">
                BATTLE
              </h1>
              <h1 className="text-5xl md:text-8xl font-black text-black">
                ARENA
              </h1>
            </div>
          </div>
          <p className="text-lg md:text-2xl text-cyan-300 mt-4 font-bold animate-bounce-slow">
            ⚔️ ENTER THE ULTIMATE TOY SHOWDOWN ⚔️
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-4 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            socketConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              socketConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
            }`} />
            <span className="text-sm font-semibold">
              {socketConnected ? 'Connected to Server' : 'Connecting to Server...'}
            </span>
          </div>
        </div>

        {/* Stats Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {[
            { 
              label: 'Toys Online', 
              value: stats.playersOnline || 0, 
              icon: '🌍', 
              color: 'from-blue-600 to-cyan-500',
              bgColor: 'from-blue-600/30 to-cyan-600/30'
            },
            { 
              label: 'Current Active Toy Fights', 
              value: stats.activeBattles || 0, 
              icon: '⚔️', 
              color: 'from-red-600 to-orange-500',
              bgColor: 'from-red-600/30 to-orange-600/30'
            },
            { 
              label: 'In Queue', 
              value: stats.playersInQueue || 0, 
              icon: '⏰', 
              color: 'from-green-600 to-emerald-500',
              bgColor: 'from-green-600/30 to-emerald-600/30'
            }
          ].map((stat, idx) => (
            <div 
              key={idx}
              className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-xl rounded-2xl p-4 md:p-6 border-2 border-white/20 transform hover:scale-105 transition-all hover:rotate-1 group`}
              style={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-xs md:text-sm uppercase tracking-wider font-bold">{stat.label}</p>
                  <p className="text-3xl md:text-5xl font-black text-white mt-2">{stat.value}</p>
                </div>
                <div className="text-4xl md:text-6xl group-hover:animate-spin-slow">{stat.icon}</div>
              </div>
              <div className="mt-4 h-3 bg-black/30 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${stat.color} animate-pulse rounded-full`} style={{width: `${60 + idx * 15}%`}} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Battle Card */}
        {!matchFound ? (
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-6 md:p-10 border-2 border-white/30 shadow-2xl"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(139,69,19,0.3) 100%)'
            }}
          >
            {/* Wager Section */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-4xl font-black text-center mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                  ◎ CHOOSE YOUR STAKES ◎
                </span>
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {[
                  { amount: 0.025, multiplier: 1.8, tier: 'BRONZE' },
                  { amount: 0.05, multiplier: 2.0, tier: 'SILVER' },
                  { amount: 0.1, multiplier: 2.5, tier: 'GOLD' }
                ].map((stake) => (
                  <button
                    key={stake.amount}
                    onClick={() => setWagerAmount(stake.amount)}
                    className={`
                      relative p-3 md:p-6 rounded-2xl transition-all transform hover:scale-105 hover:-rotate-2
                      ${wagerAmount === stake.amount 
                        ? 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 shadow-2xl scale-110 animate-pulse-slow' 
                        : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800'
                      }
                    `}
                    style={{
                      boxShadow: wagerAmount === stake.amount 
                        ? '0 20px 40px rgba(255,193,7,0.5), inset 0 2px 0 rgba(255,255,255,0.5)'
                        : '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                  >
                    {wagerAmount === stake.amount && (
                      <div className="absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs px-2 py-1 md:px-3 md:py-1 rounded-full font-black animate-bounce shadow-lg">
                          SELECTED
                        </div>
                      </div>
                    )}
                    <div className="text-xs md:text-sm font-bold text-gray-400 mb-1">{stake.tier}</div>
                    <div className="text-2xl md:text-4xl mb-1 md:mb-2">◎</div>
                    <div className="text-lg md:text-2xl font-black text-white">{stake.amount} SOL</div>
                    <div className="text-xs md:text-sm text-green-400 mt-1 font-bold">
                      WIN: {(stake.amount * stake.multiplier).toFixed(3)} SOL
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border-2 border-red-500 rounded-xl backdrop-blur">
                <p className="text-red-400 text-center font-bold">{error}</p>
              </div>
            )}

            {/* Matchmaking Button */}
            {!matchmaking ? (
              <button
                {...findMatchHandlers}
                disabled={!selectedTeam || selectedTeam.length === 0}
                className="w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 animate-gradient-x opacity-80" />
                <div className="relative py-4 md:py-8 bg-gradient-to-r from-green-500/90 to-blue-500/90 hover:from-green-400 hover:to-blue-400 text-white font-black text-xl md:text-4xl rounded-2xl transition-all transform hover:scale-[1.02] shadow-2xl border-2 border-white/30">
                  <div className="flex items-center justify-center gap-2 md:gap-4">
                    <span className="text-2xl md:text-4xl animate-bounce">⚔️</span>
                    <span className="tracking-wider">FIND OPPONENT</span>
                    <span className="text-2xl md:text-4xl animate-bounce" style={{animationDelay: '0.5s'}}>⚔️</span>
                  </div>
                  <div className="text-xs md:text-sm font-normal mt-2 opacity-90">
                    {selectedTeam?.length === 4 ? '✅ Team Ready! Click to Battle!' : '❌ Select Your Team First'}
                  </div>
                </div>
              </button>
            ) : (
              <div className="space-y-6">
                {/* Epic Searching Animation */}
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    {/* Outer spinning ring */}
                    <div className="absolute inset-0 w-32 h-32 md:w-40 md:h-40">
                      <div className="w-full h-full border-4 border-t-yellow-400 border-r-red-500 border-b-purple-500 border-l-cyan-500 rounded-full animate-spin" />
                    </div>
                    {/* Inner spinning ring */}
                    <div className="absolute inset-2 w-28 h-28 md:w-36 md:h-36">
                      <div className="w-full h-full border-4 border-t-pink-500 border-r-green-500 border-b-blue-500 border-l-orange-500 rounded-full animate-spin-reverse" />
                    </div>
                    {/* Center icon */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                      <div className="text-5xl md:text-6xl animate-pulse">🎮</div>
                    </div>
                  </div>
                </div>

                {/* Search Info */}
                <div className="text-center">
                  <h3 className="text-2xl md:text-4xl font-black text-white mb-4 animate-pulse">
                    SEARCHING FOR OPPONENT...
                  </h3>
                  
                  {/* Game Tip */}
                  <div className="mb-4 px-6 py-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl border border-cyan-400/30 max-w-2xl mx-auto">
                    <p className="text-sm md:text-base text-cyan-300 font-bold uppercase tracking-wider mb-2">
                      💡 Tip of the Day
                    </p>
                    <p className="text-base md:text-lg text-white/90 font-medium animate-fade-in">
                      {currentTip}
                    </p>
                  </div>
                  
                  <p className="text-lg md:text-xl text-cyan-400 mb-4 font-bold">
                    ⏱️ Time: {formatTime(searchTime)}
                  </p>
                  {queuePosition > 0 && (
                    <p className="text-md md:text-lg text-yellow-400 font-bold animate-bounce">
                      Queue Position: #{queuePosition}
                    </p>
                  )}
                </div>

                {/* Cancel Button */}
                <button
                  {...cancelMatchmakingHandlers}
                  className="w-full py-3 md:py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-lg md:text-xl rounded-2xl transition-all transform hover:scale-[1.02] shadow-xl border-2 border-red-400/50"
                >
                  ❌ CANCEL SEARCH
                </button>
              </div>
            )}

            {/* Wallet Connection */}
            {!connected && (
              <div className="mt-8 text-center">
                <p className="text-gray-300 mb-4 font-bold">Connect your wallet to start battling!</p>
                
                {/* Mobile wallet notice */}
                {isMobileDevice() && (
                  <div className="mb-4 p-3 bg-blue-900/50 border border-blue-400/50 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-blue-300 font-medium">
                      📱 <strong>Mobile Tip:</strong> For the best experience, we recommend using <strong>Solflare</strong> wallet. 
                      Phantom opens in its own browser for security.
                    </p>
                  </div>
                )}
                
                <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-500 hover:!to-blue-500 !font-bold !text-lg" />
              </div>
            )}
          </div>
        ) : (
          // Match Found Screen - Epic Animation
          <div className="relative">
            {/* Explosion effect background */}
            <div className="absolute inset-0 animate-explosion">
              <div className="w-full h-full bg-gradient-radial from-yellow-500/50 via-orange-500/30 to-transparent rounded-3xl" />
            </div>
            
            <div className="relative bg-gradient-to-br from-yellow-900/90 via-orange-800/90 to-red-900/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border-4 border-yellow-500 shadow-2xl animate-pulse-border">
              <div className="text-center">
                <div className="text-5xl md:text-7xl mb-6 animate-bounce">⚔️</div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                  <span className="animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-orange-500">
                    MATCH FOUND!
                  </span>
                </h2>
                <p className="text-xl md:text-3xl text-yellow-300 mb-8 font-bold animate-pulse">
                  🔥 PREPARE FOR BATTLE! 🔥
                </p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
                  <div className="text-center transform hover:scale-110 transition-all">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl md:text-6xl mb-2 animate-pulse shadow-2xl">
                      👤
                    </div>
                    <p className="text-white font-black text-lg md:text-xl">YOU</p>
                  </div>
                  
                  <div className="text-3xl md:text-5xl animate-pulse font-black text-yellow-400">VS</div>
                  
                  <div className="text-center transform hover:scale-110 transition-all">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-4xl md:text-6xl mb-2 animate-pulse shadow-2xl">
                      👤
                    </div>
                    <p className="text-white font-black text-lg md:text-xl">
                      {opponent ? `${opponent.slice(0, 6)}...` : 'OPPONENT'}
                    </p>
                  </div>
                </div>
                
                <div className="text-md md:text-xl text-gray-300">
                  Battle ID: <span className="text-yellow-400 font-mono font-bold">{battleId?.slice(0, 12)}...</span>
                </div>
                
                <div className="mt-8">
                  <div className="inline-flex items-center gap-2 text-green-400 text-lg md:text-xl animate-pulse font-bold">
                    <div className="w-4 h-4 bg-green-400 rounded-full animate-ping" />
                    LOADING BATTLE ARENA...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tips - Mobile Responsive */}
        <div className="mt-6 md:mt-8 bg-black/60 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-white/20">
          <h3 className="text-lg md:text-xl font-black text-yellow-400 mb-3 text-center">
            🎮 BATTLE TIPS 🎮
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm md:text-base text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-green-400">⚡</span>
              <p className="font-bold">Mix toy types for ultimate synergy!</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400">💎</span>
              <p className="font-bold">Higher stakes = Bigger rewards!</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">🎯</span>
              <p className="font-bold">Study opponent patterns!</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400">🔥</span>
              <p className="font-bold">Ultimate abilities change everything!</p>
            </div>
          </div>
        </div>
      </div>
      </div> {/* Close #pvp-wrapper */}

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgb(234 179 8);
            box-shadow: 0 0 60px rgba(234, 179, 8, 0.8);
          }
          50% {
            border-color: rgb(245 158 11);
            box-shadow: 0 0 100px rgba(245, 158, 11, 1);
          }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes explosion {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(2);
            opacity: 0.5;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        
        .animate-explosion {
          animation: explosion 3s ease-out infinite;
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 4s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-fall {
          animation: fall linear infinite;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        /* Lightning effect */
        .lightning {
          position: absolute;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, #fff, transparent);
          opacity: 0;
          animation: lightning 4s linear infinite;
        }
        
        .lightning-1 {
          left: 20%;
          animation-delay: 0s;
        }
        
        .lightning-2 {
          right: 30%;
          animation-delay: 2s;
        }
        
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          95% { opacity: 1; }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .animate-fall {
            animation-duration: 8s;
          }
        }
      `}</style>
    </div>
  );
};

export default PvPLobby;