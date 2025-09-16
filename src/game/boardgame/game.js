// Boardgame.io Game Definition for Toybox NFT Card Battle
import { ENHANCED_CHARACTERS } from '../enhancedCharacters';

// Default test decks for when no cards are provided
const getDefaultPlayerDeck = () => [
  {
    id: 'robot',
    name: 'RoboWarrior',
    emoji: '🤖',
    maxHealth: 120,
    attack: 25,
    abilities: [
      { name: 'Laser Blast', damage: 30, manaCost: 3, targetType: 'enemy' },
      { name: 'Shield Generator', shield: 20, manaCost: 2, targetType: 'ally' }
    ]
  },
  {
    id: 'dino',
    name: 'T-Rex',
    emoji: '🦖',
    maxHealth: 150,
    attack: 35,
    abilities: [
      { name: 'Bite', damage: 40, manaCost: 4, targetType: 'enemy' },
      { name: 'Roar', damage: 15, manaCost: 2, targetType: 'all_enemies' }
    ]
  },
  {
    id: 'bear',
    name: 'Teddy',
    emoji: '🧸',
    maxHealth: 100,
    attack: 20,
    abilities: [
      { name: 'Cuddle', heal: 25, manaCost: 2, targetType: 'ally' },
      { name: 'Bear Hug', damage: 20, freeze: true, manaCost: 3, targetType: 'enemy' }
    ]
  },
  {
    id: 'rocket',
    name: 'Rocket',
    emoji: '🚀',
    maxHealth: 80,
    attack: 30,
    abilities: [
      { name: 'Pyroblast', damage: 50, manaCost: 5, targetType: 'enemy' },
      { name: 'Boost', heal: 15, manaCost: 1, targetType: 'ally' }
    ]
  }
];

const getDefaultAIDeck = () => [
  {
    id: 'alien',
    name: 'Alien',
    emoji: '👽',
    maxHealth: 110,
    attack: 28,
    abilities: [
      { name: 'Mind Control', damage: 25, manaCost: 3, targetType: 'enemy' },
      { name: 'Regenerate', heal: 20, manaCost: 2, targetType: 'ally' }
    ]
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    maxHealth: 140,
    attack: 32,
    abilities: [
      { name: 'Fire Breath', damage: 35, manaCost: 4, targetType: 'enemy' },
      { name: 'Dragon Scale', shield: 25, manaCost: 3, targetType: 'ally' }
    ]
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    maxHealth: 90,
    attack: 22,
    abilities: [
      { name: 'Rainbow Heal', heal: 30, manaCost: 3, targetType: 'ally' },
      { name: 'Horn Strike', damage: 25, manaCost: 2, targetType: 'enemy' }
    ]
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    maxHealth: 95,
    attack: 26,
    abilities: [
      { name: 'Haunt', damage: 20, freeze: true, manaCost: 3, targetType: 'enemy' },
      { name: 'Phase Shift', shield: 15, manaCost: 2, targetType: 'ally' }
    ]
  }
];

