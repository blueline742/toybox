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

// Define setPlayerTeam move function separately for phase reference
const setPlayerTeam = ({ G, ctx, playerID }, team) => {
  console.log(`🎯 setPlayerTeam called`);
  console.log('Raw playerID parameter:', playerID, 'type:', typeof playerID);
  console.log('Team parameter received:', team);
  console.log('ctx.currentPlayer:', ctx.currentPlayer);
  console.log('ctx.playOrder:', ctx.playOrder);

  let actualPlayerID = null;
  let teamCards = team;

  // PRIORITY 1: Check if team has submittedBy metadata (from client)
  if (team && typeof team === 'object' && !Array.isArray(team)) {
    console.log('📦 Team object detected with potential metadata');

    if (team.submittedBy !== undefined && team.submittedBy !== null) {
      actualPlayerID = String(team.submittedBy);
      console.log('✅ Using submittedBy from metadata:', actualPlayerID);
    }

    // Extract the actual cards array
    teamCards = team.cards || team;
    console.log('📋 Extracted cards:', teamCards?.length, 'cards');
  }

  // PRIORITY 2: Use ctx.currentPlayer if available and no metadata
  if (!actualPlayerID && ctx.currentPlayer !== null && ctx.currentPlayer !== undefined) {
    actualPlayerID = String(ctx.currentPlayer);
    console.log('📌 Using ctx.currentPlayer as fallback:', actualPlayerID);
  }

  // PRIORITY 3: Infer from game state - which player hasn't set their team yet
  if (!actualPlayerID) {
    console.log('🔍 Attempting to infer playerID from game state...');

    if (!G.players['0'].ready) {
      actualPlayerID = '0';
      console.log('📌 Inferred Player 0 (not ready yet)');
    } else if (!G.players['1'].ready) {
      actualPlayerID = '1';
      console.log('📌 Inferred Player 1 (not ready yet)');
    } else {
      console.error('❌ Both players already ready, cannot accept new team');
      console.error('Player states:', {
        player0: G.players['0'].ready,
        player1: G.players['1'].ready
      });
      return G; // Return unchanged game state
    }
  }

  console.log('🎯 Final playerID determined:', actualPlayerID);

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
    console.log('⚠️ Player', actualPlayerID, 'already set their team');
    return G;
  }

  console.log(`🎲 Player ${actualPlayerID} setting team with ${teamCards.length} cards - MatchID:`, ctx?.matchID || G.matchID);

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
  console.log(`✅ Player ${actualPlayerID} team set - Cards:`, playerCards.map(c => c.name), '- MatchID:', ctx?.matchID || G.matchID);

  // Check if both players are ready
  const allReady = G.players['0'].ready && G.players['1'].ready;

  console.log('📊 Current ready status after team set:', {
    player0Ready: G.players['0'].ready,
    player1Ready: G.players['1'].ready,
    player0Cards: G.players['0'].cards.length,
    player1Cards: G.players['1'].cards.length,
    bothReady: allReady
  });

  if (allReady) {
    console.log('🎮 Both players ready - game can start!');
    console.log('  Player 0 cards:', G.players['0'].cards.map(c => c.name));
    console.log('  Player 1 cards:', G.players['1'].cards.map(c => c.name));
    console.log('  Phase will transition to playing');
    // Don't set G.phase manually - let boardgame.io handle it via endIf
    G.turnNumber = 1;
  } else {
    console.log('⏳ Waiting for other player to set team');
  }

  // CRITICAL: Must return the modified game state for changes to persist
  return G;
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
    console.log('🎮 GAME SETUP CALLED');
    console.log('  Context:', ctx);
    console.log('  SetupData:', setupData);
    console.log('  PlayOrder:', ctx?.playOrder);
    console.log('  NumPlayers:', ctx?.numPlayers);
    console.log('  MatchID:', setupData?.matchID || 'unknown');

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
      matchID: setupData?.matchID || 'unknown' // Track matchID for logging
    };

    console.log('📊 Initial game state created:', {
      phase: gameState.phase,
      setupCount: gameState.setupCount,
      playersReady: Object.values(gameState.players).map(p => p.ready)
    });
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
      endIf: ({ G, ctx }) => {
        if (!G || !G.players) {
          console.log('⚠️ endIf check - G or players not initialized');
          return false;
        }

        // Check if both players exist
        if (!G.players['0'] || !G.players['1']) {
          console.log('⚠️ endIf check - Players not initialized');
          return false;
        }

        const player0Ready = G.players['0'].ready === true;
        const player1Ready = G.players['1'].ready === true;
        const allReady = player0Ready && player1Ready;

        console.log('🔍 Setup endIf check - MatchID:', G.matchID, {
          player0: { ready: player0Ready, cards: G.players['0']?.cards?.length || 0 },
          player1: { ready: player1Ready, cards: G.players['1']?.cards?.length || 0 },
          transition: allReady
        });

        if (allReady) {
          console.log('✅ BOTH PLAYERS READY - Transitioning to playing phase - MatchID:', G.matchID);
        }
        return allReady;
      },
      onEnd: ({ G, ctx }) => {
        console.log('✅ BOTH PLAYERS READY on server - Transitioning to playing phase - MatchID:', G.matchID);
        console.log('📊 Setup phase ended, transitioning to playing phase');
        if (G.players && G.players['0'] && G.players['1']) {
          console.log('  Player 0 team:', G.players['0'].cards.map(c => c.name));
          console.log('  Player 1 team:', G.players['1'].cards.map(c => c.name));
        }

        // Create a clean, serializable game state for the playing phase
        const nextState = {
          players: G.players,
          turnNumber: G.turnNumber || 1,
          activeEffects: G.activeEffects || [],
          animationQueue: G.animationQueue || [],
          winner: G.winner || null,
          phase: 'playing',
          setupCount: G.setupCount || 1,
          matchID: G.matchID || 'unknown'
        };

        // Ensure the state is fully serializable
        return JSON.parse(JSON.stringify(nextState));
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

      console.log(`${attacker.name} attacks ${defender.name}!`);
    },

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
    startBattle: ({ G, ctx, events, random }) => {
      console.log('Starting battle with default decks');

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

    // Use ability move
    useAbility: ({ G, ctx, events }, { sourceCardId, abilityIndex, targetCardId }) => {
      console.log('🎯 useAbility called:', { sourceCardId, abilityIndex, targetCardId });

      const currentPlayerID = ctx.currentPlayer;
      const opponentID = currentPlayerID === '0' ? '1' : '0';

      // Find source card
      const sourceCard = G.players[currentPlayerID].cards.find(c => c.id === sourceCardId);
      if (!sourceCard || !sourceCard.isAlive) {
        console.log('Source card not found or dead');
        return;
      }

      // Get ability
      const ability = sourceCard.abilities?.[abilityIndex];
      if (!ability) {
        console.log('Ability not found');
        return;
      }

      console.log(`${sourceCard.name} uses ${ability.name}!`);

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
            console.log(`${targetCard.name} was defeated!`);
          }
          console.log(`${targetCard.name} takes ${ability.damage} damage! (${targetCard.currentHealth}/${targetCard.maxHealth})`);
        }
      }

      if (ability.heal && targetCardId) {
        // Find target card (should be ally)
        const targetCard = G.players[currentPlayerID].cards.find(c => c.id === targetCardId);
        if (targetCard && targetCard.isAlive) {
          targetCard.currentHealth = Math.min(targetCard.maxHealth, targetCard.currentHealth + ability.heal);
          console.log(`${targetCard.name} heals for ${ability.heal}! (${targetCard.currentHealth}/${targetCard.maxHealth})`);
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
      console.log('Ability executed successfully');
    },

    // Clear processed animations
    clearAnimationQueue: ({ G, ctx }) => {
      G.animationQueue = [];
    },

    // End turn manually
    endTurn: ({ G, ctx, events }) => {
      console.log('End turn called for player', ctx.currentPlayer);
      // Use boardgame.io's events to properly end the turn
      if (events && events.endTurn) {
        events.endTurn();
      }
    },

    // Removed AI logic - all moves are now human-triggered
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