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
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [hasStartedTurn, setHasStartedTurn] = useState(false);

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

  // Automatic turn start - select a random card and ability when it's our turn
  useEffect(() => {
    if (!isOurTurn || !bothPlayersReady || ctx?.gameover || hasStartedTurn) {
      return;
    }

    if (playerTeam.length === 0 || aiTeam.length === 0) {
      return;
    }

    // Get alive cards from our team
    const aliveCards = playerTeam.filter(c => c.health > 0 || c.currentHealth > 0);
    if (aliveCards.length === 0) {
      return;
    }

    // Select next card in rotation
    const activeCard = aliveCards[currentCharacterIndex % aliveCards.length];
    if (!activeCard) {
      return;
    }

    console.log('🎯 Auto-selecting card for turn:', activeCard.name);
    setHasStartedTurn(true);

    // Delay to make it feel more natural
    setTimeout(() => {
      // Select a random ability from the card
      const abilities = activeCard.abilities || [];
      if (abilities.length > 0) {
        const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];

        console.log('🎲 Selected ability:', randomAbility.name);
        setSelectedCard(activeCard);
        setCurrentAbility(randomAbility);

        // Determine valid targets based on ability
        const targets = randomAbility.targetType === 'enemy'
          ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
          : randomAbility.targetType === 'friendly'
          ? playerTeam.filter(c => (c.health || c.currentHealth || 100) > 0 && c.id !== activeCard.id)
          : [...playerTeam, ...aiTeam].filter(c => (c.health || c.currentHealth || 100) > 0);

        if (targets.length > 0) {
          setValidTargets(targets.map(c => c.id));
          setIsTargeting(true);
          setShowTargetingOverlay(true);
          console.log('📍 Showing targeting overlay with', targets.length, 'valid targets');
        }
      }
    }, 1000);
  }, [isOurTurn, bothPlayersReady, ctx?.gameover, hasStartedTurn, playerTeam, aiTeam, currentCharacterIndex]);

  // Reset turn state when turn changes
  useEffect(() => {
    if (!isOurTurn) {
      setHasStartedTurn(false);
      setCurrentCharacterIndex(prev => (prev + 1) % 4); // Move to next card for next turn
    }
  }, [isOurTurn]);

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

        // Show spell notification with proper props
        setSpellNotification({
          ability: ability,
          caster: card,
          targets: [] // No specific targets for instant abilities
        });

        // Add visual effect
        setActiveEffects(prev => [...prev, {
          id: Date.now(),
          type: ability.effect,
          cardId: card.id,
          duration: 1500
        }]);

        // End turn after instant ability
        setTimeout(() => {
          if (moves?.endTurn) {
            console.log('Ending turn after instant ability');
            moves.endTurn();
          }
        }, 2000); // Wait for animation
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

      // Show spell notification with proper props
      setSpellNotification({
        ability: currentAbility,
        caster: selectedCard,
        targets: [targetCard]
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

      // End turn after ability is used
      setTimeout(() => {
        if (moves?.endTurn) {
          console.log('Ending turn after ability use');
          moves.endTurn();
        }
      }, 2000); // Wait for animation to complete
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
    <div className="relative w-full h-full bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Turn Indicator */}
      {!ctx?.gameover && bothPlayersReady && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className={`px-6 py-3 rounded-lg font-bold text-lg shadow-xl ${
            isOurTurn
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300'
          }`}>
            {isOurTurn ? '⚔️ Your Turn!' : '⏳ Opponent\'s Turn'}
          </div>
        </div>
      )}

      {/* Waiting for Players */}
      {isWaiting && !ctx?.gameover && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-black/80 p-8 rounded-lg text-white text-center">
            <h2 className="text-2xl font-bold mb-4 animate-pulse">
              ⏳ Waiting for Opponent...
            </h2>
            <p className="text-gray-300">
              {G?.players?.[actualPlayerID]?.ready ? 'Your team is ready!' : 'Setting up teams...'}
            </p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {ctx?.gameover && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 text-center">
              {ctx.gameover.winner === actualPlayerID ? '🎉 Victory!' : '💀 Defeat!'}
            </h2>
            <p className="text-center text-gray-300 mb-6">
              {ctx.gameover.winner === actualPlayerID
                ? 'Congratulations! You\'ve won the battle!'
                : 'Better luck next time!'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}

      {/* Spell Notification */}
      {spellNotification && (
        <SpellNotification
          ability={spellNotification.ability}
          caster={spellNotification.caster}
          targets={spellNotification.targets}
          onComplete={() => setSpellNotification(null)}
        />
      )}

      {/* Targeting Instructions */}
      {isTargeting && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold animate-pulse shadow-xl">
            Click a target to cast {currentAbility?.name}!
          </div>
        </div>
      )}

      {/* End Turn Button */}
      {isOurTurn && bothPlayersReady && !ctx?.gameover && (
        <div className="absolute bottom-8 right-8 z-20">
          <button
            onClick={() => {
              if (moves?.endTurn) {
                moves.endTurn();
                // Clear any active targeting
                handleCancelTargeting();
              }
            }}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all shadow-xl"
          >
            End Turn ⏭️
          </button>
        </div>
      )}

      {/* Back to Menu Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
        >
          ← Back to Menu
        </button>
      </div>

      <div className={`absolute inset-0 ${showTargetingOverlay ? 'blur-md scale-105 transition-all duration-300' : 'transition-all duration-300'}`}>
        <HearthstoneScene
          playerTeam={playerTeam}
          aiTeam={aiTeam}
          isPlayerTurn={isOurTurn}
          onEndTurn={() => moves?.endTurn && moves.endTurn()}
          onCardAttack={(attacker, defender) => {
            if (moves?.attackCard) {
              moves.attackCard(attacker.instanceId || attacker.id, defender.instanceId || defender.id);

              // Show attack notification
              setSpellNotification({
                ability: {
                  name: 'Attack',
                  effect: 'damage',
                  damage: attacker.attack || 10,
                  description: 'Basic attack'
                },
                caster: attacker,
                targets: [defender]
              });

              // Add damage number animation
              setDamageNumbers(prev => [...prev, {
                id: Date.now(),
                value: attacker.attack || 10,
                cardId: defender.instanceId || defender.id,
                duration: 1500
              }]);

              // Add attack effect
              setActiveEffects(prev => [...prev, {
                id: Date.now(),
                type: 'attack',
                sourceId: attacker.instanceId || attacker.id,
                targetId: defender.instanceId || defender.id,
                duration: 1000
              }]);

              // End turn after attack
              setTimeout(() => {
                if (moves?.endTurn) {
                  console.log('Ending turn after attack');
                  moves.endTurn();
                }
              }, 2000); // Wait for animation
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
          activeCard={selectedCard}
          targets={validTargets.map(id => {
            const allCards = [...playerTeam, ...aiTeam];
            return allCards.find(c => c.id === id);
          }).filter(Boolean)}
          onTargetSelect={handleTargetSelect}
          onCancel={handleCancelTargeting}
          selectedAbility={currentAbility}
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