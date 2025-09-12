// PvP Battle Manager with player targeting support
class PvPBattleManager {
  constructor(io, battleId, player1, player2) {
    this.io = io;
    this.battleId = battleId;
    this.player1 = player1;
    this.player2 = player2;
    
    // Battle state
    this.currentTurn = 'player1';
    this.player1CharacterIndex = 0;
    this.player2CharacterIndex = 0;
    this.turnNumber = 0;
    
    // Teams
    this.player1Team = this.initializeTeam(player1.teamData, 'player1');
    this.player2Team = this.initializeTeam(player2.teamData, 'player2');
    
    // Battle state
    this.isComplete = false;
    this.winner = null;
    this.waitingForTarget = false;
    this.currentAbility = null;
    this.currentCaster = null;
    this.targetingTimeout = null;
    
    // Seeded random for deterministic outcomes
    this.seed = this.generateSeed(battleId);
    this.rng = this.createSeededRandom(this.seed);
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
  
  startTurn() {
    if (this.isComplete) return;
    
    const attackingTeam = this.currentTurn === 'player1' ? this.player1Team : this.player2Team;
    const defendingTeam = this.currentTurn === 'player1' ? this.player2Team : this.player1Team;
    const currentIndex = this.currentTurn === 'player1' ? this.player1CharacterIndex : this.player2CharacterIndex;
    
    // Find next alive character
    const aliveAttackers = attackingTeam.filter(char => char.isAlive);
    if (aliveAttackers.length === 0) {
      this.endBattle();
      return;
    }
    
    // Get the active character
    const characterToUse = currentIndex % aliveAttackers.length;
    const activeCharacter = aliveAttackers[characterToUse];
    
    console.log(`PvP Turn: ${this.currentTurn} - Character ${characterToUse + 1}/${aliveAttackers.length}: ${activeCharacter.name}`);
    
    // Check if frozen
    if (activeCharacter.status.frozen) {
      activeCharacter.status.frozen = false;
      
      const action = {
        type: 'skip_turn',
        caster: this.getCharacterData(activeCharacter),
        reason: 'frozen',
        turnNumber: this.turnNumber
      };
      
      // Broadcast skip turn
      this.io.to(this.battleId).emit('battle_action', {
        action,
        state: this.getState()
      });
      
      // Advance turn
      this.advanceTurn();
      
      // Start next turn after longer delay for frozen skip visibility
      setTimeout(() => this.startTurn(), 4000); // Increased from 2000ms to 4000ms
      return;
    }
    
    // Select ability
    const ability = this.selectAbility(activeCharacter);
    this.currentAbility = ability;
    this.currentCaster = activeCharacter;
    
    // Determine if this ability needs targeting
    const needsTargeting = this.needsPlayerTargeting(ability);
    
    if (needsTargeting) {
      // Determine valid targets
      const validTargets = this.getValidTargets(ability, defendingTeam, attackingTeam);
      
      // Request target from the active player
      const activeSocket = this.currentTurn === 'player1' ? this.player1.socket : this.player2.socket;
      
      this.waitingForTarget = true;
      
      // Clear any existing timeout
      if (this.targetingTimeout) {
        clearTimeout(this.targetingTimeout);
      }
      
      // Send target request to the active player
      this.io.to(activeSocket).emit('request_target', {
        ability: ability,
        caster: this.getCharacterData(activeCharacter),
        validTargets: validTargets.map(t => this.getCharacterData(t)),
        timeout: 10000 // 10 seconds
      });
      
      // Set timeout for auto-selection
      this.targetingTimeout = setTimeout(() => {
        if (this.waitingForTarget) {
          console.log('Target selection timeout - auto-selecting random target');
          // Auto-select random target
          const randomTarget = validTargets[this.rng.range(0, validTargets.length - 1)];
          this.waitingForTarget = false;
          this.targetingTimeout = null;
          this.executeAbility(activeCharacter, ability, [randomTarget]);
        }
      }, 10000);
      
    } else {
      // Auto-target for AOE or non-targetable abilities
      const targets = this.autoSelectTargets(ability, defendingTeam, attackingTeam);
      this.executeAbility(activeCharacter, ability, targets);
    }
  }
  
  handleTargetSelection(playerId, targetId) {
    if (!this.waitingForTarget) return;
    
    // Verify it's the right player's turn
    const expectedPlayer = this.currentTurn === 'player1' ? this.player1.wallet : this.player2.wallet;
    if (playerId !== expectedPlayer) return;
    
    // Find the target
    const allCharacters = [...this.player1Team, ...this.player2Team];
    const target = allCharacters.find(c => c.instanceId === targetId);
    
    if (!target) return;
    
    // Clear the timeout since player selected a target
    if (this.targetingTimeout) {
      clearTimeout(this.targetingTimeout);
      this.targetingTimeout = null;
    }
    
    this.waitingForTarget = false;
    this.executeAbility(this.currentCaster, this.currentAbility, [target]);
  }
  
  needsPlayerTargeting(ability) {
    // Single target abilities that should allow player choice
    return ['damage', 'damage_burn', 'multi_damage', 'heal', 'shield'].includes(ability.effect);
  }
  
  getValidTargets(ability, defendingTeam, attackingTeam) {
    // Determine valid targets based on ability type
    if (ability.effect === 'damage' || ability.effect === 'damage_burn' || ability.effect === 'multi_damage') {
      return defendingTeam.filter(c => c.isAlive);
    } else if (ability.effect === 'heal' || ability.effect === 'shield') {
      return attackingTeam.filter(c => c.isAlive);
    }
    return [];
  }
  
  autoSelectTargets(ability, defendingTeam, attackingTeam) {
    // Auto-select targets for AOE abilities
    if (ability.effect === 'damage_all' || ability.effect === 'freeze_all') {
      return defendingTeam.filter(c => c.isAlive);
    } else if (ability.effect === 'heal_all' || ability.effect === 'shield_all') {
      return attackingTeam.filter(c => c.isAlive);
    } else if (ability.effect === 'damage_chain') {
      const alive = defendingTeam.filter(c => c.isAlive);
      return alive.slice(0, 3);
    }
    
    // Default random target
    const validTargets = defendingTeam.filter(c => c.isAlive);
    if (validTargets.length > 0) {
      return [validTargets[this.rng.range(0, validTargets.length - 1)]];
    }
    return [];
  }
  
  selectAbility(character) {
    if (!character.abilities || character.abilities.length === 0) {
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
        return { ...ability };
      }
    }
    
    return { ...character.abilities[character.abilities.length - 1] };
  }
  
