// Re-export all types
export { Rarity, SeededRNG } from './data/rarity';
export { 
  StatusEffect, 
  ToyStats, 
  Move, 
  Toy,
} from './data/toys';

export interface BattleState {
  playerTeam: Toy[];
  enemyTeam: Toy[];
  currentTurn: 'player' | 'enemy';
  turnOrder: Toy[];
  currentToyIndex: number;
  winner?: 'player' | 'enemy';
  turnCount: number;
}