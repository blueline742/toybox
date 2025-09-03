import { RARITY_CRIT_BONUS, distributeStatBudget, Rarity, SeededRNG } from './rarity';

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

// Move definitions
export const MOVES: Record<string, Move> = {
  laserZap: {
    id: 'laser_zap',
    name: 'Laser Zap',
    damage: 12,
    soundEffect: 'zap.wav',
    animation: 'zap'
  },
  overcharge: {
    id: 'overcharge',
    name: 'Overcharge',
    damage: 20,
    special: true,
    statusEffect: StatusEffect.Burn,
    soundEffect: 'zap.wav',
    animation: 'overcharge'
  },
  bite: {
    id: 'bite',
    name: 'Bite',
    damage: 14,
    soundEffect: 'chomp.wav',
    animation: 'bite'
  },
  roar: {
    id: 'roar',
    name: 'Mighty Roar',
    damage: 8,
    special: true,
    statusEffect: StatusEffect.Stun,
    soundEffect: 'roar.wav',
    animation: 'roar'
  },
  squeak: {
    id: 'squeak',
    name: 'Squeak',
    damage: 6,
    soundEffect: 'squeak.wav',
    animation: 'squeak'
  },
  squeakStun: {
    id: 'squeak_stun',
    name: 'Sonic Squeak',
    damage: 10,
    special: true,
    statusEffect: StatusEffect.Stun,
    soundEffect: 'squeak.wav',
    animation: 'sonic_squeak'
  },
  shieldRaise: {
    id: 'shield_raise',
    name: 'Shield Up',
    damage: 0,
    statusEffect: StatusEffect.Shield,
    targetSelf: true,
    soundEffect: 'clack.wav',
    animation: 'shield'
  },
  rifleShot: {
    id: 'rifle_shot',
    name: 'Rifle Shot',
    damage: 16,
    special: true,
    soundEffect: 'clack.wav',
    animation: 'shoot'
  },
  lineStrike: {
    id: 'line_strike',
    name: 'Line Strike',
    damage: 13,
    soundEffect: 'whoosh.wav',
    animation: 'yo_strike'
  },
  spinTrick: {
    id: 'spin_trick',
    name: 'Spin Trick',
    damage: 18,
    special: true,
    soundEffect: 'whoosh.wav',
    animation: 'yo_spin'
  },
  ram: {
    id: 'ram',
    name: 'Ram',
    damage: 11,
    soundEffect: 'engine.wav',
    animation: 'ram'
  },
  shockwave: {
    id: 'shockwave',
    name: 'Shockwave',
    damage: 22,
    special: true,
    soundEffect: 'boom.wav',
    animation: 'shockwave'
  },
  springPop: {
    id: 'spring_pop',
    name: 'Spring Pop',
    damage: 25,
    special: true,
    soundEffect: 'boing.wav',
    animation: 'spring_pop'
  },
  surprise: {
    id: 'surprise',
    name: 'Surprise!',
    damage: 8,
    statusEffect: StatusEffect.Stun,
    soundEffect: 'boing.wav',
    animation: 'surprise'
  },
  slap: {
    id: 'slap',
    name: 'Bear Slap',
    damage: 15,
    soundEffect: 'thud.wav',
    animation: 'slap'
  },
  bearHug: {
    id: 'bear_hug',
    name: 'Bear Hug',
    damage: 18,
    special: true,
    statusEffect: StatusEffect.Shield,
    targetSelf: true,
    soundEffect: 'thud.wav',
    animation: 'hug'
  }
};

