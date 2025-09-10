// Animation Queue System for smooth spell effects
// Ensures animations play fully even with network lag

class AnimationQueue {
  constructor() {
    this.queue = []
    this.isPlaying = false
    this.currentAnimation = null
    this.onAnimationStart = null
    this.onAnimationComplete = null
  }

  // Add an animation to the queue
  add(animation) {
    const animationItem = {
      id: `anim-${Date.now()}-${Math.random()}`,
      type: animation.type,
      caster: animation.caster,
      targets: animation.targets,
      ability: animation.ability,
      duration: animation.duration || this.getDefaultDuration(animation.type),
      effects: animation.effects || [],
      onStart: animation.onStart,
      onComplete: animation.onComplete,
      priority: animation.priority || 0,
      positions: animation.positions
    }

    // High priority animations (like damage numbers) can overlap
    if (animationItem.priority > 0) {
      this.queue.unshift(animationItem)
    } else {
      this.queue.push(animationItem)
    }

    // Start playing if not already
    if (!this.isPlaying) {
      this.playNext()
    }

    return animationItem.id
  }

  // Get default duration based on animation type
  getDefaultDuration(type) {
    const durations = {
      'spell_cast': 500,        // Caster animation
      'spell_travel': 1000,      // Projectile travel
      'spell_impact': 500,       // Impact effect
      'damage_number': 1500,     // Damage text float
      'heal_effect': 1000,       // Healing animation
      'shield_effect': 800,      // Shield bubble
      'physical_attack': 900,    // Melee attack
      'death': 1000,             // Death animation
      'revive': 1500,            // Revival effect
      'buff': 800,               // Buff application
      'debuff': 800,             // Debuff application
      'ultimate': 2000,          // Ultimate abilities
      'multi_hit': 1500,         // Multi-hit effects
      'aoe': 1200,               // Area effects
      'summon': 1000,            // Summoning animation
      'notification': 3000       // Spell notification popup
    }
    return durations[type] || 1000
  }

  // Play the next animation in queue
  async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    this.currentAnimation = this.queue.shift()

    // Call global start handler
    if (this.onAnimationStart) {
      this.onAnimationStart(this.currentAnimation)
    }

    // Call animation's start handler
    if (this.currentAnimation.onStart) {
      this.currentAnimation.onStart(this.currentAnimation)
    }

    // Wait for animation duration
    await this.wait(this.currentAnimation.duration)

    // Call animation's complete handler
    if (this.currentAnimation.onComplete) {
      this.currentAnimation.onComplete(this.currentAnimation)
    }

    // Call global complete handler
    if (this.onAnimationComplete) {
      this.onAnimationComplete(this.currentAnimation)
    }

    this.currentAnimation = null

    // Play next animation
    this.playNext()
  }

  // Helper to wait for duration
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Clear all queued animations
  clear() {
    this.queue = []
    this.currentAnimation = null
    this.isPlaying = false
  }

  // Get current queue size
  size() {
    return this.queue.length
  }

  // Check if currently playing
  isAnimating() {
    return this.isPlaying || this.queue.length > 0
  }

  // Speed up animations for catch-up
  setCatchUpMode(enabled) {
    if (enabled) {
      // Speed up animations by 50% when catching up
      this.speedMultiplier = 0.5
    } else {
      this.speedMultiplier = 1
    }
  }

  // Get adjusted duration based on speed multiplier
  getAdjustedDuration(baseDuration) {
    return baseDuration * (this.speedMultiplier || 1)
  }

  // Queue a full spell sequence (cast -> travel -> impact -> damage)
  queueSpellSequence(spellData) {
    const sequence = []

    // 1. Caster animation
    sequence.push({
      type: 'spell_cast',
      caster: spellData.caster,
      ability: spellData.ability,
      duration: 300,
      onStart: () => spellData.onCastStart?.()
    })

    // 2. Projectile travel (if ranged)
    if (spellData.ability.projectile !== false) {
      sequence.push({
        type: 'spell_travel',
        caster: spellData.caster,
        targets: spellData.targets,
        ability: spellData.ability,
        positions: spellData.positions,
        duration: this.calculateTravelTime(spellData.positions),
        onStart: () => spellData.onProjectileStart?.()
      })
    }

    // 3. Impact effect
    sequence.push({
      type: 'spell_impact',
      targets: spellData.targets,
      ability: spellData.ability,
      duration: 400,
      onStart: () => spellData.onImpact?.()
    })

    // 4. Damage/heal numbers (can overlap with next animation)
    if (spellData.effects) {
      sequence.push({
        type: 'damage_number',
        effects: spellData.effects,
        duration: 1000,
        priority: 1, // High priority allows overlap
        onStart: () => spellData.onDamageNumbers?.()
      })
    }

    // Add all to queue
    sequence.forEach(anim => this.add(anim))
  }

  // Calculate travel time based on distance
  calculateTravelTime(positions) {
    if (!positions || !positions.caster || !positions.targets?.[0]) {
      return 800 // Default travel time
    }

    const dx = positions.targets[0].x - positions.caster.x
    const dy = positions.targets[0].y - positions.caster.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Scale travel time with distance (min 400ms, max 1200ms)
    const travelTime = Math.min(1200, Math.max(400, distance * 2))
    return travelTime
  }

  // Queue a physical attack sequence
  queuePhysicalAttack(attackData) {
    this.add({
      type: 'physical_attack',
      caster: attackData.caster,
      targets: attackData.targets,
      duration: 900,
      onStart: () => attackData.onAttackStart?.(),
      onComplete: () => attackData.onAttackComplete?.()
    })

    // Queue damage numbers
    if (attackData.effects) {
      this.add({
        type: 'damage_number',
        effects: attackData.effects,
        duration: 1000,
        priority: 1,
        onStart: () => attackData.onDamageNumbers?.()
      })
    }
  }
}

// Singleton instance
let animationQueueInstance = null

export const getAnimationQueue = () => {
  if (!animationQueueInstance) {
    animationQueueInstance = new AnimationQueue()
  }
  return animationQueueInstance
}

export default AnimationQueue