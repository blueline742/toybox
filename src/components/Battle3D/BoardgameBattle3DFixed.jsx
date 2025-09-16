import React, { useEffect, useState, useRef } from 'react';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { ToyboxGame } from '../../game/boardgame/game';
import HearthstoneScene from './HearthstoneScene';
import SpellNotification from '../SpellNotification';
import TargetingOverlay from './TargetingOverlay';

// Test teams
const getTestTeams = () => {
  const playerTestTeam = [
    { id: 'robot-1', name: 'RoboWarrior', emoji: '🤖', maxHealth: 120, attack: 25,
      abilities: [
        { name: 'Laser Blast', damage: 30, manaCost: 3, targetType: 'enemy' },
        { name: 'Shield Generator', shield: 20, manaCost: 2, targetType: 'ally' }
      ]
    },
    { id: 'dino-1', name: 'T-Rex', emoji: '🦖', maxHealth: 150, attack: 35,
      abilities: [
        { name: 'Bite', damage: 40, manaCost: 4, targetType: 'enemy' },
        { name: 'Roar', damage: 15, manaCost: 2, targetType: 'all_enemies' }
      ]
    },
    { id: 'bear-1', name: 'Teddy', emoji: '🧸', maxHealth: 100, attack: 20,
      abilities: [
        { name: 'Cuddle', heal: 25, manaCost: 2, targetType: 'ally' },
        { name: 'Bear Hug', damage: 20, freeze: true, manaCost: 3, targetType: 'enemy' }
      ]
    },
    { id: 'rocket-1', name: 'Rocket', emoji: '🚀', maxHealth: 80, attack: 30,
      abilities: [
        { name: 'Pyroblast', damage: 50, manaCost: 5, targetType: 'enemy' },
        { name: 'Boost', heal: 15, manaCost: 1, targetType: 'ally' }
      ]
    }
  ];

  const aiTestTeam = [
    { id: 'alien-1', name: 'Alien', emoji: '👽', maxHealth: 110, attack: 28,
      abilities: [
        { name: 'Mind Control', damage: 25, manaCost: 3, targetType: 'enemy' },
        { name: 'Regenerate', heal: 20, manaCost: 2, targetType: 'ally' }
      ]
    },
    { id: 'dragon-1', name: 'Dragon', emoji: '🐉', maxHealth: 140, attack: 32,
      abilities: [
        { name: 'Fire Breath', damage: 35, manaCost: 4, targetType: 'enemy' },
        { name: 'Dragon Scale', shield: 25, manaCost: 3, targetType: 'ally' }
      ]
    },
    { id: 'unicorn-1', name: 'Unicorn', emoji: '🦄', maxHealth: 90, attack: 22,
      abilities: [
        { name: 'Rainbow Heal', heal: 30, manaCost: 3, targetType: 'ally' },
        { name: 'Horn Strike', damage: 25, manaCost: 2, targetType: 'enemy' }
      ]
    },
    { id: 'ghost-1', name: 'Ghost', emoji: '👻', maxHealth: 95, attack: 26,
      abilities: [
        { name: 'Haunt', damage: 20, freeze: true, manaCost: 3, targetType: 'enemy' },
        { name: 'Phase Shift', shield: 15, manaCost: 2, targetType: 'ally' }
      ]
    }
  ];

  return { playerTestTeam, aiTestTeam };
};

