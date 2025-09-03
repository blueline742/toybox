import { Toy, Move, BattleState } from '../types';
import { CombatSystem } from './combat';

export class AISystem {
  private combat: CombatSystem;

  constructor(combat: CombatSystem) {
    this.combat = combat;
  }

  selectTarget(attacker: Toy, enemies: Toy[]): Toy | null {
    const aliveEnemies = enemies.filter(e => e.stats.hp > 0);
    if (aliveEnemies.length === 0) return null;

    // Priority 1: Lowest HP
    aliveEnemies.sort((a, b) => {
      if (a.stats.hp !== b.stats.hp) {
        return a.stats.hp - b.stats.hp;
      }
      // Priority 2: Highest ATK on tie
      return b.stats.atk - a.stats.atk;
    });

    return aliveEnemies[0];
  }

  evaluateMove(
    attacker: Toy,
    target: Toy,
    move: Move
  ): number {
    let score = 0;

    // Base score from damage
    if (move.damage > 0 && !move.targetSelf) {
      const potentialDamage = Math.max(1, 
        move.damage + attacker.stats.atk - Math.floor(target.stats.def / 2)
      );
      score += potentialDamage;

      // Bonus for lethal damage
      if (potentialDamage >= target.stats.hp) {
        score += 50;
      }
    }

    // Score for status effects
    if (move.statusEffect) {
      switch (move.statusEffect) {
        case 'stun':
          // Stun is valuable against high-speed enemies
          score += target.stats.speed * 0.5;
          break;
        case 'burn':
          // Burn is good for tanky enemies
          score += target.stats.hp * 0.1;
          break;
        case 'shield':
          // Shield is good when low health
          if (move.targetSelf) {
            const healthPercent = attacker.stats.hp / attacker.stats.maxHp;
            score += (1 - healthPercent) * 30;
          }
          break;
      }
    }

    // Prefer special moves when they would be impactful
    if (move.special && score >= 15) {
      score += 10;
    }

    return score;
  }

  selectMove(
    attacker: Toy,
    target: Toy | null,
    state: BattleState
  ): { move: Move; target: Toy | null } {
    if (!target) {
      // If no valid target, try a self-targeting move
      const selfMove = attacker.moves.find(m => m.targetSelf);
      return { move: selfMove || attacker.moves[0], target: attacker };
    }

    // Evaluate all moves
    const moveScores = attacker.moves.map(move => ({
      move,
      score: this.evaluateMove(attacker, target, move)
    }));

    // Sort by score
    moveScores.sort((a, b) => b.score - a.score);

    // Use special if it's high value
    const special = moveScores.find(m => m.move.special);
    if (special && special.score >= 15) {
      return { move: special.move, target };
    }

    // Otherwise use best scoring move
    return { move: moveScores[0].move, target };
  }

  makeDecision(state: BattleState): { move: Move; target: Toy } {
    const currentToy = state.turnOrder[state.currentToyIndex];
    
    // AI is controlling enemy team
    const enemies = state.playerTeam;
    const target = this.selectTarget(currentToy, enemies);
    
    const decision = this.selectMove(currentToy, target, state);
    
    return {
      move: decision.move,
      target: decision.target || currentToy
    };
  }
}