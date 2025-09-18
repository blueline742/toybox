import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { ToyboxGame } from '../../game/boardgame/game';
import HearthstoneScene from './HearthstoneScene';
import TargetingOverlay from './TargetingOverlay';
import SpellNotification from '../SpellNotification';

// Create the board component that renders the 3D scene
const ToyboxBoard = ({ G, ctx, moves, events, playerID, gameMetadata, selectedTeam, credentials, isConnected, lobbySocket, matchID, ...otherProps }) => {
  // Extract playerID from otherProps if not directly provided
  const actualPlayerID = playerID || otherProps.playerID || ctx?.currentPlayer || '0';

  console.log('ToyboxBoard - selectedTeam received:', selectedTeam);
  console.log('ToyboxBoard - moves available:', moves ? Object.keys(moves) : 'no moves');
  console.log('ToyboxBoard - playOrder:', ctx?.playOrder, 'numPlayers:', ctx?.numPlayers);
  console.log('ToyboxBoard - Game over?:', ctx?.gameover);
  console.log('🔴 ToyboxBoard - playerID from props:', playerID);
  console.log('🔴 ToyboxBoard - actualPlayerID:', actualPlayerID);
  console.log('🔴 ToyboxBoard - isConnected:', isConnected);
  console.log('🔴 ToyboxBoard - ctx:', ctx);
  console.log('🔴 ToyboxBoard - gameMetadata:', gameMetadata);
  console.log('🔴 ToyboxBoard - G.players:', G?.players);

  const [isInitialized, setIsInitialized] = useState(false);
  // REMOVED: local team state - now using G.players directly
  const [activeEffects, setActiveEffects] = useState([]);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [spellNotification, setSpellNotification] = useState(null);
  const [pyroblastActive, setPyroblastActive] = useState(false);
  const [pyroblastCaster, setPyroblastCaster] = useState(null);
  const [pyroblastTarget, setPyroblastTarget] = useState(null);

  // Targeting state
  const [isTargeting, setIsTargeting] = useState(false);
  const [showTargetingOverlay, setShowTargetingOverlay] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [hasStartedTurn, setHasStartedTurn] = useState(false);

  // Debug Player 2 Canvas issue
  useEffect(() => {
    if (actualPlayerID === '1') {
      console.log('🔵 Player 2 State Check:', {
        showTargetingOverlay,
        isTargeting,
        currentAbility,
        selectedCard,
        validTargets: validTargets.length,
        gameOver: ctx?.gameover,
        hasError: false
      });
    }
  }, [showTargetingOverlay, isTargeting, currentAbility, selectedCard, validTargets, ctx?.gameover, actualPlayerID]);

  // Use actualPlayerID instead of playerID
  const isOurTurn = ctx?.currentPlayer === actualPlayerID;
  const isPlayer0 = actualPlayerID === '0';
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Check game phase - wait only during setup
  const isInPlayingPhase = G?.phase === 'playing';
  const bothPlayersReady = G?.setupComplete === true || isInPlayingPhase;
  const isWaiting = !isInPlayingPhase; // Only wait if not in playing phase

  console.log('🔍 Game Phase Check:', {
    phase: G?.phase,
    setupComplete: G?.setupComplete,
    isInPlayingPhase,
    bothPlayersReady,
    isWaiting,
    isOurTurn,
    currentPlayer: ctx?.currentPlayer,
    playerID: actualPlayerID
  });

  // Check if game was abandoned
  const gameAbandoned = G?.abandoned === true;
  const abandonedBy = G?.abandonedBy;

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

      // Add extra delay for Player 1 to ensure Player 0's state is synced
      if (actualPlayerID === '1') {
        console.log('⏳ Player 1 waiting for state sync...');
        await new Promise(resolve => setTimeout(resolve, 2000));
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
          // Retry after a delay if it's a stateID mismatch
          if (error.toString().includes('stateID')) {
            console.log('🔄 Retrying team submission after stateID mismatch...');
            setTimeout(() => {
              setHasAutoSelected(false); // Reset to allow retry
            }, 2000);
          }
        }
      } else {
        console.log('⚠️ Cannot submit team - moves not available or player already ready');
      }
    };

    // Small delay to ensure everything is initialized
    const timer = setTimeout(submitTeam, 1000);
    return () => clearTimeout(timer);
  }, [canSelectTeam, selectedTeam, hasAutoSelected, moves, actualPlayerID, G, isConnected, bothPlayersConnected]);

  // CRITICAL FIX: Always use G.players for teams (synchronized state)
  const opponentID = actualPlayerID === '0' ? '1' : '0';

  // Ensure cards have instanceId for proper rendering
  const playerTeam = (G?.players?.[actualPlayerID]?.cards || []).map((card, index) => ({
    ...card,
    instanceId: card.instanceId || `p${actualPlayerID}-${card.id}-${index}`,
    isAlive: true, // Cards are always alive initially, health is managed separately
    health: card.health !== undefined ? card.health : card.maxHealth // Initialize health if not set
  }));

  const aiTeam = (G?.players?.[opponentID]?.cards || []).map((card, index) => ({
    ...card,
    instanceId: card.instanceId || `p${opponentID}-${card.id}-${index}`,
    isAlive: true, // Cards are always alive initially, health is managed separately
    health: card.health !== undefined ? card.health : card.maxHealth // Initialize health if not set
  }));

  // Debug logging for card data
  useEffect(() => {
    console.log('🎮 Card Data Debug:');
    console.log('  actualPlayerID:', actualPlayerID);
    console.log('  opponentID:', opponentID);
    console.log('  G.players:', G?.players);
    console.log('  playerTeam:', playerTeam);
    console.log('  aiTeam:', aiTeam);
    console.log('  Player 0 cards raw:', G?.players?.['0']?.cards);
    console.log('  Player 1 cards raw:', G?.players?.['1']?.cards);
    console.log('  playerTeam processed:', playerTeam.map(c => ({ name: c.name, instanceId: c.instanceId, health: c.health, isAlive: c.isAlive })));
    console.log('  aiTeam processed:', aiTeam.map(c => ({ name: c.name, instanceId: c.instanceId, health: c.health, isAlive: c.isAlive })));
  }, [G, actualPlayerID, opponentID, playerTeam, aiTeam]);

  useEffect(() => {
    console.log('🔄 BOARD STATE SYNC:', {
      phase: G?.phase,
      setupComplete: G?.setupComplete,
      playerID: actualPlayerID,
      opponentID: opponentID,
      playerTeam: playerTeam.map(c => c?.name),
      playerTeamLength: playerTeam.length,
      aiTeam: aiTeam.map(c => c?.name),
      aiTeamLength: aiTeam.length,
      player0Ready: G?.players?.['0']?.ready,
      player1Ready: G?.players?.['1']?.ready,
      player0Cards: G?.players?.['0']?.cards?.length || 0,
      player1Cards: G?.players?.['1']?.cards?.length || 0,
      rawG: G
    });

    // Check if game is ready to start
    if (G?.phase === 'playing' && G?.setupComplete && playerTeam.length > 0 && aiTeam.length > 0) {
      console.log('🎮 GAME STARTED - Both teams visible!');
      setIsInitialized(true);
    }

    // If we're in playing phase but can't see opponent's cards, log a warning
    if (G?.phase === 'playing' && aiTeam.length === 0 && G?.players?.[opponentID]?.cards?.length > 0) {
      console.warn('⚠️ State sync issue detected - opponent cards not visible!');
      console.log('Opponent state:', G?.players?.[opponentID]);
      // Force a re-render after a short delay
      setTimeout(() => {
        console.log('🔄 Attempting to force state refresh...');
        setIsInitialized(false);
      setTimeout(() => setIsInitialized(true), 100);
      }, 1000);
    }
  }, [G, playerTeam, aiTeam, actualPlayerID, opponentID]);

  // Automatic turn start - select a random card and ability when it's our turn
  useEffect(() => {
    console.log('🎮 Auto-turn check:', {
      isOurTurn,
      bothPlayersReady,
      gameover: ctx?.gameover,
      hasStartedTurn,
      playerTeamLength: playerTeam.length,
      aiTeamLength: aiTeam.length
    });

    if (!isOurTurn || !bothPlayersReady || ctx?.gameover || hasStartedTurn) {
      console.log('⏸️ Skipping auto-turn:', {
        reason: !isOurTurn ? 'not our turn' : !bothPlayersReady ? 'not ready' : ctx?.gameover ? 'game over' : 'already started'
      });
      return;
    }

    if (playerTeam.length === 0 || aiTeam.length === 0) {
      console.log('⏸️ Skipping auto-turn: teams not loaded');
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

        // Show spell notification for the selected ability
        setSpellNotification({
          ability: randomAbility,
          caster: activeCard,
          targets: []
        });

        // Determine valid targets based on ability
        const targets = randomAbility.targetType === 'enemy'
          ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
          : randomAbility.targetType === 'friendly'
          ? playerTeam.filter(c => (c.health || c.currentHealth || 100) > 0 && c.id !== activeCard.id)
          : [...playerTeam, ...aiTeam].filter(c => (c.health || c.currentHealth || 100) > 0);

        if (targets.length > 0) {
          setValidTargets(targets.map(c => c.instanceId || c.id));
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

    // Check if this is Pyroblast or another targeted spell
    const isPyroblast = ability.name?.toLowerCase() === 'pyroblast';
    const requiresTarget = ability.requiresTarget || ability.targetType === 'enemy' || ability.targetType === 'ally' || isPyroblast;

    // Handle different ability types
    if (requiresTarget) {
      console.log('This ability requires a target');
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

      setValidTargets(targets.map(c => c.instanceId || c.id));
      console.log('Valid targets:', targets.map(c => ({ name: c.name, instanceId: c.instanceId || c.id })));
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
    console.log('🎯 handleTargetSelect called with:', targetCard);
    console.log('Current state:', { isTargeting, currentAbility, selectedCard });
    console.log('Available moves:', moves ? Object.keys(moves) : 'no moves');

    if (!isTargeting || !currentAbility || !selectedCard) {
      console.log('Not in targeting mode');
      console.log('isTargeting:', isTargeting, 'currentAbility:', currentAbility, 'selectedCard:', selectedCard);
      return;
    }

    // Check if target is valid (use instanceId for comparison)
    const targetInstanceId = targetCard.instanceId || targetCard.id;
    if (!validTargets.includes(targetInstanceId)) {
      console.log('Invalid target');
      console.log('Valid targets:', validTargets);
      console.log('Target card instanceId:', targetInstanceId);
      return;
    }

    console.log('Target selected:', targetCard.name);

    // Determine target team
    const targetTeam = playerTeam.some(c => c.id === targetCard.id) ? 'player' : 'enemy';

    // Check if this is a Pyroblast spell or any fire spell
    console.log('🔥 Current ability:', currentAbility);
    console.log('🔥 Ability name:', currentAbility.name);
    console.log('🔥 Ability lowercase:', currentAbility.name?.toLowerCase());

    const isPyroblast = currentAbility.name?.toLowerCase() === 'pyroblast' ||
                       currentAbility.name?.toLowerCase().includes('pyro') ||
                       currentAbility.name?.toLowerCase().includes('fire');

    // Execute ability with target
    if (moves?.castSpell && isPyroblast) {
      console.log('🔥 Casting Pyroblast-like spell:', currentAbility.name);
      console.log('Caster:', selectedCard);
      console.log('Target:', targetCard);
      console.log('Target team:', targetTeam);

      // Use the new castSpell move for Pyroblast
      moves.castSpell(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, 0);

      // Calculate precise 3D positions for the Pyroblast effect
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const targetIndex = targetTeam === 'enemy'
        ? aiTeam.findIndex(c => c.id === targetCard.id)
        : playerTeam.findIndex(c => c.id === targetCard.id);

      console.log('Caster index:', casterIndex, 'Target index:', targetIndex);

      // Match the exact card positioning from HearthstoneScene
      const isMobile = window.innerWidth <= 768;
      const spacing = isMobile ? 2.5 : 2.2;
      const totalCards = 4;

      // Center the cards horizontally (matching getCardPosition function)
      const startX = -(totalCards - 1) * spacing / 2;

      // Calculate X positions for caster and target
      const casterX = startX + (casterIndex * spacing);
      const targetX = startX + (targetIndex * spacing);

      // Y position (height above table)
      const cardY = 0.4;

      // Z positions (distance from center - matching HearthstoneScene)
      const playerZ = 5.5;  // Player cards are at z = 5.5
      const aiZ = -5.5;     // AI cards are at z = -5.5

      const startPosition = [
        casterX,
        cardY + 0.5,  // Slightly above the card
        actualPlayerID === '0' ? playerZ : aiZ
      ];

      const endPosition = [
        targetX,
        cardY + 0.5,  // Slightly above the target card
        targetTeam === 'enemy'
          ? (actualPlayerID === '0' ? aiZ : playerZ)  // Enemy team opposite side
          : (actualPlayerID === '0' ? playerZ : aiZ)   // Same team same side
      ];

      console.log('Start position:', startPosition);
      console.log('End position:', endPosition);

      // Add Pyroblast to activeEffects for rendering
      const pyroblastEffect = {
        id: Date.now(),
        type: 'pyroblast',
        startPosition: startPosition,
        endPosition: endPosition,
        active: true,
        duration: 2500
      };

      console.log('🎆 Adding Pyroblast effect:', pyroblastEffect);
      console.log('🎆 Start:', startPosition, 'End:', endPosition);

      setActiveEffects(prev => {
          const newEffects = [...prev, pyroblastEffect];
        console.log('🎆 Updated activeEffects array:', newEffects);
        console.log('🎆 Total effects:', newEffects.length);
          return newEffects;
        });

      // Clear targeting state immediately to hide overlay
      setShowTargetingOverlay(false);

      // Trigger the enhanced Pyroblast effect with a small delay
      setTimeout(() => {
        console.log('🎆 Setting pyroblastActive to true');
        setPyroblastActive(true);
        setPyroblastCaster(selectedCard);
        setPyroblastTarget(targetCard);
        console.log('🎆 Pyroblast state updated:', {
          active: true,
          caster: selectedCard.name,
          target: targetCard.name
        });
      }, 50);

      // Clear after effect duration
      setTimeout(() => {
        setPyroblastActive(false);
        setPyroblastCaster(null);
        setPyroblastTarget(null);
      }, 2550);

      // Clear remaining targeting state
      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.useAbility) {
        console.log('🎯 Executing ability:', currentAbility.name);
        console.log('Source card:', selectedCard.id);
        console.log('Target card:', targetCard.id);

        moves.useAbility({
          sourceCardId: selectedCard.id,
          abilityIndex: 0,
          targetCardId: targetCard.id
        });

      // Only trigger Pyroblast effect for actual Pyroblast spell
      // Disabled for now to prevent rendering glitches
      /*
      if (currentAbility.damage || currentAbility.effect === 'damage') {
        console.log('🎆 Triggering visual effect for ability:', currentAbility.name);
        // Visual effects disabled temporarily to fix rendering issues
      }
      */

      // Clear targeting state with a small delay to prevent rendering issues
      setTimeout(() => {
        setIsTargeting(false);
        setShowTargetingOverlay(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);
    } else if (moves?.playCard) {
        // Fallback to playCard if useAbility doesn't exist
        console.log('🎯 Using playCard fallback for ability:', currentAbility.name);
        moves.playCard(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, 0);

      // Clear targeting state with delay
      setTimeout(() => {
        setIsTargeting(false);
        setShowTargetingOverlay(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);
    } else {
      console.error('❌ No move available to execute ability!');
      console.log('Available moves:', Object.keys(moves || {}));
    }

    // Show spell notification with proper props
    setSpellNotification({
      ability: currentAbility,
      caster: selectedCard,
      targets: [targetCard]
    });

    // Add damage number if it's a damage ability
    if (currentAbility.damage || (currentAbility.effect === 'damage' && currentAbility.value)) {
      // Calculate position based on target card's team and index
      const targetTeam = playerTeam.find(c => c.id === targetCard.id) ? 'player' : 'ai';
        const targetIndex = targetTeam === 'player'
        ? playerTeam.findIndex(c => c.id === targetCard.id)
        : aiTeam.findIndex(c => c.id === targetCard.id);

      // Simple position calculation (will be refined in HearthstoneScene)
      const position = [
        targetIndex * 2 - 3, // X position based on index
        targetTeam === 'player' ? -2 : 2, // Y position based on team
        0 // Z position
      ];

      setDamageNumbers(prev => [...prev, {
        id: Date.now(),
        value: currentAbility.damage || currentAbility.value,
        cardId: targetCard.id,
        position: position,
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

  const handleCancelTargeting = () => {
    setIsTargeting(false);
    setShowTargetingOverlay(false);
    setValidTargets([]);
    setCurrentAbility(null);
    setSelectedCard(null);
  }

  // Clean up effects after their duration
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setActiveEffects(prev => prev.filter(e => now - e.id < e.duration));
      setDamageNumbers(prev => prev.filter(d => now - d.id < d.duration));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  // Watch for Pyroblast spell cast in game state - temporarily disabled for debugging

  // Clear spell notification after delay
  useEffect(() => {
    if (spellNotification) {
      const timer = setTimeout(() => {
        setSpellNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [spellNotification]);

  // Render the main battle UI
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

      {/* Waiting for Players - Only show in setup phase */}
      {G?.phase !== 'playing' && !ctx?.gameover && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-black/80 p-8 rounded-lg text-white text-center">
            <h2 className="text-2xl font-bold mb-4 animate-pulse">
              ⏳ Waiting for Opponent...
            </h2>
            <p className="text-gray-300">
              {G?.players?.[actualPlayerID]?.ready ? 'Your team is ready!' : 'Setting up teams...'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Phase: {G?.phase || 'unknown'} | Setup: {G?.setupComplete ? 'Complete' : 'In Progress'} | P0: {G?.players?.['0']?.ready ? '✓' : '✗'} | P1: {G?.players?.['1']?.ready ? '✓' : '✗'}
            </p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {(ctx?.gameover || gameAbandoned) && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 text-center">
              {gameAbandoned ? (
                abandonedBy === actualPlayerID ? '🚪 You Left!' : '🏆 Opponent Left!'
              ) : ctx.gameover?.reason === 'opponent_abandoned' || ctx.gameover?.reason === 'opponent_left' ? (
                '🏆 Opponent Left!'
              ) : (
                ctx.gameover?.winner === actualPlayerID ? '🎉 Victory!' : '💀 Defeat!'
              )}
            </h2>
            <p className="text-center text-gray-300 mb-6">
              {gameAbandoned ? (
                abandonedBy === actualPlayerID
                  ? 'You left the battle.'
                  : 'Your opponent has left the battle. You win by default!'
              ) : ctx.gameover?.reason === 'opponent_abandoned' || ctx.gameover?.reason === 'opponent_left' ? (
                'Your opponent left the game. You win by default!'
              ) : ctx.gameover?.winner === actualPlayerID ? (
                'Congratulations! You\'ve won the battle!'
              ) : (
                'Better luck next time!'
              )}
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
          onClick={() => {
            console.log('🚪 User clicked Back to Menu');

            // Notify server that player is leaving
            if (lobbySocket && lobbySocket.connected) {
              lobbySocket.emit('player_left_battle', {
                battleId: matchID,
                playerID: actualPlayerID,
                playerNumber: actualPlayerID === '0' ? 1 : 2,
                matchID: matchID,
                reason: 'user_left'
              });
            }

            // Clean up match
            fetch(`http://localhost:4001/match/${matchID}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerID: actualPlayerID,
                reason: 'user_left_via_button'
              })
            }).catch(err => console.error('Failed to delete match:', err));

            // Give time for cleanup then navigate
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
        >
          ← Back to Menu
        </button>
      </div>

      {/* Main 3D Scene Container */}
      <div className="absolute inset-0" style={{
        // Keep canvas always visible and interactive except when overlay is shown
        pointerEvents: showTargetingOverlay ? 'none' : 'auto',
        // Ensure Canvas is always visible unless game is over
        display: ctx?.gameover ? 'none' : 'block',
        zIndex: 1
      }}>
        <HearthstoneScene
          playerTeam={playerTeam}
          aiTeam={aiTeam}
          isPlayerTurn={isOurTurn}
          onEndTurn={() => moves?.endTurn && moves.endTurn()}
          onCardClick={(card) => {
            console.log('Card clicked in HearthstoneScene:', card);
            if (isTargeting) {
              handleTargetSelect(card);
            }
          }}
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
          isWaiting={!isInPlayingPhase}
          currentPlayer={ctx?.currentPlayer}
          playerID={actualPlayerID}
          pyroblastActive={pyroblastActive}
          pyroblastCaster={pyroblastCaster}
          pyroblastTarget={pyroblastTarget}
        />
      </div>

      {/* Targeting Overlay - Show for both players */}
      {showTargetingOverlay && selectedCard && currentAbility && (() => {
        const mappedTargets = validTargets.map(targetInstanceId => {
          const allCards = [...playerTeam, ...aiTeam];
          return allCards.find(c => (c.instanceId || c.id) === targetInstanceId);
        }).filter(Boolean);

        console.log('🎯 TARGETING OVERLAY RENDER:', {
          showTargetingOverlay,
          selectedCard,
          currentAbility,
          validTargets,
          mappedTargets,
          actualPlayerID,
          handleTargetSelectExists: typeof handleTargetSelect
        });

        // Show the same overlay for both players
        return (
          <TargetingOverlay
            activeCard={selectedCard}
            targets={mappedTargets}
            onTargetSelect={handleTargetSelect}
            onCancel={handleCancelTargeting}
            selectedAbility={currentAbility}
          />
        );
      })()}

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
const BoardgamePvP = ({ matchID, playerID, credentials, selectedTeam, lobbySocket, onBattleEnd }) => {
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
          transports: ['websocket', 'polling'], // Prefer websocket for better sync
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          upgrade: true, // Allow upgrading from polling to websocket
          rememberUpgrade: true
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

  // Render the Client component - pass playerID and lobbySocket as props to the board
  return (
    <ClientComponent
      selectedTeam={selectedTeam}
      credentials={credentials}
      isConnected={isConnected}
      playerID={playerID}
      lobbySocket={lobbySocket}
      matchID={matchID}
      onBattleEnd={onBattleEnd}
    />
  );
};

export default BoardgamePvP;