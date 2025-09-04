// Enhanced Sound System for Epic Toy Fighter Game

class SoundManager {
  constructor() {
    this.sounds = {}
    this.musicVolume = 0.5
    this.effectsVolume = 0.7
    this.isMuted = false
    this.currentMusic = null
    
    // Initialize audio context
    this.audioContext = null
    this.initAudioContext()
    
    // Preload sound effects
    this.loadSounds()
  }

  initAudioContext() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
    } catch (e) {
      console.warn('Web Audio API not supported:', e)
    }
  }

  loadSounds() {
    // Define sound effect URLs (using free sound resources)
    this.soundUrls = {
      // Battle sounds
      hit: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2HO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMF',
      heal: 'data:audio/wav;base64,UklGRkQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSACAAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAYgBjAGQAZQBmAGcAaABpAGoAawBsAG0AbgBvAHAAcQByAHMAdAB1AHYAdwB4AHkAegB7AHwAfQB+AH8AgACBAIIAgwCEAIUAhgCHAIgAiQCKAIsAjACNAI4AjwCQAJEAkgCTAJQAlQCWAJcAmACZAJoAmwCcAJ0AngCfAKAAoQCiAKMApAClAKYApwCoAKkAqgCrAKwArQCuAK8AsACxALIAswC0ALUAtgC3ALgAuQC6ALsAvAC9AL4AvwDAAMEAwgDDAMQAxQDGAMcAyADJAMoAywDMAM0AzgDPANAA0QDSANMA1ADVANYA1wDYANkA2gDbANwA3QDeAN8A4ADhAOIA4wDkAOUA5gDnAOgA6QDqAOsA7ADtAO4A7wDwAPEA8gDzAPQA9QD2APcA+AD5APoA+wD8AP0A/gD/AA==',
      powerup: 'data:audio/wav;base64,UklGRjQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRADAAAAAAAA//8AAP//AAD//wAAAAAAAAAAAAD//wAA//8AAAAAAAD//wAAAAAAAAAA//8AAP//AAAAAAAA//8AAP//AAAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAD//wAA//8AAP//AAD//wAAAAAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA',
      combo: 'data:audio/wav;base64,UklGRiQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQABAACAP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD+AP4A/gD8=',
      victory: 'data:audio/wav;base64,UklGRpQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXAEAAAAAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/AAD//wAAgD8AAP//AACAPwAA//8AAIA/',
      defeat: '/defeat.wav',
      
      // UI sounds
      click: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
      hover: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    }
    
    // Create audio elements from data URIs
    Object.entries(this.soundUrls).forEach(([key, dataUri]) => {
      const audio = new Audio(dataUri)
      audio.preload = 'auto'
      this.sounds[key] = audio
    })
  }

  // Play a sound effect
  playSound(soundName, volume = null) {
    if (this.isMuted) return
    
    const sound = this.sounds[soundName]
    if (sound) {
      const audio = sound.cloneNode()
      audio.volume = volume || this.effectsVolume
      
      // Add random pitch variation for variety
      if (this.audioContext && soundName === 'hit') {
        audio.playbackRate = 0.9 + Math.random() * 0.2
      }
      
      audio.play().catch(e => console.log('Sound play failed:', e))
      
      // Clean up after playing
      audio.addEventListener('ended', () => {
        audio.remove()
      })
    }
  }

  // Play background music
  playMusic(musicName) {
    if (this.currentMusic) {
      this.currentMusic.pause()
    }
    
    // For now, using placeholder - in production, you'd load actual music files
    const music = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=')
    music.loop = true
    music.volume = this.musicVolume
    
    if (!this.isMuted) {
      music.play().catch(e => console.log('Music play failed:', e))
    }
    
    this.currentMusic = music
  }

  // Stop background music
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause()
      this.currentMusic = null
    }
  }

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted
    
    if (this.isMuted) {
      if (this.currentMusic) {
        this.currentMusic.pause()
      }
    } else {
      if (this.currentMusic) {
        this.currentMusic.play()
      }
    }
    
    return this.isMuted
  }

  // Set volumes
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume
    }
  }

  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume))
  }

  // Play combo sound with increasing pitch
  playComboSound(comboCount) {
    if (this.isMuted) return
    
    const audio = this.sounds.combo.cloneNode()
    audio.volume = this.effectsVolume
    audio.playbackRate = 1 + (comboCount * 0.1) // Increase pitch with combo
    audio.play().catch(e => console.log('Combo sound failed:', e))
  }

  // Play critical hit sound
  playCriticalSound() {
    if (this.isMuted) return
    
    // Play multiple sounds for impact
    this.playSound('hit', this.effectsVolume * 1.2)
    setTimeout(() => this.playSound('powerup', this.effectsVolume * 0.5), 50)
  }

  // Play victory fanfare
  playVictoryFanfare() {
    if (this.isMuted) return
    
    this.playSound('victory', this.effectsVolume)
    // Could add more complex victory sequence here
  }

  // Play defeat sound
  playDefeatSound() {
    if (this.isMuted) return
    
    this.playSound('defeat', this.effectsVolume * 0.8)
  }
}

// Create and export singleton instance
const soundManager = new SoundManager()

export default soundManager

// Export specific sound functions for easy use
export const playHitSound = () => soundManager.playSound('hit')
export const playHealSound = () => soundManager.playSound('heal')
export const playPowerUpSound = () => soundManager.playSound('powerup')
export const playComboSound = (count) => soundManager.playComboSound(count)
export const playCriticalSound = () => soundManager.playCriticalSound()
export const playVictorySound = () => soundManager.playVictoryFanfare()
export const playDefeatSound = () => soundManager.playDefeatSound()
export const playClickSound = () => soundManager.playSound('click')
export const playHoverSound = () => soundManager.playSound('hover', 0.3)
export const toggleMute = () => soundManager.toggleMute()
export const startBattleMusic = () => soundManager.playMusic('battle')
export const stopMusic = () => soundManager.stopMusic()