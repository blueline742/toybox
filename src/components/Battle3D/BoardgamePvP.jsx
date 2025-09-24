import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useWalletSafety } from '../../contexts/WalletSafetyContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { ToyboxGame } from '../../game/boardgame/game';
import HearthstoneScene from './HearthstoneScene';
import TargetingOverlay from './TargetingOverlay';
import SpellNotification from '../SpellNotification';
import assetPreloader from '../../utils/AssetPreloader';

// Create the board component that renders the 3D scene
const ToyboxBoard = ({ G, ctx, moves, events, playerID, gameMetadata, selectedTeam, credentials, isConnected, lobbySocket, matchID, ...otherProps }) => {
  // Extract playerID from otherProps if not directly provided
  const actualPlayerID = playerID || otherProps.playerID || ctx?.currentPlayer || '0';

  // Log available moves on mount
  React.useEffect(() => {
//     console.log('🎮 Available moves:', moves ? Object.keys(moves) : 'No moves');
  }, [moves]);

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTimeRemaining, setLoadingTimeRemaining] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);
  // REMOVED: local team state - now using G.players directly
  const [activeEffects, setActiveEffects] = useState([]);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [spellNotification, setSpellNotification] = useState(null);
  const [frozenCharacters, setFrozenCharacters] = useState(new Map());
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map());
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

  // Debug Player 2 Canvas issue - REMOVED to improve performance
  // This useEffect was causing excessive re-renders

  // Use actualPlayerID instead of playerID
  const isOurTurn = ctx?.currentPlayer === actualPlayerID;
  const isPlayer0 = actualPlayerID === '0';
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Check game phase - wait only during setup
  const isInPlayingPhase = G?.phase === 'playing';
  const bothPlayersReady = G?.setupComplete === true || isInPlayingPhase;
  const isWaiting = !isInPlayingPhase; // Only wait if not in playing phase

  // Check if game was abandoned
  const gameAbandoned = G?.abandoned === true;
  const abandonedBy = G?.abandonedBy;

  // Check if we're officially in the match (server has registered us)
  // We need to ensure we're connected and authenticated
  const isInMatch = isConnected && ctx && G && G.players;
  const bothPlayersConnected = ctx?.playOrder?.length === 2;
  // Only allow moves if game is initialized, not game over, and we haven't set our team yet
  const canSelectTeam = isInMatch && bothPlayersConnected && !ctx?.gameover && G?.phase !== 'playing' && !G?.players?.[actualPlayerID]?.ready;

  // Detect WebGL issues on mobile
  useEffect(() => {
    if (assetsLoaded && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Give 3D scene 3 seconds to render, otherwise switch to fallback
      const fallbackTimer = setTimeout(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
//           console.warn('3D scene failed to render on mobile, using 2D fallback');
          setForceFallback(true);
        }
      }, 3000);

      return () => clearTimeout(fallbackTimer);
    }
  }, [assetsLoaded]);

  // Prevent page reload on errors
  useEffect(() => {
    const handleError = (event) => {
//       console.error('Global error caught:', event.error);
      event.preventDefault(); // Prevent page reload

      // Force 2D mode on mobile if there's an error
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setForceFallback(true);
        setSceneError(true);
      }
    };

    const handleUnhandledRejection = (event) => {
//       console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent page reload

      // Force 2D mode on mobile if there's an error
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setForceFallback(true);
        setSceneError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Preload critical PvP assets when component mounts
  useEffect(() => {
    // Check if assets are already loaded from initial load
    if (assetPreloader.assets.images.size > 0) {
      // Assets already loaded from app initialization
      setAssetsLoaded(true);
      return;
    }

    // Load only critical PvP assets if not already loaded
    const loadPvPAssets = async () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // On mobile, load fewer assets initially for faster startup
      const criticalAssets = isMobile ? [
        // Mobile: Only load most common cards first
        { type: 'image', name: 'nft_robot', src: '/assets/nft/newnft/robotnft.png' },
        { type: 'image', name: 'nft_wizard', src: '/assets/nft/newnft/wizardnft.png' },
        { type: 'image', name: 'nft_duckie', src: '/assets/nft/newnft/duckienft.png' },
        { type: 'image', name: 'nft_brickdude', src: '/assets/nft/newnft/brickdudenft.png' },
        { type: 'image', name: 'nft_cardback', src: '/assets/nft/newnft/cardback.png' }
      ] : [
        // Desktop: Load all cards
        { type: 'image', name: 'nft_robot', src: '/assets/nft/newnft/robotnft.png' },
        { type: 'image', name: 'nft_wizard', src: '/assets/nft/newnft/wizardnft.png' },
        { type: 'image', name: 'nft_archwizard', src: '/assets/nft/newnft/archwizardnft.png' },
        { type: 'image', name: 'nft_duckie', src: '/assets/nft/newnft/duckienft.png' },
        { type: 'image', name: 'nft_brickdude', src: '/assets/nft/newnft/brickdudenft.png' },
        { type: 'image', name: 'nft_windup', src: '/assets/nft/newnft/winduptoynft.png' },
        { type: 'image', name: 'nft_dino', src: '/assets/nft/newnft/dinonft.png' },
        { type: 'image', name: 'nft_voodoo', src: '/assets/nft/newnft/voodoonft.png' },
        { type: 'image', name: 'nft_cardback', src: '/assets/nft/newnft/cardback.png' }
      ];

      // Track progress
      assetPreloader.onProgress((progress) => {
        setLoadingProgress(progress);
      });

      assetPreloader.onLoadComplete(() => {
        setAssetsLoaded(true);
//         console.log('✅ PvP assets loaded and ready');
      });

      try {
        await assetPreloader.loadAssets(criticalAssets);
      } catch (error) {
//         console.error('⚠️ Error loading assets, proceeding anyway:', error);
        // Force proceed even if some assets fail
        setAssetsLoaded(true);
      }
    };

    loadPvPAssets();

    // Mobile timeout - proceed after 30 seconds on mobile, 20 seconds on desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const timeoutMs = isMobile ? 30000 : 20000;

    // Set initial time remaining
    setLoadingTimeRemaining(Math.ceil(timeoutMs / 1000));

    // Update countdown timer
    const countdownInterval = setInterval(() => {
      setLoadingTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (!assetsLoaded) {
//         console.warn(`⏰ Asset loading timeout after ${timeoutMs/1000}s, proceeding anyway`);
        setAssetsLoaded(true);
      }
    }, timeoutMs);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(countdownInterval);
    };
  }, [assetsLoaded]);

  // Helper function to wait for server authentication
  const waitForAuthentication = async (attemptCount = 0) => {
    const maxAttempts = 20;
    const delay = 500;

    if (attemptCount >= maxAttempts) {
//       console.error('❌ Failed to authenticate after', maxAttempts, 'attempts');
      return false;
    }

    if (!isConnected) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return waitForAuthentication(attemptCount + 1);
    }

    if (!ctx?.playOrder || ctx.playOrder.length !== 2) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return waitForAuthentication(attemptCount + 1);
    }

    return true;
  };

  // Auto-submit team when ready
  useEffect(() => {
    if (!canSelectTeam || !selectedTeam || selectedTeam.length === 0 || hasAutoSelected) {
      return;
    }

    const submitTeam = async () => {

      // Wait for authentication first
      const isAuthenticated = await waitForAuthentication();
      if (!isAuthenticated) {
//         console.error('❌ Failed to authenticate, cannot submit team');
        return;
      }

      // Add extra delay for Player 1 to ensure Player 0's state is synced
      if (actualPlayerID === '1') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Now we're authenticated, submit the team
      if (moves?.setPlayerTeam && !G?.players?.[actualPlayerID]?.ready) {

        // Include metadata to ensure correct player assignment
        const teamWithMetadata = {
          cards: selectedTeam,
          submittedBy: actualPlayerID, // Include who's submitting
          timestamp: Date.now()
        };

        try {
          moves.setPlayerTeam(teamWithMetadata);
          setHasAutoSelected(true);
        } catch (error) {
//           console.error('❌ Failed to submit team:', error);
          // Retry after a delay if it's a stateID mismatch
          if (error.toString().includes('stateID')) {
            setTimeout(() => {
              setHasAutoSelected(false); // Reset to allow retry
            }, 2000);
          }
        }
      } else {
      }
    };

    // Small delay to ensure everything is initialized
    const timer = setTimeout(submitTeam, 1000);
    return () => clearTimeout(timer);
  }, [canSelectTeam, selectedTeam, hasAutoSelected, moves, actualPlayerID, G, isConnected, bothPlayersConnected]);

  // CRITICAL FIX: Always use G.players for teams (synchronized state)
  const opponentID = actualPlayerID === '0' ? '1' : '0';

  // Unified position calculation function for consistency across all spell effects
  const getCardPositionUnified = (cardIndex, isPlayerTeam) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 2.5 : 2.2;
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;
    const x = startX + cardIndex * spacing;
    const z = isPlayerTeam ?
      (actualPlayerID === '0' ? 5.5 : -5.5) :
      (actualPlayerID === '0' ? -5.5 : 5.5);
    return [x, 0.5, z];
  };

  // Absolute position calculation that aligns with HearthstoneScene rendering
  // HearthstoneScene always renders playerTeam at z=5.5 (bottom) and aiTeam at z=-5.5 (top)
  // We need to map card positions based on how they appear visually to the current player
  const getCardPositionAbsolute = (cardIndex, cardOwner) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 2.5 : 2.2;
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;
    const x = startX + cardIndex * spacing;

    // Map positions based on visual appearance to the current player:
    // - Cards owned by actualPlayerID appear at z=5.5 (bottom, same as playerTeam)
    // - Cards owned by opponent appear at z=-5.5 (top, same as aiTeam)
    let z;
    if (String(cardOwner) === actualPlayerID) {
      z = 5.5;  // This player's cards appear at bottom (playerTeam position)
    } else {
      z = -5.5; // Opponent's cards appear at top (aiTeam position)
    }

    return [x, 0.5, z];
  };

  // Memoize team arrays to prevent recreating on every render
  const playerTeam = useMemo(() => {
    return (G?.players?.[actualPlayerID]?.cards || []).map((card, index) => ({
      ...card,
      instanceId: card.instanceId || `p${actualPlayerID}-${card.id}-${index}`,
      isAlive: true, // Cards are always alive initially, health is managed separately
      health: card.health !== undefined ? card.health : card.maxHealth // Initialize health if not set
    }));
  }, [G?.players?.[actualPlayerID]?.cards, actualPlayerID]);

  const aiTeam = useMemo(() => {
    return (G?.players?.[opponentID]?.cards || []).map((card, index) => ({
      ...card,
      instanceId: card.instanceId || `p${opponentID}-${card.id}-${index}`,
      isAlive: true, // Cards are always alive initially, health is managed separately
      health: card.health !== undefined ? card.health : card.maxHealth // Initialize health if not set
    }));
  }, [G?.players?.[opponentID]?.cards, opponentID]);

  // Track frozen and shielded characters
  useEffect(() => {
    const frozen = new Map();
    const shielded = new Map();

    // Check player cards
    playerTeam.forEach(card => {
      if (card.frozen && card.currentHealth > 0) {
//         console.log(`❄️ Player card ${card.name} is FROZEN:`, card.frozen, 'turns:', card.frozenTurns);
        frozen.set(card.instanceId, true);
      }
      if (card.shields > 0) {
        shielded.set(card.instanceId, { type: 'energy', amount: card.shields });
      }
    });

    // Check AI cards
    aiTeam.forEach(card => {
      if (card.frozen && card.currentHealth > 0) {
//         console.log(`❄️ AI card ${card.name} is FROZEN:`, card.frozen, 'turns:', card.frozenTurns);
        frozen.set(card.instanceId, true);
      }
      if (card.shields > 0) {
        shielded.set(card.instanceId, { type: 'energy', amount: card.shields });
      }
    });

//     console.log('🧊 Frozen characters map:', frozen.size, 'frozen cards');
    setFrozenCharacters(frozen);
    setShieldedCharacters(shielded);
  }, [playerTeam, aiTeam]);

  // Debug logging for card data
  useEffect(() => {
  }, [G, actualPlayerID, opponentID, playerTeam, aiTeam]);

  useEffect(() => {

    // Check if game is ready to start
    if (G?.phase === 'playing' && G?.setupComplete && playerTeam.length > 0 && aiTeam.length > 0) {
      setIsInitialized(true);
    }

    // If we're in playing phase but can't see opponent's cards, log a warning
    if (G?.phase === 'playing' && aiTeam.length === 0 && G?.players?.[opponentID]?.cards?.length > 0) {
//       console.warn('⚠️ State sync issue detected - opponent cards not visible!');
      // Force a re-render after a short delay
      setTimeout(() => {
        setIsInitialized(false);
      setTimeout(() => setIsInitialized(true), 100);
      }, 1000);
    }
  }, [G, playerTeam, aiTeam, actualPlayerID, opponentID]);

  // Show frozen notification when it's a frozen player's turn
  useEffect(() => {
    if (!ctx?.currentPlayer || !G?.phase || G.phase !== 'playing') return;
    if (!moves?.endFrozenTurn) return;

    const isOurTurn = ctx.currentPlayer === actualPlayerID;

    // Only process when it's our turn
    if (!isOurTurn) return;

    // Check if the server has marked this as a skip turn
    if (G.skipTurn) {
//       console.log(`❄️❄️❄️ Server says skip turn - Player ${actualPlayerID}`);

      // Check if all our cards are frozen (for validation)
      const aliveCards = playerTeam.filter(c => c.currentHealth > 0);
      const frozenCards = aliveCards.filter(c => c.frozen);
      const allFrozen = aliveCards.length > 0 && frozenCards.length === aliveCards.length;

      if (allFrozen) {
//         console.log('❄️ All cards frozen - showing skip notification');
//         console.log('❄️ Frozen cards:', frozenCards.map(c => ({
          name: c.name,
          frozenTurns: c.frozenTurns
        })));

        setSpellNotification({
          ability: {
            name: 'FROZEN - SKIPPING TURN',
            description: 'All cards are frozen in ice!'
          },
          caster: null,
          targets: [],
          isFrozenSkip: true
        });

        // After showing the notification, end the turn
        setTimeout(() => {
//           console.log('❄️ Calling endFrozenTurn to skip turn');
          moves.endFrozenTurn();
        }, 3000);
      }
    }
  }, [ctx?.currentPlayer, G?.phase, G?.skipTurn, playerTeam, actualPlayerID, moves]);

  // Simplified sync mechanism - just track G.activeEffects directly
  // No need for complex tracking refs that cause performance issues
  useEffect(() => {
    if (!G?.activeEffects || !G.activeEffects.length) {
      // Only clear if we currently have effects
      setActiveEffects(prev => prev.length > 0 ? [] : prev);
      return;
    }

    // Skip effect processing on mobile to reduce CPU load
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && forceFallback) {
      // Just clear effects on mobile 2D mode
      setActiveEffects([]);
      return;
    }

    // Simply sync all effects from game state
    const newEffects = [];
    G.activeEffects.forEach(effect => {

      // Calculate positions for the effect based on card IDs

        // Calculate positions for the effect based on card IDs
        let startPosition = [0, 0.5, 0];
        let endPosition = [0, 0.5, 0];

        // Find caster card position (include all cards even dead ones)
        if (effect.casterCardId) {
          // Find the caster card in the authoritative game state
          const casterCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.casterCardId);

          if (casterCard) {
            const casterTeam = G.players[casterCard.owner].cards;
            const casterIndex = casterTeam.findIndex(c => c.instanceId === casterCard.instanceId);
            // Use absolute position based on actual owner
            startPosition = getCardPositionAbsolute(casterIndex, casterCard.owner);
          }
        }

        // Find target card position for targeted spells
        if (effect.targetCardId && effect.type === 'pyroblast') {
          // Find the target card in the authoritative game state
          const targetCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.targetCardId);

          if (targetCard) {
            const targetTeam = G.players[targetCard.owner].cards;
            const targetIndex = targetTeam.findIndex(c => c.instanceId === targetCard.instanceId);
            // Use absolute position based on actual owner from game state
            endPosition = getCardPositionAbsolute(targetIndex, targetCard.owner);
          } else {
            // Fallback: try to determine position from targetCardId format (e.g., p0-2)
            if (effect.targetCardId && effect.targetCardId.includes('-')) {
              const parts = effect.targetCardId.split('-');
              const playerIndex = parts[0].substring(1);
              const cardPos = parseInt(parts[parts.length - 1]);
              if (!isNaN(cardPos)) {
                // Use absolute position with parsed owner ID
                endPosition = getCardPositionAbsolute(cardPos, playerIndex);
              }
            }
          }
        }

        // For Ice Nova, calculate enemy positions
        let targetPositions = [];
        if (effect.type === 'ice_nova') {
          // Use the casterCard we already found above to determine the caster's owner
          const casterCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.casterCardId);
          const isPlayerCasting = casterCard ? String(casterCard.owner) === actualPlayerID : false;
          const enemyOwner = casterCard ? (String(casterCard.owner) === '0' ? '1' : '0') : opponentID;
          const enemyTeam = G.players[enemyOwner].cards.filter(c => c.currentHealth > 0);

          targetPositions = enemyTeam.map((card, index) => {
            // Use absolute position based on enemy owner
            return getCardPositionAbsolute(index, enemyOwner);
          });
        }

        // For Chain Lightning, calculate all target positions
        let chainTargets = [];
        if (effect.type === 'chain_lightning') {
          // Use the casterCard to determine the caster's owner
          const casterCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.casterCardId);
          const isPlayerCasting = casterCard ? String(casterCard.owner) === actualPlayerID : false;
          const enemyOwner = casterCard ? (String(casterCard.owner) === '0' ? '1' : '0') : opponentID;
          const enemyTeam = G.players[enemyOwner].cards.filter(c => c.currentHealth > 0);

          chainTargets = enemyTeam.map((card, index) => {
            // Use absolute position based on enemy owner
            const position = getCardPositionAbsolute(index, enemyOwner);
            return {
              position: position,
              cardId: card.instanceId || card.id
            };
          });
        }

        // Add the synced effect
        const syncedEffect = {
          ...effect,
          startPosition: effect.type === 'pyroblast' ? startPosition : undefined,
          endPosition: effect.type === 'pyroblast' ? endPosition : undefined,
          casterPosition: (effect.type === 'ice_nova' || effect.type === 'chain_lightning' || effect.type === 'sword_slash' || effect.type === 'block_defence' || effect.type === 'whirlwind') ? startPosition : undefined,
          targetPositions: effect.type === 'ice_nova' ? targetPositions : undefined,
          targets: effect.type === 'chain_lightning' ? chainTargets :
                   (effect.type === 'sword_slash' || effect.type === 'block_defence' || effect.type === 'whirlwind') ?
                   (effect.type === 'sword_slash' ?
                     (() => {
                       // Calculate target position for sword slash using unified position
                       const targetCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.targetCardId);
                       if (targetCard) {
                         const targetTeam = G.players[targetCard.owner].cards;
                         const targetIndex = targetTeam.findIndex(c => c.instanceId === targetCard.instanceId);
                         // Use absolute position based on target's actual owner
                         const position = getCardPositionAbsolute(targetIndex, targetCard.owner);
                         return [{position: position, cardId: effect.targetCardId}];
                       }
                       return [{position: [0, 0.5, 0], cardId: effect.targetCardId}];
                     })() :
                     effect.type === 'block_defence' ?
                       (() => {
                         // Block defence affects the caster's team
                         const casterCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.casterCardId);
                         if (casterCard) {
                           const allyTeam = G.players[casterCard.owner].cards.filter(c => c.currentHealth > 0);
                           return allyTeam.map((card, index) => {
                             const position = getCardPositionAbsolute(index, casterCard.owner);
                             return {position: position, cardId: card.instanceId || card.id};
                           });
                         }
                         return [];
                       })() :
                       (() => {
                         // Whirlwind affects the enemy team
                         const casterCard = [...G.players['0'].cards, ...G.players['1'].cards].find(c => c.instanceId === effect.casterCardId);
                         if (casterCard) {
                           const enemyOwner = String(casterCard.owner) === '0' ? '1' : '0';
                           const enemyTeam = G.players[enemyOwner].cards.filter(c => c.currentHealth > 0);
                           return enemyTeam.map((card, index) => {
                             const position = getCardPositionAbsolute(index, enemyOwner);
                             return {position: position, cardId: card.instanceId || card.id};
                           });
                         }
                         return [];
                       })()
                   ) : undefined,
          active: true,
          duration: effect.type === 'chain_lightning' ? 2000 :
                   (effect.type === 'sword_slash' || effect.type === 'block_defence' || effect.type === 'whirlwind') ? 2500 : 8000,
          synced: true // Mark as synced from game state
        };

      newEffects.push(syncedEffect);
    });

    // Update all effects at once to prevent multiple re-renders
    setActiveEffects(newEffects);
  }, [G?.activeEffects, playerTeam, aiTeam, actualPlayerID, forceFallback]); // Include all dependencies

  // Backup polling mechanism to ensure effects are synced - DISABLED to reduce jitter
  // The main useEffect should handle sync, polling can cause duplicate processing
  /*
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (G?.activeEffects?.length > 0) {
        // Trigger the sync by updating a dummy state
        setActiveEffects(prev => {
          // Check for any unprocessed effects
          const unprocessed = G.activeEffects.filter(effect =>
            !prev.find(e => e.id === effect.id) &&
            !processedEffectsRef.current.has(effect.id)
          );

          if (unprocessed.length > 0) {
            // Process them through the normal flow by clearing processed refs
            unprocessed.forEach(effect => {
              processedEffectsRef.current.delete(effect.id);
            });
          }
          return prev;
        });
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(pollInterval);
  }, [G?.activeEffects]);
  */

  // Automatic turn start - select a random card and ability when it's our turn
  useEffect(() => {
    if (!isOurTurn || !bothPlayersReady || ctx?.gameover || hasStartedTurn) {
      return;
    }

    if (playerTeam.length === 0 || aiTeam.length === 0) {
      return;
    }

    // Check if all our cards are frozen
    const allFrozen = playerTeam.every(c => c.frozen || c.currentHealth <= 0);
    if (allFrozen) {
//       console.log('❄️ All player cards are frozen - marking turn as started to prevent card selection');
      // Mark turn as started to prevent re-running this logic
      setHasStartedTurn(true);
      // The frozen notification and turn ending is handled by the other useEffect
      return; // Don't select cards or abilities
    }

    // Get alive cards from our team
    const aliveCards = playerTeam.filter(c => (c.health > 0 || c.currentHealth > 0) && !c.frozen);
    if (aliveCards.length === 0) {
      return;
    }

    // Select next card in rotation
    const activeCard = aliveCards[currentCharacterIndex % aliveCards.length];
    if (!activeCard) {
      return;
    }

    setHasStartedTurn(true);

    // Delay to make it feel more natural
    setTimeout(() => {
      // Use G.currentTurnCard if available, as that's the authoritative source
      const actualCaster = G?.currentTurnCard?.card || activeCard;

      // Select an ability from the ACTUAL CASTER's abilities
      const abilities = actualCaster.abilities || [];
      if (abilities.length > 0) {
        let selectedAbility;

        // Special handling for Wizard Toy with weighted spell selection
        if (actualCaster.name === 'Wizard Toy') {
          const rand = Math.random();
          if (rand < 0.50) {
            // 50% chance for Ice Nova
            selectedAbility = abilities.find(a => a.id === 'ice_nova') || abilities[2];
          } else if (rand < 0.75) {
            // 25% chance for Pyroblast
            selectedAbility = abilities.find(a => a.id === 'pyroblast') || abilities[0];
          } else {
            // 25% chance for Lightning Zap (Chain Lightning)
            selectedAbility = abilities.find(a => a.id === 'lightning_zap') || abilities[1];
          }
        } else {
          // Use default random selection for other characters
          selectedAbility = abilities[Math.floor(Math.random() * abilities.length)];
        }

        setSelectedCard(actualCaster);
        setCurrentAbility(selectedAbility);

        // Show spell notification for the selected ability
        setSpellNotification({
          ability: selectedAbility,
          caster: actualCaster,
          targets: []
        });

        // Determine valid targets based on ability
        const targets = selectedAbility.targetType === 'enemy' || selectedAbility.targetType === 'single' || selectedAbility.targetType === 'all_enemies'
          ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
          : selectedAbility.targetType === 'friendly' || selectedAbility.targetType === 'ally' || selectedAbility.targetType === 'all_allies'
          ? playerTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
          : [...playerTeam, ...aiTeam].filter(c => (c.health || c.currentHealth || 100) > 0);

        if (targets.length > 0) {
          setValidTargets(targets.map(c => c.instanceId || c.id));
          setIsTargeting(true);
          setShowTargetingOverlay(true);
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
      return;
    }

    // Check if card is frozen
    if (card.frozen) {
//       console.log('❄️ Card is frozen - cannot use abilities!');
      return;
    }

    // Check if all our cards are frozen (shouldn't be able to act at all)
    const allFrozen = playerTeam.every(c => c.frozen || c.currentHealth <= 0);
    if (allFrozen) {
//       console.log('❄️ All cards are frozen - turn should be skipping!');
      return;
    }

//     console.log('🎮 handleAbilityClick - Card:', card.name, 'Abilities:', card.abilities);

    // Find the correct ability index based on what the user wants
    // For now, try to find Ice Nova if it's a wizard
    let abilityIndex = 0;
    if (card.name === 'Wizard Toy' && card.abilities) {
      const iceNovaIndex = card.abilities.findIndex(a =>
        a.name?.toLowerCase().includes('ice nova') || a.effect === 'freeze_all'
      );
      if (iceNovaIndex >= 0) {
        abilityIndex = iceNovaIndex;
//         console.log('❄️ Found Ice Nova at index:', iceNovaIndex);
      }
    }

//     console.log('🧙 Card abilities array:', card.abilities);
//     console.log('🔢 Ability index requested:', abilityIndex);
    const ability = card.abilities?.[abilityIndex];
//     console.log('📌 Selected ability:', JSON.stringify(ability, null, 2));
    if (!ability) {
//       console.error('❌ No ability at index', abilityIndex, 'in abilities:', card.abilities);
      return;
    }


    // Check if this is Pyroblast or another targeted spell
    const isPyroblast = ability.name?.toLowerCase() === 'pyroblast';
    const isIceNova = ability.name?.toLowerCase().includes('ice nova') || ability.effect === 'freeze_all';
    // Ice Nova is instant - it affects all enemies without needing a target
    const requiresTarget = !isIceNova && (ability.requiresTarget || ability.targetType === 'enemy' || ability.targetType === 'ally' || ability.targetType === 'all_allies' || ability.targetType === 'single' || isPyroblast);

    // Handle different ability types
    if (requiresTarget) {
      // Set up targeting mode
      setIsTargeting(true);
      setShowTargetingOverlay(true);
      setCurrentAbility(ability);
      setSelectedCard(card);

      // Determine valid targets based on ability
      // Ice Nova targets all enemies but still needs target selection
      const targets = isIceNova
        ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0) // Ice Nova always targets all enemies
        : ability.targetType === 'enemy' || ability.targetType === 'single'
        ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
        : ability.targetType === 'friendly' || ability.targetType === 'ally' || ability.targetType === 'all_allies'
        ? playerTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
        : [...playerTeam, ...aiTeam].filter(c => (c.health || c.currentHealth || 100) > 0);

      setValidTargets(targets.map(c => c.instanceId || c.id));
    } else {
      // Instant ability - no target needed (includes Ice Nova)
//       console.log('❄️ INSTANT CAST - Ice Nova or other instant ability');
      if (moves?.playCard) {
        // Use playCard since useAbility doesn't handle freeze
//         console.log('🎮 CALLING playCard for instant ability:', {
          cardId: card.instanceId || card.id,
          ability: ability,
          abilityIndex: abilityIndex,
          hasFreeze: ability?.freeze,
          effect: ability?.effect,
          isIceNova: isIceNova
        });
        moves.playCard(card.instanceId || card.id, null, abilityIndex);

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

        // Trigger frost overlay for Ice Nova
        if (isIceNova) {
//           console.log('❄️ Triggering frost overlay for Ice Nova');
          setFrostOverlayTriggerIds(prev => [...prev, `ice-nova-${Date.now()}`]);
        }

        // End turn after instant ability
      setTimeout(() => {
          if (moves?.endTurn) {
            moves.endTurn();
          }
        }, 2000); // Wait for animation
      }
    }
  };

  // Handle target selection
  const handleTargetSelect = (targetCard) => {

    if (!isTargeting || !currentAbility || !selectedCard) {
//       console.log('❌ Not targeting or no ability/card selected:', { isTargeting, currentAbility, selectedCard });
      return;
    }

    // Check if target is valid (use instanceId for comparison)
    const targetInstanceId = targetCard.instanceId || targetCard.id;

    if (!validTargets.includes(targetInstanceId)) {
//       console.log('❌ Invalid target:', targetInstanceId, 'Valid targets:', validTargets);
      return;
    }

//     console.log('🎯 Target selected:', {
      ability: currentAbility,
      caster: selectedCard?.name,
      target: targetCard?.name,
      isIceNova: currentAbility.name?.toLowerCase() === 'ice nova' ||
                currentAbility.name?.toLowerCase() === 'icenova' ||
                currentAbility.id === 'ice_nova' ||
                currentAbility.effect === 'freeze_all'
    });


    // Determine target team
    // Use instanceId for team detection to ensure accuracy\n    const targetTeam = playerTeam.some(c => c.instanceId === targetCard.instanceId) ? 'player' : 'enemy';

    // Get the actual caster from game state (used by all abilities)
    const actualCaster = G?.currentTurnCard?.card || selectedCard;

    // Check if this is a Pyroblast spell or any fire spell

    const isPyroblast = currentAbility.name?.toLowerCase() === 'pyroblast' ||
                       currentAbility.name?.toLowerCase().includes('pyro') ||
                       currentAbility.name?.toLowerCase().includes('fire');

    const isIceNova = currentAbility.name?.toLowerCase() === 'ice nova' ||
                      currentAbility.name?.toLowerCase() === 'icenova' ||
                      currentAbility.id === 'ice_nova' ||
                      currentAbility.effect === 'freeze_all';

    const isWhirlwind = currentAbility.name?.toLowerCase().includes('whirlwind') ||
                        currentAbility.id === 'whirlwind_slash';

    const isSwordSlash = currentAbility.name?.toLowerCase() === 'sword slash' ||
                         currentAbility.id === 'sword_slash';

    const isBlockDefence = currentAbility.name?.toLowerCase() === 'block defence' ||
                          currentAbility.id === 'block_defence';

    const isLightning = currentAbility.name?.toLowerCase() === 'lightning zap' ||
                       currentAbility.name?.toLowerCase().includes('chain') ||
                       currentAbility.name?.toLowerCase().includes('lightning');

    // Execute ability with target
    if (moves?.castSpell && isPyroblast) {

      // Find the correct ability index for Pyroblast
      const pyroblastIndex = actualCaster.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'pyroblast' || a.id === 'pyroblast'
      ) ?? 0;

      // Use the new castSpell move for Pyroblast with actual caster
      moves.castSpell(actualCaster.instanceId, targetCard.instanceId, pyroblastIndex);

      // Calculate precise 3D positions for the Pyroblast effect using game state
      const casterTeam = G.players[actualCaster.owner].cards;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === actualCaster.instanceId);
      const isPlayerCasting = String(actualCaster.owner) === actualPlayerID;

      const targetTeam = G.players[targetCard.owner].cards;
      const targetIndex = targetTeam.findIndex(c => c.instanceId === targetCard.instanceId);
      const isTargetPlayer = String(targetCard.owner) === actualPlayerID;


      // Use absolute position calculation for both caster and target
      const startPosition = getCardPositionAbsolute(casterIndex, actualCaster.owner);
      const endPosition = getCardPositionAbsolute(targetIndex, targetCard.owner);

      // Adjust Y position slightly for spell effect
      startPosition[1] += 0.5;
      endPosition[1] += 0.5;


      // Clear ALL targeting state immediately to prevent duplicate casts
      setShowTargetingOverlay(false);
      setIsTargeting(false);
      setSelectedCard(null);
      setCurrentAbility(null);
      setValidTargets([]);

      // Add spell notification
      setSpellNotification({
        ability: { name: 'Pyroblast', damage: 35, description: 'Massive fireball!' },
        caster: selectedCard,
        targets: [targetCard]
      });

    } else if (moves?.castSpell && isIceNova) {

      // Z positions (distance from center - matching HearthstoneScene)
      const playerZ = 5.5;  // Player cards are at z = 5.5
      const aiZ = -5.5;     // AI cards are at z = -5.5

      // Ice Nova is AOE - hits all enemies
      const casterTeam = G.players[actualCaster.owner].cards;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === actualCaster.instanceId);
      const isPlayerCasting = String(actualCaster.owner) === actualPlayerID;

      // Use absolute position calculation
      const casterPosition = getCardPositionAbsolute(casterIndex, actualCaster.owner);

      // Get all enemy positions
      const enemyOwner = String(actualCaster.owner) === '0' ? '1' : '0';
      const enemyTeam = G.players[enemyOwner].cards;
      const enemyPositions = enemyTeam.filter(c => c.isAlive !== false && c.currentHealth > 0).map((card, index) => {
        // Use absolute position based on enemy owner
        return getCardPositionAbsolute(index, enemyOwner);
      });

      // Add Ice Nova effect
      const iceNovaEffect = {
        id: Date.now(),
        type: 'ice_nova',
        casterPosition: casterPosition,
        targetPositions: enemyPositions,
        enemyCardIds: enemyTeam.filter(c => c.isAlive !== false && c.currentHealth > 0).map(c => c.instanceId),
        active: true,
        duration: 8000  // 8 seconds for the full effect
      };

      // Effects are now synced from G.activeEffects for both players
      // setActiveEffects(prev => [...prev, iceNovaEffect]);

      // Find the correct ability index for Ice Nova
      const iceNovaIndex = actualCaster.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'ice nova' || a.id === 'ice_nova'
      ) ?? 0;

      // Execute the spell on first enemy (AOE will hit all)
      if (targetCard && targetCard.health > 0) {
//         console.log('❄️ CALLING castSpell for Ice Nova:', {
          caster: actualCaster.instanceId,
          target: targetCard.instanceId,
          abilityIndex: iceNovaIndex,
          hasMove: !!moves?.castSpell
        });
        if (moves?.castSpell) {
          moves.castSpell(actualCaster.instanceId, targetCard.instanceId, iceNovaIndex);
        } else {
//           console.error('❌ moves.castSpell not available!');
        }
      }

      // Clear targeting state
      setShowTargetingOverlay(false);

      // Add spell notification
      setSpellNotification({
        ability: { name: 'Ice Nova', description: 'Freezing wave!' },
        caster: selectedCard,
        targets: enemyTeam.filter(e => e.health > 0)
      });

      // Clear remaining targeting state
      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.castSpell && isSwordSlash) {
      // Brick Dude - Sword Slash Effect
      const casterTeam = G.players[actualCaster.owner].cards;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === actualCaster.instanceId);
      const isPlayerCasting = String(actualCaster.owner) === actualPlayerID;

      // Use absolute position calculation
      const casterPosition = getCardPositionAbsolute(casterIndex, actualCaster.owner);

      // Get target position
      const targetTeam = G.players[targetCard.owner].cards;
      const targetIndex = targetTeam.findIndex(c => c.instanceId === targetCard.instanceId);
      const isTargetPlayer = String(targetCard.owner) === actualPlayerID;
      const targetPosition = getCardPositionAbsolute(targetIndex, targetCard.owner);

      const abilityIndex = actualCaster.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'sword slash' || a.id === 'sword_slash'
      ) ?? 0;

      if (targetCard && targetCard.health > 0) {
        moves.castSpell(actualCaster.instanceId, targetCard.instanceId, abilityIndex);
      }

      setShowTargetingOverlay(false);
      setSpellNotification({
        ability: { name: 'Sword Slash', description: 'Brick sword strike!' },
        caster: selectedCard,
        targets: [targetCard]
      });

      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.castSpell && isBlockDefence) {
      // Brick Dude - Block Defence Effect (shields all allies)
      const allyTeam = G.players[actualCaster.owner].cards.filter(c => c.isAlive !== false && c.currentHealth > 0);
      const casterTeam = G.players[actualCaster.owner].cards;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === actualCaster.instanceId);
      const isPlayerCasting = String(actualCaster.owner) === actualPlayerID;
      const casterPosition = getCardPositionAbsolute(casterIndex, actualCaster.owner);

      const abilityIndex = actualCaster.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'block defence' || a.id === 'block_defence'
      ) ?? 1;

      // No target needed for self/team buff - just cast it
      moves.castSpell(actualCaster.instanceId, actualCaster.instanceId, abilityIndex);

      setShowTargetingOverlay(false);
      setSpellNotification({
        ability: { name: 'Block Defence', description: 'Shields for all!' },
        caster: selectedCard,
        targets: allyTeam
      });

      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.castSpell && isWhirlwind) {
      // Brick Dude - Whirlwind Slash (Ultimate)
      const enemyOwner = String(actualCaster.owner) === '0' ? '1' : '0';
      const enemyTeam = G.players[enemyOwner].cards.filter(c => c.isAlive !== false && c.currentHealth > 0);
      const casterTeam = G.players[actualCaster.owner].cards;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === actualCaster.instanceId);
      const isPlayerCasting = String(actualCaster.owner) === actualPlayerID;
      const casterPosition = getCardPositionAbsolute(casterIndex, actualCaster.owner);

      const abilityIndex = actualCaster.abilities?.findIndex(a =>
        a.name?.toLowerCase().includes('whirlwind') || a.id === 'whirlwind_slash'
      ) ?? 2;

      // Execute on first enemy (AOE will hit all)
      if (enemyTeam.length > 0) {
        moves.castSpell(actualCaster.instanceId, enemyTeam[0].instanceId, abilityIndex);
      }

      setShowTargetingOverlay(false);
      setSpellNotification({
        ability: { name: 'WHIRLWIND SLASH', description: 'Spinning devastation!' },
        caster: selectedCard,
        targets: enemyTeam
      });

      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.castSpell && isLightning) {
      // Chain Lightning Effect

      // Find all enemy targets
      const enemyOwner = String(actualCaster.owner) === '0' ? '1' : '0';
      const enemyTeam = G.players[enemyOwner].cards.filter(c => c.isAlive !== false && c.currentHealth > 0);

      // Calculate caster position (Wizard Toy)
      const casterTeam = G.players[actualCaster.owner].cards;
      const casterIndex = casterTeam.findIndex(c => c.instanceId === actualCaster.instanceId);
      const isPlayerCasting = String(actualCaster.owner) === actualPlayerID;
      const casterPosition = getCardPositionAbsolute(casterIndex, actualCaster.owner);

      // Calculate all target positions for the chain effect
      const chainTargets = enemyTeam.map((card, index) => {
        // Use absolute position based on enemy owner
        const targetPos = getCardPositionAbsolute(index, enemyOwner);
        return {
          position: targetPos,
          cardId: card.instanceId
        };
      });

      // Add Chain Lightning effect to active effects
      const chainLightningEffect = {
        id: Date.now(),
        type: 'chain_lightning',
        casterPosition: casterPosition,
        targets: chainTargets,
        active: true,
        duration: 2000  // 2 seconds for the full chain
      };

      // This will sync to both players through G.activeEffects
      // The effect will be picked up by the useEffect that syncs G.activeEffects

      // Find the correct ability index for Lightning Zap
      const lightningIndex = actualCaster.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'lightning zap' || a.id === 'lightning_zap'
      ) ?? 1; // Default to index 1 for Wizard Toy

      // Execute the spell on the first target (will chain to others)
      if (targetCard && targetCard.health > 0) {
        moves.castSpell(actualCaster.instanceId, targetCard.instanceId, lightningIndex);
      }

      // Clear targeting state
      setShowTargetingOverlay(false);

      // Add spell notification
      setSpellNotification({
        ability: { name: 'Lightning Zap', description: 'Chain Lightning!' },
        caster: selectedCard,
        targets: enemyTeam
      });

      // Clear remaining targeting state
      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.castSpell) {
        // Use castSpell for spells like Ice Nova (it handles freeze properly)
        // Find the correct ability index for the current ability
        let abilityIndex = 0;
        if (selectedCard.abilities && currentAbility) {
          const index = selectedCard.abilities.findIndex(a =>
            a.name === currentAbility.name ||
            (a.effect === currentAbility.effect && a.damage === currentAbility.damage)
          );
          if (index >= 0) abilityIndex = index;
        }
//         console.log('🎯 Casting spell with ability index:', abilityIndex, 'ability:', currentAbility);
        moves.castSpell(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, abilityIndex);

      // Only trigger Pyroblast effect for actual Pyroblast spell
      // Disabled for now to prevent rendering glitches
      /*
      if (currentAbility.damage || currentAbility.effect === 'damage') {
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
        // Find the correct ability index for the current ability
        let abilityIndex = 0;
        if (selectedCard.abilities && currentAbility) {
          const index = selectedCard.abilities.findIndex(a =>
            a.name === currentAbility.name ||
            (a.effect === currentAbility.effect && a.damage === currentAbility.damage)
          );
          if (index >= 0) abilityIndex = index;
        }
//         console.log('🎯 Playing card with ability index:', abilityIndex, 'ability:', currentAbility);
//         console.log('🎮 CALLING playCard with target:', {
          cardId: selectedCard.instanceId || selectedCard.id,
          targetId: targetCard.instanceId || targetCard.id,
          ability: currentAbility,
          abilityIndex: abilityIndex,
          hasFreeze: currentAbility?.freeze,
          effect: currentAbility?.effect
        });
        moves.playCard(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, abilityIndex);

      // Clear targeting state with delay
      setTimeout(() => {
        setIsTargeting(false);
        setShowTargetingOverlay(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);
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

  // Clean up effects after their duration - simplified to reduce lag
  useEffect(() => {
    // Only clean up damage numbers, not spell effects (they're managed by G.activeEffects)
    const cleanup = setInterval(() => {
      const now = Date.now();
      setDamageNumbers(prev => prev.filter(d => now - d.id < d.duration));
    }, 2000); // Reduced frequency to minimize re-renders

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
      {/* Asset Loading Screen */}
      {!assetsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-b from-blue-900 to-purple-900">
          <div className="text-center px-4">
            <div className="text-6xl mb-4 animate-bounce">🎮</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Loading Battle Assets...</h2>
            <div className="w-64 max-w-[80vw] h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-white/70 text-sm mt-2">
              {loadingProgress < 100 ? 'Optimizing for smooth gameplay...' : 'Almost ready...'}
            </p>
            {loadingTimeRemaining > 0 && (
              <p className="text-white/50 text-xs mt-2">
                {loadingTimeRemaining > 10
                  ? `Auto-continue in ${loadingTimeRemaining}s if needed`
                  : `Starting soon... ${loadingTimeRemaining}s`}
              </p>
            )}
            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
              <p className="text-yellow-300/70 text-xs mt-3">
                📱 Mobile detected - extended loading time
              </p>
            )}
          </div>
        </div>
      )}

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

      {/* Main 3D Scene Container - Only render when assets are loaded */}
      {assetsLoaded && !sceneError && (
        <div className="absolute inset-0" style={{
          // Keep canvas always visible and interactive except when overlay is shown
          pointerEvents: showTargetingOverlay ? 'none' : 'auto',
          // Ensure Canvas is always visible unless game is over
          display: ctx?.gameover ? 'none' : 'block',
          zIndex: 1
        }}
        onError={(e) => {
//           console.error('Scene render error:', e);
          setSceneError(true);
        }}>
          <HearthstoneScene
          playerTeam={playerTeam}
          aiTeam={aiTeam}
          isPlayerTurn={isOurTurn}
          activeEffects={activeEffects}
          damageNumbers={damageNumbers}
          frozenCharacters={frozenCharacters}
          shieldedCharacters={shieldedCharacters}
          onEndTurn={() => moves?.endTurn && moves.endTurn()}
          onCardClick={(card) => {
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
                  moves.endTurn();
                }
              }, 2000); // Wait for animation
            }
          }}
          onAbilityClick={handleAbilityClick}
          onTargetSelect={handleTargetSelect}
          isTargeting={isTargeting}
          validTargets={validTargets}
          isWaiting={!isInPlayingPhase}
          currentPlayer={ctx?.currentPlayer}
          playerID={actualPlayerID}
          pyroblastActive={pyroblastActive}
          pyroblastCaster={pyroblastCaster}
          pyroblastTarget={pyroblastTarget}
        />
      </div>
      )}

      {/* Mobile 2D/3D Toggle Button */}
      {assetsLoaded && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !ctx?.gameover && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setForceFallback(!forceFallback)}
            className="bg-black/50 text-white px-3 py-1 rounded text-sm"
          >
            {forceFallback ? '3D View' : '2D View'}
          </button>
        </div>
      )}

      {/* Simple 2D Fallback for Scene Errors */}
      {assetsLoaded && (sceneError || forceFallback) && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-purple-900 overflow-y-auto" style={{ zIndex: 1 }}>
          <div className="p-4">
            <div className="text-white text-center mb-4">
              {sceneError ? '⚠️ 3D rendering failed - Using simple view' : '📱 Mobile 2D View'}
            </div>
            {/* Simple card display */}
            <div className="mb-8">
              <h3 className="text-white text-lg mb-2">Opponent's Cards</h3>
              <div className="flex flex-wrap gap-2">
                {aiTeam.map((card, i) => (
                  <div key={i} className={`bg-red-800 p-2 rounded text-white text-sm ${card.currentHealth <= 0 ? 'opacity-50' : ''}`}>
                    <div>{card.name}</div>
                    <div>❤️ {card.currentHealth}/{card.maxHealth}</div>
                    {card.shieldAmount > 0 && <div>🛡️ {card.shieldAmount}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-white text-lg mb-2">Your Cards</h3>
              <div className="flex flex-wrap gap-2">
                {playerTeam.map((card, i) => (
                  <div
                    key={i}
                    className={`bg-blue-800 p-2 rounded text-white text-sm cursor-pointer ${card.currentHealth <= 0 ? 'opacity-50' : ''}`}
                    onClick={() => !isTargeting && isOurTurn && handleCardClick(card)}
                  >
                    <div>{card.name}</div>
                    <div>❤️ {card.currentHealth}/{card.maxHealth}</div>
                    {card.shieldAmount > 0 && <div>🛡️ {card.shieldAmount}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Simple ability buttons */}
            {selectedCard && isOurTurn && (
              <div className="bg-black/50 p-4 rounded">
                <h4 className="text-white mb-2">Select Ability for {selectedCard.name}:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCard.abilities?.map((ability, i) => (
                    <button
                      key={i}
                      onClick={() => handleAbilitySelect(selectedCard, ability)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
                    >
                      {ability.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Targeting Overlay - Show for both players */}
      {showTargetingOverlay && selectedCard && currentAbility && (() => {
        const mappedTargets = validTargets.map(targetInstanceId => {
          const allCards = [...playerTeam, ...aiTeam];
          return allCards.find(c => (c.instanceId || c.id) === targetInstanceId);
        }).filter(Boolean);

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
  const [assetsPreloaded, setAssetsPreloaded] = useState(false);
  const [connectionCountdown, setConnectionCountdown] = useState(0);
  const [socketDisconnected, setSocketDisconnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Simple reload prevention for mobile
  useEffect(() => {
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;

    const preventReload = (e) => {
//       console.log('Preventing reload during PvP battle');
      e.preventDefault();
      e.returnValue = 'Battle in progress!';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', preventReload);

    return () => {
      window.removeEventListener('beforeunload', preventReload);
    };
  }, []);

  // Mark PvP as active and track wallet status
  const { setIsPvPActive, walletConnected } = useWalletSafety();
  const wallet = useWallet();
  const walletAdapterRef = useRef(null);

  // Pause wallet adapter during PvP to prevent race conditions
  useEffect(() => {
    setIsPvPActive(true);

    // Store original wallet adapter methods
    if (wallet.wallet?.adapter) {
      walletAdapterRef.current = {
        originalEmit: wallet.wallet.adapter.emit,
        originalConnect: wallet.wallet.adapter.connect,
        originalDisconnect: wallet.wallet.adapter.disconnect
      };

      // Override methods to prevent activity during PvP
      wallet.wallet.adapter.emit = function(...args) {
//         console.log('🔒 Wallet emit blocked during PvP:', args[0]);
        // Only allow critical events
        if (args[0] === 'error') {
          return walletAdapterRef.current?.originalEmit?.apply(this, args);
        }
        return null;
      };

      // Prevent connection changes during PvP
      wallet.wallet.adapter.connect = async function() {
//         console.log('🔒 Wallet connect blocked during PvP');
        return Promise.resolve();
      };

      wallet.wallet.adapter.disconnect = async function() {
//         console.log('🔒 Wallet disconnect blocked during PvP');
        return Promise.resolve();
      };
    }

    // Restore wallet adapter on cleanup
    return () => {
      setIsPvPActive(false);
      if (walletAdapterRef.current && wallet.wallet?.adapter) {
        wallet.wallet.adapter.emit = walletAdapterRef.current.originalEmit;
        wallet.wallet.adapter.connect = walletAdapterRef.current.originalConnect;
        wallet.wallet.adapter.disconnect = walletAdapterRef.current.originalDisconnect;
        walletAdapterRef.current = null;
      }
    };
  }, [setIsPvPActive, wallet.wallet?.adapter]);

  // Log wallet status for future staking features
  useEffect(() => {
    if (walletConnected) {
//       console.log('💰 Wallet connected during PvP - ready for future staking features!');
//       console.log('Wallet address:', wallet.publicKey?.toString());
    }
  }, [walletConnected, wallet.publicKey]);

  // Preload assets before creating client to avoid disconnect issues
  useEffect(() => {
    const checkAssetsAndLoad = async () => {
      // Check if assets are already loaded
      if (window.assetPreloader && window.assetPreloader.assets.images.size > 0) {
        // Even if assets are loaded, add a delay on mobile to ensure stable connection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
//           console.log('📱 Mobile detected - waiting for stable connection...');
          const waitTime = 5; // 5 seconds
          setConnectionCountdown(waitTime);

          const countdownInterval = setInterval(() => {
            setConnectionCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          setTimeout(() => {
            setAssetsPreloaded(true);
          }, waitTime * 1000);
        } else {
          setAssetsPreloaded(true);
        }
        return;
      }

      // If not, do a quick load of essential assets
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
//       console.log(`📦 Preparing for ${isMobile ? 'mobile' : 'desktop'} play...`);

      // Much longer delay for mobile to ensure PC doesn't think they disconnected
      const waitTime = isMobile ? 10 : 2; // seconds
      setConnectionCountdown(waitTime);

      const countdownInterval = setInterval(() => {
        setConnectionCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setAssetsPreloaded(true);
      }, waitTime * 1000);
    };

    checkAssetsAndLoad();
  }, []);

  // Track if we've already created a client to prevent duplicates
  const clientCreatedRef = useRef(false);

  // Create the client component using useMemo - ONLY after assets check
  const ClientComponent = useMemo(() => {
    // Don't create client until we've checked assets
    if (!assetsPreloaded) {
      return null;
    }

    // Prevent creating multiple clients for the same match
    if (clientCreatedRef.current) {
      return null;
    }

    clientCreatedRef.current = true;

    return Client({
      game: ToyboxGame,
      board: ToyboxBoard,
      multiplayer: SocketIO({
        server: window.location.hostname === 'localhost'
          ? 'http://localhost:4001'
          : 'https://toybox-boardgame.onrender.com',
        socketOpts: {
          transports: ['polling', 'websocket'], // Start with polling for mobile stability
          forceNew: false,
          reconnection: true,
          reconnectionAttempts: 10, // More attempts for mobile
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          randomizationFactor: 0.5, // Add jitter to prevent thundering herd
          timeout: 120000, // 2 minute timeout for mobile
          pingInterval: 25000, // Match server settings
          pingTimeout: 60000, // Match server settings
          upgrade: true,
          rememberUpgrade: true,
          // Custom reconnect handling
          autoConnect: true,
          query: {
            matchID: matchID,
            playerID: playerID
          }
        }
      }),
      playerID: String(playerID),
      credentials,
      matchID,
      debug: false
    });
  }, [matchID, playerID, credentials, assetsPreloaded]);

  // Handle connection state and socket monitoring
  useEffect(() => {
    setIsConnected(true);

    // Monitor socket connection if available
    if (window.io && assetsPreloaded) {
      // Access the socket instance (boardgame.io uses socket.io internally)
      const checkSocketStatus = () => {
        const socket = window.io.sockets?.[0] || window.io?.socket;
        if (socket) {
          socket.on('disconnect', (reason) => {
//             console.log('Socket disconnected:', reason);
            setSocketDisconnected(true);

            // Don't navigate away - try to reconnect
            if (reason === 'io server disconnect' || reason === 'transport close') {
              // Server disconnected us or transport failed
              socket.connect();
            }
          });

          socket.on('reconnect_attempt', (attemptNumber) => {
//             console.log(`Reconnection attempt ${attemptNumber}`);
            setReconnectAttempt(attemptNumber);
          });

          socket.on('reconnect', () => {
//             console.log('Successfully reconnected!');
            setSocketDisconnected(false);
            setReconnectAttempt(0);
          });

          socket.on('connect', () => {
//             console.log('Socket connected');
            setSocketDisconnected(false);
            setReconnectAttempt(0);
          });

          socket.on('connect_error', (error) => {
//             console.error('Connection error:', error.message);
            setSocketDisconnected(true);
          });
        }
      };

      // Check after a short delay to ensure socket is initialized
      setTimeout(checkSocketStatus, 1000);
    }

    // Handle WebGL context loss recovery
    const handleContextLost = (event) => {
      event.preventDefault();
//       console.warn('WebGL context lost - switching to 2D mode');
      setForceFallback(true);
      setSceneError(true);
    };

    const handleContextRestored = () => {
//       console.log('WebGL context restored');
      // Don't automatically switch back to 3D on mobile
      if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setForceFallback(false);
        setSceneError(false);
      }
    };

    window.addEventListener('webglcontextlost', handleContextLost, false);
    window.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
      window.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [playerID]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset client creation flag when component unmounts
      clientCreatedRef.current = false;

      // Clear any pending timeouts or intervals
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
    };
  }, []);

  if (!isConnected || !ClientComponent || clientCreatedRef.current === false) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
        <div className="text-center px-4">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <div className="mb-4 text-xl">
            {!assetsPreloaded ? 'Preparing battle arena...' : 'Connecting to game server...'}
          </div>
          {!assetsPreloaded && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
            <div className="text-yellow-300 text-sm mb-2">
              📱 Mobile detected - optimizing for your device
            </div>
          )}
          {connectionCountdown > 0 && (
            <div className="text-cyan-300 text-lg font-bold mt-3">
              Connecting in {connectionCountdown}...
            </div>
          )}
          <div className="text-sm text-gray-300">Match ID: {matchID}</div>
          <div className="text-sm text-gray-300">Player ID: {playerID}</div>
        </div>
      </div>
    );
  }

  // Render the Client component - pass playerID and lobbySocket as props to the board
  return (
    <div data-pvp-active="true">
      {/* Reconnection Overlay */}
      {socketDisconnected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-gray-800 rounded-lg p-6 text-white max-w-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Connection Lost</h3>
              <p className="text-gray-300 mb-2">
                {reconnectAttempt > 0
                  ? `Reconnecting... Attempt ${reconnectAttempt}/10`
                  : 'Attempting to reconnect...'}
              </p>
              <p className="text-sm text-gray-400">
                Don't close the app - the battle will resume
              </p>
              {reconnectAttempt >= 5 && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  Force Reload
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ClientComponent
        selectedTeam={selectedTeam}
        credentials={credentials}
        isConnected={isConnected}
        playerID={playerID}
        lobbySocket={lobbySocket}
        matchID={matchID}
        onBattleEnd={onBattleEnd}
      />
    </div>
  );
};

export default BoardgamePvP;