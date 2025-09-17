// Match Pool Manager for Boardgame.io PvP
// Manages a pool of pre-created match IDs to avoid dynamic match creation issues

class MatchPoolManager {
  constructor(poolSize = 20) {
    this.poolSize = poolSize;
    this.matchPool = [];
    this.initializePool();
  }

  // Initialize the match pool with available match IDs
  initializePool() {
    this.matchPool = Array.from({ length: this.poolSize }, (_, i) => ({
      id: `battle_${i + 1}`,
      inUse: false,
      players: [],
      createdAt: null,
      lastUsed: null
    }));
    console.log(`🎮 Match pool initialized with ${this.poolSize} slots`);
  }

  // Get the first available match ID
  getAvailableMatch() {
    const slot = this.matchPool.find(m => !m.inUse);

    if (!slot) {
      console.warn('⚠️ No available matches in pool!');
      return null;
    }

    // Mark as in use
    slot.inUse = true;
    slot.createdAt = Date.now();
    slot.players = [];

    console.log(`✅ Assigned match: ${slot.id}`);
    return slot.id;
  }

  // Release a match back to the pool
  releaseMatch(matchId) {
    const slot = this.matchPool.find(m => m.id === matchId);

    if (!slot) {
      console.warn(`⚠️ Match ${matchId} not found in pool`);
      return false;
    }

    // Reset the slot
    slot.inUse = false;
    slot.lastUsed = Date.now();
    slot.players = [];

    console.log(`♻️ Released match: ${matchId} back to pool`);
    return true;
  }

  // Add a player to a match
  addPlayerToMatch(matchId, playerData) {
    const slot = this.matchPool.find(m => m.id === matchId);

    if (!slot) {
      console.warn(`⚠️ Match ${matchId} not found`);
      return false;
    }

    slot.players.push(playerData);
    console.log(`👤 Added player to ${matchId}: ${playerData.wallet}`);
    return true;
  }

  // Get match info
  getMatchInfo(matchId) {
    return this.matchPool.find(m => m.id === matchId);
  }

  // Get pool status
  getPoolStatus() {
    const inUse = this.matchPool.filter(m => m.inUse).length;
    const available = this.matchPool.filter(m => !m.inUse).length;

    return {
      total: this.poolSize,
      inUse,
      available,
      matches: this.matchPool.map(m => ({
        id: m.id,
        inUse: m.inUse,
        playerCount: m.players.length
      }))
    };
  }

  // Clean up stale matches (optional - for matches that didn't complete properly)
  cleanupStaleMatches(maxAge = 30 * 60 * 1000) { // 30 minutes default
    const now = Date.now();
    let cleaned = 0;

    this.matchPool.forEach(slot => {
      if (slot.inUse && slot.createdAt && (now - slot.createdAt) > maxAge) {
        this.releaseMatch(slot.id);
        cleaned++;
        console.log(`🧹 Cleaned up stale match: ${slot.id}`);
      }
    });

    return cleaned;
  }
}

// Create singleton instance
const matchPoolManager = new MatchPoolManager(20);

// Export for use in other modules
export default matchPoolManager;