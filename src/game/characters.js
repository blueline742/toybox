// Toy Fighter Character Data
export const CHARACTERS = {
  ROBO_FIGHTER: {
    id: 'robo_fighter',
    name: 'Robo Fighter',
    maxHealth: 100,
    color: '#5352ED',
    secondaryColor: '#40407a',
    emoji: '🤖',
    description: 'A high-tech robot toy with laser attacks',
    abilities: [
      {
        id: 'laser_blast',
        name: 'Laser Blast',
        damage: 25,
        cooldown: 0,
        manaCost: 20,
        description: 'Fires a concentrated laser beam',
        effect: 'damage',
        animation: 'laser_blast'
      },
      {
        id: 'shield_boost',
        name: 'Shield Boost',
        heal: 20,
        cooldown: 2,
        manaCost: 25,
        description: 'Activates energy shields for protection',
        effect: 'heal',
        animation: 'shield'
      },
      {
        id: 'rocket_punch',
        name: 'Rocket Punch',
        damage: 35,
        cooldown: 3,
        manaCost: 35,
        description: 'Launches a devastating rocket-powered punch',
        effect: 'damage',
        animation: 'explosion'
      }
    ],
    stats: {
      attack: 8,
      defense: 6,
      speed: 7
    }
  },

  TEDDY_WARRIOR: {
    id: 'teddy_warrior',
    name: 'Teddy Warrior',
    maxHealth: 120,
    color: '#CD6133',
    secondaryColor: '#8B4513',
    emoji: '🧸',
    description: 'A cuddly bear with fierce combat skills',
    abilities: [
      {
        id: 'bear_hug',
        name: 'Bear Hug',
        damage: 20,
        cooldown: 0,
        description: 'A crushing embrace that deals damage',
        effect: 'damage',
        animation: 'hug'
      },
      {
        id: 'honey_heal',
        name: 'Honey Heal',
        heal: 30,
        cooldown: 2,
        description: 'Restores health with magical honey',
        effect: 'heal',
        animation: 'honey'
      },
      {
        id: 'berserker_rage',
        name: 'Berserker Rage',
        damage: 40,
        cooldown: 4,
        description: 'Unleashes primal fury for massive damage',
        effect: 'damage',
        animation: 'rage'
      }
    ],
    stats: {
      attack: 7,
      defense: 9,
      speed: 5
    }
  },

  NINJA_TURTLE: {
    id: 'ninja_turtle',
    name: 'Ninja Turtle',
    maxHealth: 90,
    color: '#00d2d3',
    secondaryColor: '#0fb9b1',
    emoji: '🐢',
    description: 'Lightning-fast turtle with ninja skills',
    abilities: [
      {
        id: 'shuriken_throw',
        name: 'Shuriken Throw',
        damage: 22,
        cooldown: 0,
        description: 'Throws spinning star projectiles',
        effect: 'damage',
        animation: 'shuriken'
      },
      {
        id: 'shell_spin',
        name: 'Shell Spin',
        damage: 30,
        cooldown: 1,
        description: 'Spins rapidly dealing damage',
        effect: 'damage',
        animation: 'spin'
      },
      {
        id: 'smoke_bomb',
        name: 'Smoke Bomb',
        heal: 15,
        damage: 25,
        cooldown: 3,
        description: 'Creates confusion, heals and damages',
        effect: 'both',
        animation: 'smoke'
      }
    ],
    stats: {
      attack: 9,
      defense: 5,
      speed: 9
    }
  },

  DRAGON_MASTER: {
    id: 'dragon_master',
    name: 'Dragon Master',
    maxHealth: 110,
    color: '#FF6B6B',
    secondaryColor: '#C92A2A',
    emoji: '🐉',
    description: 'Ancient dragon with devastating fire attacks',
    abilities: [
      {
        id: 'fire_breath',
        name: 'Fire Breath',
        damage: 28,
        cooldown: 0,
        description: 'Breathes scorching flames',
        effect: 'damage',
        animation: 'fire'
      },
      {
        id: 'dragon_scales',
        name: 'Dragon Scales',
        heal: 25,
        cooldown: 2,
        description: 'Regenerates protective scales',
        effect: 'heal',
        animation: 'scales'
      },
      {
        id: 'meteor_storm',
        name: 'Meteor Storm',
        damage: 45,
        cooldown: 4,
        description: 'Calls down a meteor storm',
        effect: 'damage',
        animation: 'meteor'
      }
    ],
    stats: {
      attack: 10,
      defense: 7,
      speed: 6
    }
  },

  UNICORN_WARRIOR: {
    id: 'unicorn_warrior',
    name: 'Unicorn Warrior',
    maxHealth: 95,
    color: '#FF00FF',
    secondaryColor: '#CC00CC',
    emoji: '🦄',
    description: 'Magical unicorn with rainbow powers',
    abilities: [
      {
        id: 'rainbow_blast',
        name: 'Rainbow Blast',
        damage: 24,
        cooldown: 0,
        description: 'Shoots a rainbow beam',
        effect: 'damage',
        animation: 'rainbow'
      },
      {
        id: 'healing_aura',
        name: 'Healing Aura',
        heal: 35,
        cooldown: 3,
        description: 'Creates a magical healing field',
        effect: 'heal',
        animation: 'aura'
      },
      {
        id: 'horn_charge',
        name: 'Horn Charge',
        damage: 32,
        heal: 10,
        cooldown: 2,
        description: 'Charges with magical horn',
        effect: 'both',
        animation: 'charge'
      }
    ],
    stats: {
      attack: 7,
      defense: 8,
      speed: 8
    }
  },

  ALIEN_INVADER: {
    id: 'alien_invader',
    name: 'Alien Invader',
    maxHealth: 100,
    color: '#00FF00',
    secondaryColor: '#00CC00',
    emoji: '👽',
    description: 'Extraterrestrial fighter with cosmic powers',
    abilities: [
      {
        id: 'plasma_gun',
        name: 'Plasma Gun',
        damage: 26,
        cooldown: 0,
        description: 'Fires alien plasma bolts',
        effect: 'damage',
        animation: 'plasma'
      },
      {
        id: 'teleport',
        name: 'Teleport',
        heal: 20,
        damage: 20,
        cooldown: 2,
        description: 'Teleports and strikes',
        effect: 'both',
        animation: 'teleport'
      },
      {
        id: 'ufo_strike',
        name: 'UFO Strike',
        damage: 38,
        cooldown: 3,
        description: 'Calls in UFO backup',
        effect: 'damage',
        animation: 'ufo'
      }
    ],
    stats: {
      attack: 8,
      defense: 7,
      speed: 7
    }
  },

  PIRATE_CAPTAIN: {
    id: 'pirate_captain',
    name: 'Pirate Captain',
    maxHealth: 105,
    color: '#8B4513',
    secondaryColor: '#654321',
    emoji: '🏴‍☠️',
    description: 'Swashbuckling pirate with explosive attacks',
    abilities: [
      {
        id: 'cannon_blast',
        name: 'Cannon Blast',
        damage: 30,
        cooldown: 1,
        description: 'Fires a cannon ball',
        effect: 'damage',
        animation: 'cannon'
      },
      {
        id: 'grog_heal',
        name: 'Grog Heal',
        heal: 28,
        cooldown: 2,
        description: 'Drinks healing grog',
        effect: 'heal',
        animation: 'grog'
      },
      {
        id: 'kraken_summon',
        name: 'Kraken Summon',
        damage: 42,
        cooldown: 4,
        description: 'Summons the mighty Kraken',
        effect: 'damage',
        animation: 'kraken'
      }
    ],
    stats: {
      attack: 8,
      defense: 8,
      speed: 6
    }
  },

  WIZARD_TOY: {
    id: 'wizard_toy',
    name: 'Wizard Toy',
    maxHealth: 85,
    color: '#9370DB',
    secondaryColor: '#7B68EE',
    emoji: '🧙',
    description: 'Mystical wizard with powerful spells',
    abilities: [
      {
        id: 'magic_missile',
        name: 'Magic Missile',
        damage: 20,
        cooldown: 0,
        description: 'Casts magic missiles',
        effect: 'damage',
        animation: 'missile'
      },
      {
        id: 'time_freeze',
        name: 'Time Freeze',
        damage: 35,
        cooldown: 3,
        description: 'Freezes time and strikes',
        effect: 'damage',
        animation: 'freeze'
      },
      {
        id: 'arcane_shield',
        name: 'Arcane Shield',
        heal: 40,
        cooldown: 3,
        description: 'Creates magical shield',
        effect: 'heal',
        animation: 'shield'
      }
    ],
    stats: {
      attack: 9,
      defense: 4,
      speed: 7
    }
  }
}

// AI behavior patterns
export const AI_PATTERNS = {
  AGGRESSIVE: {
    name: 'Aggressive',
    damageChance: 0.7,
    healChance: 0.3,
    specialChance: 0.4
  },
  DEFENSIVE: {
    name: 'Defensive',
    damageChance: 0.4,
    healChance: 0.6,
    specialChance: 0.3
  },
  BALANCED: {
    name: 'Balanced',
    damageChance: 0.5,
    healChance: 0.4,
    specialChance: 0.35
  }
}

// Get a random AI character (not the player's choice)
export const getRandomAICharacter = (excludeId = null) => {
  const availableCharacters = Object.values(CHARACTERS).filter(char => char.id !== excludeId)
  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)]
}

// Get AI behavior pattern based on character
export const getAIPattern = (character) => {
  switch (character.id) {
    case 'robo_fighter':
      return AI_PATTERNS.BALANCED
    case 'teddy_warrior':
      return AI_PATTERNS.DEFENSIVE
    case 'ninja_turtle':
      return AI_PATTERNS.AGGRESSIVE
    default:
      return AI_PATTERNS.BALANCED
  }
}