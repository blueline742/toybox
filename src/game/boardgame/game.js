// Boardgame.io Game Definition for Toybox NFT Card Battle
import { ENHANCED_CHARACTERS } from '../enhancedCharacters.js';

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

// Define setPlayerTeam move function with MANUAL phase transition
const setPlayerTeam = ({ G, ctx, events, playerID }, team) => {

  let actualPlayerID = null;
  let teamCards = team;

  // PRIORITY 1: Check if team has submittedBy metadata (from client)
  if (team && typeof team === 'object' && !Array.isArray(team)) {

    if (team.submittedBy !== undefined && team.submittedBy !== null) {
      actualPlayerID = String(team.submittedBy);
    }

    // Extract the actual cards array
    teamCards = team.cards || team;
  }

  // PRIORITY 2: Use ctx.currentPlayer if available and no metadata
  if (!actualPlayerID && ctx.currentPlayer !== null && ctx.currentPlayer !== undefined) {
    actualPlayerID = String(ctx.currentPlayer);
  }

  // PRIORITY 3: Infer from game state - which player hasn't set their team yet
  if (!actualPlayerID) {

    if (!G.players['0'].ready) {
      actualPlayerID = '0';
    } else if (!G.players['1'].ready) {
      actualPlayerID = '1';
    } else {
      console.error('❌ Both players already ready, cannot accept new team');
      console.error('Player states:', {
        player0: G.players['0'].ready,
        player1: G.players['1'].ready
      });
      return G; // Return unchanged game state
    }
  }


  // Validate team cards
  if (!teamCards || !Array.isArray(teamCards) || teamCards.length === 0) {
    console.error('❌ Invalid team data:', teamCards);
    return G; // Return unchanged game state
  }

  // Validate we have a valid player ID
  if (!G.players[actualPlayerID]) {
    console.error('❌ Invalid playerID:', actualPlayerID);
    return G;
  }

  // Check if this player already set their team
  if (G.players[actualPlayerID].ready) {
    return G;
  }


  // Transform the selected team into the game format - ensure only serializable data
  const playerCards = teamCards.map((card, index) => {
    // Create a clean serializable card object
    const cleanCard = {
      id: `p${actualPlayerID}-${card.id}-${index}`,
      instanceId: `p${actualPlayerID}-${index}`,
      name: card.name,
      emoji: card.emoji,
      maxHealth: card.maxHealth || 100,
      currentHealth: card.maxHealth || 100,
      attack: card.attack || card.stats?.attack || 20,
      defense: card.defense || card.stats?.defense || 10,
      speed: card.speed || card.stats?.speed || 15,
      frozen: false,
      frozenTurns: 0,
      shields: 0,
      position: index,
      owner: parseInt(actualPlayerID),
      isAlive: true,
      // Preserve the NFT image path if it exists
      image: card.nftImage ? `/assets/nft/newnft/${card.nftImage}` : card.image || null,
      color: actualPlayerID === '0' ? 'blue' : 'red',
      rarity: card.rarity || 'common',
      level: card.level || 1,
      description: card.description || ''
    };

    // Clean abilities to ensure they're serializable
    if (card.abilities && Array.isArray(card.abilities)) {
      cleanCard.abilities = card.abilities.map(ability => {
        // Only include serializable fields
        const cleanAbility = {
          name: String(ability.name || ''),
          damage: Number(ability.damage || 0),
          heal: Number(ability.heal || 0),
          shield: Number(ability.shield || 0),
          manaCost: Number(ability.manaCost || 0),
          targetType: String(ability.targetType || 'enemy'),
          description: String(ability.description || '')
        };
        // Remove any function fields
        return JSON.parse(JSON.stringify(cleanAbility));
      });
    } else {
      cleanCard.abilities = [];
    }

    // Clean ultimate ability if it exists
    if (card.ultimateAbility) {
      const cleanUltimate = {
        name: String(card.ultimateAbility.name || ''),
        damage: Number(card.ultimateAbility.damage || 0),
        heal: Number(card.ultimateAbility.heal || 0),
        shield: Number(card.ultimateAbility.shield || 0),
        manaCost: Number(card.ultimateAbility.manaCost || 0),
        targetType: String(card.ultimateAbility.targetType || 'enemy'),
        description: String(card.ultimateAbility.description || '')
      };
      // Ensure it's fully serializable
      cleanCard.ultimateAbility = JSON.parse(JSON.stringify(cleanUltimate));
    }

    // Final serialization check - ensure entire object is JSON-safe
    return JSON.parse(JSON.stringify(cleanCard));
  });

  // Update the player's cards and mark as ready
  G.players[actualPlayerID].cards = playerCards;
  G.players[actualPlayerID].ready = true;

  // Check if both players are ready
  const allReady = G.players['0'].ready && G.players['1'].ready;

  if (allReady) {

    // CRITICAL: Manually transition to playing phase
    if (ctx.phase === 'setup' && events && events.endPhase) {
      events.endPhase();
      G.phase = 'playing';
      G.setupComplete = true;
      G.turnNumber = 1;
    }
  } else {
  }
};

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

