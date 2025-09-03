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
  
  // Determine which player we are
  const isPlayer1 = pvpData?.playerNumber === 1;
  const ourTeam = isPlayer1 ? player1Team : player2Team;
  const theirTeam = isPlayer1 ? player2Team : player1Team;
  
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
      setBattleState('in_progress');
    });
    
    // Listen for battle errors
    socket.on('battle_error', ({ message, error }) => {
      console.error('Battle error:', message, error);
      setBattleState('error');
    });
    
    // Listen for battle actions from server
    socket.on('battle_action', ({ action, state }) => {
      console.log('Received battle action:', action);
      
      // Update teams with new state
      setPlayer1Team(state.player1Team);
      setPlayer2Team(state.player2Team);
      
      // Show the action animation
      displayAction(action);
    });
    
    // Listen for battle completion
    socket.on('battle_complete', ({ winner: winnerId, finalState }) => {
      console.log('Battle complete, winner:', winnerId);
      setBattleState('complete');
      setWinner(winnerId);
      
      // Determine if we won
      const weWon = winnerId === publicKey?.toString();
      
      setTimeout(() => {
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
      setTimeout(() => setSpellNotification(null), 2000);
      return;
    }
    
    if (action.type === 'ability_used') {
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
      
      // Apply visual effects
      action.effects.forEach(effect => {
        showDamageNumber(effect);
      });
      
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
            {player1Team.map(char => (
              <div key={char.instanceId} id={`char-${char.instanceId}`}>
                <CharacterCard
                  character={char}
                  isActive={false}
                  showHealth={true}
                  isAlive={char.isAlive}
                />
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
            ))}
          </div>
        </div>
        
        {/* Opponent Team */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white text-xl font-bold text-center">
            {isPlayer1 ? 'Opponent' : 'Your Team'}
          </h3>
          <div className="flex flex-col gap-2">
            {player2Team.map(char => (
              <div key={char.instanceId} id={`char-${char.instanceId}`}>
                <CharacterCard
                  character={char}
                  isActive={false}
                  showHealth={true}
                  isAlive={char.isAlive}
                />
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
            ))}
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