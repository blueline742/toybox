class MusicManager {
  constructor() {
    this.currentMusic = null
    this.currentTrack = null
    this.volume = 0.15 // Reduced from 0.3 to 0.15 (50% reduction)
    this.isMuted = false
    this.laughSounds = []
    this.laughInterval = null
    this.isPlayingLaughs = false
  }

  playMenuMusic() {
    this.playMusic('/menumusic.mp3', 'menu')
    this.startLaughterEffects()
  }

  playBattleMusic() {
    this.stopLaughterEffects()
    this.playMusic('/battlemusic.mp3', 'battle')
  }

  playMusic(src, trackName) {
    // Don't restart if already playing the same track
    if (this.currentTrack === trackName && this.currentMusic && !this.currentMusic.paused) {
      return
    }

    // Stop current music if playing
    this.stopMusic()

    // Create new audio element
    this.currentMusic = new Audio(src)
    this.currentMusic.loop = true
    this.currentMusic.volume = this.isMuted ? 0 : this.volume
    this.currentTrack = trackName

    // Play the music
    this.currentMusic.play().catch(err => {
      console.log('Music playback failed:', err)
      // Retry on user interaction if autoplay was blocked
      document.addEventListener('click', () => {
        if (this.currentMusic && this.currentMusic.paused) {
          this.currentMusic.play().catch(() => {})
        }
      }, { once: true })
    })
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause()
      this.currentMusic.currentTime = 0
      this.currentMusic = null
      this.currentTrack = null
    }
    this.stopLaughterEffects()
  }

  pauseMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause()
    }
  }

  resumeMusic() {
    if (this.currentMusic) {
      this.currentMusic.play().catch(() => {})
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.currentMusic && !this.isMuted) {
      this.currentMusic.volume = this.volume
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.currentMusic) {
      this.currentMusic.volume = this.isMuted ? 0 : this.volume
    }
    // Mute/unmute laugh sounds
    this.laughSounds.forEach(sound => {
      if (sound.audio) {
        sound.audio.volume = this.isMuted ? 0 : this.volume * 0.5
      }
    })
    return this.isMuted
  }

  fadeOut(duration = 1000) {
    if (!this.currentMusic) return

    const startVolume = this.currentMusic.volume
    const fadeStep = startVolume / (duration / 50)
    
    const fadeInterval = setInterval(() => {
      if (this.currentMusic && this.currentMusic.volume > fadeStep) {
        this.currentMusic.volume -= fadeStep
      } else {
        clearInterval(fadeInterval)
        this.stopMusic()
      }
    }, 50)
  }

  crossFade(newSrc, newTrackName, duration = 1000) {
    // Handle laughter effects based on track
    if (newTrackName === 'menu') {
      this.startLaughterEffects()
    } else {
      this.stopLaughterEffects()
    }
    
    if (!this.currentMusic) {
      this.playMusic(newSrc, newTrackName)
      return
    }

    const oldMusic = this.currentMusic
    const startVolume = oldMusic.volume
    const fadeStep = startVolume / (duration / 50)

    // Start new music at volume 0
    this.currentMusic = new Audio(newSrc)
    this.currentMusic.loop = true
    this.currentMusic.volume = 0
    this.currentTrack = newTrackName
    this.currentMusic.play().catch(() => {})

    const newMusic = this.currentMusic

    // Crossfade
    const fadeInterval = setInterval(() => {
      if (oldMusic.volume > fadeStep) {
        oldMusic.volume -= fadeStep
        newMusic.volume = Math.min(this.volume, newMusic.volume + fadeStep)
      } else {
        clearInterval(fadeInterval)
        oldMusic.pause()
        newMusic.volume = this.isMuted ? 0 : this.volume
      }
    }, 50)
  }
  startLaughterEffects() {
    if (this.isPlayingLaughs) return
    
    this.isPlayingLaughs = true
    
    // Preload laugh sounds
    this.laughSounds = [
      { src: '/laugh1.wav', audio: null },
      { src: '/laugh2.wav', audio: null },
      { src: '/laugh3.wav', audio: null },
      { src: '/laugh4.wav', audio: null }
    ]
    
    // Load all laugh sounds
    this.laughSounds.forEach(sound => {
      sound.audio = new Audio(sound.src)
      sound.audio.volume = this.isMuted ? 0 : this.volume * 0.5 // 50% quieter
    })
    
    // Play random laughs at intervals
    const playRandomLaugh = () => {
      if (!this.isPlayingLaughs || this.currentTrack !== 'menu') return
      
      const randomLaugh = this.laughSounds[Math.floor(Math.random() * this.laughSounds.length)]
      if (randomLaugh.audio && !this.isMuted) {
        // Clone the audio to allow overlapping sounds
        const laughClone = randomLaugh.audio.cloneNode()
        laughClone.volume = this.volume * 0.5 // 50% quieter than music
        laughClone.play().catch(() => {})
      }
      
      // Schedule next laugh (random interval between 8-20 seconds)
      const nextInterval = 8000 + Math.random() * 12000
      this.laughInterval = setTimeout(playRandomLaugh, nextInterval)
    }
    
    // Start with a delay (3-8 seconds after menu music starts)
    const initialDelay = 3000 + Math.random() * 5000
    this.laughInterval = setTimeout(playRandomLaugh, initialDelay)
  }
  
  stopLaughterEffects() {
    this.isPlayingLaughs = false
    
    if (this.laughInterval) {
      clearTimeout(this.laughInterval)
      this.laughInterval = null
    }
    
    // Stop any currently playing laugh sounds
    this.laughSounds.forEach(sound => {
      if (sound.audio) {
        sound.audio.pause()
        sound.audio.currentTime = 0
      }
    })
  }
}

// Create singleton instance
const musicManager = new MusicManager()

export default musicManager