// Toy templates
export const TOY_TEMPLATES = {
  robot: {
    id: 'robot',
    name: 'Wind-Up Robot',
    sprite: 'robot.png',
    moves: [MOVES.laserZap, MOVES.overcharge],
    baseStats: { atk: 22, def: 18, hp: 30, speed: 20 }
  },
  dino: {
    id: 'dino',
    name: 'Plastic Dino',
    sprite: 'dino.png',
    moves: [MOVES.bite, MOVES.roar],
    baseStats: { atk: 25, def: 15, hp: 35, speed: 15 }
  },
  duck: {
    id: 'duck',
    name: 'Squeaky Duck',
    sprite: 'duck.png',
    moves: [MOVES.squeak, MOVES.squeakStun],
    baseStats: { atk: 15, def: 12, hp: 28, speed: 35 }
  },
  army: {
    id: 'army',
    name: 'Army Man',
    sprite: 'army.png',
    moves: [MOVES.shieldRaise, MOVES.rifleShot],
    baseStats: { atk: 20, def: 25, hp: 32, speed: 13 }
  },
  yoyo: {
    id: 'yoyo',
    name: 'Yo-Yo Spinner',
    sprite: 'yoyo.png',
    moves: [MOVES.lineStrike, MOVES.spinTrick],
    baseStats: { atk: 23, def: 14, hp: 28, speed: 25 }
  },
  rc: {
    id: 'rc',
    name: 'RC Car',
    sprite: 'rc.png',
    moves: [MOVES.ram, MOVES.shockwave],
    baseStats: { atk: 21, def: 16, hp: 30, speed: 23 }
  },
  jack: {
    id: 'jack',
    name: 'Jack-in-the-Box',
    sprite: 'jack.png',
    moves: [MOVES.surprise, MOVES.springPop],
    baseStats: { atk: 28, def: 10, hp: 27, speed: 25 }
  },
  teddy: {
    id: 'teddy',
    name: 'Teddy Bruiser',
    sprite: 'teddy.png',
    moves: [MOVES.slap, MOVES.bearHug],
    baseStats: { atk: 24, def: 22, hp: 38, speed: 6 }
  }
};

// Starter toys (always Common)
export const STARTER_TOY_IDS = ['robot', 'dino', 'duck'];

// Mintable toys pool
export const MINTABLE_TOY_IDS = ['army', 'yoyo', 'rc', 'jack', 'teddy'];

export function createToy(
  templateId: string,
  rarity: Rarity,
  rng?: SeededRNG,
  isNFT: boolean = false,
  mint?: string
): Toy {
  const template = TOY_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown toy template: ${templateId}`);
  }

  // For deterministic stats or use random
  let stats: ReturnType<typeof distributeStatBudget>;
  
  if (rng) {
    stats = distributeStatBudget(rarity, rng);
  } else {
    // Use base stats adjusted for rarity
    const multiplier = {
      [Rarity.Common]: 1.0,
      [Rarity.Rare]: 1.11,
      [Rarity.Epic]: 1.24,
      [Rarity.Legendary]: 1.40,
      [Rarity.Mythic]: 1.55
    }[rarity];
    
    stats = {
      atk: Math.floor(template.baseStats.atk * multiplier),
      def: Math.floor(template.baseStats.def * multiplier),
      hp: Math.floor(template.baseStats.hp * multiplier),
      speed: Math.floor(template.baseStats.speed * multiplier)
    };
  }

  const critChance = 10 + RARITY_CRIT_BONUS[rarity];

  const toyStats: ToyStats = {
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    speed: stats.speed,
    critChance
  };

  const toy: Toy = {
    id: `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    rarity,
    stats: toyStats,
    sprite: template.sprite,
    moves: [...template.moves],
    statusEffects: [],
    statusDuration: 0,
    isNFT,
    mint
  };

  return toy;
}

export function createStarterToys(): Toy[] {
  return STARTER_TOY_IDS.map(id => 
    createToy(id, Rarity.Common, undefined, false)
  );
}

export function generatePackToys(rng: SeededRNG, rarities: Rarity[]): Toy[] {
  const allToyIds = [...STARTER_TOY_IDS, ...MINTABLE_TOY_IDS];
  
  return rarities.map(rarity => {
    const toyId = allToyIds[rng.nextInt(0, allToyIds.length - 1)];
    return createToy(toyId, rarity, rng, true);
  });
}