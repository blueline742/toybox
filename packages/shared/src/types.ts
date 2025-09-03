export enum Rarity {
  Common = 'common',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
  Mythic = 'mythic'
}

export enum StatusEffect {
  None = 'none',
  Stun = 'stun',
  Burn = 'burn',
  Shield = 'shield'
}

export interface ToyStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  critChance: number;
}

export interface Toy {
  id: string;
  name: string;
  rarity: Rarity;
  stats: ToyStats;
  sprite: string;
  moves: Move[];
  statusEffects: StatusEffect[];
  statusDuration: number;
  isNFT?: boolean;
  mint?: string;
}

export interface Move {
  id: string;
  name: string;
  damage: number;
  special?: boolean;
  statusEffect?: StatusEffect;
  soundEffect: string;
  animation: string;
  targetSelf?: boolean;
}

export interface BattleState {
  playerTeam: Toy[];
  enemyTeam: Toy[];
  currentTurn: 'player' | 'enemy';
  turnOrder: Toy[];
  currentToyIndex: number;
  winner?: 'player' | 'enemy';
  turnCount: number;
}

export interface PackResult {
  toys: Toy[];
  animationSeed: number;
}

export interface PlayerData {
  wallet?: string;
  starterToys: Toy[];
  nftToys: Toy[];
  wins: number;
  losses: number;
}