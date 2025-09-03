// Power-ups and Special Abilities
export const POWER_UPS = {
  MEGA_BOOST: {
    id: 'mega_boost',
    name: 'Mega Boost',
    icon: '⚡',
    color: '#FFD700',
    duration: 3,
    effect: {
      damageMultiplier: 2,
      description: 'Double damage for 3 turns!'
    }
  },
  SHIELD_WALL: {
    id: 'shield_wall',
    name: 'Shield Wall',
    icon: '🛡️',
    color: '#4169E1',
    duration: 2,
    effect: {
      damageReduction: 0.5,
      description: 'Take 50% less damage for 2 turns!'
    }
  },
  RAPID_FIRE: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    icon: '🔥',
    color: '#FF4500',
    duration: 1,
    effect: {
      extraTurn: true,
      description: 'Take an extra turn immediately!'
    }
  },
  HEALTH_SURGE: {
    id: 'health_surge',
    name: 'Health Surge',
    icon: '❤️',
    color: '#FF1493',
    effect: {
      instantHeal: 40,
      description: 'Instantly restore 40 HP!'
    }
  },
  TIME_WARP: {
    id: 'time_warp',
    name: 'Time Warp',
    icon: '⏰',
    color: '#9370DB',
    duration: 1,
    effect: {
      resetCooldowns: true,
      description: 'Reset all ability cooldowns!'
    }
  },
  CHAOS_STORM: {
    id: 'chaos_storm',
    name: 'Chaos Storm',
    icon: '🌀',
    color: '#FF00FF',
    effect: {
      randomDamage: { min: 10, max: 50 },
      description: 'Deal 10-50 random damage!'
    }
  }
}

// Special combo moves
export const COMBO_MOVES = {
  TRIPLE_STRIKE: {
    id: 'triple_strike',
    name: 'Triple Strike',
    requiredHits: 3,
    damage: 45,
    icon: '💫',
    description: 'Land 3 hits in a row for massive damage!'
  },
  PERFECT_DEFENSE: {
    id: 'perfect_defense',
    name: 'Perfect Defense',
    requiredBlocks: 3,
    heal: 50,
    icon: '✨',
    description: 'Block 3 attacks to gain health!'
  },
  ULTIMATE_COMBO: {
    id: 'ultimate_combo',
    name: 'Ultimate Combo',
    requiredCombo: 5,
    damage: 75,
    icon: '🌟',
    description: '5 hit combo unleashes ultimate power!'
  }
}

// Arena environments with special effects
export const ARENAS = {
  SPACE_STATION: {
    id: 'space_station',
    name: 'Space Station',
    background: '/assets/backgrounds/space-bg.jpg',
    particleEffect: 'stars',
    ambientColor: '#1a0033',
    specialEffect: {
      type: 'low_gravity',
      description: 'Reduced cooldowns in zero gravity'
    }
  },
  CYBER_CITY: {
    id: 'cyber_city',
    name: 'Cyber City',
    background: '/assets/backgrounds/cyberpunk-bg.jpg',
    particleEffect: 'neon',
    ambientColor: '#ff00ff',
    specialEffect: {
      type: 'tech_boost',
      description: 'Tech abilities deal +10% damage'
    }
  },
  VOLCANO_PIT: {
    id: 'volcano_pit',
    name: 'Volcano Pit',
    background: '/assets/backgrounds/volcano-bg.jpg',
    particleEffect: 'fire',
    ambientColor: '#ff4500',
    specialEffect: {
      type: 'burn_damage',
      description: 'All attacks have chance to burn'
    }
  },
  CRYSTAL_CAVE: {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    background: '/assets/backgrounds/crystal-bg.jpg',
    particleEffect: 'crystals',
    ambientColor: '#00ffff',
    specialEffect: {
      type: 'magic_amplify',
      description: 'Healing effects increased by 20%'
    }
  },
  GALAXY_CORE: {
    id: 'galaxy_core',
    name: 'Galaxy Core',
    background: '/assets/backgrounds/galaxy-bg.jpg',
    particleEffect: 'cosmos',
    ambientColor: '#4b0082',
    specialEffect: {
      type: 'chaos_realm',
      description: 'Random power-ups appear each turn'
    }
  }
}

// Achievement system
export const ACHIEVEMENTS = {
  FIRST_BLOOD: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first battle',
    icon: '🏆',
    points: 10
  },
  FLAWLESS_VICTORY: {
    id: 'flawless_victory',
    name: 'Flawless Victory',
    description: 'Win without taking damage',
    icon: '💎',
    points: 50
  },
  COMBO_MASTER: {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Land a 5-hit combo',
    icon: '⭐',
    points: 30
  },
  SURVIVOR: {
    id: 'survivor',
    name: 'Survivor',
    description: 'Win with less than 10 HP',
    icon: '💪',
    points: 40
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win in under 5 turns',
    icon: '⚡',
    points: 35
  },
  COLLECTOR: {
    id: 'collector',
    name: 'Collector',
    description: 'Use 10 different power-ups',
    icon: '📦',
    points: 25
  }
}

// Generate random power-up
export const getRandomPowerUp = () => {
  const powerUps = Object.values(POWER_UPS)
  return powerUps[Math.floor(Math.random() * powerUps.length)]
}

// Check combo conditions
export const checkCombo = (moveHistory) => {
  if (moveHistory.length < 3) return null
  
  const lastMoves = moveHistory.slice(-5)
  
  // Check for triple strike
  if (lastMoves.slice(-3).every(m => m.type === 'damage' && m.hit)) {
    return COMBO_MOVES.TRIPLE_STRIKE
  }
  
  // Check for perfect defense
  if (lastMoves.slice(-3).every(m => m.type === 'blocked')) {
    return COMBO_MOVES.PERFECT_DEFENSE
  }
  
  // Check for ultimate combo
  if (lastMoves.length === 5 && lastMoves.every(m => m.hit)) {
    return COMBO_MOVES.ULTIMATE_COMBO
  }
  
  return null
}