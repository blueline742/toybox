import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import HearthstoneScene from './HearthstoneScene';
import SpellNotification from '../SpellNotification';
import musicManager from '../../utils/musicManager';

const PvPBattle3D = ({ playerTeam, opponentTeam, pvpData, onBattleEnd, onBack }) => {
  const { publicKey } = useWallet();

  // Initialize teams from props
  const [player1Team, setPlayer1Team] = useState([]);
  const [player2Team, setPlayer2Team] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);
  const [battleState, setBattleState] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [spellNotification, setSpellNotification] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [activeEffects, setActiveEffects] = useState([]);

  // Buff/Debuff tracking states
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map());
  const [frozenCharacters, setFrozenCharacters] = useState(new Map());

  // Targeting state for 3D
  const [isTargeting, setIsTargeting] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [opponentCharacterIndex, setOpponentCharacterIndex] = useState(0);
  const [currentTurn, setCurrentTurn] = useState('waiting');
  const [currentCaster, setCurrentCaster] = useState(null);
  const [targetingTimeout, setTargetingTimeout] = useState(null);

  // Debug effect to log state changes
  useEffect(() => {
    console.log(`🔄 State Update: activeCharacterIndex=${activeCharacterIndex}, opponentCharacterIndex=${opponentCharacterIndex}, currentTurn=${currentTurn}`);
  }, [activeCharacterIndex, opponentCharacterIndex, currentTurn]);

  // Determine which player we are
  const isPlayer1 = pvpData?.playerNumber === 1;
  const ourTeam = isPlayer1 ? player1Team : player2Team;
  const theirTeam = isPlayer1 ? player2Team : player1Team;

  // Initialize teams when component mounts
  useEffect(() => {
    console.log('🎮 3D PVP BATTLE INITIALIZED');

    if (playerTeam && opponentTeam) {
      const p1Team = isPlayer1 ? playerTeam : opponentTeam;
      const p2Team = isPlayer1 ? opponentTeam : playerTeam;

      // Initialize teams with proper structure for 3D
      setPlayer1Team(p1Team.map((char, idx) => ({
        ...char,
        instanceId: `p1-${idx}`,
        currentHealth: char.currentHealth || char.maxHealth || 100,
        isAlive: true,
        team: 'player1'
      })));

      setPlayer2Team(p2Team.map((char, idx) => ({
        ...char,
        instanceId: `p2-${idx}`,
        currentHealth: char.currentHealth || char.maxHealth || 100,
        isAlive: true,
        team: 'player2'
      })));

      setBattleState('active');

      // Notify server that we're ready
      if (pvpData?.socket && pvpData?.battleId) {
        console.log('📡 Emitting battle_ready');
        pvpData.socket.emit('battle_ready', {
          battleId: pvpData.battleId,
          wallet: pvpData.playerAddress
        });
      }
    }
  }, [playerTeam, opponentTeam, isPlayer1, pvpData]);

  // Listen for WebSocket messages
  useEffect(() => {
    if (!pvpData?.socket) return;

    const socket = pvpData.socket;

    const handleBattleInitialized = (data) => {
      console.log('🎯 3D PVP Battle Initialized:', data);
      setBattleState('active');

      // Handle initial state from server
      if (data.state) {
        handleGameUpdate(data.state);

        // Also initialize character indices
        if (data.state.player1CharacterIndex !== undefined || data.state.player2CharacterIndex !== undefined) {
          const p1Index = (data.state.player1CharacterIndex || 0) % 4;
          const p2Index = (data.state.player2CharacterIndex || 0) % 4;

          if (isPlayer1) {
            setActiveCharacterIndex(p1Index);
            setOpponentCharacterIndex(p2Index);
          } else {
            setActiveCharacterIndex(p2Index);
            setOpponentCharacterIndex(p1Index);
          }
        }
      }

      const isOurTurn = data.state?.currentTurn === `player${pvpData.playerNumber}`;
      setCurrentTurn(isOurTurn ? 'player' : 'opponent');
    };

    const handleBattleError = (data) => {
      console.error('❌ 3D PVP Battle Error:', data);
      setBattleState('error');
    };

    const handleRequestTarget = (data) => {
      console.log('🎯 Target requested:', data);

      // Set up targeting mode
      setCurrentAbility(data.ability);
      setCurrentCaster(data.caster);
      setValidTargets(data.validTargets);
      setIsTargeting(true);
      setCurrentTurn('player'); // It's our turn to select

      // Set timeout warning
      if (data.timeout) {
        const timeout = setTimeout(() => {
          console.log('⏰ Target selection timeout!');
          setIsTargeting(false);
          setValidTargets([]);
          setCurrentAbility(null);
        }, data.timeout);
        setTargetingTimeout(timeout);
      }
    };

    const handleGameUpdate = (data) => {
      console.log('📡 3D PVP Game Update:', data);
      console.log('📡 Keys in data:', Object.keys(data));

      // Update teams from server state
      if (data.team1 || data.player1Team) {
        const team1Data = data.team1 || data.player1Team;
        setPlayer1Team(team1Data.map((char, idx) => ({
          ...char,
          instanceId: char.instanceId || `p1-${idx}`,
          isAlive: char.currentHealth > 0,
          team: 'player1'
        })));
      }

      if (data.team2 || data.player2Team) {
        const team2Data = data.team2 || data.player2Team;
        setPlayer2Team(team2Data.map((char, idx) => ({
          ...char,
          instanceId: char.instanceId || `p2-${idx}`,
          isAlive: char.currentHealth > 0,
          team: 'player2'
        })));
      }

      // Update character indices for turn tracking
      // activeCharacterIndex is for "our" team (bottom cards)
      // opponentCharacterIndex is for "their" team (top cards)
      if (data.player1CharacterIndex !== undefined) {
        const index = data.player1CharacterIndex % 4; // Ensure it cycles within team size
        console.log(`📍 Player1 character index from server: ${data.player1CharacterIndex} -> ${index}, We are player${pvpData.playerNumber}`);
        if (isPlayer1) {
          // We are player1, so player1's index is our active index
          setActiveCharacterIndex(index);
          console.log(`📍 Setting our (player) active index to: ${index}`);
        } else {
          // We are player2, so player1's index is opponent's active index
          setOpponentCharacterIndex(index);
          console.log(`📍 Setting opponent active index to: ${index}`);
        }
      }

      if (data.player2CharacterIndex !== undefined) {
        const index = data.player2CharacterIndex % 4; // Ensure it cycles within team size
        console.log(`📍 Player2 character index from server: ${data.player2CharacterIndex} -> ${index}, We are player${pvpData.playerNumber}`);
        if (isPlayer1) {
          // We are player1, so player2's index is opponent's active index
          setOpponentCharacterIndex(index);
          console.log(`📍 Setting opponent active index to: ${index}`);
        } else {
          // We are player2, so player2's index is our active index
          setActiveCharacterIndex(index);
          console.log(`📍 Setting our (player) active index to: ${index}`);
        }
      }

      // Update turn state
      if (data.currentTurn !== undefined) {
        const isOurTurn = data.currentTurn === `player${pvpData.playerNumber}`;
        setCurrentTurn(isOurTurn ? 'player' : 'opponent');
        console.log(`🎮 Turn update: ${data.currentTurn}, Our turn: ${isOurTurn ? 'YES' : 'NO'}`);

        // Clear targeting if turn changed
        if (!isOurTurn) {
          setIsTargeting(false);
          setValidTargets([]);
          setCurrentAbility(null);
        }
      }

      // Sync buffs/debuffs
      syncBuffDebuffStates(data.team1 || data.player1Team, data.team2 || data.player2Team);
    };

    const handleActionResult = (data) => {
      console.log('⚔️ 3D PVP Action Result:', data);

      // Show spell notification
      if (data.action && data.action.ability) {
        const casterData = data.action.caster || {};
        const targetsData = data.results ? data.results.map(r => r.target) : [];

        setSpellNotification({
          ability: data.action.ability,
          caster: casterData,
          targets: targetsData
        });

        // Create 3D effect for the action
        const effect = createEffectFromAction(data.action, data.results);
        if (effect) {
          setActiveEffects(prev => [...prev, effect]);

          // Remove effect after duration
          setTimeout(() => {
            setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
          }, effect.duration || 2500);
        }

        // Add damage numbers
        if (data.results) {
          data.results.forEach(result => {
            if (result.damage || result.heal) {
              addDamageNumber(result.target, result.damage || result.heal, result.heal);
            }
          });
        }

        // Clear notification after delay
        setTimeout(() => setSpellNotification(null), 2500);
      }
    };

    const handleGameEnd = (data) => {
      console.log('🏆 3D PVP Game Ended:', data);
      setWinner(data.winner);
      setBattleState('ended');

      if (onBattleEnd) {
        onBattleEnd(data.winner === pvpData.playerNumber ? 'win' : 'lose', data);
      }
    };

    const handleBattleAction = (data) => {
      console.log('⚔️ 3D PVP Battle Action:', data);
      console.log('⚔️ Battle Action state keys:', data.state ? Object.keys(data.state) : 'no state');

      // Update state from server
      if (data.state) {
        handleGameUpdate(data.state);
      }

      // Handle action result
      if (data.action) {
        handleActionResult(data);
      }
    };

    socket.on('battle_initialized', handleBattleInitialized);
    socket.on('battle_error', handleBattleError);
    socket.on('request_target', handleRequestTarget);
    socket.on('gameUpdate', handleGameUpdate);
    socket.on('actionResult', handleActionResult);
    socket.on('battle_action', handleBattleAction);
    socket.on('gameEnd', handleGameEnd);

    return () => {
      socket.off('battle_initialized', handleBattleInitialized);
      socket.off('battle_error', handleBattleError);
      socket.off('request_target', handleRequestTarget);
      socket.off('gameUpdate', handleGameUpdate);
      socket.off('actionResult', handleActionResult);
      socket.off('battle_action', handleBattleAction);
      socket.off('gameEnd', handleGameEnd);

      // Clear timeout on cleanup
      if (targetingTimeout) {
        clearTimeout(targetingTimeout);
      }
    };
  }, [pvpData, onBattleEnd]);

  // Helper function to sync buff/debuff states
  const syncBuffDebuffStates = (team1, team2) => {
    const allCharacters = [...(team1 || []), ...(team2 || [])];

    const newFrozen = new Map();
    const newShielded = new Map();

    allCharacters.forEach(char => {
      if (char.status?.frozen) {
        newFrozen.set(char.instanceId, true);
      }

      if (char.shields && char.shields > 0) {
        newShielded.set(char.instanceId, { amount: char.shields, type: 'energy' });
      }
    });

    setFrozenCharacters(newFrozen);
    setShieldedCharacters(newShielded);
  };

  // Create 3D effect from action
  const createEffectFromAction = (action, results) => {
    const ability = action.ability;
    const caster = action.caster;
    if (!ability) return null;

    const effectId = Date.now() + Math.random();
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 1.5 : 2.2;
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;

    // Get caster position (the character casting the spell)
    let startPosition = [0, 2.3, 0];
    if (caster) {
      const casterTeam = caster.instanceId?.startsWith('p1') ? player1Team : player2Team;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === caster.instanceId);
      if (casterIndex !== -1) {
        const casterX = startX + casterIndex * spacing;
        const casterY = 2.3; // Active card height
        const casterZ = caster.instanceId?.startsWith('p1') ?
          (pvpData.playerNumber === 1 ? 5.5 : -5.5) :
          (pvpData.playerNumber === 1 ? -5.5 : 5.5);
        startPosition = [casterX, casterY, casterZ];
      }
    }

    // Get target position from first result target
    let targetPosition = [0, 1.8, 0];
    if (results && results.length > 0 && results[0].target) {
      const target = results[0].target;
      // Calculate position based on target's team and index
      const targetTeam = target.instanceId?.startsWith('p1') ? player1Team : player2Team;
      const targetIndex = targetTeam.findIndex(c => c.instanceId === target.instanceId);
      if (targetIndex !== -1) {
        const targetX = startX + targetIndex * spacing;
        const targetY = 1.8; // Normal card height
        const targetZ = target.instanceId?.startsWith('p1') ?
          (pvpData.playerNumber === 1 ? 5.5 : -5.5) :
          (pvpData.playerNumber === 1 ? -5.5 : 5.5);
        targetPosition = [targetX, targetY, targetZ];
      }
    }

    return {
      id: effectId,
      type: getEffectType(ability),
      startPosition,
      targetPosition,
      duration: getEffectType(ability) === 'pyroblast' ? 2500 : 2000
    };
  };

  // Get effect type from ability - always use pyroblast for now
  const getEffectType = (ability) => {
    const name = ability.name.toLowerCase();
    if (name.includes('heal')) return 'healing';
    if (name.includes('shield')) return 'shield';
    // Use pyroblast for all damage abilities for now
    return 'pyroblast';
  };

  // Add damage number
  const addDamageNumber = (target, value, isHealing = false) => {
    const id = Date.now() + Math.random();
    setDamageNumbers(prev => [...prev, {
      id,
      value,
      position: [0, 0, 0], // Will be calculated based on target
      isHealing,
      isCritical: false
    }]);

    // Remove after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 2000);
  };

  // Handle card click for targeting
  const handleCardClick = (target) => {
    if (!isTargeting) return;

    // Check if this is a valid target
    const isValidTarget = validTargets.some(t =>
      t.instanceId === target.instanceId ||
      t.id === target.id
    );

    if (!isValidTarget) {
      console.log('❌ Invalid target selected');
      return;
    }

    // Clear timeout
    if (targetingTimeout) {
      clearTimeout(targetingTimeout);
      setTargetingTimeout(null);
    }

    // Send target selection to server
    if (pvpData?.socket && pvpData?.battleId) {
      console.log('📤 Sending target selection:', target.instanceId);
      pvpData.socket.emit('select_target', {
        battleId: pvpData.battleId,
        targetId: target.instanceId,
        wallet: pvpData.playerAddress
      });

      setIsTargeting(false);
      setValidTargets([]);
      setCurrentAbility(null);
      setCurrentCaster(null);
    }
  };

  // Handle ability selection (when it's player's turn)
  const selectAbility = (character, ability) => {
    if (currentTurn !== 'player') return;

    setCurrentAbility(ability);

    // Determine valid targets based on ability type
    const targets = ability.targetType === 'ally'
      ? ourTeam.filter(c => c.isAlive)
      : theirTeam.filter(c => c.isAlive);

    setValidTargets(targets);
    setIsTargeting(true);
  };

  // Debug logging
  const indexToUse = currentTurn === 'player' ? activeCharacterIndex : opponentCharacterIndex;
  console.log(`🎯 Passing to HearthstoneScene: Turn=${currentTurn}, activeCharacterIndex=${activeCharacterIndex}, opponentCharacterIndex=${opponentCharacterIndex}, using=${indexToUse}`);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      {/* 3D Battle Scene */}
      <HearthstoneScene
        playerTeam={isPlayer1 ? player1Team : player2Team}
        aiTeam={isPlayer1 ? player2Team : player1Team}
        onCardClick={handleCardClick}
        shieldedCharacters={shieldedCharacters}
        frozenCharacters={frozenCharacters}
        isTargeting={isTargeting}
        validTargets={validTargets}
        activeCharacterIndex={indexToUse}
        currentTurn={currentTurn}
        activeEffects={activeEffects}
        damageNumbers={damageNumbers}
      />

      {/* Spell Notification */}
      {spellNotification && (
        <SpellNotification
          ability={spellNotification.ability}
          caster={spellNotification.caster}
          targets={spellNotification.targets}
          onComplete={() => setSpellNotification(null)}
        />
      )}

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
        >
          Leave Battle
        </button>
      </div>

      {/* Turn Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`px-4 py-2 rounded-lg font-bold ${
          currentTurn === 'player' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {currentTurn === 'player' ? 'Your Turn' : "Opponent's Turn"}
        </div>
      </div>

      {/* Targeting UI */}
      {isTargeting && currentAbility && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-500 animate-pulse">
            <div className="text-center">
              <h3 className="text-yellow-400 font-bold text-lg mb-2">
                Select Target for {currentAbility.name}
              </h3>
              <p className="text-white text-sm">
                Click on a {currentAbility.effect === 'heal' || currentAbility.effect === 'shield' ? 'friendly' : 'enemy'} card
              </p>
              <div className="mt-2 text-xs text-gray-400">
                {validTargets.length} valid target{validTargets.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wager Info */}
      {pvpData?.wagerAmount && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-purple-800 text-white px-4 py-2 rounded-lg font-bold">
            Wager: {pvpData.wagerAmount} SOL
          </div>
        </div>
      )}

      {/* Battle End Screen */}
      {battleState === 'ended' && winner && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
          <div className="bg-gradient-to-b from-purple-900 to-blue-900 p-8 rounded-lg text-white">
            <h2 className="text-4xl font-bold mb-4">
              {winner === pvpData.playerNumber ? '🎉 Victory!' : '💀 Defeat'}
            </h2>
            {pvpData?.wagerAmount && (
              <p className="text-xl mb-4">
                {winner === pvpData.playerNumber
                  ? `You won ${pvpData.wagerAmount * 2} SOL!`
                  : `You lost ${pvpData.wagerAmount} SOL`}
              </p>
            )}
            <button
              onClick={onBack}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PvPBattle3D;