const ToyboxGame = {
  name: 'toybox-battle',

  setup: (ctx, setupData) => {

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
        buffs: [],
        ready: false  // Track if player has set their team
      };
    }

    const gameState = {
      players,
      turnNumber: 0,
      activeEffects: [],
      animationQueue: [],
      winner: null,
      phase: 'setup', // Start in setup phase
      setupCount: (setupData?.setupCount || 0) + 1, // Track how many times setup is called
      matchID: setupData?.matchID || 'unknown', // Track matchID for logging
      setupComplete: false // Track if setup phase is complete
    };

    return gameState;
  },

  // Phase configuration for proper state synchronization
  phases: {
    setup: {
      start: true,
      next: 'playing',
      turn: {
        activePlayers: { all: 'setup' } // All players active simultaneously
      },
      moves: {
        setPlayerTeam
      },
      // REMOVED endIf - using manual phase transition instead
      // This avoids the boardgame.io multiplayer sync timing issue
      onEnd: ({ G, ctx }) => {
        if (G.players && G.players['0'] && G.players['1']) {
        }

        // Mark setup as complete
        G.setupComplete = true;
        G.phase = 'playing';
      }
    },
    playing: {
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
      }
    }
  },

  moves: {
    // Reference the setPlayerTeam function defined above
    setPlayerTeam,

    // Simple attack move for PvP
    attackCard: ({ G, ctx }, attackerId, defenderId) => {
      if (!G || !G.players) return;

      const currentPlayer = ctx.currentPlayer;
      const player = G.players[currentPlayer];
      const opponent = G.players[currentPlayer === '0' ? '1' : '0'];

      if (!player || !opponent) return;

      // Find attacker card
      const attacker = player.cards.find(c => c.instanceId === attackerId && c.isAlive);
      if (!attacker) return;

      // Find defender card
      const defender = opponent.cards.find(c => c.instanceId === defenderId && c.isAlive);
      if (!defender) return;

      // Deal damage
      defender.currentHealth -= attacker.attack;
      if (defender.currentHealth <= 0) {
        defender.currentHealth = 0;
        defender.isAlive = false;
      }

      // Optional: Defender counter-attacks
      if (defender.isAlive) {
        attacker.currentHealth -= defender.attack;
        if (attacker.currentHealth <= 0) {
          attacker.currentHealth = 0;
          attacker.isAlive = false;
        }
      }

    },

    // Cast spell move for abilities like Pyroblast
    castSpell: ({ G, ctx }, casterId, targetId, abilityIndex = 0) => {

      // Get current player's cards
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return;

      // Find caster card
      const caster = player.cards.find(c => c.instanceId === casterId && c.isAlive);
      if (!caster || !caster.abilities || !caster.abilities[abilityIndex]) return;

      const ability = caster.abilities[abilityIndex];

      // Check if spell has already been used
      if (ability.used) {
        return;
      }

      // Check mana cost (if mana system is implemented)
      if (player.currentMana !== undefined && player.currentMana < ability.manaCost) {
        return;
      }

      // Find target in opponent's cards
      const opponentId = playerId === '0' ? '1' : '0';
      const opponent = G.players[opponentId];
      const target = opponent.cards.find(c => c.instanceId === targetId && c.isAlive);
      if (!target) return;

      // Deduct mana if applicable
      if (player.currentMana !== undefined) {
        player.currentMana -= ability.manaCost;
      }

      // Mark spell as used
      ability.used = true;

      // Apply spell effect
      if (ability.damage) {
        target.currentHealth -= ability.damage;
        if (target.currentHealth <= 0) {
          target.currentHealth = 0;
          target.isAlive = false;
        }
      }

      if (ability.heal) {
        target.currentHealth = Math.min(target.currentHealth + ability.heal, target.maxHealth);
      }

      if (ability.shield) {
        target.shield = (target.shield || 0) + ability.shield;
      }

      if (ability.freeze) {
        target.isFrozen = true;
        target.frozenTurns = 2;
      }

      // Store spell effect info for visual rendering
      G.lastSpellCast = {
        spell: ability.name,
        casterId,
        targetId,
        timestamp: Date.now()
      };

    },

    // Initialize cards for both players - now works with or without external data
    initializeCards: ({ G, ctx }, customDecks) => {

      // Determine which decks to use
      let playerDeck, aiDeck;

      if (customDecks && (customDecks.playerTestTeam || customDecks.playerCards)) {
        // Use provided custom decks
        playerDeck = customDecks.playerTestTeam || customDecks.playerCards || getDefaultPlayerDeck();
        aiDeck = customDecks.aiTestTeam || customDecks.aiCards || getDefaultAIDeck();
      } else {
        // Use default decks
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


      // Important: boardgame.io requires moves to not mutate G directly
      // The framework handles the immutability, but we need to ensure we're working
      // with the G object that was passed in
    },

    // Simple start battle move that uses default decks
    startBattle: ({ G, ctx, events, random }) => {

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

      }
    },

    // Process auto-play from animation queue
    processAutoPlay: ({ G, ctx, events }) => {
      if (G.animationQueue.length === 0) return;

      const action = G.animationQueue[0];
      if (action.type !== 'autoPlay') return;

      const { card, target, ability } = action;


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
        }, 5000); // Wait 5 seconds to show spell animations (especially Pyroblast)
      }
    },

    // Play a card's ability (kept for compatibility but no mana check)
    playCard: ({ G, ctx }, cardId, targetId, abilityIndex = 0) => {
      // Safety checks
      if (!G || !ctx || !G.players || !cardId) {
        console.error('Invalid game state or parameters');
        return;
      }


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


      if (!card || card.frozen || card.currentHealth <= 0) {
        return;
      }

      const ability = card.abilities?.[abilityIndex];
      if (!ability) {
        return;
      }


      // No mana cost anymore!

      // Queue animation with visual effect information
      // Check ability name (normalize to lowercase and remove spaces)
      const abilityNameLower = (ability.name || ability.id || '').toLowerCase().replace(/\s+/g, '');
      const effectType = abilityNameLower.includes('pyroblast') ? 'pyroblast' :
                        abilityNameLower.includes('icenova') ? 'ice_nova' :
                        (abilityNameLower.includes('lightning') || abilityNameLower.includes('zap')) ? 'chain_lightning' :
                        abilityNameLower.includes('swordslash') ? 'sword_slash' :
                        abilityNameLower.includes('blockdefence') ? 'block_defence' :
                        abilityNameLower.includes('whirlwind') ? 'whirlwind' :
                        abilityNameLower.includes('fireball') ? 'fireball' :
                        ability.animation || 'default';

      G.animationQueue.push({
        type: 'ability',
        caster: card,
        ability: ability,
        target: targetId,
        effectType: effectType,
        timestamp: Date.now()
      });

      // Also add to activeEffects for visual rendering
      const newEffect = {
        id: Date.now(),
        type: effectType,
        casterPosition: card.position || [0, 0, 0],
        targetPosition: targetId ? [0, 0, 0] : null, // Will be calculated on client
        casterCardId: card.instanceId,
        targetCardId: targetId,
        timestamp: Date.now()
      };

      G.activeEffects.push(newEffect);

      // Find target
      let target = null;
      if (targetId) {
        // Check both teams for target
        target = [...player.cards, ...opponent.cards].find(c => c.instanceId === targetId);
      }

      // Apply ability effects
      if (ability.damage && target) {
        // Apply damage considering shields
        let actualDamage = ability.damage;
        if (target.shields > 0) {
          const absorbed = Math.min(target.shields, actualDamage);
          actualDamage -= absorbed;
          target.shields -= absorbed;
        }

        target.currentHealth -= actualDamage;

        // If card dies, move to graveyard
        if (target.currentHealth <= 0) {
          const targetOwner = target.owner;
          G.players[targetOwner].graveyard.push(target);
          G.players[targetOwner].cards = G.players[targetOwner].cards.filter(c => c.instanceId !== target.instanceId);
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

    // Cast spell move - this is what the frontend actually calls
    castSpell: ({ G, ctx }, sourceCardId, targetCardId, abilityIndex) => {

      const currentPlayer = ctx.currentPlayer;
      const player = G.players[currentPlayer];
      const opponent = G.players[currentPlayer === '0' ? '1' : '0'];

      if (!player || !opponent) {
        return;
      }

      // Find card - handle both instanceId and simplified p0-0 format
      let card = player.cards.find(c => c.instanceId === sourceCardId);

      // If not found by instanceId, try to parse p0-0 format
      if (!card && sourceCardId.includes('-')) {
        const parts = sourceCardId.split('-');
        if (parts[0] === 'p' + currentPlayer) {
          const cardIndex = parseInt(parts[parts.length - 1]);
          card = player.cards[cardIndex];
        }
      }

      // Also check by id
      if (!card) {
        card = player.cards.find(c => c.id === sourceCardId);
      }


      if (!card || card.frozen || card.currentHealth <= 0) {
        return;
      }

      // Check if it's the ultimate ability (index 2 usually) or regular ability
      let ability;
      if (abilityIndex === 2 && card.ultimateAbility) {
        ability = card.ultimateAbility;
      } else {
        ability = card.abilities?.[abilityIndex];
      }

      if (!ability) {
        return;
      }


      // No mana cost anymore!

      // Queue animation with visual effect information
      // Check ability name (normalize to lowercase and remove spaces)
      const abilityNameLower = (ability.name || ability.id || '').toLowerCase().replace(/\s+/g, '');
      const effectType = abilityNameLower.includes('pyroblast') ? 'pyroblast' :
                        abilityNameLower.includes('icenova') ? 'ice_nova' :
                        (abilityNameLower.includes('lightning') || abilityNameLower.includes('zap')) ? 'chain_lightning' :
                        abilityNameLower.includes('swordslash') ? 'sword_slash' :
                        abilityNameLower.includes('blockdefence') ? 'block_defence' :
                        abilityNameLower.includes('whirlwind') ? 'whirlwind' :
                        abilityNameLower.includes('fireball') ? 'fireball' :
                        ability.animation || 'default';

      G.animationQueue.push({
        type: 'ability',
        caster: card,
        ability: ability,
        target: targetCardId,
        effectType: effectType,
        timestamp: Date.now()
      });

      // Add to activeEffects for visual rendering with unique ID
      const effectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newEffect = {
        id: effectId,
        type: effectType,
        casterPosition: card.position || [0, 0, 0],
        targetPosition: targetCardId ? [0, 0, 0] : null, // Will be calculated on client
        casterCardId: card.instanceId,
        targetCardId: targetCardId,
        timestamp: Date.now()
      };

      G.activeEffects.push(newEffect);

      // Note: Server-side cleanup is handled in clearExpiredEffects move
      // Don't use setTimeout as it causes proxy revocation errors

      // Find target
      let target = null;
      if (targetCardId) {
        // First try to find by instanceId
        target = [...player.cards, ...opponent.cards].find(c => c.instanceId === targetCardId);

        // If not found, try p0-0 format
        if (!target && targetCardId.includes('-')) {
          const parts = targetCardId.split('-');
          if (parts[0] === 'p0' || parts[0] === 'p1') {
            const playerIndex = parts[0].substring(1);
            const cardIndex = parseInt(parts[parts.length - 1]);
            const targetPlayer = G.players[playerIndex];
            if (targetPlayer && targetPlayer.cards[cardIndex]) {
              target = targetPlayer.cards[cardIndex];
            }
          }
        }

      }

      // Apply ability effects
      if (ability.damage && target) {
        // Apply damage considering shields
        let actualDamage = ability.damage;
        if (target.shields > 0) {
          const absorbed = Math.min(target.shields, actualDamage);
          actualDamage -= absorbed;
          target.shields -= absorbed;
        }

        target.currentHealth -= actualDamage;

        // If card dies, move to graveyard
        if (target.currentHealth <= 0) {
          const targetOwner = target.owner;
          G.players[targetOwner].graveyard.push(target);
          G.players[targetOwner].cards = G.players[targetOwner].cards.filter(c => c.instanceId !== target.instanceId);
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

      // Mark ability as used
      if (!card.usedAbilities) card.usedAbilities = [];
      card.usedAbilities.push(ability.id || ability.name);

    },


    // Use ability move
    useAbility: ({ G, ctx, events }, { sourceCardId, abilityIndex, targetCardId }) => {

      const currentPlayerID = ctx.currentPlayer;
      const opponentID = currentPlayerID === '0' ? '1' : '0';

      // Find source card
      const sourceCard = G.players[currentPlayerID].cards.find(c => c.id === sourceCardId);
      if (!sourceCard || !sourceCard.isAlive) {
        return;
      }

      // Get ability
      const ability = sourceCard.abilities?.[abilityIndex];
      if (!ability) {
        return;
      }


      // Handle different ability effects
      if (ability.damage && targetCardId) {
        // Find target card
        let targetCard = G.players[opponentID].cards.find(c => c.id === targetCardId);
        if (!targetCard) {
          targetCard = G.players[currentPlayerID].cards.find(c => c.id === targetCardId);
        }

        if (targetCard && targetCard.isAlive) {
          targetCard.currentHealth = Math.max(0, targetCard.currentHealth - ability.damage);
          if (targetCard.currentHealth <= 0) {
            targetCard.isAlive = false;
          }
        }
      }

      if (ability.heal && targetCardId) {
        // Find target card (should be ally)
        const targetCard = G.players[currentPlayerID].cards.find(c => c.id === targetCardId);
        if (targetCard && targetCard.isAlive) {
          targetCard.currentHealth = Math.min(targetCard.maxHealth, targetCard.currentHealth + ability.heal);
        }
      }

      // Add to animation queue
      G.animationQueue.push({
        type: 'ability',
        sourceId: sourceCardId,
        targetId: targetCardId,
        ability: ability,
        timestamp: Date.now()
      });

      G.turnNumber++;

      // Note: Don't end turn here - let the client handle that
    },

    // Clear processed animations
    clearAnimationQueue: ({ G, ctx }) => {
      G.animationQueue = [];
    },

    // Clear expired visual effects - only allow current player to call this
    clearExpiredEffects: ({ G, ctx }) => {
      // Only allow the current player to clear effects to prevent spam
      if (!ctx || ctx.currentPlayer === undefined) {
        return;
      }

      const now = Date.now();
      const EFFECT_DURATION = 8000; // 8 seconds to match client timing

      const initialCount = G.activeEffects.length;
      G.activeEffects = G.activeEffects.filter(effect =>
        now - effect.timestamp < EFFECT_DURATION
      );

      const clearedCount = initialCount - G.activeEffects.length;
      if (clearedCount > 0) {
      }
    },

    // End turn manually
    endTurn: ({ G, ctx, events }) => {

      // Clean up expired effects when turn ends
      const now = Date.now();
      const EFFECT_DURATION = 8000; // 8 seconds
      const initialCount = G.activeEffects.length;

      G.activeEffects = G.activeEffects.filter(effect =>
        now - effect.timestamp < EFFECT_DURATION
      );

      if (initialCount > G.activeEffects.length) {
      }

      // Use boardgame.io's events to properly end the turn
      if (events && events.endTurn) {
        events.endTurn();
      }
    },

    // Handle player leaving the match
    leaveMatch: ({ G, ctx, events }) => {

      // End game with opponent as winner
      const winner = ctx.currentPlayer === '0' ? '1' : '0';
      if (events && events.endGame) {
        events.endGame({ winner, reason: 'opponent_left' });
      }

      return G;
    },
  },

  endIf: ({ G, ctx }) => {
    // Only check for end conditions during the playing phase
    if (ctx.phase !== 'playing') {
      return;
    }

    // Check if game state is properly initialized
    if (!G || !G.players || !G.players['0'] || !G.players['1']) {
      return;
    }

    // Check if all cards are dead (cards array becomes empty when they die)
    const player0HasCards = G.players['0'].cards && G.players['0'].cards.some(card => card.isAlive);
    const player1HasCards = G.players['1'].cards && G.players['1'].cards.some(card => card.isAlive);

    // Only check for winner if game has actually started (turns have been played)
    const gameInProgress = G.turnNumber > 0;

    if (gameInProgress) {
      if (!player0HasCards) {
        return { winner: '1' }; // Player 1 wins
      }
      if (!player1HasCards) {
        return { winner: '0' }; // Player 0 wins
      }
    }

    if (G.winner !== null) {
      return { winner: G.winner };
    }
  }
  // Removed AI section - PvP only now
};

export { ToyboxGame };