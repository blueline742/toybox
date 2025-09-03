// Seeded random number generator for deterministic PvP battles
class SeededRandom {
  constructor(seed) {
    this.seed = seed
  }
  
  // Simple LCG (Linear Congruential Generator)
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483647
    return this.seed / 2147483647
  }
  
  // Get random number between 0 and 1
  random() {
    return this.next()
  }
  
  // Get random integer between min and max (inclusive)
  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min
  }
  
  // Pick random element from array
  randomChoice(array) {
    if (!array || array.length === 0) return null
    return array[this.randomInt(0, array.length - 1)]
  }
  
  // Pick weighted random choice based on probabilities
  randomWeighted(choices) {
    const random = this.random()
    let cumulative = 0
    
    for (const choice of choices) {
      cumulative += choice.chance
      if (random < cumulative) {
        return choice
      }
    }
    
    return choices[choices.length - 1]
  }
}

// Create a shared seed for each battle
export const createBattleSeed = (battleId) => {
  // Convert battle ID to a numeric seed
  let seed = 0
  for (let i = 0; i < battleId.length; i++) {
    seed = ((seed << 5) - seed) + battleId.charCodeAt(i)
    seed = seed & seed // Convert to 32bit integer
  }
  return Math.abs(seed)
}

export default SeededRandom