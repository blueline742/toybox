import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { ToyboxGame } from '../../game/boardgame/game';
import HearthstoneScene from './HearthstoneScene';
import TargetingOverlay from './TargetingOverlay';
import SpellNotification from '../SpellNotification';

// Create the board component that renders the 3D scene
const ToyboxBoard = ({ G, ctx, moves, events, playerID, gameMetadata, selectedTeam, credentials, isConnected, ...otherProps }) => {
  // Extract playerID from otherProps if not directly provided
  const actualPlayerID = playerID || otherProps.playerID || ctx?.currentPlayer || '0';

  console.log('ToyboxBoard - selectedTeam received:', selectedTeam);
  console.log('ToyboxBoard - moves available:', moves);
  console.log('ToyboxBoard - playOrder:', ctx?.playOrder, 'numPlayers:', ctx?.numPlayers);
  console.log('ToyboxBoard - Game over?:', ctx?.gameover);
  console.log('🔴 ToyboxBoard - playerID from props:', playerID);
  console.log('🔴 ToyboxBoard - actualPlayerID:', actualPlayerID);
  console.log('🔴 ToyboxBoard - isConnected:', isConnected);
  console.log('🔴 ToyboxBoard - ctx:', ctx);
  console.log('🔴 ToyboxBoard - gameMetadata:', gameMetadata);
  console.log('🔴 ToyboxBoard - G.players:', G?.players);

  const [isInitialized, setIsInitialized] = useState(false);
  const [playerTeam, setPlayerTeam] = useState([]);
  const [aiTeam, setAiTeam] = useState([]);
  const [activeEffects, setActiveEffects] = useState([]);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [spellNotification, setSpellNotification] = useState(null);

  // Targeting state
  const [isTargeting, setIsTargeting] = useState(false);
  const [showTargetingOverlay, setShowTargetingOverlay] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  // Use actualPlayerID instead of playerID
  const isOurTurn = ctx?.currentPlayer === actualPlayerID;
  const isPlayer0 = actualPlayerID === '0';
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Check if both players are ready
  const bothPlayersReady = G?.phase === 'playing' || (G?.players && Object.values(G.players).every(p => p.ready));
  const isWaiting = !bothPlayersReady;

  // Check if we're officially in the match (server has registered us)
  // We need to ensure we're connected and authenticated
  const isInMatch = isConnected && ctx && G && G.players;
  const bothPlayersConnected = ctx?.playOrder?.length === 2;
  // Only allow moves if game is initialized, not game over, and we haven't set our team yet
  const canSelectTeam = isInMatch && bothPlayersConnected && !ctx?.gameover && G?.phase !== 'playing' && !G?.players?.[actualPlayerID]?.ready;

  // Helper function to wait for server authentication
  const waitForAuthentication = async (attemptCount = 0) => {
    const maxAttempts = 20;
    const delay = 500;

    if (attemptCount >= maxAttempts) {
      console.error('❌ Failed to authenticate after', maxAttempts, 'attempts');
      return false;
    }

    if (!isConnected) {
      console.log(`⏳ Waiting for connection... (attempt ${attemptCount + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return waitForAuthentication(attemptCount + 1);
    }

    if (!ctx?.playOrder || ctx.playOrder.length !== 2) {
      console.log(`⏳ Waiting for both players... (attempt ${attemptCount + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return waitForAuthentication(attemptCount + 1);
    }

    console.log('✅ Authentication complete! PlayerID:', actualPlayerID, 'Connected:', isConnected);
    return true;
  };

  // Auto-submit team when ready
  useEffect(() => {
    if (!canSelectTeam || !selectedTeam || selectedTeam.length === 0 || hasAutoSelected) {
      return;
    }

    const submitTeam = async () => {
      console.log('🎯 Auto-submitting team for player', actualPlayerID);
      console.log('  Team:', selectedTeam.map(t => t.name));
      console.log('  CanSelectTeam:', canSelectTeam);
      console.log('  IsConnected:', isConnected);
      console.log('  BothPlayersConnected:', bothPlayersConnected);
      console.log('  PlayerReady:', G?.players?.[actualPlayerID]?.ready);

      // Wait for authentication first
      const isAuthenticated = await waitForAuthentication();
      if (!isAuthenticated) {
        console.error('❌ Failed to authenticate, cannot submit team');
        return;
      }

      // Now we're authenticated, submit the team
      if (moves?.setPlayerTeam && !G?.players?.[actualPlayerID]?.ready) {
        console.log('📤 Submitting team with metadata for player', actualPlayerID);

        // Include metadata to ensure correct player assignment
        const teamWithMetadata = {
          cards: selectedTeam,
          submittedBy: actualPlayerID, // Include who's submitting
          timestamp: Date.now()
        };

        try {
          moves.setPlayerTeam(teamWithMetadata);
          setHasAutoSelected(true);
          console.log('✅ Team submitted successfully for player', actualPlayerID);

          // Log the current state after submission
          setTimeout(() => {
            console.log('📊 Post-submission state check:', {
              player0Ready: G?.players?.['0']?.ready,
              player1Ready: G?.players?.['1']?.ready,
              player0Cards: G?.players?.['0']?.cards?.length,
              player1Cards: G?.players?.['1']?.cards?.length,
              phase: G?.phase
            });
          }, 1000);
        } catch (error) {
          console.error('❌ Failed to submit team:', error);
        }
      } else {
        console.log('⚠️ Cannot submit team - moves not available or player already ready');
      }
    };

    // Small delay to ensure everything is initialized
    const timer = setTimeout(submitTeam, 1000);
    return () => clearTimeout(timer);
  }, [canSelectTeam, selectedTeam, hasAutoSelected, moves, actualPlayerID, G, isConnected, bothPlayersConnected]);

  // Update teams based on game state
  useEffect(() => {
    if (!G?.players) {
      console.log('No players in game state yet');
      return;
    }

    console.log('🔄 BOARD STATE RECEIVED:', {
      phase: G.phase,
      playerID: actualPlayerID,
      player0Ready: G.players['0']?.ready,
      player1Ready: G.players['1']?.ready,
      player0Cards: G.players['0']?.cards?.map(c => c.name),
      player1Cards: G.players['1']?.cards?.map(c => c.name)
    });

    // Determine which team is ours and which is opponent's
    const ourTeam = G.players[actualPlayerID]?.cards || [];
    const opponentID = actualPlayerID === '0' ? '1' : '0';
    const opponentTeam = G.players[opponentID]?.cards || [];

    console.log(`Player ${actualPlayerID} team:`, ourTeam.map(c => c.name));
    console.log(`Opponent ${opponentID} team:`, opponentTeam.map(c => c.name));

    // Update local state
    if (ourTeam.length > 0 || opponentTeam.length > 0) {
      setPlayerTeam(ourTeam);
      setAiTeam(opponentTeam);
      console.log('✅ Teams updated - Player:', ourTeam.length, 'cards, AI/Opponent:', opponentTeam.length, 'cards');

      // Check if both teams are ready
      if (ourTeam.length > 0 && opponentTeam.length > 0) {
        console.log('🎮 Both teams ready! Starting battle...');
        setIsInitialized(true);
      }
    }
  }, [G, actualPlayerID]);

  // Handle ability activation
  const handleAbilityClick = (card) => {
    if (!isOurTurn) {
      console.log('Not our turn!');
      return;
    }

    const ability = card.abilities?.[0];
    if (!ability) {
      console.log('No ability on this card');
      return;
    }

    console.log('Activating ability:', ability.name, 'from card:', card.name);

    // Handle different ability types
    if (ability.requiresTarget) {
      // Set up targeting mode
      setIsTargeting(true);
      setShowTargetingOverlay(true);
      setCurrentAbility(ability);
      setSelectedCard(card);

      // Determine valid targets based on ability
      const targets = ability.targetType === 'enemy'
        ? aiTeam.filter(c => c.health > 0)
        : ability.targetType === 'friendly'
        ? playerTeam.filter(c => c.health > 0 && c.id !== card.id)
        : [...playerTeam, ...aiTeam].filter(c => c.health > 0);

      setValidTargets(targets.map(c => c.id));
      console.log('Valid targets:', targets.map(c => c.name));
    } else {
      // Instant ability - no target needed
      if (moves?.useAbility) {
        moves.useAbility({
          sourceCardId: card.id,
          abilityIndex: 0,
          targetCardId: null
        });

        // Show spell notification
        setSpellNotification({
          name: ability.name,
          description: ability.description
        });

        // Add visual effect
        setActiveEffects(prev => [...prev, {
          id: Date.now(),
          type: ability.effect,
          cardId: card.id,
          duration: 1500
        }]);
      }
    }
  };

  // Handle target selection
  const handleTargetSelect = (targetCard) => {
    if (!isTargeting || !currentAbility || !selectedCard) {
      console.log('Not in targeting mode');
      return;
    }

    if (!validTargets.includes(targetCard.id)) {
      console.log('Invalid target');
      return;
    }

    console.log('Target selected:', targetCard.name);

    // Execute ability with target
    if (moves?.useAbility) {
      moves.useAbility({
        sourceCardId: selectedCard.id,
        abilityIndex: 0,
        targetCardId: targetCard.id
      });

      // Show spell notification
      setSpellNotification({
        name: currentAbility.name,
        description: `${currentAbility.description} → ${targetCard.name}`
      });

      // Add damage number if it's a damage ability
      if (currentAbility.effect === 'damage' && currentAbility.value) {
        setDamageNumbers(prev => [...prev, {
          id: Date.now(),
          value: currentAbility.value,
          cardId: targetCard.id,
          duration: 1500
        }]);
      }
    }

    // Clear targeting state
    handleCancelTargeting();
  };

  const handleCancelTargeting = () => {
    setIsTargeting(false);
    setShowTargetingOverlay(false);
    setValidTargets([]);
    setCurrentAbility(null);
    setSelectedCard(null);
  };

  // Clean up effects after their duration
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setActiveEffects(prev => prev.filter(e => now - e.id < e.duration));
      setDamageNumbers(prev => prev.filter(d => now - d.id < d.duration));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  // Clear spell notification after delay
  useEffect(() => {
    if (spellNotification) {
      const timer = setTimeout(() => {
        setSpellNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [spellNotification]);

  return (
    <div className="relative w-full h-full">
      {spellNotification && (
        <SpellNotification
          name={spellNotification.name}
          description={spellNotification.description}
        />
      )}

      <div className="absolute inset-0">
        <HearthstoneScene
          playerTeam={playerTeam}
          aiTeam={aiTeam}
          isPlayerTurn={isOurTurn}
          onEndTurn={() => moves?.endTurn && moves.endTurn()}
          onCardAttack={(attacker, defender) => {
            if (moves?.attackCard) {
              moves.attackCard(attacker.instanceId || attacker.id, defender.instanceId || defender.id);
            }
          }}
          onAbilityClick={handleAbilityClick}
          onTargetSelect={handleTargetSelect}
          isTargeting={isTargeting}
          validTargets={validTargets}
          activeEffects={activeEffects}
          damageNumbers={damageNumbers}
          isWaiting={isWaiting}
          currentPlayer={ctx?.currentPlayer}
          playerID={actualPlayerID}
        />
      </div>

      {showTargetingOverlay && (
        <TargetingOverlay
          onCancel={handleCancelTargeting}
          abilityName={currentAbility?.name}
        />
      )}

      {/* Debug info */}
      <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 p-2 rounded">
        <div>Phase: {G?.phase || 'unknown'}</div>
        <div>Player ID: {actualPlayerID} (prop: {playerID})</div>
        <div>Turn: {isOurTurn ? 'Your Turn' : "Opponent's Turn"}</div>
        <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
        <div>Ready: P0={G?.players?.['0']?.ready ? '✓' : '✗'} P1={G?.players?.['1']?.ready ? '✓' : '✗'}</div>
        <div>Teams: P0={G?.players?.['0']?.cards?.length || 0} cards, P1={G?.players?.['1']?.cards?.length || 0} cards</div>
      </div>
    </div>
  );
};

// Main component that creates and manages the client
const BoardgamePvP = ({ matchID, playerID, credentials, selectedTeam }) => {
  const [isConnected, setIsConnected] = useState(false);

  console.log('🎮 BoardgamePvP initialized:', {
    matchID,
    playerID,
    credentials: credentials ? 'provided' : 'none',
    selectedTeam: selectedTeam?.map(t => t.name)
  });

  // Create the client component using useMemo
  const ClientComponent = useMemo(() => {
    console.log('📱 Creating boardgame.io client for player', playerID);

    return Client({
      game: ToyboxGame,
      board: ToyboxBoard,
      multiplayer: SocketIO({
        server: 'http://localhost:4000',
        socketOpts: {
          transports: ['polling'],
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        }
      }),
      playerID: String(playerID),
      credentials,
      matchID,
      debug: false
    });
  }, [matchID, playerID, credentials]);

  // Handle connection state
  useEffect(() => {
    console.log('✅ Client component created for player', playerID);
    setIsConnected(true);

    // Handle WebGL context loss recovery
    const handleContextLost = (event) => {
      console.log('⚠️ WebGL Context Lost, attempting recovery');
      event.preventDefault();
      // Force a re-render after a short delay
      setTimeout(() => {
        setIsConnected(false);
        setTimeout(() => setIsConnected(true), 100);
      }, 1000);
    };

    const handleContextRestored = () => {
      console.log('✅ WebGL Context Restored');
      setIsConnected(true);
    };

    window.addEventListener('webglcontextlost', handleContextLost, false);
    window.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
      window.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [playerID]);

  // Force sync on connection
  useEffect(() => {
    if (isConnected) {
      console.log('🔄 Connection established for player', playerID);
    }
  }, [isConnected, playerID]);

  if (!isConnected || !ClientComponent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4 text-xl">Connecting to game server... (Using polling transport)</div>
          <div className="text-sm text-gray-400">Match ID: {matchID}</div>
          <div className="text-sm text-gray-400">Player ID: {playerID}</div>
        </div>
      </div>
    );
  }

  // Render the Client component - pass playerID as a prop to the board
  return (
    <ClientComponent
      selectedTeam={selectedTeam}
      credentials={credentials}
      isConnected={isConnected}
      playerID={playerID}
    />
  );
};

export default BoardgamePvP;