export const ToyboxGame = {
  name: 'toybox-battle',

  setup: (ctx) => {
    console.log('Game setup called with ctx:', ctx);

    // Initialize players manually since playerSetup might not be working
    const players = {};
    for (let i = 0; i < (ctx?.numPlayers || 2); i++) {
      players[i] = {
        health: 100,
        maxHealth: 100,
        cards: [],  // Initialize with empty array
        graveyard: [],
        mana: 3,
        maxMana: 3,
        buffs: []
      };
    }

    const gameState = {
      players,
      turnNumber: 0,
      activeEffects: [],
      animationQueue: [],
      winner: null
    };

    console.log('Initial game state:', gameState);
    return gameState;
  },

  turn: {
    order: {
      first: () => 0,
      next: ({ G, ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
    onBegin: ({ G, ctx, events, random }) => {
      // Check if game is initialized
      if (!G || !G.players || !G.players[ctx.currentPlayer]) {
        return;
      }

      const player = G.players[ctx.currentPlayer];
      const opponent = G.players[ctx.currentPlayer === '0' ? '1' : '0'];

      // Process turn start effects
      G.turnNumber++;

      // Unfreeze cards that have been frozen for a turn
      if (player.cards && player.cards.length > 0) {
        player.cards.forEach(card => {
          if (card.frozenTurns > 0) {
            card.frozenTurns--;
            if (card.frozenTurns === 0) {
              card.frozen = false;
            }
          }
        });
      }

      // Store the randomly selected card for this turn
      const aliveCards = player.cards.filter(c => c.currentHealth > 0 && !c.frozen);
      if (aliveCards.length > 0) {
        const randomCard = random.Shuffle(aliveCards)[0];

        // Pick a random ability from the card
        if (randomCard.abilities && randomCard.abilities.length > 0) {
          const randomAbilityIndex = Math.floor(Math.random() * randomCard.abilities.length);

          // Store the selected card and ability for the player to target
          G.currentTurnCard = {
            card: randomCard,
            abilityIndex: randomAbilityIndex,
            ability: randomCard.abilities[randomAbilityIndex]
          };
        }
      }
    },
    onEnd: ({ G, ctx }) => {
      // Check if game is initialized
      if (!G || !G.players || !G.players[ctx.currentPlayer]) {
        return;
      }

      // Clear any temporary buffs
      const player = G.players[ctx.currentPlayer];
      if (player.buffs) {
        player.buffs = player.buffs.filter(buff => buff.duration > 1);
        player.buffs.forEach(buff => buff.duration--);
      }
    }
  },

  moves: {
    // Initialize cards for both players - now works with or without external data
    initializeCards: ({ G, ctx }, customDecks) => {
      console.log('=== initializeCards Debug ===');
      console.log('G state before:', G);
      console.log('customDecks:', customDecks);

      // Determine which decks to use
      let playerDeck, aiDeck;

      if (customDecks && (customDecks.playerTestTeam || customDecks.playerCards)) {
        // Use provided custom decks
        playerDeck = customDecks.playerTestTeam || customDecks.playerCards || getDefaultPlayerDeck();
        aiDeck = customDecks.aiTestTeam || customDecks.aiCards || getDefaultAIDeck();
      } else {
        // Use default decks
        console.log('No custom decks provided, using defaults');
        playerDeck = getDefaultPlayerDeck();
        aiDeck = getDefaultAIDeck();
      }

      // Initialize player 0 cards
      G.players['0'].cards = playerDeck.map((card, index) => ({
        ...card,
        id: `p0-${card.id}-${index}`,
        instanceId: `p0-${index}`,
        currentHealth: card.maxHealth || 100,
        attack: card.attack || 20,
        frozen: false,
        frozenTurns: 0,
        shields: 0,
        position: index,
        owner: 0
      }));

      // Initialize player 1 cards
      G.players['1'].cards = aiDeck.map((card, index) => ({
        ...card,
        id: `p1-${card.id}-${index}`,
        instanceId: `p1-${index}`,
        currentHealth: card.maxHealth || 100,
        attack: card.attack || 20,
        frozen: false,
        frozenTurns: 0,
        shields: 0,
        position: index,
        owner: 1
      }));

      console.log('Cards initialized successfully!');
      console.log('Player 0 cards:', G.players['0'].cards);
      console.log('Player 1 cards:', G.players['1'].cards);

      // Important: boardgame.io requires moves to not mutate G directly
      // The framework handles the immutability, but we need to ensure we're working
      // with the G object that was passed in
    },

    // Simple start battle move that uses default decks
    startBattle: ({ G, ctx, events, random, playerID }) => {
      console.log('Starting battle with default decks');
      console.log('Actual game state G:', G);
      console.log('G.players:', G?.players);

      // Safety check - ensure players exist
      if (!G || !G.players || !G.players['0'] || !G.players['1']) {
        console.error('Players not properly initialized!', G);
        return;
      }

      // Only initialize if cards don't exist
      if (!G.players['0'].cards.length || !G.players['1'].cards.length) {
        const playerDeck = getDefaultPlayerDeck();
        const aiDeck = getDefaultAIDeck();

        G.players['0'].cards = playerDeck.map((card, index) => ({
          ...card,
          id: `p0-${card.id}-${index}`,
          instanceId: `p0-${index}`,
          currentHealth: card.maxHealth || 100,
          attack: card.attack || 20,
          frozen: false,
          frozenTurns: 0,
          shields: 0,
          position: index,
          owner: 0
        }));

        G.players['1'].cards = aiDeck.map((card, index) => ({
          ...card,
          id: `p1-${card.id}-${index}`,
          instanceId: `p1-${index}`,
          currentHealth: card.maxHealth || 100,
          attack: card.attack || 20,
          frozen: false,
          frozenTurns: 0,
          shields: 0,
          position: index,
          owner: 1
        }));

        console.log('Battle started with default decks!');
        console.log('Player 0 cards:', G.players['0'].cards);
        console.log('Player 1 cards:', G.players['1'].cards);
      }
    },

    // Process auto-play from animation queue
    processAutoPlay: ({ G, ctx, events }) => {
      if (G.animationQueue.length === 0) return;

      const action = G.animationQueue[0];
      if (action.type !== 'autoPlay') return;

      const { card, target, ability } = action;

      console.log(`${card.name} uses ${ability.name} on ${target.name}`);

      // Apply ability effects
      if (ability.damage && target) {
        let actualDamage = ability.damage;
        if (target.shields > 0) {
          const absorbed = Math.min(target.shields, actualDamage);
          actualDamage -= absorbed;
          target.shields -= absorbed;
        }
        target.currentHealth -= actualDamage;

        if (target.currentHealth <= 0) {
          const targetOwner = target.owner;
          G.players[targetOwner].graveyard.push(target);
          G.players[targetOwner].cards = G.players[targetOwner].cards.filter(c => c.instanceId !== target.instanceId);
        }
      }

      if (ability.heal && target) {
        target.currentHealth = Math.min(target.currentHealth + ability.heal, target.maxHealth);
      }

      if (ability.shield && target) {
        target.shields = (target.shields || 0) + ability.shield;
      }

      if (ability.freeze && target) {
        target.frozen = true;
        target.frozenTurns = 2;
      }

      // Clear the processed action
      G.animationQueue.shift();

      // Auto end turn after processing
      if (events && events.endTurn) {
        setTimeout(() => {
          events.endTurn();
        }, 2000); // Wait 2 seconds to show the action
      }
    },

    // Play a card's ability (kept for compatibility but no mana check)
    playCard: ({ G, ctx }, cardId, targetId, abilityIndex = 0) => {
      // Safety checks
      if (!G || !ctx || !G.players || !cardId) {
        console.error('Invalid game state or parameters');
        return;
      }

      console.log('playCard called with:', { cardId, targetId, abilityIndex });

      const player = G.players[ctx.currentPlayer];
      if (!player || !player.cards) {
        console.error('Invalid player or player cards');
        return;
      }

      const opponent = G.players[ctx.currentPlayer === '0' ? '1' : '0'];
      if (!opponent || !opponent.cards) {
        console.error('Invalid opponent or opponent cards');
        return;
      }

      const card = player.cards.find(c => c.instanceId === cardId);

      console.log('Found card:', card);
      console.log('Player cards:', player.cards);

      if (!card || card.frozen || card.currentHealth <= 0) {
        console.log('Card not valid:', { card, frozen: card?.frozen, health: card?.currentHealth });
        return;
      }

      const ability = card.abilities?.[abilityIndex];
      if (!ability) {
        console.log('No ability found at index:', abilityIndex);
        return;
      }

      // No mana cost anymore!

      // Queue animation
      G.animationQueue.push({
        type: 'ability',
        caster: card,
        ability: ability,
        target: targetId,
        timestamp: Date.now()
      });

      // Find target
      let target = null;
      if (targetId) {
        // Check both teams for target
        target = [...player.cards, ...opponent.cards].find(c => c.instanceId === targetId);
        console.log('Found target:', target);
      }

      // Apply ability effects
      if (ability.damage && target) {
        console.log('Applying damage:', {
          ability: ability,
          targetBefore: { ...target },
          damage: ability.damage
        });

        // Apply damage considering shields
        let actualDamage = ability.damage;
        if (target.shields > 0) {
          const absorbed = Math.min(target.shields, actualDamage);
          actualDamage -= absorbed;
          target.shields -= absorbed;
        }

        target.currentHealth -= actualDamage;

        console.log('After damage:', {
          targetAfter: { ...target },
          actualDamage: actualDamage,
          newHealth: target.currentHealth
        });

        // If card dies, move to graveyard
        if (target.currentHealth <= 0) {
          const targetOwner = target.owner;
          G.players[targetOwner].graveyard.push(target);
          G.players[targetOwner].cards = G.players[targetOwner].cards.filter(c => c.instanceId !== target.instanceId);
          console.log('Target died and moved to graveyard');
        }
      }

      if (ability.heal && target) {
        target.currentHealth = Math.min(target.currentHealth + ability.heal, target.maxHealth);
      }

      if (ability.freeze && target) {
        target.frozen = true;
        target.frozenTurns = 2; // Frozen for 2 turns

        G.animationQueue.push({
          type: 'freeze',
          target: target,
          timestamp: Date.now()
        });
      }

      if (ability.shield) {
        const shieldTarget = target || card;
        shieldTarget.shields += ability.shield;

        G.animationQueue.push({
          type: 'shield',
          target: shieldTarget,
          amount: ability.shield,
          timestamp: Date.now()
        });
      }

      // Direct damage to opponent player
      if (ability.directDamage) {
        opponent.health -= ability.directDamage;
      }

      // Check win condition
      if (opponent.health <= 0 || opponent.cards.length === 0) {
        G.winner = ctx.currentPlayer;
      }
    },

    // Heal a card or player
    healCard: ({ G, ctx }, targetId, amount) => {
      const player = G.players[ctx.currentPlayer];

      if (player.mana < 2) return;
      player.mana -= 2;

      if (targetId === 'player') {
        player.health = Math.min(player.health + amount, player.maxHealth);
      } else {
        const target = player.cards.find(c => c.instanceId === targetId);
        if (target) {
          target.currentHealth = Math.min(target.currentHealth + amount, target.maxHealth);
        }
      }

      G.animationQueue.push({
        type: 'heal',
        target: targetId,
        amount: amount,
        timestamp: Date.now()
      });
    },

    // Freeze an enemy card
    freezeCard: ({ G, ctx }, targetId) => {
      const opponent = G.players[ctx.currentPlayer === '0' ? '1' : '0'];
      const target = opponent.cards.find(c => c.instanceId === targetId);

      if (!target || target.frozen) return;

      const player = G.players[ctx.currentPlayer];
      if (player.mana < 3) return;
      player.mana -= 3;

      target.frozen = true;
      target.frozenTurns = 2;

      G.animationQueue.push({
        type: 'freeze',
        target: target,
        timestamp: Date.now()
      });
    },

    // Revive a card from graveyard
    reviveCard: ({ G, ctx }, cardId) => {
      const player = G.players[ctx.currentPlayer];
      const deadCard = player.graveyard.find(c => c.instanceId === cardId);

      if (!deadCard) return;

      if (player.mana < 5) return;
      player.mana -= 5;

      // Restore card with half health
      deadCard.currentHealth = Math.floor(deadCard.maxHealth / 2);
      deadCard.frozen = false;
      deadCard.frozenTurns = 0;

      // Add back to cards
      player.cards.push(deadCard);
      player.graveyard = player.graveyard.filter(c => c.instanceId !== cardId);

      G.animationQueue.push({
        type: 'revive',
        card: deadCard,
        timestamp: Date.now()
      });
    },

    // Buff a friendly card
    buffCard: ({ G, ctx }, targetId, buffType = 'attack', amount = 10) => {
      const player = G.players[ctx.currentPlayer];
      const target = player.cards.find(c => c.instanceId === targetId);

      if (!target) return;

      if (player.mana < 2) return;
      player.mana -= 2;

      if (buffType === 'attack') {
        target.attack += amount;
      } else if (buffType === 'health') {
        target.maxHealth += amount;
        target.currentHealth += amount;
      } else if (buffType === 'shield') {
        target.shields += amount;
      }

      G.animationQueue.push({
        type: 'buff',
        target: target,
        buffType: buffType,
        amount: amount,
        timestamp: Date.now()
      });
    },

    // Clear processed animations
    clearAnimationQueue: ({ G, ctx }) => {
      G.animationQueue = [];
    },

    // End turn manually
    endTurn: ({ G, ctx }) => {
      // Boardgame.io handles turn ending automatically
      // We don't need to do anything here
      console.log('End turn called');
    },

    // Simple AI move for automatic play
    aiPlay: ({ G, ctx, random }) => {
      console.log('AI Play called for player:', ctx.currentPlayer);

      const player = G.players[ctx.currentPlayer];
      const opponent = G.players[ctx.currentPlayer === '0' ? '1' : '0'];

      // Get alive cards for AI
      const aliveCards = player.cards.filter(c => c.isAlive && !c.frozen && c.currentHealth > 0);

      if (aliveCards.length === 0) {
        console.log('AI has no cards to play');
        return;
      }

      // Pick a random card
      const randomCard = random.Shuffle(aliveCards)[0];

      if (!randomCard.abilities || randomCard.abilities.length === 0) {
        console.log('AI card has no abilities');
        return;
      }

      const ability = randomCard.abilities[0];
      const manaCost = ability.manaCost || 2;

      if (player.mana < manaCost) {
        console.log('AI not enough mana');
        return;
      }

      // Determine targets
      let targets = [];
      if (ability.damage) {
        targets = opponent.cards.filter(c => c.currentHealth > 0);
      } else if (ability.heal || ability.shield) {
        targets = player.cards.filter(c => c.currentHealth > 0 && c.currentHealth < c.maxHealth);
      }

      if (targets.length === 0) {
        console.log('AI has no valid targets');
        return;
      }

      // Pick random target and execute
      const randomTarget = random.Shuffle(targets)[0];

      // Execute the ability inline instead of calling playCard
      player.mana -= manaCost;

      if (ability.damage && randomTarget) {
        let actualDamage = ability.damage;
        if (randomTarget.shields > 0) {
          const absorbed = Math.min(randomTarget.shields, actualDamage);
          actualDamage -= absorbed;
          randomTarget.shields -= absorbed;
        }
        randomTarget.currentHealth -= actualDamage;
        console.log('AI dealt', actualDamage, 'damage to', randomTarget.name);

        if (randomTarget.currentHealth <= 0) {
          const targetOwner = randomTarget.owner;
          G.players[targetOwner].graveyard.push(randomTarget);
          G.players[targetOwner].cards = G.players[targetOwner].cards.filter(c => c.instanceId !== randomTarget.instanceId);
        }
      }

      if (ability.heal && randomTarget) {
        randomTarget.currentHealth = Math.min(randomTarget.currentHealth + ability.heal, randomTarget.maxHealth);
        console.log('AI healed', randomTarget.name, 'for', ability.heal);
      }

      if (ability.shield && randomTarget) {
        randomTarget.shields = (randomTarget.shields || 0) + ability.shield;
        console.log('AI shielded', randomTarget.name);
      }

      G.animationQueue.push({
        type: 'ability',
        caster: randomCard,
        ability: ability,
        target: randomTarget.instanceId,
        timestamp: Date.now()
      });
    }
  },

  endIf: ({ G, ctx }) => {
    // Check if game state is properly initialized
    if (!G || !G.players || !G.players['0'] || !G.players['1']) {
      return;
    }

    // Check if all cards are dead (cards array becomes empty when they die)
    const player0HasCards = G.players['0'].cards && G.players['0'].cards.length > 0;
    const player1HasCards = G.players['1'].cards && G.players['1'].cards.length > 0;

    // If cards have been initialized (graveyard has cards or there are living cards)
    const gameStarted = (G.players['0'].cards.length + G.players['0'].graveyard.length) > 0 ||
                        (G.players['1'].cards.length + G.players['1'].graveyard.length) > 0;

    if (gameStarted) {
      if (!player0HasCards) {
        return { winner: '1' }; // Player 1 (AI) wins
      }
      if (!player1HasCards) {
        return { winner: '0' }; // Player 0 wins
      }
    }

    if (G.winner !== null) {
      return { winner: G.winner };
    }
  },

  ai: {
    enumerate: ({ G, ctx }) => {
      const moves = [];

      // Check if game is properly initialized
      if (!G || !G.players || !G.players[ctx.currentPlayer]) {
        return moves;
      }

      const player = G.players[ctx.currentPlayer];
      const opponent = G.players[(ctx.currentPlayer + 1) % 2];

      // Try to play each card's abilities
      player.cards.forEach(card => {
        if (!card.frozen && card.currentHealth > 0 && card.abilities) {
          card.abilities.forEach((ability, index) => {
            const manaCost = ability.manaCost || 2;
            if (player.mana >= manaCost) {
              // Target selection based on ability type
              if (ability.damage) {
                opponent.cards.forEach(target => {
                  if (target.currentHealth > 0) {
                    moves.push({ move: 'playCard', args: [card.instanceId, target.instanceId, index] });
                  }
                });
              } else if (ability.heal || ability.shield) {
                player.cards.forEach(target => {
                  if (target.currentHealth > 0 && target.currentHealth < target.maxHealth) {
                    moves.push({ move: 'playCard', args: [card.instanceId, target.instanceId, index] });
                  }
                });
              }
            }
          });
        }
      });

      // End turn is always an option
      moves.push({ move: 'endTurn', args: [] });

      return moves;
    }
  }
};