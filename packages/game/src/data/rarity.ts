export enum Rarity {
  Common = 'common',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
  Mythic = 'mythic'
}

// Mulberry32 seeded RNG
export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export const RARITY_ODDS = {
  [Rarity.Common]: 0.65,
  [Rarity.Rare]: 0.25,
  [Rarity.Epic]: 0.08,
  [Rarity.Legendary]: 0.019,
  [Rarity.Mythic]: 0.001
};

export const RARITY_STAT_BUDGET = {
  [Rarity.Common]: 90,
  [Rarity.Rare]: 100,
  [Rarity.Epic]: 112,
  [Rarity.Legendary]: 126,
  [Rarity.Mythic]: 140
};

export const RARITY_CRIT_BONUS = {
  [Rarity.Common]: 0,
  [Rarity.Rare]: 0,
  [Rarity.Epic]: 5,
  [Rarity.Legendary]: 8,
  [Rarity.Mythic]: 12
};

export const RARITY_COLORS = {
  [Rarity.Common]: 0x888888,
  [Rarity.Rare]: 0x4A90E2,
  [Rarity.Epic]: 0x9B59B6,
  [Rarity.Legendary]: 0xF39C12,
  [Rarity.Mythic]: 0xE74C3C
};

export const RARITY_GLOW = {
  [Rarity.Common]: { color: 0xffffff, intensity: 0.1 },
  [Rarity.Rare]: { color: 0x4A90E2, intensity: 0.3 },
  [Rarity.Epic]: { color: 0x9B59B6, intensity: 0.5 },
  [Rarity.Legendary]: { color: 0xF39C12, intensity: 0.7 },
  [Rarity.Mythic]: { color: 0xE74C3C, intensity: 1.0, rainbow: true }
};

export function rollRarity(rng: SeededRNG): Rarity {
  const roll = rng.next();
  let cumulative = 0;
  
  for (const [rarity, odds] of Object.entries(RARITY_ODDS)) {
    cumulative += odds;
    if (roll <= cumulative) {
      return rarity as Rarity;
    }
  }
  
  return Rarity.Common;
}

export function rollPackWithPity(rng: SeededRNG, count: number = 5): Rarity[] {
  const results: Rarity[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push(rollRarity(rng));
  }
  
  // Pity rule: ensure at least one Rare+
  const hasRareOrBetter = results.some(r => 
    r !== Rarity.Common
  );
  
  if (!hasRareOrBetter) {
    // Force upgrade one Common to Rare
    const commonIndex = results.findIndex(r => r === Rarity.Common);
    if (commonIndex !== -1) {
      results[commonIndex] = Rarity.Rare;
    }
  }
  
  return results;
}

export function distributeStatBudget(
  rarity: Rarity, 
  rng: SeededRNG
): { atk: number; def: number; hp: number; speed: number } {
  const budget = RARITY_STAT_BUDGET[rarity];
  
  // Random distribution with minimum values
  const minAtk = 15;
  const minDef = 10;
  const minHp = 20;
  const minSpeed = 10;
  
  const minTotal = minAtk + minDef + minHp + minSpeed;
  const remaining = budget - minTotal;
  
  // Distribute remaining points randomly
  const weights = [
    rng.next(), // ATK weight
    rng.next(), // DEF weight  
    rng.next(), // HP weight
    rng.next()  // SPEED weight
  ];
  
  const totalWeight = weights.reduce((a, b) => a + b);
  const distributions = weights.map(w => Math.floor(remaining * w / totalWeight));
  
  return {
    atk: minAtk + distributions[0],
    def: minDef + distributions[1],
    hp: minHp + distributions[2],
    speed: minSpeed + distributions[3]
  };
}