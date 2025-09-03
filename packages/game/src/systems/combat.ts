import { Toy, Move, StatusEffect, BattleState, SeededRNG } from '../types';

export class CombatSystem {
  private rng: SeededRNG;

  constructor(seed: number = Date.now()) {
    this.rng = new SeededRNG(seed);
  }

  calculateDamage(attacker: Toy, defender: Toy, move: Move): {
    damage: number;
    isCrit: boolean;
  } {
    if (move.damage === 0) {
      return { damage: 0, isCrit: false };
    }

    // Base damage calculation
    let damage = Math.max(1, move.damage + attacker.stats.atk - Math.floor(defender.stats.def / 2));

    // Check for crit
    const isCrit = this.rng.next() * 100 < attacker.stats.critChance;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    // Apply shield reduction
    if (defender.statusEffects.includes(StatusEffect.Shield)) {
      damage = Math.floor(damage * 0.5);
    }

    return { damage, isCrit };
  }

  applyDamage(toy: Toy, damage: number): void {
    toy.stats.hp = Math.max(0, toy.stats.hp - damage);
  }

  applyStatusEffect(toy: Toy, effect: StatusEffect, duration: number = 2): void {
    if (effect === StatusEffect.None) return;
    
    if (!toy.statusEffects.includes(effect)) {
      toy.statusEffects.push(effect);
    }
    toy.statusDuration = duration;
  }

  processStatusEffects(toy: Toy): number {
    let statusDamage = 0;

    if (toy.statusEffects.includes(StatusEffect.Burn)) {
      statusDamage = 4;
      this.applyDamage(toy, statusDamage);
      
      toy.statusDuration--;
      if (toy.statusDuration <= 0) {
        toy.statusEffects = toy.statusEffects.filter(e => e !== StatusEffect.Burn);
      }
    }

    if (toy.statusEffects.includes(StatusEffect.Shield)) {
      toy.statusDuration--;
      if (toy.statusDuration <= 0) {
        toy.statusEffects = toy.statusEffects.filter(e => e !== StatusEffect.Shield);
      }
    }

    if (toy.statusEffects.includes(StatusEffect.Stun)) {
      toy.statusDuration--;
      if (toy.statusDuration <= 0) {
        toy.statusEffects = toy.statusEffects.filter(e => e !== StatusEffect.Stun);
      }
    }

    return statusDamage;
  }

  canAct(toy: Toy): boolean {
    return !toy.statusEffects.includes(StatusEffect.Stun) && toy.stats.hp > 0;
  }

  executeMove(
    attacker: Toy,
    defender: Toy,
    move: Move
  ): {
    damage: number;
    isCrit: boolean;
    statusApplied?: StatusEffect;
  } {
    const result: any = { damage: 0, isCrit: false };

    // Handle self-targeting moves
    const target = move.targetSelf ? attacker : defender;

    // Calculate and apply damage
    if (move.damage > 0 && !move.targetSelf) {
      const damageResult = this.calculateDamage(attacker, defender, move);
      this.applyDamage(defender, damageResult.damage);
      result.damage = damageResult.damage;
      result.isCrit = damageResult.isCrit;
    }

    // Apply status effects
    if (move.statusEffect) {
      this.applyStatusEffect(target, move.statusEffect, move.statusEffect === StatusEffect.Stun ? 1 : 2);
      result.statusApplied = move.statusEffect;
    }

    return result;
  }

  getTurnOrder(team1: Toy[], team2: Toy[]): Toy[] {
    const allToys = [...team1, ...team2].filter(t => t.stats.hp > 0);
    
    // Sort by speed, with random tiebreaker
    return allToys.sort((a, b) => {
      if (a.stats.speed === b.stats.speed) {
        return this.rng.next() > 0.5 ? 1 : -1;
      }
      return b.stats.speed - a.stats.speed;
    });
  }

  checkWinCondition(state: BattleState): 'player' | 'enemy' | null {
    const playerAlive = state.playerTeam.some(t => t.stats.hp > 0);
    const enemyAlive = state.enemyTeam.some(t => t.stats.hp > 0);

    if (!playerAlive) return 'enemy';
    if (!enemyAlive) return 'player';
    return null;
  }

  initBattleState(playerTeam: Toy[], enemyTeam: Toy[]): BattleState {
    // Reset HP for all toys
    [...playerTeam, ...enemyTeam].forEach(toy => {
      toy.stats.hp = toy.stats.maxHp;
      toy.statusEffects = [];
      toy.statusDuration = 0;
    });

    const turnOrder = this.getTurnOrder(playerTeam, enemyTeam);

    return {
      playerTeam,
      enemyTeam,
      currentTurn: 'player',
      turnOrder,
      currentToyIndex: 0,
      turnCount: 0
    };
  }

  nextTurn(state: BattleState): void {
    state.currentToyIndex++;
    
    if (state.currentToyIndex >= state.turnOrder.length) {
      // New round
      state.currentToyIndex = 0;
      state.turnCount++;
      state.turnOrder = this.getTurnOrder(state.playerTeam, state.enemyTeam);
      
      // Process status effects at round end
      [...state.playerTeam, ...state.enemyTeam].forEach(toy => {
        if (toy.stats.hp > 0) {
          this.processStatusEffects(toy);
        }
      });
    }

    // Find next active toy
    while (state.currentToyIndex < state.turnOrder.length) {
      const currentToy = state.turnOrder[state.currentToyIndex];
      if (currentToy.stats.hp > 0) {
        state.currentTurn = state.playerTeam.includes(currentToy) ? 'player' : 'enemy';
        break;
      }
      state.currentToyIndex++;
    }
  }
}