  executeAbility(caster, ability, targets) {
    // Calculate and apply effects
    const effects = [];
    
    targets.forEach((target) => {
      const effect = {
        targetId: target.instanceId,
        type: 'damage',
        amount: 0
      };
      
      // Calculate damage/heal
      if (ability.damage) {
        const baseDamage = ability.damage;
        const variance = this.rng.range(-5, 5);
        const isCritical = this.rng.next() < 0.15;
        
        effect.amount = baseDamage + variance;
        if (isCritical) {
          effect.amount = Math.floor(effect.amount * 1.5);
          effect.isCritical = true;
        }
      } else if (ability.heal) {
        effect.type = 'heal';
        effect.amount = ability.heal;
      } else if (ability.shield) {
        effect.type = 'shield';
        effect.amount = ability.shield;
      }
      
      // Apply status effects
      if (ability.freeze || ability.effect === 'freeze_all') {
        effect.freeze = true;
      }
      
      // Apply the effect
      this.applyEffect(target, effect);
      effects.push(effect);
    });
    
    // Create action object
    const action = {
      type: 'ability_used',
      turnNumber: this.turnNumber,
      caster: this.getCharacterData(caster),
      ability: ability,
      targets: targets.map(t => this.getCharacterData(t)),
      effects: effects
    };
    
    // Broadcast action to both players
    this.io.to(this.battleId).emit('battle_action', {
      action,
      state: this.getState()
    });
    
    // Check for battle end
    const alivePlayer1 = this.player1Team.filter(c => c.isAlive).length;
    const alivePlayer2 = this.player2Team.filter(c => c.isAlive).length;
    
    if (alivePlayer1 === 0 || alivePlayer2 === 0) {
      this.endBattle();
    } else {
      // Advance turn
      this.advanceTurn();
      
      // Start next turn after delay - slowed down for better visibility
      setTimeout(() => this.startTurn(), 4500); // Increased from 3000ms to 4500ms for better pacing
    }
  }
  
  applyEffect(target, effect) {
    switch (effect.type) {
      case 'damage':
        if (!target.isAlive) return;
        
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
    }
  }
  
  advanceTurn() {
    // Increment character index for the current team
    if (this.currentTurn === 'player1') {
      this.player1CharacterIndex++;
    } else {
      this.player2CharacterIndex++;
    }
    
    // Switch turns
    this.currentTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
    this.turnNumber++;
  }
  
  endBattle() {
    this.isComplete = true;
    const alivePlayer1 = this.player1Team.filter(c => c.isAlive).length;
    const alivePlayer2 = this.player2Team.filter(c => c.isAlive).length;
    
    if (alivePlayer1 > 0) {
      this.winner = this.player1.wallet;
    } else if (alivePlayer2 > 0) {
      this.winner = this.player2.wallet;
    } else {
      this.winner = 'draw';
    }
    
    // Broadcast battle complete
    this.io.to(this.battleId).emit('battle_complete', {
      winner: this.winner,
      finalState: this.getState()
    });
  }
  
  getCharacterData(char) {
    return {
      instanceId: char.instanceId,
      id: char.id,
      name: char.name,
      team: char.team,
      emoji: char.emoji,
      rarity: char.rarity,
      color: char.color,
      image: char.image
    };
  }
  
  getState() {
    return {
      battleId: this.battleId,
      currentTurn: this.currentTurn,
      turnNumber: this.turnNumber,
      player1Team: this.player1Team,
      player2Team: this.player2Team,
      isComplete: this.isComplete,
      winner: this.winner
    };
  }
}

export default PvPBattleManager;