// The board component that renders the 3D scene
function ToyboxBattleBoard({ G, ctx, moves, events, playerID, gameMetadata }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [battleStarted, setBattleStarted] = useState(false);

  // Visual state
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

  // Log game state changes
  useEffect(() => {
    // Add defensive checks to prevent crashes
    if (!G || !G.players) {
      console.log('Waiting for game state to be ready...');
      return;
    }

    console.log('Game state updated:', {
      player0Cards: G.players['0'].cards.length,
      player1Cards: G.players['1'].cards.length,
      turnNumber: G.turnNumber,
    });

    // Check if cards are already initialized
    const cardsExist = G?.players?.['0']?.cards?.length > 0 || G?.players?.['1']?.cards?.length > 0;

    if (cardsExist && !isInitialized) {
      console.log('Cards detected, marking as initialized');
      setIsInitialized(true);
    }
  }, [G, isInitialized]);

  // Loading buffer
  useEffect(() => {
    if (isLoading) {
      const isMobile = window.innerWidth <= 768;
      const loadTime = isMobile ? 7000 : 5000;
      const interval = 100;
      const increment = 100 / (loadTime / interval);

      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + increment;
          if (next >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setIsLoading(false);
            }, 500);
            return 100;
          }
          return next;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isLoading]);

  // Auto-start battle with countdown
  useEffect(() => {
    if (!isLoading && !battleStarted && playerTeam.length === 0) {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setBattleStarted(true);
            // Auto-start the battle
            if (moves && moves.startBattle) {
              moves.startBattle();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isLoading, battleStarted, playerTeam.length]);

  // Show targeting overlay when it's player's turn
  useEffect(() => {
    if (G && G.currentTurnCard && ctx && ctx.currentPlayer === playerID && !isTargeting) {
      const { card, ability, abilityIndex } = G.currentTurnCard;

      // Determine valid targets
      let targets = [];
      const currentPlayerTeam = playerID === '0' ? playerTeam : aiTeam;
      const opponentTeam = playerID === '0' ? aiTeam : playerTeam;

      if (ability.damage || ability.targetType === 'enemy') {
        targets = opponentTeam.filter(c => c.isAlive);
      } else if (ability.heal || ability.shield || ability.targetType === 'ally') {
        targets = currentPlayerTeam.filter(c => c.isAlive);
      }

      if (targets.length > 0) {
        setSelectedCard(card);
        setCurrentAbility({ ...ability, index: abilityIndex });
        setValidTargets(targets);
        setIsTargeting(true);
        setShowTargetingOverlay(true);
      }
    }
  }, [G?.currentTurnCard, ctx?.currentPlayer, playerID]);

  // Sync game state to visual state
  useEffect(() => {
    console.log('Sync effect running. G state:', G);
    if (G && G.players && G.players['0'] && G.players['1']) {
      console.log('Player 0 cards:', G.players['0'].cards);
      console.log('Player 1 cards:', G.players['1'].cards);

      const mappedPlayerTeam = G.players['0'].cards.map(card => ({
        ...card,
        instanceId: card.instanceId || card.id,
        isAlive: card.currentHealth > 0,
        team: 'player'
      }));

      const mappedAiTeam = G.players['1'].cards.map(card => ({
        ...card,
        instanceId: card.instanceId || card.id,
        isAlive: card.currentHealth > 0,
        team: 'ai'
      }));

      console.log('Setting teams - Player:', mappedPlayerTeam, 'AI:', mappedAiTeam);
      setPlayerTeam(mappedPlayerTeam);
      setAiTeam(mappedAiTeam);
    }
  }, [G]);

  const handleCardClick = (card) => {
    console.log('Card clicked:', card);
    console.log('Is targeting:', isTargeting);
    console.log('Selected card:', selectedCard);
    console.log('Current ability:', currentAbility);

    // If targeting mode - this is when clicking on a target
    if (isTargeting && selectedCard && currentAbility) {
      const isValidTarget = validTargets.some(t => t.instanceId === card.instanceId);
      console.log('Is valid target:', isValidTarget);
      console.log('Valid targets:', validTargets);

      if (isValidTarget) {
        console.log('Playing card:', selectedCard.instanceId, 'targeting:', card.instanceId);

        if (moves && moves.playCard) {
          moves.playCard(selectedCard.instanceId, card.instanceId, currentAbility.index);
        } else {
          console.error('playCard move not available!');
        }

        setIsTargeting(false);
        setShowTargetingOverlay(false);
        setValidTargets([]);
        setCurrentAbility(null);
        setSelectedCard(null);

        // End turn after playing
        setTimeout(() => {
          if (events && events.endTurn) {
            events.endTurn();
          }
        }, 1000);
      }
      return;
    }
  };

  // Function to automatically select and play a card for the current player
  const playRandomCard = () => {
    if (!ctx || !G || !G.players) return;

    const currentPlayerIndex = ctx.currentPlayer;
    const player = G.players[currentPlayerIndex];
    const isPlayerTurn = currentPlayerIndex === '0';

    console.log('Playing random card for player:', currentPlayerIndex);

    // Get alive cards for current player
    const aliveCards = isPlayerTurn
      ? playerTeam.filter(c => c.isAlive && !c.frozen)
      : aiTeam.filter(c => c.isAlive && !c.frozen);

    if (aliveCards.length === 0) {
      console.log('No alive cards to play');
      return;
    }

    // Pick a random card
    const randomCard = aliveCards[Math.floor(Math.random() * aliveCards.length)];
    console.log('Selected random card:', randomCard);

    if (!randomCard.abilities || randomCard.abilities.length === 0) {
      console.log('Card has no abilities');
      return;
    }

    // Use first ability
    const ability = randomCard.abilities[0];
    const manaCost = ability.manaCost || 2;

    if (player.mana < manaCost) {
      console.log('Not enough mana for ability');
      return;
    }

    // Determine valid targets based on ability type
    let targets = [];

    if (ability.damage || ability.targetType === 'enemy') {
      // Damage abilities target enemies
      targets = isPlayerTurn ? aiTeam.filter(c => c.isAlive) : playerTeam.filter(c => c.isAlive);
      console.log('Damage ability - targeting enemy team:', targets);
    } else if (ability.heal || ability.shield || ability.targetType === 'ally') {
      // Heal/shield abilities target friendlies
      targets = isPlayerTurn ? playerTeam.filter(c => c.isAlive) : aiTeam.filter(c => c.isAlive);
      console.log('Heal/Shield ability - targeting friendly team:', targets);
    } else if (ability.targetType === 'all_enemies') {
      // AOE abilities don't need targeting
      console.log('AOE ability - no targeting needed');
      if (moves && moves.playCard) {
        moves.playCard(randomCard.instanceId, null, 0);
      }
      return;
    }

    // If it's the player's turn and we need targeting, show the overlay
    if (isPlayerTurn && targets.length > 0) {
      setSelectedCard(randomCard);
      setCurrentAbility({ ...ability, index: 0 });
      setValidTargets(targets);
      setIsTargeting(true);
      setShowTargetingOverlay(true);
    } else if (!isPlayerTurn && targets.length > 0) {
      // AI automatically picks a random target
      const randomTarget = targets[Math.floor(Math.random() * targets.length)];
      console.log('AI selected target:', randomTarget);
      if (moves && moves.playCard) {
        moves.playCard(randomCard.instanceId, randomTarget.instanceId, 0);
      }
    }
  };

  const handleCancelTargeting = () => {
    setIsTargeting(false);
    setShowTargetingOverlay(false);
    setValidTargets([]);
    setCurrentAbility(null);
    setSelectedCard(null);
  };

  const handleEndTurn = () => {
    if (ctx && ctx.currentPlayer === '0' && events) {
      console.log('Ending turn...');
      if (events.endTurn) {
        events.endTurn();
      } else {
        console.error('endTurn event not available');
      }
    }
  };

  // Effect to handle AI turns - removed since we'll use boardgame.io's AI

  // Get visual states
  const shieldedCharacters = new Map();
  const frozenCharacters = new Map();

  [...playerTeam, ...aiTeam].forEach(card => {
    if (card.shields > 0) {
      shieldedCharacters.set(card.instanceId, {
        type: 'energy',
        amount: card.shields
      });
    }
    if (card.frozen) {
      frozenCharacters.set(card.instanceId, true);
    }
  });

  // Defensive check - ensure G and all required properties exist
  if (!G || !ctx || !G.players || !G.players['0'] || !G.players['1']) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-white text-2xl">Initializing game...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8 animate-pulse">
              Loading Battle Arena...
            </h2>
            <div className="w-80 h-6 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-200"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-white text-lg">
              {Math.round(loadingProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* Targeting Overlay */}
      {showTargetingOverlay && (
        <TargetingOverlay
          activeCard={selectedCard}
          targets={validTargets}
          onTargetSelect={handleCardClick}
          onCancel={handleCancelTargeting}
          selectedAbility={currentAbility}
        />
      )}

      {/* 3D Scene */}
      {!isLoading && (
        <div className={showTargetingOverlay ? 'blur-md scale-105 transition-all duration-300' : 'transition-all duration-300'}>
          <HearthstoneScene
            playerTeam={playerTeam}
            aiTeam={aiTeam}
            onCardClick={handleCardClick}
            shieldedCharacters={shieldedCharacters}
            frozenCharacters={frozenCharacters}
            isTargeting={isTargeting}
            validTargets={validTargets}
            activeCharacterIndex={ctx?.currentPlayer === '0' ? 0 : -1}
            currentTurn={ctx?.currentPlayer === '0' ? 'player' : 'ai'}
            activeEffects={activeEffects}
            damageNumbers={damageNumbers}
          />
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

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
        >
          Back to Menu
        </button>
      </div>

      {/* Turn Display */}
      {G && ctx && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg">
            <div>Turn: {G.turnNumber}</div>
            <div className={ctx.currentPlayer === playerID ? 'text-green-400' : 'text-red-400'}>
              {ctx.currentPlayer === playerID ? 'Your Turn' : "Opponent's Turn"}
            </div>
          </div>
        </div>
      )}

      {/* Countdown Display */}
      {!isLoading && !battleStarted && countdown > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center">
            <div className="text-8xl font-bold text-yellow-400 animate-pulse">
              {countdown}
            </div>
            <div className="text-2xl text-white mt-4">
              Battle Starting...
            </div>
          </div>
        </div>
      )}

      {/* Card Count Display */}
      {G && playerTeam.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
            Player Cards: {playerTeam.filter(c => c.isAlive).length}/{playerTeam.length} |
            AI Cards: {aiTeam.filter(c => c.isAlive).length}/{aiTeam.length}
          </div>
        </div>
      )}

      {/* Battle End */}
      {ctx?.gameover && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
          <div className="bg-gradient-to-b from-purple-900 to-blue-900 p-8 rounded-lg text-white">
            <h2 className="text-4xl font-bold mb-4">
              {ctx.gameover.winner === '0' ? '🎉 Victory!' : '💀 Defeat'}
            </h2>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create the Boardgame.io client for local testing
const BoardgameClientLocal = Client({
  game: ToyboxGame,
  board: ToyboxBattleBoard,
  numPlayers: 2,
  debug: true // Set to true temporarily to see what's happening
});

// Component that supports both local testing and PvP
export default function BoardgameBattle3DFixed({
  playerTeam = null,
  opponentTeam = null,
  battleId = null,
  playerNumber = '0',
  socket = null,
  isPvP = false
}) {
  // Determine the correct playerID based on playerNumber
  const playerID = playerNumber ? playerNumber.toString() : '0';

  console.log('BoardgameBattle3DFixed props:', {
    isPvP,
    playerNumber,
    playerID,
    battleId,
    hasPlayerTeam: !!playerTeam,
    hasOpponentTeam: !!opponentTeam
  });

  // If PvP mode with socket connection
  if (isPvP && battleId) {
    // TODO: Connect to multiplayer server
    // For now, still use local client but with provided teams
    return <BoardgameClientLocal playerID={playerID} />;
  }

  // Local testing mode
  return <BoardgameClientLocal playerID="0" />;
}