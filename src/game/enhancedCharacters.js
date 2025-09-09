// Default stats based on rarity
const DEFAULT_STATS = {
  common: { attack: 5, defense: 5 },
  rare: { attack: 7, defense: 6 },
  epic: { attack: 8, defense: 7 },
  legendary: { attack: 9, defense: 8 },
  mythic: { attack: 10, defense: 10 }
}

// Enhanced Toy Fighter Character Data with Ultimate Abilities
export const ENHANCED_CHARACTERS = {
  ROBO_FIGHTER: {
    id: 'robo_fighter',
    name: 'Robot Guardian',
    maxHealth: 100,
    color: '#5352ED',
    emoji: '🤖',
    image: '/robot.png',
    selectSound: '/robot.wav',
    abilitySound: '/robot.wav',
    rarity: 'epic',
    description: 'A high-tech robot toy with laser attacks',
    stats: {
      attack: 8,
      defense: 6
    },
    abilities: [
      {
        id: 'laser_blast',
        name: 'Laser Blast',
        damage: 25,
        chance: 0.45, // 45% chance
        description: 'Fires a concentrated laser beam',
        effect: 'damage',
        animation: 'laser_blast',
        priority: 1
      },
      {
        id: 'shield_boost',
        name: 'Shield Boost',
        shield: 30,
        chance: 0.45, // 45% chance
        description: 'Activates a persistent energy shield that absorbs damage',
        effect: 'shield',
        animation: 'shield',
        priority: 2
      },
      {
        id: 'recharge_batteries',
        name: 'RECHARGE BATTERIES',
        healAll: 50,
        revive: true,
        chance: 0.10, // 10% chance - ULTIMATE
        description: 'Revives fallen allies and heals all teammates with electric energy!',
        effect: 'heal_revive_all',
        animation: 'recharge_batteries',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  TEDDY_WARRIOR: {
    id: 'teddy_warrior',
    name: 'Teddy Warrior',
    maxHealth: 120,
    color: '#CD6133',
    emoji: '🧸',
    image: '/assets/images/warriornft.png',
    rarity: 'rare',
    description: 'A cuddly bear with fierce combat skills',
    abilities: [
      {
        id: 'bear_hug',
        name: 'Bear Hug',
        damage: 20,
        chance: 0.50, // 50% chance
        description: 'A crushing embrace',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'honey_heal',
        name: 'Honey Heal',
        heal: 30,
        chance: 0.40, // 40% chance
        description: 'Restores health with magical honey',
        effect: 'heal',
        animation: 'healing_aura',
        priority: 2
      },
      {
        id: 'berserker_rage',
        name: 'BERSERKER RAGE',
        damage: 65,
        chance: 0.10, // 10% chance - easier ultimate for common
        description: 'Unleashes primal fury!',
        effect: 'damage',
        animation: 'explosion',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  NINJA_TURTLE: {
    id: 'ninja_turtle',
    name: 'Bath Turtle',
    maxHealth: 90,
    color: '#00d2d3',
    emoji: '🐢',
    image: '/bathturtle.jpeg',
    selectSound: '/bathturtle.wav',
    abilitySound: '/bathturtle1.wav',
    rarity: 'common',
    description: 'Lightning-fast turtle with ninja skills',
    abilities: [
      {
        id: 'shuriken_throw',
        name: 'Shuriken Throw',
        damage: 22,
        chance: 0.45, // 45% chance
        description: 'Throws spinning star projectiles',
        effect: 'damage',
        animation: 'ice_shard',
        priority: 1
      },
      {
        id: 'smoke_bomb',
        name: 'Smoke Bomb',
        heal: 15,
        damage: 15,
        chance: 0.35, // 35% chance
        description: 'Creates confusion',
        effect: 'both',
        animation: 'poison_cloud',
        priority: 2
      },
      {
        id: 'shadow_clone_jutsu',
        name: 'SHADOW CLONE JUTSU',
        damage: 35,
        hits: 3, // Hits 3 times!
        chance: 0.08, // 8% chance - ULTIMATE
        description: 'Creates shadow clones for triple attack!',
        effect: 'multi_damage',
        animation: 'teleport',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  DRAGON_MASTER: {
    id: 'dragon_master',
    name: 'Dragon Rider',
    maxHealth: 110,
    color: '#FF6B6B',
    emoji: '🐉',
    image: '/dragonrider.jpeg',
    rarity: 'legendary',
    description: 'Ancient dragon with devastating fire attacks',
    abilities: [
      {
        id: 'fire_breath',
        name: 'Fire Breath',
        damage: 28,
        chance: 0.40, // 40% chance
        description: 'Breathes scorching flames',
        effect: 'damage',
        animation: 'fire_breath',
        priority: 1
      },
      {
        id: 'dragon_scales',
        name: 'Dragon Scales',
        heal: 25,
        chance: 0.30, // 30% chance
        description: 'Regenerates protective scales',
        effect: 'heal',
        animation: 'shield',
        priority: 2
      },
      {
        id: 'apocalypse_storm',
        name: 'APOCALYPSE STORM',
        damage: 120,
        chance: 0.03, // 3% chance - LEGENDARY ULTIMATE!
        description: 'UNLEASHES THE DRAGON\'S WRATH!',
        effect: 'damage_all', // Hits ALL enemies!
        animation: 'meteor_storm',
        isUltimate: true,
        isLegendary: true,
        priority: 3
      }
    ]
  },

  UNICORN_WARRIOR: {
    id: 'unicorn_warrior',
    name: 'Magic Unicorn',
    maxHealth: 95,
    color: '#FF00FF',
    emoji: '🦄',
    image: '/unicorn.png',
    rarity: 'epic',
    description: 'Magical unicorn with rainbow powers',
    abilities: [
      {
        id: 'rainbow_blast',
        name: 'Rainbow Blast',
        damage: 24,
        chance: 0.50, // 50% chance
        description: 'Shoots a rainbow beam',
        effect: 'damage',
        animation: 'rainbow_blast',
        priority: 1
      },
      {
        id: 'magic_shield',
        name: 'Magic Shield',
        shield: 20,
        heal: 15,
        chance: 0.35, // 35% chance
        description: 'Creates a protective magical shield',
        effect: 'shield',
        animation: 'magic_shield',
        priority: 2
      },
      {
        id: 'prismatic_storm',
        name: 'PRISMATIC STORM',
        damage: 40,
        chance: 0.15, // 15% chance - LEGENDARY ULTIMATE!
        description: 'Rainbow destruction rains from above!',
        effect: 'damage_all',
        animation: 'prismatic_storm',
        isUltimate: true,
        isLegendary: true,
        priority: 3
      }
    ]
  },

  SQUISHY_ALIEN: {
    id: 'squishy_alien',
    name: 'Squishy Alien',
    maxHealth: 100,
    color: '#00FF00',
    emoji: '👽',
    image: '/alien.jpeg',
    rarity: 'common',
    description: 'A soft, gooey alien with stretchy powers',
    abilities: [
      {
        id: 'goo_blast',
        name: 'Goo Blast',
        damage: 26,
        chance: 0.45, // 45% chance
        description: 'Shoots sticky alien goo',
        effect: 'damage',
        animation: 'poison_cloud',
        priority: 1
      },
      {
        id: 'squish_and_bounce',
        name: 'Squish and Bounce',
        heal: 20,
        damage: 20,
        chance: 0.35, // 35% chance
        description: 'Squishes to dodge and bounces back',
        effect: 'both',
        animation: 'teleport',
        priority: 2
      },
      {
        id: 'alien_stretch',
        name: 'MEGA STRETCH',
        damage: 75,
        chance: 0.06, // 6% chance - ULTIMATE
        description: 'Stretches to enormous size!',
        effect: 'damage',
        animation: 'meteor_storm',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  PIRATE_CAPTAIN: {
    id: 'pirate_captain',
    name: 'Pirate Captain',
    maxHealth: 105,
    color: '#8B4513',
    emoji: '🦜',
    image: '/pirate.png',
    rarity: 'common',
    description: 'Swashbuckling pirate with explosive attacks',
    abilities: [
      {
        id: 'cannon_blast',
        name: 'Cannon Blast',
        damage: 30,
        chance: 0.45, // 45% chance
        description: 'Fires a cannon ball',
        effect: 'damage',
        animation: 'explosion',
        priority: 1
      },
      {
        id: 'grog_heal',
        name: 'Grog Heal',
        heal: 28,
        chance: 0.40, // 40% chance
        description: 'Drinks healing grog',
        effect: 'heal',
        animation: 'healing_aura',
        priority: 2
      },
      {
        id: 'kraken_summon',
        name: 'RELEASE THE KRAKEN',
        damage: 50,
        hits: 2, // Hits twice!
        chance: 0.08, // 8% chance - ULTIMATE
        description: 'Summons the mighty Kraken!',
        effect: 'multi_damage',
        animation: 'poison_cloud',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  WIZARD_TOY: {
    id: 'wizard_toy',
    name: 'Wizard Toy',
    maxHealth: 85,
    color: '#9370DB',
    emoji: '🧙',
    image: '/assets/images/wizardnft.png',
    rarity: 'legendary',
    description: 'Elemental wizard master of fire, ice, and lightning',
    abilities: [
      {
        id: 'pyroblast',
        name: 'Pyroblast',
        damage: 35,
        chance: 0.6, // 60% chance - primary spell for testing targeting
        description: 'Hurls a massive fireball that explodes on impact',
        effect: 'damage',
        animation: 'pyroblast',
        priority: 1
      },
      {
        id: 'lightning_zap',
        name: 'Lightning Zap',
        damage: 25,
        chance: 0.2, // 20% chance
        description: 'Strikes enemies with chain lightning',
        effect: 'damage_chain',
        animation: 'lightning_zap',
        priority: 2
      },
      {
        id: 'ice_nova',
        name: 'ICE NOVA',
        damage: 15,
        freeze: true,
        chance: 0.2, // 20% chance - reduced for testing
        description: 'Freezes all enemies in ice, making them skip their next turn!',
        effect: 'freeze_all',
        animation: 'ice_nova',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  PHOENIX_DRAGON: {
    id: 'phoenix_dragon',
    name: 'Phoenix Dragon',
    maxHealth: 100,
    color: '#FFA500',
    emoji: '🐲',
    image: '/phoenix.jpeg',
    selectSound: '/phoenix.wav',
    abilitySound: '/phoenix.wav',
    rarity: 'mythic',
    description: 'Legendary dragon-phoenix hybrid with devastating fire powers',
    abilities: [
      {
        id: 'dragon_claw_strike',
        name: 'Dragon Claw Strike',
        damage: 30,
        chance: 0.55, // 55% chance (increased since removing one ability)
        description: 'Slashes with burning dragon claws',
        effect: 'damage',
        animation: 'dragon_claw',
        priority: 1
      },
      {
        id: 'inferno_wing_sweep',
        name: 'Inferno Wing Sweep',
        damage: 45,
        burn: true,
        chance: 0.35, // 35% chance
        description: 'Sweeps burning wings dealing damage over time',
        effect: 'damage_burn',
        animation: 'wing_sweep',
        priority: 2
      },
      {
        id: 'dragon_rebirth_apocalypse',
        name: 'DRAGON REBIRTH APOCALYPSE',
        damage: 200,
        heal: 150,
        chance: 0.10, // 10% chance - MYTHIC ULTIMATE! (increased slightly)
        description: 'TRANSFORMS INTO ANCIENT DRAGON-PHOENIX AND UNLEASHES ARMAGEDDON!',
        effect: 'apocalypse', // Massive damage to all, full heal and buff to self!
        animation: 'dragon_apocalypse',
        isUltimate: true,
        isMythic: true,
        priority: 3
      }
    ]
  },

  // ===== NEW COMMON TOYS =====
  RUBBER_DUCKIE: {
    id: 'rubber_duckie',
    name: 'Rubber Duckie',
    maxHealth: 85,
    color: '#FFD700',
    emoji: '🦆',
    image: '/duckiepp.jpg',
    selectSound: '/duckie.wav',
    abilitySound: '/duckie1.wav',
    ultimateSound: '/duckie2.wav',
    rarity: 'common',
    description: 'Bath time warrior with splashy attacks',
    abilities: [
      {
        id: 'splash_peck',
        name: 'Splash Peck',
        damage: 18,
        chance: 0.50,
        description: 'Light peck attack on random enemy',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'soap_spray',
        name: 'Soap Spray',
        damage: 10,
        chance: 0.40,
        description: 'Sprays soap to lower enemy accuracy',
        effect: 'debuff_accuracy',
        animation: 'default',
        priority: 2
      },
      {
        id: 'duck_swarm',
        name: 'DUCK SWARM',
        damage: 40,
        chance: 0.10,
        description: 'Summons a flock to peck all enemies!',
        effect: 'damage_all',
        animation: 'default',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  BRICK_DUDE: {
    id: 'brick_dude',
    name: 'Brick Dude',
    maxHealth: 90,
    color: '#DC143C',
    emoji: '🧱',
    image: '/legopp.jpg',
    selectSound: '/duckie.wav',
    abilitySound: '/duckie1.wav',
    ultimateSound: '/duckie2.wav',
    rarity: 'common',
    description: 'A master builder warrior with sword and shield',
    abilities: [
      {
        id: 'sword_slash',
        name: 'Sword Slash',
        damage: 25,
        chance: 0.35, // 35% chance
        description: 'Slashes enemy with a brick sword',
        effect: 'damage',
        animation: 'sword_slash',
        priority: 1,
        targetType: 'single'
      },
      {
        id: 'block_defence',
        name: 'Block Defence',
        shield: 15,
        chance: 0.55, // 55% chance
        description: 'Shields all allies with 15 damage protection',
        effect: 'shield_all',
        animation: 'block_shield',
        priority: 2,
        targetType: 'all_allies'
      },
      {
        id: 'whirlwind_slash',
        name: 'WHIRLWIND SLASH',
        damage: 35,
        chance: 0.10, // 10% chance
        description: 'Spins with sword hitting all enemies (100%, 60%, 30% damage)',
        effect: 'damage_cascade',
        animation: 'whirlwind',
        isUltimate: true,
        priority: 3,
        targetType: 'all_enemies',
        cascadeDamage: [1.0, 0.6, 0.3]
      }
    ]
  },

  WIND_UP_SOLDIER: {
    id: 'wind_up_soldier',
    name: 'Wind-Up Soldier',
    maxHealth: 95,
    color: '#556B2F',
    emoji: '⚙️',
    image: '/winduppp.jpg',
    rarity: 'common',
    description: 'Mechanical soldier that never stops marching',
    abilities: [
      {
        id: 'march_attack',
        name: 'March Attack',
        damage: 20,
        chance: 0.50,
        description: 'Single-target military strike',
        effect: 'damage',
        animation: 'sword_slash',
        priority: 1,
        targetType: 'single'
      },
      {
        id: 'wind_tension',
        name: 'Wind Tension',
        damage: 0,
        buffDamage: 15,
        chance: 0.25,
        description: 'Buffs all allies next attack by +15 damage',
        effect: 'buff_damage_all',
        animation: 'wind_up',
        priority: 2,
        targetType: 'all_allies'
      },
      {
        id: 'forward_march',
        name: 'FORWARD MARCH',
        damage: 0,
        criticalBoost: 0.5,
        chance: 0.25,
        description: 'Increases critical strike chance of all allies by 50% permanently!',
        effect: 'buff_critical_all',
        animation: 'march_forward',
        isUltimate: true,
        priority: 3,
        targetType: 'all_allies'
      }
    ]
  },

  WOODEN_BLOCK_GOLEM: {
    id: 'wooden_block_golem',
    name: 'Block Golem',
    maxHealth: 130,
    color: '#8B4513',
    emoji: '🧱',
    image: '/golumpp.jpg',
    rarity: 'common',
    description: 'Sturdy wooden blocks come to life',
    abilities: [
      {
        id: 'block_smash',
        name: 'Block Smash',
        damage: 25,
        chance: 0.45,
        description: 'Heavy strike with slow speed',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'stack_up',
        name: 'Stack Up',
        damage: 0,
        chance: 0.45,
        description: 'Stacks blocks to raise defense',
        effect: 'buff_defense',
        animation: 'default',
        priority: 2
      },
      {
        id: 'collapse',
        name: 'COLLAPSE',
        damage: 50,
        chance: 0.10,
        description: 'Falls apart crushing all enemies!',
        effect: 'damage_all',
        animation: 'default',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  // ===== NEW RARE TOYS =====
  RUBIKS_CUBE: {
    id: 'rubiks_cube',
    name: "Rubik's Cube",
    maxHealth: 110,
    color: '#FF6347',
    emoji: '🎲',
    image: '/rubikspp.png',
    rarity: 'common',
    description: 'A magical puzzle cube with reality-warping powers',
    abilities: [
      {
        id: 'color_blast',
        name: 'Color Blast',
        damage: 24,
        chance: 0.45,
        description: 'Blasts enemies with colorful energy',
        effect: 'damage',
        animation: 'laser_blast',
        priority: 1
      },
      {
        id: 'puzzle_solve',
        name: 'Puzzle Solve',
        heal: 25,
        chance: 0.45,
        description: 'Solves itself to restore health',
        effect: 'heal',
        animation: 'healing_aura',
        priority: 2
      },
      {
        id: 'reality_scramble',
        name: 'REALITY SCRAMBLE',
        damage: 35,
        chance: 0.10,
        description: 'Scrambles reality itself!',
        effect: 'damage',
        animation: 'chaos_storm',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  THE_PUPPET: {
    id: 'the_puppet',
    name: 'The Puppet',
    maxHealth: 100,
    color: '#8B4513',
    emoji: '🎭',
    image: '/puppetpp.png',
    rarity: 'common',
    description: 'A mysterious marionette with enchanted strings',
    abilities: [
      {
        id: 'string_slash',
        name: 'String Slash',
        damage: 26,
        chance: 0.45,
        description: 'Whips with enchanted strings',
        effect: 'damage',
        animation: 'ice_shard',
        priority: 1
      },
      {
        id: 'puppet_dance',
        name: 'Puppet Dance',
        damage: 35,
        chance: 0.45,
        description: 'Mesmerizing dance that confuses enemies',
        effect: 'damage',
        animation: 'teleport',
        priority: 2
      },
      {
        id: 'puppet_master',
        name: 'PUPPET MASTER',
        damage: 25,
        hits: 4,
        chance: 0.10,
        description: 'Controls enemies like puppets!',
        effect: 'multi_random',
        animation: 'chaos_storm',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  // ===== NEW EPIC TOYS =====
  MECHA_DINO: {
    id: 'mecha_dino',
    name: 'Mecha Dino',
    maxHealth: 115,
    color: '#008080',
    emoji: '🦕',
    image: '/mechadinopp.jpg',
    selectSound: '/mechadino.wav',
    abilitySound: '/mechadino1.wav',
    ultimateSound: '/mechadino2.wav',
    rarity: 'epic',
    description: 'Robotic dinosaur with missile systems',
    abilities: [
      {
        id: 'tail_whip',
        name: 'Tail Whip',
        damage: 20,
        chance: 0.45,
        description: 'Sweeps tail hitting all enemies lightly',
        effect: 'damage_all_light',
        animation: 'default',
        priority: 1
      },
      {
        id: 'rocket_bite',
        name: 'Rocket Bite',
        damage: 35,
        chance: 0.45,
        description: 'Explosive bite attack',
        effect: 'damage',
        animation: 'explosion',
        priority: 2
      },
      {
        id: 'missile_barrage',
        name: 'MISSILE BARRAGE',
        damage: 30,
        hits: 4,
        chance: 0.10,
        description: 'Fires 4 rockets at random targets!',
        effect: 'multi_random',
        animation: 'explosion',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  CURSED_MARIONETTE: {
    id: 'cursed_marionette',
    name: 'Cursed Marionette',
    maxHealth: 90,
    color: '#8B008B',
    emoji: '🎭',
    image: '/cursedmarionettepp.jpg',
    selectSound: '/masionette.wav',
    abilitySound: '/masionette1.wav',
    ultimateSound: '/masionette2.wav',
    rarity: 'epic',
    description: 'Possessed puppet with mind control strings',
    abilities: [
      {
        id: 'string_slash',
        name: 'String Slash',
        damage: 28,
        chance: 0.45,
        description: 'Razor-sharp strings cut enemies',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'possession',
        name: 'Possession',
        damage: 0,
        chance: 0.45,
        description: 'Forces enemy to attack their ally',
        effect: 'mind_control',
        animation: 'default',
        priority: 2
      },
      {
        id: 'string_mastery',
        name: 'STRING MASTERY',
        damage: 0,
        chance: 0.10,
        description: 'Controls ALL enemies for 1 turn!',
        effect: 'mind_control_all',
        animation: 'default',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  BATTLE_TRAIN: {
    id: 'battle_train',
    name: 'Battle Train',
    maxHealth: 125,
    color: '#2F4F4F',
    emoji: '🚂',
    image: '/battletrain.jpeg',
    selectSound: '/train.wav',
    abilitySound: '/train1.wav',
    rarity: 'rare',
    description: 'Armored toy train ready for war',
    abilities: [
      {
        id: 'toy_cannon',
        name: 'Toy Cannon',
        damage: 32,
        chance: 0.45,
        description: 'Heavy cannon blast',
        effect: 'damage',
        animation: 'explosion',
        priority: 1
      },
      {
        id: 'iron_carriage',
        name: 'Iron Carriage',
        damage: 0,
        chance: 0.45,
        description: 'Reinforced armor boosts team defense',
        effect: 'team_defense',
        animation: 'shield',
        priority: 2
      },
      {
        id: 'full_steam_ahead',
        name: 'FULL STEAM AHEAD',
        damage: 80,
        chance: 0.10,
        description: 'Charges through ALL enemies!',
        effect: 'damage_all',
        animation: 'default',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  // ===== NEW LEGENDARY TOYS =====
  COSMIC_JACK: {
    id: 'cosmic_jack',
    name: 'Cosmic Jack-in-the-Box',
    maxHealth: 95,
    color: '#9400D3',
    emoji: '🎁',
    image: '/cosmicjackpp.jpg',
    selectSound: '/cosmicjack.wav',
    abilitySound: '/cosmicjack1.wav',
    rarity: 'legendary',
    description: 'Reality-warping jack-in-the-box from space',
    abilities: [
      {
        id: 'box_punch',
        name: 'Box Punch',
        damage: 30,
        chance: 0.45,
        description: 'Random burst strike from the box',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'chaos_trick',
        name: 'Chaos Trick',
        damage: 15,
        chance: 0.45,
        description: 'Applies random debuff to enemy',
        effect: 'random_debuff',
        animation: 'default',
        priority: 2
      },
      {
        id: 'supernova_pop',
        name: 'SUPERNOVA POP',
        damage: 100,
        chance: 0.05,
        description: 'Deals 50% MAX HP to ALL enemies!',
        effect: 'percentage_damage_all',
        animation: 'explosion',
        isUltimate: true,
        isLegendary: true,
        priority: 3
      }
    ]
  },

  PHARAOH_BOT: {
    id: 'pharaoh_bot',
    name: 'Pharaoh Bot',
    maxHealth: 105,
    color: '#FFD700',
    emoji: '🤴',
    image: '/pharoe.jpg',
    rarity: 'legendary',
    description: 'Ancient Egyptian robot awakened from pyramid',
    abilities: [
      {
        id: 'golden_slash',
        name: 'Golden Slash',
        damage: 35,
        chance: 0.45,
        description: 'Strikes with golden blade',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'sandstorm_guard',
        name: 'Sandstorm Guard',
        damage: 0,
        chance: 0.45,
        description: 'Sandstorm reduces all damage to team',
        effect: 'team_damage_reduction',
        animation: 'default',
        priority: 2
      },
      {
        id: 'curse_of_eternity',
        name: 'CURSE OF ETERNITY',
        damage: 20,
        chance: 0.05,
        description: 'Eternal curse - stacking DOT to ALL!',
        effect: 'curse_all',
        animation: 'default',
        isUltimate: true,
        isLegendary: true,
        priority: 3
      }
    ]
  },

  KNIGHTMARE_HORSE: {
    id: 'knightmare_horse',
    name: 'Knightmare Rocking Horse',
    maxHealth: 110,
    color: '#191970',
    emoji: '🐴',
    image: '/rockinghorsepp.jpg',
    selectSound: '/rockinghorse.wav',
    abilitySound: '/rockinghorse1.wav',
    ultimateSound: '/rockinghorse2.wav',
    rarity: 'legendary',
    description: 'Haunted rocking horse from ancient castle',
    abilities: [
      {
        id: 'dark_charge',
        name: 'Dark Charge',
        damage: 32,
        chance: 0.45,
        description: 'Ghostly charge with stun chance',
        effect: 'damage_stun',
        animation: 'default',
        priority: 1
      },
      {
        id: 'spectral_neigh',
        name: 'Spectral Neigh',
        damage: 0,
        chance: 0.47,
        description: 'Haunting cry boosts team attack',
        effect: 'team_attack_buff',
        animation: 'default',
        priority: 2
      },
      {
        id: 'charge_of_doom',
        name: 'CHARGE OF DOOM',
        damage: 150,
        chance: 0.03,
        description: 'MASSIVE critical charge + stun!',
        effect: 'mega_crit_stun',
        animation: 'default',
        isUltimate: true,
        isLegendary: true,
        priority: 3
      }
    ]
  },

  DOCTOR_TOY: {
    id: 'doctor_toy',
    name: 'Doctor Toy',
    maxHealth: 100,
    color: '#00CED1',
    emoji: '⚕️',
    image: '/doctorpp.png',
    rarity: 'common',
    description: 'A medical toy that heals and protects',
    abilities: [
      {
        id: 'medical_strike',
        name: 'Medical Strike',
        damage: 20,
        chance: 0.40,
        description: 'Precise surgical strike',
        effect: 'damage',
        animation: 'default',
        priority: 1
      },
      {
        id: 'emergency_heal',
        name: 'Emergency Heal',
        heal: 35,
        chance: 0.45,
        description: 'Emergency medical treatment',
        effect: 'heal',
        animation: 'healing_aura',
        priority: 2
      },
      {
        id: 'miracle_cure',
        name: 'MIRACLE CURE',
        healAll: 45,
        chance: 0.10,
        description: 'Heals the entire team!',
        effect: 'heal_all',
        animation: 'healing_aura',
        isUltimate: true,
        priority: 3
      }
    ]
  },

  ROCKET_TOY: {
    id: 'rocket_toy',
    name: 'Rocket Ship',
    maxHealth: 85,
    color: '#FF1493',
    emoji: '🚀',
    image: '/rocketpp.png',
    rarity: 'common',
    description: 'A toy rocket ready for blast off',
    abilities: [
      {
        id: 'rocket_blast',
        name: 'Rocket Blast',
        damage: 24,
        chance: 0.45,
        description: 'Fires rocket engines',
        effect: 'damage',
        animation: 'laser_blast',
        priority: 1
      },
      {
        id: 'fuel_boost',
        name: 'Fuel Boost',
        heal: 20,
        damage: 15,
        chance: 0.35,
        description: 'Boosts with rocket fuel',
        effect: 'both',
        animation: 'fire_blast',
        priority: 2
      },
      {
        id: 'space_launch',
        name: 'SPACE LAUNCH',
        damage: 60,
        chance: 0.10,
        description: 'Launches into space and crashes down!',
        effect: 'damage',
        animation: 'explosion',
        isUltimate: true,
        priority: 3
      }
    ]
  }
}

// Ensure all characters have stats
Object.values(ENHANCED_CHARACTERS).forEach(char => {
  if (!char.stats) {
    char.stats = DEFAULT_STATS[char.rarity] || DEFAULT_STATS.common
  }
})

// Get random ability based on weighted chances
export const selectRandomAbility = (character) => {
  const random = Math.random()
  let cumulativeChance = 0
  
  // Sort abilities by priority to check ultimates last
  const sortedAbilities = [...character.abilities].sort((a, b) => a.priority - b.priority)
  
  for (const ability of sortedAbilities) {
    cumulativeChance += ability.chance
    if (random <= cumulativeChance) {
      return ability
    }
  }
  
  // Fallback to first ability if somehow nothing selected
  return character.abilities[0]
}

// Get random target from alive characters
export const selectRandomTarget = (targets) => {
  const aliveTargets = targets.filter(t => t.currentHealth > 0)
  if (aliveTargets.length === 0) return null
  return aliveTargets[Math.floor(Math.random() * aliveTargets.length)]
}

// Get all alive targets for AOE abilities
export const selectAllTargets = (targets) => {
  return targets.filter(t => t.currentHealth > 0)
}

// Calculate damage with rarity and attack stat bonuses
export const calculateDamageWithRarity = (baseDamage, rarity, attackStat = null) => {
  const rarityMultipliers = {
    common: 1.0,
    rare: 1.1,
    epic: 1.2,
    legendary: 1.3,
    mythic: 1.5
  }
  
  // Get attack stat or use default based on rarity
  const attack = attackStat || DEFAULT_STATS[rarity]?.attack || 5
  
  // Attack multiplier: each point above 5 adds 10% damage
  const attackMultiplier = 1 + ((attack - 5) * 0.1)
  
  return Math.round(baseDamage * (rarityMultipliers[rarity] || 1.0) * attackMultiplier)
}

// Calculate damage reduction from defense
export const calculateDefenseReduction = (incomingDamage, defenderRarity, defenseStat = null) => {
  // Get defense stat or use default based on rarity
  const defense = defenseStat || DEFAULT_STATS[defenderRarity]?.defense || 5
  
  // Defense reduction: each point of defense reduces damage by 5%
  const defenseReduction = defense * 0.05
  
  // Cap defense reduction at 50% to prevent immunity
  const actualReduction = Math.min(defenseReduction, 0.5)
  
  return Math.round(incomingDamage * (1 - actualReduction))
}

// Get random AI team based on difficulty
export const generateAITeam = (difficulty = 'normal') => {
  const allCharacters = Object.values(ENHANCED_CHARACTERS)
  const team = []
  
  // Difficulty affects rarity chances
  const rarityChances = {
    easy: { common: 0.6, rare: 0.3, epic: 0.08, legendary: 0.02, mythic: 0 },
    normal: { common: 0.4, rare: 0.35, epic: 0.15, legendary: 0.08, mythic: 0.02 },
    hard: { common: 0.2, rare: 0.3, epic: 0.25, legendary: 0.2, mythic: 0.05 },
    nightmare: { common: 0.1, rare: 0.2, epic: 0.3, legendary: 0.3, mythic: 0.1 }
  }
  
  const chances = rarityChances[difficulty] || rarityChances.normal
  
  for (let i = 0; i < 3; i++) {
    const random = Math.random()
    let selectedRarity = 'common'
    let cumulative = 0
    
    for (const [rarity, chance] of Object.entries(chances)) {
      cumulative += chance
      if (random <= cumulative) {
        selectedRarity = rarity
        break
      }
    }
    
    const validCharacters = allCharacters.filter(c => c.rarity === selectedRarity)
    if (validCharacters.length > 0) {
      team.push(validCharacters[Math.floor(Math.random() * validCharacters.length)])
    } else {
      // Fallback to any character
      team.push(allCharacters[Math.floor(Math.random() * allCharacters.length)])
    }
  }
  
  return team
}