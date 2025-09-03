// Sound effects utility (Web Audio API based)
class SoundManager {
  constructor() {
    this.audioContext = null
    this.sounds = new Map()
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.initialized = true
    } catch (error) {
      console.log('Web Audio not supported', error)
    }
  }

  // Generate procedural sound effects using Web Audio API
  generateTone(frequency, duration, type = 'sine', volume = 0.1) {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // Sound effect presets
  playHit() {
    this.generateTone(150, 0.2, 'sawtooth', 0.15)
  }

  playHeal() {
    this.generateTone(400, 0.3, 'sine', 0.1)
    setTimeout(() => {
      this.generateTone(600, 0.2, 'sine', 0.08)
    }, 100)
  }

  playSpecial() {
    this.generateTone(800, 0.1, 'square', 0.12)
    setTimeout(() => {
      this.generateTone(600, 0.1, 'square', 0.1)
    }, 120)
    setTimeout(() => {
      this.generateTone(400, 0.15, 'square', 0.08)
    }, 240)
  }

  playVictory() {
    const notes = [523, 659, 784, 1047] // C, E, G, C
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.generateTone(note, 0.4, 'triangle', 0.1)
      }, index * 200)
    })
  }

  playDefeat() {
    const notes = [400, 350, 300, 250] // Descending notes
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.generateTone(note, 0.3, 'sawtooth', 0.08)
      }, index * 150)
    })
  }

  playButtonClick() {
    this.generateTone(800, 0.1, 'square', 0.05)
  }
}

export const soundManager = new SoundManager()

// Auto-initialize on first user interaction
export const initSounds = () => {
  soundManager.init()
}