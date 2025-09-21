import React, { useEffect, useState, useMemo, useRef } from 'react';
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

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTimeRemaining, setLoadingTimeRemaining] = useState(0);
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
        console.log('✅ PvP assets loaded and ready');
      });

      try {
        await assetPreloader.loadAssets(criticalAssets);
      } catch (error) {
        console.error('⚠️ Error loading assets, proceeding anyway:', error);
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
        console.warn(`⏰ Asset loading timeout after ${timeoutMs/1000}s, proceeding anyway`);
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
      console.error('❌ Failed to authenticate after', maxAttempts, 'attempts');
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
        console.error('❌ Failed to authenticate, cannot submit team');
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
          console.error('❌ Failed to submit team:', error);
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
  }, [G, actualPlayerID, opponentID, playerTeam, aiTeam]);

  useEffect(() => {

    // Check if game is ready to start
    if (G?.phase === 'playing' && G?.setupComplete && playerTeam.length > 0 && aiTeam.length > 0) {
      setIsInitialized(true);
    }

    // If we're in playing phase but can't see opponent's cards, log a warning
    if (G?.phase === 'playing' && aiTeam.length === 0 && G?.players?.[opponentID]?.cards?.length > 0) {
      console.warn('⚠️ State sync issue detected - opponent cards not visible!');
      // Force a re-render after a short delay
      setTimeout(() => {
        setIsInitialized(false);
      setTimeout(() => setIsInitialized(true), 100);
      }, 1000);
    }
  }, [G, playerTeam, aiTeam, actualPlayerID, opponentID]);

  // Simplified sync mechanism - just track G.activeEffects directly
  // No need for complex tracking refs that cause performance issues
  useEffect(() => {
    if (!G?.activeEffects || !G.activeEffects.length) {
      // Only clear if we currently have effects
      setActiveEffects(prev => prev.length > 0 ? [] : prev);
      return;
    }

    // Simply sync all effects from game state
    const newEffects = [];
    G.activeEffects.forEach(effect => {

      // Calculate positions for the effect based on card IDs

        // Calculate positions for the effect based on card IDs
        let startPosition = [0, 0.5, 0];
        let endPosition = [0, 0.5, 0];

        // Find caster card position
        if (effect.casterCardId) {
          const casterInPlayer = playerTeam.findIndex(c => c.instanceId === effect.casterCardId);
          const casterInAI = aiTeam.findIndex(c => c.instanceId === effect.casterCardId);

          if (casterInPlayer !== -1) {
            const x = (casterInPlayer - 1.5) * 2;
            const z = actualPlayerID === '0' ? 5.5 : -5.5;
            startPosition = [x, 0.5, z];
          } else if (casterInAI !== -1) {
            const x = (casterInAI - 1.5) * 2;
            const z = actualPlayerID === '0' ? -5.5 : 5.5;
            startPosition = [x, 0.5, z];
          }
        }

        // Find target card position for targeted spells
        if (effect.targetCardId && effect.type === 'pyroblast') {
          const targetInPlayer = playerTeam.findIndex(c => c.instanceId === effect.targetCardId);
          const targetInAI = aiTeam.findIndex(c => c.instanceId === effect.targetCardId);

          if (targetInPlayer !== -1) {
            const x = (targetInPlayer - 1.5) * 2;
            const z = actualPlayerID === '0' ? 5.5 : -5.5;
            endPosition = [x, 0.5, z];
          } else if (targetInAI !== -1) {
            const x = (targetInAI - 1.5) * 2;
            const z = actualPlayerID === '0' ? -5.5 : 5.5;
            endPosition = [x, 0.5, z];
          }
        }

        // For Ice Nova, calculate enemy positions
        let targetPositions = [];
        if (effect.type === 'ice_nova') {
          const casterInPlayer = playerTeam.findIndex(c => c.instanceId === effect.casterCardId);
          const isPlayerCasting = casterInPlayer !== -1;
          const enemyTeam = isPlayerCasting ? aiTeam : playerTeam;

          targetPositions = enemyTeam.filter(c => c.health > 0).map((card, index) => {
            const x = (index - 1.5) * 2;
            const z = isPlayerCasting
              ? (actualPlayerID === '0' ? -5.5 : 5.5)
              : (actualPlayerID === '0' ? 5.5 : -5.5);
            return [x, 0.5, z];
          });
        }

        // For Chain Lightning, calculate all target positions
        let chainTargets = [];
        if (effect.type === 'chain_lightning') {
          const casterInPlayer = playerTeam.findIndex(c => c.instanceId === effect.casterCardId);
          const isPlayerCasting = casterInPlayer !== -1;
          const enemyTeam = isPlayerCasting ? aiTeam : playerTeam;

          chainTargets = enemyTeam.filter(c => c.health > 0).map((card, index) => {
            const x = (index - 1.5) * 2;
            const z = isPlayerCasting
              ? (actualPlayerID === '0' ? -5.5 : 5.5)
              : (actualPlayerID === '0' ? 5.5 : -5.5);
            return {
              position: [x, 0.5, z],
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
                       // Calculate target position for sword slash
                       const targetCard = [...playerTeam, ...aiTeam].find(c => c.instanceId === effect.targetCardId);
                       if (targetCard) {
                         const targetInPlayer = playerTeam.findIndex(c => c.instanceId === targetCard.instanceId) !== -1;
                         const targetIndex = targetInPlayer ?
                           playerTeam.findIndex(c => c.instanceId === targetCard.instanceId) :
                           aiTeam.findIndex(c => c.instanceId === targetCard.instanceId);
                         const x = (targetIndex - 1.5) * 2;
                         const z = targetInPlayer
                           ? (actualPlayerID === '0' ? 5.5 : -5.5)
                           : (actualPlayerID === '0' ? -5.5 : 5.5);
                         return [{position: [x, 0.5, z], cardId: effect.targetCardId}];
                       }
                       return [{position: [0, 0.5, 0], cardId: effect.targetCardId}];
                     })() :
                     effect.type === 'block_defence' ?
                       playerTeam.filter(c => c.health > 0).map((card, index) => ({
                         position: [(index - 1.5) * 2, 0.5, actualPlayerID === '0' ? 5.5 : -5.5],
                         cardId: card.instanceId || card.id
                       })) :
                       aiTeam.filter(c => c.health > 0).map((card, index) => ({
                         position: [(index - 1.5) * 2, 0.5, actualPlayerID === '0' ? -5.5 : 5.5],
                         cardId: card.instanceId || card.id
                       }))
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
  }, [G?.activeEffects?.length]); // Only re-run when the number of effects changes

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

    setHasStartedTurn(true);

    // Delay to make it feel more natural
    setTimeout(() => {
      // Select an ability from the card based on weighted chances
      const abilities = activeCard.abilities || [];
      if (abilities.length > 0) {
        let selectedAbility;

        // Special handling for Wizard Toy with weighted spell selection
        if (activeCard.name === 'Wizard Toy') {
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

        setSelectedCard(activeCard);
        setCurrentAbility(selectedAbility);

        // Show spell notification for the selected ability
        setSpellNotification({
          ability: selectedAbility,
          caster: activeCard,
          targets: []
        });

        // Determine valid targets based on ability
        const targets = selectedAbility.targetType === 'enemy'
          ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
          : selectedAbility.targetType === 'friendly'
          ? playerTeam.filter(c => (c.health || c.currentHealth || 100) > 0 && c.id !== activeCard.id)
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

    const ability = card.abilities?.[0];
    if (!ability) {
      return;
    }


    // Check if this is Pyroblast or another targeted spell
    const isPyroblast = ability.name?.toLowerCase() === 'pyroblast';
    const isIceNova = ability.name?.toLowerCase() === 'ice nova' || ability.effect === 'freeze_all';
    const requiresTarget = ability.requiresTarget || ability.targetType === 'enemy' || ability.targetType === 'ally' || isPyroblast || isIceNova;

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
        : ability.targetType === 'enemy'
        ? aiTeam.filter(c => (c.health || c.currentHealth || 100) > 0)
        : ability.targetType === 'friendly'
        ? playerTeam.filter(c => (c.health || c.currentHealth || 100) > 0 && c.id !== card.id)
        : [...playerTeam, ...aiTeam].filter(c => (c.health || c.currentHealth || 100) > 0);

      setValidTargets(targets.map(c => c.instanceId || c.id));
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
            moves.endTurn();
          }
        }, 2000); // Wait for animation
      }
    }
  };

  // Handle target selection
  const handleTargetSelect = (targetCard) => {

    if (!isTargeting || !currentAbility || !selectedCard) {
      return;
    }

    // Check if target is valid (use instanceId for comparison)
    const targetInstanceId = targetCard.instanceId || targetCard.id;

    if (!validTargets.includes(targetInstanceId)) {
      return;
    }


    // Determine target team
    const targetTeam = playerTeam.some(c => c.id === targetCard.id) ? 'player' : 'enemy';

    // Check if this is a Pyroblast spell or any fire spell

    const isPyroblast = currentAbility.name?.toLowerCase() === 'pyroblast' ||
                       currentAbility.name?.toLowerCase().includes('pyro') ||
                       currentAbility.name?.toLowerCase().includes('fire');

    const isIceNova = currentAbility.name?.toLowerCase() === 'ice nova' ||
                      currentAbility.name?.toLowerCase().includes('frost') ||
                      currentAbility.name?.toLowerCase().includes('ice');

    // Execute ability with target
    if (moves?.castSpell && isPyroblast) {

      // Find the correct ability index for Pyroblast
      const pyroblastIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'pyroblast' || a.id === 'pyroblast'
      ) ?? 0;

      // Use the new castSpell move for Pyroblast
      moves.castSpell(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, pyroblastIndex);

      // Calculate precise 3D positions for the Pyroblast effect
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const targetIndex = targetTeam === 'enemy'
        ? aiTeam.findIndex(c => c.id === targetCard.id)
        : playerTeam.findIndex(c => c.id === targetCard.id);


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


      // Add Pyroblast to activeEffects using the safe SimplePyroblast
      const pyroblastEffect = {
        id: Date.now(),
        type: 'pyroblast',
        startPosition: startPosition,
        endPosition: endPosition,
        active: true,
        duration: 6000  // 6 seconds - longer than turn delay to ensure full animation
      };

      // Effects are now synced from G.activeEffects for both players
      // setActiveEffects(prev => [...prev, pyroblastEffect]);

      // Execute the spell move - this will add the effect to G.activeEffects
      const abilityIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'pyroblast' || a.id === 'pyroblast'
      ) ?? 0;

      // Execute the spell move - this will add the effect to G.activeEffects

      if (moves.castSpell) {
        moves.castSpell(
          selectedCard.instanceId || selectedCard.id,
          targetCard.instanceId || targetCard.id,
          abilityIndex
        );
      } else {
        console.error('❌ moves.castSpell is not available!');
      }

      // Clear targeting state immediately to hide overlay
      setShowTargetingOverlay(false);

      // Add spell notification
      setSpellNotification({
        ability: { name: 'Pyroblast', damage: 35, description: 'Massive fireball!' },
        caster: selectedCard,
        targets: [targetCard]
      });

      // Clear remaining targeting state
      setTimeout(() => {
        setIsTargeting(false);
        setSelectedCard(null);
        setCurrentAbility(null);
        setValidTargets([]);
      }, 100);

    } else if (moves?.castSpell && isIceNova) {

      // Z positions (distance from center - matching HearthstoneScene)
      const playerZ = 5.5;  // Player cards are at z = 5.5
      const aiZ = -5.5;     // AI cards are at z = -5.5

      // Ice Nova is AOE - hits all enemies
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const isPlayerCasting = casterIndex !== -1;

      // Calculate caster position
      const casterX = isPlayerCasting
        ? (casterIndex - 1.5) * 2  // Player positions
        : (aiTeam.findIndex(c => c.id === selectedCard.id) - 1.5) * 2; // AI positions

      const casterY = 0.5;
      const casterZ = isPlayerCasting
        ? (actualPlayerID === '0' ? playerZ : aiZ)
        : (actualPlayerID === '0' ? aiZ : playerZ);

      const casterPosition = [casterX, casterY, casterZ];

      // Get all enemy positions
      const enemyTeam = isPlayerCasting ? aiTeam : playerTeam;
      const enemyPositions = enemyTeam.filter(c => c.health > 0).map((card, index) => {
        const x = (index - 1.5) * 2;
        const y = 0.5;
        const z = isPlayerCasting
          ? (actualPlayerID === '0' ? aiZ : playerZ)
          : (actualPlayerID === '0' ? playerZ : aiZ);
        return [x, y, z];
      });


      // Add Ice Nova effect
      const iceNovaEffect = {
        id: Date.now(),
        type: 'ice_nova',
        casterPosition: casterPosition,
        targetPositions: enemyPositions,
        enemyCardIds: enemyTeam.filter(c => c.health > 0).map(c => c.id),
        active: true,
        duration: 8000  // 8 seconds for the full effect
      };

      // Effects are now synced from G.activeEffects for both players
      // setActiveEffects(prev => [...prev, iceNovaEffect]);

      // Find the correct ability index for Ice Nova
      const iceNovaIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'ice nova' || a.id === 'ice_nova'
      ) ?? 0;

      // Execute the spell on first enemy (AOE will hit all)
      if (targetCard && targetCard.health > 0) {
        moves.castSpell(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, iceNovaIndex);
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

    } else if (currentAbility.name?.toLowerCase() === 'sword slash' ||
               currentAbility.id === 'sword_slash') {
      // Brick Dude - Sword Slash Effect
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const isPlayerCasting = casterIndex !== -1;

      const casterX = isPlayerCasting
        ? (casterIndex - 1.5) * 2
        : (aiTeam.findIndex(c => c.id === selectedCard.id) - 1.5) * 2;

      const casterZ = isPlayerCasting
        ? (actualPlayerID === '0' ? 5.5 : -5.5)
        : (actualPlayerID === '0' ? -5.5 : 5.5);

      const casterPosition = [casterX, 0.5, casterZ];

      // Get target position
      const targetIndex = aiTeam.findIndex(c => c.id === targetCard.id);
      const targetX = (targetIndex - 1.5) * 2;
      const targetZ = isPlayerCasting
        ? (actualPlayerID === '0' ? -5.5 : 5.5)
        : (actualPlayerID === '0' ? 5.5 : -5.5);

      const abilityIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'sword slash' || a.id === 'sword_slash'
      ) ?? 0;

      if (targetCard && targetCard.health > 0) {
        moves.castSpell(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, abilityIndex);
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

    } else if (currentAbility.name?.toLowerCase() === 'block defence' ||
               currentAbility.id === 'block_defence') {
      // Brick Dude - Block Defence Effect (shields all allies)
      const allyTeam = playerTeam.filter(c => c.health > 0);
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const casterX = (casterIndex - 1.5) * 2;
      const casterZ = actualPlayerID === '0' ? 5.5 : -5.5;

      const abilityIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'block defence' || a.id === 'block_defence'
      ) ?? 1;

      // No target needed for self/team buff - just cast it
      moves.castSpell(selectedCard.instanceId || selectedCard.id, selectedCard.instanceId || selectedCard.id, abilityIndex);

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

    } else if (currentAbility.name?.toLowerCase().includes('whirlwind') ||
               currentAbility.id === 'whirlwind_slash') {
      // Brick Dude - Whirlwind Slash (Ultimate)
      const enemyTeam = aiTeam.filter(c => c.health > 0);
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const casterX = (casterIndex - 1.5) * 2;
      const casterZ = actualPlayerID === '0' ? 5.5 : -5.5;

      const abilityIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase().includes('whirlwind') || a.id === 'whirlwind_slash'
      ) ?? 2;

      // Execute on first enemy (AOE will hit all)
      if (enemyTeam.length > 0) {
        moves.castSpell(selectedCard.instanceId || selectedCard.id, enemyTeam[0].instanceId || enemyTeam[0].id, abilityIndex);
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

    } else if (currentAbility.name?.toLowerCase() === 'lightning zap' ||
               currentAbility.name?.toLowerCase().includes('chain') ||
               currentAbility.name?.toLowerCase().includes('lightning')) {
      // Chain Lightning Effect

      // Find all enemy targets
      const enemyTeam = aiTeam.filter(c => c.health > 0);

      // Calculate caster position (Wizard Toy)
      const casterIndex = playerTeam.findIndex(c => c.id === selectedCard.id);
      const isPlayerCasting = casterIndex !== -1;

      const casterX = isPlayerCasting
        ? (casterIndex - 1.5) * 2
        : (aiTeam.findIndex(c => c.id === selectedCard.id) - 1.5) * 2;

      const casterZ = isPlayerCasting
        ? (actualPlayerID === '0' ? 5.5 : -5.5)
        : (actualPlayerID === '0' ? -5.5 : 5.5);

      const casterPosition = [casterX, 0.5, casterZ];

      // Calculate all target positions for the chain effect
      const chainTargets = enemyTeam.map((card, index) => {
        const x = (index - 1.5) * 2;
        const z = isPlayerCasting
          ? (actualPlayerID === '0' ? -5.5 : 5.5)
          : (actualPlayerID === '0' ? 5.5 : -5.5);
        return {
          position: [x, 0.5, z],
          cardId: card.id
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
      const lightningIndex = selectedCard.abilities?.findIndex(a =>
        a.name?.toLowerCase() === 'lightning zap' || a.id === 'lightning_zap'
      ) ?? 1; // Default to index 1 for Wizard Toy

      // Execute the spell on the first target (will chain to others)
      if (targetCard && targetCard.health > 0) {
        moves.castSpell(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, lightningIndex);
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

    } else if (moves?.useAbility) {

        moves.useAbility({
          sourceCardId: selectedCard.id,
          abilityIndex: 0,
          targetCardId: targetCard.id
        });

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
        moves.playCard(selectedCard.instanceId || selectedCard.id, targetCard.instanceId || targetCard.id, 0);

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
          activeEffects={activeEffects}
          damageNumbers={damageNumbers}
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

  // Preload assets before creating client to avoid disconnect issues
  useEffect(() => {
    const checkAssetsAndLoad = async () => {
      // Check if assets are already loaded
      if (window.assetPreloader && window.assetPreloader.assets.images.size > 0) {
        setAssetsPreloaded(true);
        return;
      }

      // If not, do a quick load of essential assets
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log(`📦 Quick-loading assets for ${isMobile ? 'mobile' : 'desktop'}...`);

      // Just mark as ready after a short delay - the ToyboxBoard will handle actual loading
      setTimeout(() => {
        setAssetsPreloaded(true);
      }, isMobile ? 2000 : 1000);
    };

    checkAssetsAndLoad();
  }, []);

  // Create the client component using useMemo - ONLY after assets check
  const ClientComponent = useMemo(() => {
    // Don't create client until we've checked assets
    if (!assetsPreloaded) {
      return null;
    }

    return Client({
      game: ToyboxGame,
      board: ToyboxBoard,
      multiplayer: SocketIO({
        server: window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : 'https://toybox-boardgame.onrender.com',
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
  }, [matchID, playerID, credentials, assetsPreloaded]);

  // Handle connection state
  useEffect(() => {
    setIsConnected(true);

    // Handle WebGL context loss recovery
    const handleContextLost = (event) => {
      event.preventDefault();
      // Force a re-render after a short delay
      setTimeout(() => {
        setIsConnected(false);
      setTimeout(() => setIsConnected(true), 100);
      }, 1000);
    };

    const handleContextRestored = () => {
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
    }
  }, [isConnected, playerID]);

  if (!isConnected || !ClientComponent) {
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
          <div className="text-sm text-gray-300">Match ID: {matchID}</div>
          <div className="text-sm text-gray-300">Player ID: {playerID}</div>
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