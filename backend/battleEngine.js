// Server-side battle engine for deterministic battle simulation
// Character data will be passed from clients

class BattleEngine {
  constructor(battleId, player1Data, player2Data) {
    this.battleId = battleId;
    this.currentTurn = 0;
    this.turnOrder = 'player1'; // Alternates between player1 and player2
    this.battleLog = [];
    this.seed = this.generateSeed(battleId);
    this.rng = this.createSeededRandom(this.seed);
    
    // Initialize teams with proper structure
    this.player1Team = this.initializeTeam(player1Data.teamData, 'player1');
    this.player2Team = this.initializeTeam(player2Data.teamData, 'player2');
    
    // Track battle state
    this.isComplete = false;
    this.winner = null;
    this.player1CharacterIndex = 0;
    this.player2CharacterIndex = 0;
  }
  
  generateSeed(battleId) {
    let seed = 0;
    for (let i = 0; i < battleId.length; i++) {
      seed = ((seed << 5) - seed) + battleId.charCodeAt(i);
      seed = seed & seed;
    }
    return Math.abs(seed);
  }
  
  createSeededRandom(seed) {
    let currentSeed = seed;
    return {
      next: () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 2147483647;
        return currentSeed / 2147483647;
      },
      range: (min, max) => {
        const rand = ((currentSeed * 1664525 + 1013904223) % 2147483647) / 2147483647;
        currentSeed = (currentSeed * 1664525 + 1013904223) % 2147483647;
        return Math.floor(rand * (max - min + 1)) + min;
      }
    };
  }
  
  initializeTeam(teamData, teamId) {
    return teamData.map((char, index) => ({
      ...char,
      instanceId: `${teamId}-${char.id}-${index}`,
      currentHealth: char.maxHealth || 100,
      maxHealth: char.maxHealth || 100,
      isAlive: true,
      team: teamId,
      shields: 0,
      status: {
        frozen: false,
        burned: false,
        stunned: false
      }
    }));
  }
  
  executeTurn(selectedTargetId = null) {
    if (this.isComplete) return null;
    
    const attackingTeam = this.turnOrder === 'player1' ? this.player1Team : this.player2Team;
    const defendingTeam = this.turnOrder === 'player1' ? this.player2Team : this.player1Team;
    const currentIndex = this.turnOrder === 'player1' ? this.player1CharacterIndex : this.player2CharacterIndex;
    
    // Find next alive character
    const aliveAttackers = attackingTeam.filter(char => char.isAlive);
    if (aliveAttackers.length === 0) {
      this.endBattle();
      return null;
    }
    
    // Use proper index cycling through alive characters
    const characterToUse = currentIndex % aliveAttackers.length;
    const activeCharacter = aliveAttackers[characterToUse];
    
    console.log(`${this.turnOrder} turn - Character ${characterToUse + 1}/${aliveAttackers.length}: ${activeCharacter.name}`);
    
    // Check if frozen
    if (activeCharacter.status.frozen) {
      // Clear frozen status BEFORE creating action
      activeCharacter.status.frozen = false;
      
      const action = {
        type: 'skip_turn',
        caster: {
          instanceId: activeCharacter.instanceId,
          id: activeCharacter.id,
          name: activeCharacter.name,
          team: activeCharacter.team,  
          emoji: activeCharacter.emoji,
          rarity: activeCharacter.rarity,
          color: activeCharacter.color,
          image: activeCharacter.image
        },
        reason: 'frozen',
        turnNumber: this.currentTurn,
        wasFrozen: true  // Add flag to indicate this character was frozen
      };
      this.battleLog.push(action);
      this.advanceTurn();
      return action;
    }
    
    // Select ability using seeded random
    const ability = this.selectAbility(activeCharacter);
    
    // Select targets - use player selection if provided
    let targets;
    if (selectedTargetId) {
      // Player selected a specific target
      const selectedTarget = [...defendingTeam, ...attackingTeam].find(
        char => char.instanceId === selectedTargetId
      );
      if (selectedTarget) {
        targets = [selectedTarget];
      } else {
        // Fallback to automatic selection if target not found
        targets = this.selectTargets(ability, activeCharacter, defendingTeam, attackingTeam);
      }
    } else {
      // Automatic target selection
      targets = this.selectTargets(ability, activeCharacter, defendingTeam, attackingTeam);
    }
    
    // Calculate effects
    const effects = this.calculateEffects(ability, activeCharacter, targets);
    
    // Apply effects
    this.applyEffects(effects, targets);
    
    // Create action object
    const action = {
      type: 'ability_used',
      turnNumber: this.currentTurn,
      caster: {
        instanceId: activeCharacter.instanceId,
        id: activeCharacter.id, // Include the character's base ID for special effects
        name: activeCharacter.name,
        team: activeCharacter.team,
        emoji: activeCharacter.emoji,
        rarity: activeCharacter.rarity,
        color: activeCharacter.color,
        image: activeCharacter.image
      },
      ability: {
        id: ability.id, // Include ability ID for effect routing
        name: ability.name,
        effect: ability.effect,
        isUltimate: ability.isUltimate,
        animation: ability.animation, // Include animation type if present
        description: ability.description,
        damage: ability.damage,
        heal: ability.heal,
        shield: ability.shield,
        freeze: ability.freeze,
        burn: ability.burn,
        chance: ability.chance,
        hits: ability.hits
      },
      targets: targets.map(t => ({
        instanceId: t.instanceId,
        id: t.id, // Include target's base ID
        name: t.name,
        team: t.team,
        emoji: t.emoji,
        image: t.image
      })),
      effects: effects,
      timestamp: Date.now()
    };
    
    this.battleLog.push(action);
    
    // Check for battle end AFTER applying damage
    const alivePlayer1 = this.player1Team.filter(c => c.isAlive).length;
    const alivePlayer2 = this.player2Team.filter(c => c.isAlive).length;
    
    console.log(`After turn ${this.currentTurn}: Player1 alive: ${alivePlayer1}, Player2 alive: ${alivePlayer2}`);
    
    if (alivePlayer1 === 0 || alivePlayer2 === 0) {
      console.log('Battle should end - one team has no alive characters');
      this.endBattle();
    } else {
      this.advanceTurn();
    }
    
    return action;
  }
  
  selectAbility(character) {
    // Check if character has abilities
    if (!character.abilities || character.abilities.length === 0) {
      // Return a default attack if no abilities defined
      return {
        name: 'Basic Attack',
        damage: 20,
        effect: 'damage',
        chance: 1.0
      };
    }
    
    const random = this.rng.next();
    let cumulative = 0;
    
    for (const ability of character.abilities) {
      cumulative += ability.chance;
      if (random < cumulative) {
        // Return the full ability object with all properties
        return { ...ability };
      }
    }
    
    // Return the last ability with all properties
    return { ...character.abilities[character.abilities.length - 1] };
  }
  
  selectTargets(ability, caster, enemyTeam, allyTeam) {
    const targets = [];
    
    // Determine target based on ability effect
    switch (ability.effect) {
      case 'damage':
      case 'damage_burn':
      case 'debuff_accuracy': // Soap Spray
        const aliveEnemies = enemyTeam.filter(c => c.isAlive);
        if (aliveEnemies.length > 0) {
          const targetIndex = this.rng.range(0, aliveEnemies.length - 1);
          targets.push(aliveEnemies[targetIndex]);
        }
        break;
        
      case 'damage_chain': // Lightning Zap - hits multiple targets
        const chainTargets = enemyTeam.filter(c => c.isAlive);
        if (chainTargets.length > 0) {
          // Primary target takes full damage
          const primaryIndex = this.rng.range(0, chainTargets.length - 1);
          targets.push(chainTargets[primaryIndex]);
          
          // Chain to 1-2 additional targets if available
          const remaining = chainTargets.filter((c, i) => i !== primaryIndex);
          const chainCount = Math.min(remaining.length, this.rng.range(1, 2));
          for (let i = 0; i < chainCount; i++) {
            const chainIndex = this.rng.range(0, remaining.length - 1);
            targets.push(remaining[chainIndex]);
            remaining.splice(chainIndex, 1);
          }
        }
        break;
        
      case 'multi_damage': // Kraken - hits same target multiple times
        const multiTargets = enemyTeam.filter(c => c.isAlive);
        if (multiTargets.length > 0) {
          const targetIndex = this.rng.range(0, multiTargets.length - 1);
          const target = multiTargets[targetIndex];
          // Add same target multiple times for multi-hit
          const hits = ability.hits || 2;
          for (let i = 0; i < hits; i++) {
            targets.push(target);
          }
        }
        break;
        
      case 'apocalypse': // Phoenix Dragon ultimate - damages all enemies, heals self
        targets.push(...enemyTeam.filter(c => c.isAlive));
        // Also add caster as target for the heal effect
        targets.push(caster);
        break;
        
      case 'damage_all':
      case 'freeze_all':
        targets.push(...enemyTeam.filter(c => c.isAlive));
        break;
        
      case 'heal':
      case 'shield':
        const aliveAllies = allyTeam.filter(c => c.isAlive);
        if (aliveAllies.length > 0) {
          // Prioritize low health allies
          const sortedByHealth = aliveAllies.sort((a, b) => 
            (a.currentHealth / a.maxHealth) - (b.currentHealth / b.maxHealth)
          );
          targets.push(sortedByHealth[0]);
        }
        break;
        
      case 'heal_all':
      case 'heal_revive_all':
        targets.push(...allyTeam);
        break;
        
      default:
        // Default to random enemy
        const defaultTargets = enemyTeam.filter(c => c.isAlive);
        if (defaultTargets.length > 0) {
          const targetIndex = this.rng.range(0, defaultTargets.length - 1);
          targets.push(defaultTargets[targetIndex]);
        }
    }
    
    return targets;
  }
  
  calculateEffects(ability, caster, targets) {
    const effects = [];
    
    targets.forEach((target, index) => {
      // Skip calculating effects for dead targets (except for revive abilities)
      if (!target.isAlive && ability.effect !== 'heal_revive_all') {
        return;
      }
      
      const effect = {
        targetId: target.instanceId,
        type: 'damage'
      };
      
      // Special handling for apocalypse effect
      if (ability.effect === 'apocalypse') {
        if (target.instanceId === caster.instanceId) {
          // Heal the caster
          effect.type = 'heal';
          effect.amount = ability.heal || 150;
        } else {
          // Massive damage to enemies
          effect.type = 'damage';
          effect.amount = ability.damage || 200;
        }
      }
      // Chain lightning - reduced damage for secondary targets
      else if (ability.effect === 'damage_chain') {
        const baseDamage = ability.damage || 30;
        const variance = this.rng.range(-5, 5);
        const isCritical = this.rng.next() < 0.15;
        
        // Primary target takes full damage, chain targets take 50% damage
        const damageMultiplier = index === 0 ? 1.0 : 0.5;
        effect.type = 'damage';
        effect.amount = Math.floor((baseDamage + variance) * damageMultiplier);
        if (isCritical) {
          effect.amount = Math.floor(effect.amount * 1.5);
          effect.isCritical = true;
        }
      }
      // Debuff accuracy - small damage + accuracy debuff
      else if (ability.effect === 'debuff_accuracy') {
        effect.type = 'damage';
        effect.amount = 10; // Small damage
        effect.debuff = 'accuracy';
      }
      // Standard damage calculation
      else if (ability.damage) {
        const baseDamage = ability.damage;
        const variance = this.rng.range(-5, 5);
        const isCritical = this.rng.next() < 0.15; // 15% crit chance
        
        effect.type = 'damage';
        effect.amount = baseDamage + variance;
        if (isCritical) {
          effect.amount = Math.floor(effect.amount * 1.5);
          effect.isCritical = true;
        }
      }
      
      if (ability.heal && ability.effect !== 'apocalypse') {
        effect.type = 'heal';
        effect.amount = ability.heal;
      }
      
      if (ability.shield) {
        effect.type = 'shield';
        effect.amount = ability.shield;
      }
      
      if (ability.effect === 'freeze_all' || ability.freeze) {
        effect.freeze = true;
        effect.type = 'freeze'; // Also set type for client
      }
      
      if (ability.effect === 'damage_burn' || ability.burn) {
        effect.burn = true;
      }
      
      if (ability.effect === 'heal_revive_all' && !target.isAlive) {
        effect.type = 'revive';
        effect.amount = Math.floor(target.maxHealth * 0.5);
      }
      
      effects.push(effect);
    });
    
    return effects;
  }
  
  applyEffects(effects, targets) {
    effects.forEach((effect, index) => {
      const target = targets[index];
      if (!target) return;
      
      switch (effect.type) {
        case 'damage':
          // Skip if target is already dead
          if (!target.isAlive) return;
          
          // Apply shields first
          let remainingDamage = effect.amount;
          if (target.shields > 0) {
            if (target.shields >= remainingDamage) {
              target.shields -= remainingDamage;
              remainingDamage = 0;
            } else {
              remainingDamage -= target.shields;
              target.shields = 0;
            }
          }
          
          target.currentHealth = Math.max(0, target.currentHealth - remainingDamage);
          if (target.currentHealth === 0) {
            target.isAlive = false;
          }
          
          if (effect.freeze) {
            target.status.frozen = true;
            console.log(`❄️ Server: ${target.name} is now FROZEN!`);
          }
          if (effect.burn) {
            target.status.burned = true;
          }
          if (effect.debuff === 'accuracy') {
            target.status.accuracyDebuff = 2; // Debuffed for 2 turns
          }
          break;
          
        case 'heal':
          if (target.isAlive) {
            target.currentHealth = Math.min(target.maxHealth, target.currentHealth + effect.amount);
          }
          break;
          
        case 'shield':
          target.shields += effect.amount;
          break;
          
        case 'revive':
          if (!target.isAlive) {
            target.isAlive = true;
            target.currentHealth = effect.amount;
          }
          break;
          
        case 'freeze':
          // Handle freeze effect without damage
          if (target.isAlive) {
            target.status.frozen = true;
            console.log(`❄️ Server: ${target.name} is now FROZEN!`);
          }
          break;
      }
    });
  }
  
  advanceTurn() {
    // Increment the appropriate character index
    if (this.turnOrder === 'player1') {
      this.player1CharacterIndex++;
    } else {
      this.player2CharacterIndex++;
    }
    
    // Switch turn order
    this.turnOrder = this.turnOrder === 'player1' ? 'player2' : 'player1';
    this.currentTurn++;
  }
  
  endBattle() {
    this.isComplete = true;
    const alivePlayer1 = this.player1Team.filter(c => c.isAlive).length;
    const alivePlayer2 = this.player2Team.filter(c => c.isAlive).length;
    
    console.log('endBattle called:', {
      alivePlayer1,
      alivePlayer2,
      player1Team: this.player1Team.map(c => ({ name: c.name, isAlive: c.isAlive, health: c.currentHealth })),
      player2Team: this.player2Team.map(c => ({ name: c.name, isAlive: c.isAlive, health: c.currentHealth }))
    });
    
    if (alivePlayer1 > 0) {
      this.winner = 'player1';
    } else if (alivePlayer2 > 0) {
      this.winner = 'player2';
    } else {
      this.winner = 'draw';
    }
    
    console.log('Battle ended with winner:', this.winner);
  }
  
  getState() {
    return {
      battleId: this.battleId,
      currentTurn: this.currentTurn,
      turnOrder: this.turnOrder,
      player1Team: this.player1Team,
      player2Team: this.player2Team,
      isComplete: this.isComplete,
      winner: this.winner,
      lastAction: this.battleLog[this.battleLog.length - 1] || null
    };
  }
}

export default BattleEngine;