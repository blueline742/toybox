import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CharacterCard from './CharacterCard';
import SpellNotification from './SpellNotification';
import EnhancedSpellEffects from './EnhancedSpellEffects';
import UnicornSpellEffects from './UnicornSpellEffects';
import PhoenixDragonEffects from './PhoenixDragonEffects';
import RoboFighterEffects from './RoboFighterEffects';
import WizardEffects from './WizardEffects';
import PirateEffects from './PirateEffects';
import RubberDuckieEffects from './RubberDuckieEffects';
import musicManager from '../utils/musicManager';

const PvPBattleScreen = ({ playerTeam, opponentTeam, pvpData, onBattleEnd, onBack }) => {
  const { publicKey } = useWallet();
  
  // Initialize teams from props
  const [player1Team, setPlayer1Team] = useState([]);
  const [player2Team, setPlayer2Team] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);
  const [battleState, setBattleState] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [spellNotification, setSpellNotification] = useState(null);
  const [activeSpell, setActiveSpell] = useState(null);
  const [spellPositions, setSpellPositions] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const damageNumberId = useRef(0);
  
  // Buff/Debuff tracking states
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map()); // Track active shields
  const [frozenCharacters, setFrozenCharacters] = useState(new Map()); // Track frozen characters
  const [debuffedCharacters, setDebuffedCharacters] = useState(new Map()); // Track accuracy debuffs
  const [damageBuffedCharacters, setDamageBuffedCharacters] = useState(new Map()); // Track damage buffs
  const [criticalBuffedCharacters, setCriticalBuffedCharacters] = useState(new Map()); // Track critical buffs
  
  // Determine which player we are
  const isPlayer1 = pvpData?.playerNumber === 1;
  const ourTeam = isPlayer1 ? player1Team : player2Team;
  const theirTeam = isPlayer1 ? player2Team : player1Team;
  
  // Debug: Monitor frozen state changes
  useEffect(() => {
    console.log('%c🎮 PVP BATTLE SCREEN MOUNTED', 'background: #f0f; color: #fff; padding: 5px; font-size: 16px');
  }, []);
  
  useEffect(() => {
    if (frozenCharacters.size > 0) {
      console.log('%c❄️ FROZEN STATE UPDATED IN PVP', 'background: #0ff; color: #000; padding: 5px; font-size: 14px');
      console.log('Frozen characters:', Array.from(frozenCharacters.entries()));
    }
    window.debugFrozen = frozenCharacters;
  }, [frozenCharacters]);
  
  // Function to sync buff/debuff states from server team data
  const syncBuffDebuffStates = (team1, team2) => {
    console.log('🔄 SYNCING BUFF/DEBUFF STATES');
    console.log('Team 1:', team1);
    console.log('Team 2:', team2);
    
    const allCharacters = [...(team1 || []), ...(team2 || [])];
    
    // Clear and rebuild all buff/debuff states from server data
    const newFrozen = new Map();
    const newShielded = new Map();
    const newDamageBuff = new Map();
    const newCriticalBuff = new Map();
    const newDebuffed = new Map();
    
    allCharacters.forEach(char => {
      console.log(`Checking ${char.name} (${char.instanceId}):`, {
        status: char.status,
        shields: char.shields,
        frozen: char.status?.frozen
      });
      
      // Check frozen status
      if (char.status?.frozen) {
        console.log(`❄️ ${char.name} is FROZEN!`);
        newFrozen.set(char.instanceId, true);
      }
      
      // Check shield
      if (char.shields && char.shields > 0) {
        newShielded.set(char.instanceId, { amount: char.shields, type: 'normal' });
      }
      
      // Check other status effects if they exist
      if (char.status?.damageBuff) {
        newDamageBuff.set(char.instanceId, { amount: char.status.damageBuff });
      }
      
      if (char.status?.criticalBuff) {
        newCriticalBuff.set(char.instanceId, { 
          boost: char.status.criticalBuff, 
          permanent: char.status.criticalBuffPermanent 
        });
      }
      
      if (char.status?.accuracyDebuff) {
        newDebuffed.set(char.instanceId, { type: 'accuracy' });
      }
    });
    
    console.log('📊 Final frozen state:', Array.from(newFrozen.entries()));
    
    // Debug: expose to window for debugging
    window.frozenDebug = {
      frozen: Array.from(newFrozen.entries()),
      shields: Array.from(newShielded.entries()),
      team1: team1,
      team2: team2
    };
    
    // Update all states at once
    setFrozenCharacters(newFrozen);
    setShieldedCharacters(newShielded);
    setDamageBuffedCharacters(newDamageBuff);
    setCriticalBuffedCharacters(newCriticalBuff);
    setDebuffedCharacters(newDebuffed);
  };
  
  useEffect(() => {
    // Start battle music
    musicManager.crossFade('/battlemusic.mp3', 'battle', 1000);
    
    if (!pvpData?.socket) {
      console.error('No socket in pvpData!');
      return;
    }
    
    const socket = pvpData.socket;
    console.log('PvPBattleScreen: Setting up socket listeners for battle:', pvpData.battleId);
    
    // Listen for battle initialization
    socket.on('battle_initialized', ({ state, seed }) => {
      console.log('Battle initialized with seed:', seed);
      console.log('Battle state received:', state);
      setPlayer1Team(state.player1Team);
      setPlayer2Team(state.player2Team);
      // Don't sync buffs on init - game just started, no one is frozen yet
      setBattleState('in_progress');
    });
    
    // Listen for battle errors
    socket.on('battle_error', ({ message, error }) => {
      console.error('Battle error:', message, error);
      setBattleState('error');
    });
    
    // Listen for battle actions from server
    socket.on('battle_action', ({ action, state }) => {
      // Only log freeze-related actions
      if (action.ability?.effect === 'freeze_all' || action.effects?.some(e => e.type === 'freeze')) {
        console.log('%c🎯 FREEZE ACTION DETECTED', 'background: #00f; color: #fff; padding: 5px; font-size: 16px');
        console.log('Effects:', action.effects);
      }
      
      // Remove verbose debug logging
      
      // Update teams with new state
      setPlayer1Team(state.player1Team);
      setPlayer2Team(state.player2Team);
      
      // Sync non-frozen buffs/debuffs from server
      const allChars = [...(state.player1Team || []), ...(state.player2Team || [])];
      allChars.forEach(char => {
        // Sync shields
        if (char.shields && char.shields > 0) {
          setShieldedCharacters(prev => {
            const newMap = new Map(prev);
            newMap.set(char.instanceId, { amount: char.shields, type: 'normal' });
            return newMap;
          });
        }
        
        // Sync other buffs if they exist in the status
        if (char.status?.damageBuff) {
          setDamageBuffedCharacters(prev => {
            const newMap = new Map(prev);
            newMap.set(char.instanceId, { amount: char.status.damageBuff });
            return newMap;
          });
        }
        
        if (char.status?.criticalBuff) {
          setCriticalBuffedCharacters(prev => {
            const newMap = new Map(prev);
            newMap.set(char.instanceId, { 
              boost: char.status.criticalBuff, 
              permanent: char.status.criticalBuffPermanent 
            });
            return newMap;
          });
        }
        
        if (char.status?.accuracyDebuff) {
          setDebuffedCharacters(prev => {
            const newMap = new Map(prev);
            newMap.set(char.instanceId, { type: 'accuracy' });
            return newMap;
          });
        }
      });
      
      // Show the action animation
      displayAction(action);
    });
    
    // Listen for battle completion
    socket.on('battle_complete', ({ winner: winnerId, finalState }) => {
      console.log('PvPBattleScreen: Received battle_complete event');
      console.log('Battle complete, winner:', winnerId);
      console.log('My public key:', publicKey?.toString());
      setBattleState('complete');
      setWinner(winnerId);
      
      // Determine if we won
      const weWon = winnerId === publicKey?.toString();
      
      setTimeout(() => {
        console.log('PvPBattleScreen: Calling onBattleEnd with:', {
          winner: weWon ? 'player' : 'ai',
          survivingChars: weWon ? ourTeam : theirTeam,
          isPvP: true,
          wagerAmount: pvpData.wagerAmount
        });
        onBattleEnd({
          winner: weWon ? 'player' : 'ai',
          survivingChars: weWon ? ourTeam : theirTeam,
          isPvP: true,
          wagerAmount: pvpData.wagerAmount
        });
      }, 3000);
    });
    
    // Notify server we're ready
    console.log('Emitting battle_ready for:', pvpData.battleId);
    socket.emit('battle_ready', {
      battleId: pvpData.battleId,
      wallet: publicKey?.toString()
    });
    
    return () => {
      socket.off('battle_initialized');
      socket.off('battle_action');
      socket.off('battle_complete');
      socket.off('battle_error');
    };
  }, [pvpData, publicKey]);
  
  const displayAction = (action) => {
    if (action.type === 'skip_turn') {
      // Show frozen notification
      setSpellNotification({
        ability: { name: 'FROZEN', description: 'Skips turn due to being frozen!' },
        caster: action.caster
      });
      
      // Clear frozen status when character skips turn
      if (action.reason === 'frozen') {
        setFrozenCharacters(prev => {
          const newMap = new Map(prev);
          newMap.delete(action.caster.instanceId);
          console.log(`🔥 Clearing frozen for ${action.caster.name} after skip turn`);
          return newMap;
        });
      }
      
      setTimeout(() => setSpellNotification(null), 2000);
      return;
    }
    
    if (action.type === 'ability_used') {
      // Debug: Check if this is a freeze ability
      if (action.ability?.effect === 'freeze_all' || action.ability?.freeze) {
        console.log('%c🎯 ICE NOVA ACTION RECEIVED!', 'background: #00f; color: #fff; padding: 5px; font-size: 16px');
        console.log('Ability:', action.ability);
        console.log('Effects:', action.effects);
      }
      
      // Show ability notification
      setSpellNotification({
        ability: action.ability,
        caster: action.caster,
        targets: action.targets
      });
      
      // Set up spell effect
      setActiveSpell({
        ability: action.ability,
        caster: action.caster,
        targets: action.targets
      });
      
      // Apply visual effects only - buff/debuff states are synced from server
      action.effects?.forEach((effect) => {
        showDamageNumber(effect);
        
        // Track freeze effects manually since server clears them immediately
        if (effect.type === 'freeze' || effect.freeze) {
          console.log('%c🧊 SETTING FROZEN', 'background: #00f; color: #fff; padding: 3px', effect.targetId);
          setFrozenCharacters(prev => {
            const newMap = new Map(prev);
            newMap.set(effect.targetId, true);
            return newMap;
          });
        }
      });
      
      // Note: Buff/debuff states are now synced from server via syncBuffDebuffStates()
      // No need to manually update them here
      
      // Clear effects after animation
      setTimeout(() => {
        setSpellNotification(null);
        setActiveSpell(null);
      }, 2500);
    }
  };
  
  const showDamageNumber = (effect) => {
    const id = ++damageNumberId.current;
    let displayText = '';
    let type = 'damage';
    
    switch (effect.type) {
      case 'damage':
        displayText = `-${effect.amount}`;
        type = effect.isCritical ? 'critical' : 'damage';
        break;
      case 'heal':
        displayText = `+${effect.amount}`;
        type = 'heal';
        break;
      case 'shield':
        displayText = `Shield +${effect.amount}`;
        type = 'shield';
        break;
      case 'revive':
        displayText = 'REVIVED!';
        type = 'heal';
        break;
    }
    
    const newNumber = {
      id,
      amount: displayText,
      type,
      targetId: effect.targetId
    };
    
    setDamageNumbers(prev => [...prev, newNumber]);
    
    // Remove after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(n => n.id !== id));
    }, 2000);
  };
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 relative">
      {/* Battle Status */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-6 py-3 text-white text-center">
          <h2 className="text-2xl font-bold">
            {battleState === 'waiting' && 'Waiting for opponent...'}
            {battleState === 'in_progress' && 'Battle in Progress!'}
            {battleState === 'complete' && (winner === publicKey?.toString() ? 'Victory!' : 'Defeat!')}
          </h2>
          <p className="text-sm opacity-75">PvP Battle - {pvpData?.wagerAmount} SOL</p>
        </div>
      </div>
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold transition-all"
      >
        Forfeit Battle
      </button>
      
      {/* Teams Display */}
      <div className="flex justify-between items-center h-full px-8">
        {/* Your Team */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white text-xl font-bold text-center">
            {isPlayer1 ? 'Your Team' : 'Opponent'}
          </h3>
          <div className="flex flex-col gap-2">
            {player1Team.map(char => {
              const isOurTeam = isPlayer1;
              const isFrozen = frozenCharacters.has(char.instanceId);
              
              // Simple frozen check
              if (isFrozen) {
                console.log('%c✅ FROZEN VISUAL SHOULD SHOW', 'background: #0f0; color: #000; padding: 3px', char.name);
              }
              
              return (
                <div key={char.instanceId} id={`char-${char.instanceId}`} className="relative">
                  <CharacterCard
                    character={char}
                    isActive={false}
                    currentHealth={char.currentHealth || char.health}
                    maxHealth={char.maxHealth || char.health}
                    teamColor={isOurTeam ? 'blue' : 'red'}
                    shields={shieldedCharacters.get(char.instanceId)}
                    damageBuff={damageBuffedCharacters.get(char.instanceId)}
                    criticalBuff={criticalBuffedCharacters.get(char.instanceId)}
                    frozen={isFrozen}
                    debuffed={debuffedCharacters.get(char.instanceId)}
                  />
                  {/* Frozen Visual Effect */}
                  {isFrozen && (
                    <div className="absolute inset-0 pointer-events-none z-35">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-200/40 via-cyan-200/30 to-white/20 rounded-lg" />
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <pattern id="ice-pattern-p1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 0 L10 20 M0 10 L20 10 M5 5 L15 15 M15 5 L5 15" 
                                  stroke="rgba(173,216,230,0.6)" strokeWidth="0.5" fill="none"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#ice-pattern-p1)" />
                      </svg>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <div className="text-cyan-300 text-xs font-bold animate-pulse">FROZEN</div>
                      </div>
                    </div>
                  )}
                  {/* Damage Numbers */}
                {damageNumbers
                  .filter(n => n.targetId === char.instanceId)
                  .map(number => (
                    <div
                      key={number.id}
                      className={`absolute text-2xl font-bold animate-float-up pointer-events-none
                        ${number.type === 'damage' ? 'text-red-500' : ''}
                        ${number.type === 'critical' ? 'text-yellow-400 text-3xl' : ''}
                        ${number.type === 'heal' ? 'text-green-400' : ''}
                        ${number.type === 'shield' ? 'text-blue-400' : ''}
                      `}
                      style={{
                        transform: 'translateX(-50%)',
                        left: '50%',
                        top: '50%'
                      }}
                    >
                      {number.amount}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Opponent Team */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white text-xl font-bold text-center">
            {isPlayer1 ? 'Opponent' : 'Your Team'}
          </h3>
          <div className="flex flex-col gap-2">
            {player2Team.map(char => {
              const isOurTeam = !isPlayer1;
              const isFrozen = frozenCharacters.has(char.instanceId);
              
              // Simple frozen check
              if (isFrozen) {
                console.log('%c✅ FROZEN VISUAL SHOULD SHOW', 'background: #0f0; color: #000; padding: 3px', char.name);
              }
              
              return (
                <div key={char.instanceId} id={`char-${char.instanceId}`} className="relative">
                  <CharacterCard
                    character={char}
                    isActive={false}
                    currentHealth={char.currentHealth || char.health}
                    maxHealth={char.maxHealth || char.health}
                    teamColor={isOurTeam ? 'blue' : 'red'}
                    shields={shieldedCharacters.get(char.instanceId)}
                    damageBuff={damageBuffedCharacters.get(char.instanceId)}
                    criticalBuff={criticalBuffedCharacters.get(char.instanceId)}
                    frozen={isFrozen}
                    debuffed={debuffedCharacters.get(char.instanceId)}
                  />
                  {/* Frozen Visual Effect */}
                  {isFrozen && (
                    <div className="absolute inset-0 pointer-events-none z-35">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-200/40 via-cyan-200/30 to-white/20 rounded-lg" />
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <pattern id="ice-pattern-p2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 0 L10 20 M0 10 L20 10 M5 5 L15 15 M15 5 L5 15" 
                                  stroke="rgba(173,216,230,0.6)" strokeWidth="0.5" fill="none"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#ice-pattern-p2)" />
                      </svg>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <div className="text-cyan-300 text-xs font-bold animate-pulse">FROZEN</div>
                      </div>
                    </div>
                  )}
                  {/* Damage Numbers */}
                {damageNumbers
                  .filter(n => n.targetId === char.instanceId)
                  .map(number => (
                    <div
                      key={number.id}
                      className={`absolute text-2xl font-bold animate-float-up pointer-events-none
                        ${number.type === 'damage' ? 'text-red-500' : ''}
                        ${number.type === 'critical' ? 'text-yellow-400 text-3xl' : ''}
                        ${number.type === 'heal' ? 'text-green-400' : ''}
                        ${number.type === 'shield' ? 'text-blue-400' : ''}
                      `}
                      style={{
                        transform: 'translateX(-50%)',
                        left: '50%',
                        top: '50%'
                      }}
                    >
                      {number.amount}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Spell Effects */}
      {activeSpell && spellPositions && (
        <>
          {activeSpell.caster?.id === 'unicorn_warrior' && (
            <UnicornSpellEffects
              spell={activeSpell}
              positions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
          {activeSpell.caster?.id === 'phoenix_dragon' && (
            <PhoenixDragonEffects
              activeSpell={activeSpell}
              spellPositions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
          {activeSpell.caster?.id === 'robo_fighter' && (
            <RoboFighterEffects
              spell={activeSpell}
              positions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
          {activeSpell.caster?.id === 'wizard_toy' && (
            <WizardEffects
              spell={activeSpell}
              positions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
          {activeSpell.caster?.id === 'pirate_captain' && (
            <PirateEffects
              spell={activeSpell}
              positions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
          {activeSpell.caster?.id === 'rubber_duckie' && (
            <RubberDuckieEffects
              spell={activeSpell}
              positions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
          {/* Default effects for other characters */}
          {!['unicorn_warrior', 'phoenix_dragon', 'robo_fighter', 'wizard_toy', 'pirate_captain', 'rubber_duckie'].includes(activeSpell.caster?.id) && (
            <EnhancedSpellEffects
              activeSpell={activeSpell}
              spellPositions={spellPositions}
              onComplete={() => setActiveSpell(null)}
            />
          )}
        </>
      )}
      
      {/* Spell Notification */}
      {spellNotification && (
        <SpellNotification
          ability={spellNotification.ability}
          caster={spellNotification.caster}
          targets={spellNotification.targets}
        />
      )}
    </div>
  );
};

export default PvPBattleScreen;