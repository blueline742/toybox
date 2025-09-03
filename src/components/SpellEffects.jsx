import React, { useEffect, useRef } from 'react'

const SpellEffects = ({ activeSpell, onComplete }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])
  const projectileRef = useRef(null)

  useEffect(() => {
    if (!activeSpell) return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize spell based on type
    initializeSpell(activeSpell)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        updateParticle(particle, activeSpell.type)
        drawParticle(ctx, particle, activeSpell.color)
        return particle.life > 0
      })

      // Update and draw projectile
      if (projectileRef.current) {
        updateProjectile(projectileRef.current, activeSpell)
        drawProjectile(ctx, projectileRef.current, activeSpell)
        
        // Check if projectile reached target
        if (projectileRef.current.progress >= 1) {
          createImpactEffect(activeSpell)
          projectileRef.current = null
          setTimeout(() => onComplete(activeSpell), 500)
        }
      }

      // Continue animation if needed
      if (particlesRef.current.length > 0 || projectileRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [activeSpell, onComplete])

  const initializeSpell = (spell) => {
    particlesRef.current = []
    
    switch (spell.type) {
      case 'laser_blast':
        createLaserEffect(spell)
        break
      case 'fire_breath':
        createFireEffect(spell)
        break
      case 'rainbow_blast':
        createRainbowEffect(spell)
        break
      case 'meteor_storm':
        createMeteorEffect(spell)
        break
      case 'healing_aura':
        createHealingEffect(spell)
        break
      case 'lightning_bolt':
        createLightningEffect(spell)
        break
      case 'ice_shard':
        createIceEffect(spell)
        break
      case 'poison_cloud':
        createPoisonEffect(spell)
        break
      case 'teleport':
        createTeleportEffect(spell)
        break
      case 'shield':
        createShieldEffect(spell)
        break
      case 'hug':
        createHugEffect(spell)
        break
      default:
        createDefaultEffect(spell)
    }
  }

  const createLaserEffect = (spell) => {
    // Create laser beam projectile
    projectileRef.current = {
      startX: spell.startX,
      startY: spell.startY,
      endX: spell.endX,
      endY: spell.endY,
      progress: 0,
      speed: 0.1,
      width: 5,
      type: 'beam'
    }

    // Create particles along the beam
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: spell.startX,
        y: spell.startY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        life: 1,
        decay: 0.02,
        color: spell.color || '#00ffff',
        glow: true
      })
    }
  }

  const createFireEffect = (spell) => {
    // Create fire projectile
    projectileRef.current = {
      startX: spell.startX,
      startY: spell.startY,
      endX: spell.endX,
      endY: spell.endY,
      progress: 0,
      speed: 0.05,
      size: 20,
      type: 'fireball'
    }

    // Create fire particles
    const createFireParticles = () => {
      for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
          x: projectileRef.current ? 
            projectileRef.current.startX + (projectileRef.current.endX - projectileRef.current.startX) * projectileRef.current.progress :
            spell.startX,
          y: projectileRef.current ? 
            projectileRef.current.startY + (projectileRef.current.endY - projectileRef.current.startY) * projectileRef.current.progress :
            spell.startY,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3 - 1,
          size: Math.random() * 15 + 5,
          life: 1,
          decay: 0.03,
          color: `hsl(${Math.random() * 60}, 100%, 50%)`,
          type: 'fire'
        })
      }
    }

    // Continuously create fire particles
    const fireInterval = setInterval(() => {
      if (projectileRef.current) {
        createFireParticles()
      } else {
        clearInterval(fireInterval)
      }
    }, 50)
  }

  const createRainbowEffect = (spell) => {
    // Create rainbow beam
    projectileRef.current = {
      startX: spell.startX,
      startY: spell.startY,
      endX: spell.endX,
      endY: spell.endY,
      progress: 0,
      speed: 0.08,
      type: 'rainbow',
      hue: 0
    }

    // Create rainbow particles
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50
      particlesRef.current.push({
        x: spell.startX,
        y: spell.startY,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        size: Math.random() * 5 + 2,
        life: 1,
        decay: 0.015,
        hue: i * 7,
        type: 'rainbow'
      })
    }
  }

  const createMeteorEffect = (spell) => {
    // Create multiple meteors
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const meteor = {
          x: spell.endX + (Math.random() - 0.5) * 200,
          y: -50,
          targetX: spell.endX + (Math.random() - 0.5) * 100,
          targetY: spell.endY,
          progress: 0,
          speed: 0.03 + Math.random() * 0.02,
          size: 20 + Math.random() * 20,
          type: 'meteor',
          trail: []
        }
        
        particlesRef.current.push(meteor)
        
        // Create fire trail
        for (let j = 0; j < 10; j++) {
          particlesRef.current.push({
            x: meteor.x,
            y: meteor.y,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2,
            size: Math.random() * 10 + 5,
            life: 1,
            decay: 0.02,
            color: `hsl(${Math.random() * 60}, 100%, 50%)`,
            type: 'fire'
          })
        }
      }, i * 200)
    }
  }

  const createHealingEffect = (spell) => {
    // Create healing particles in a circle
    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const radius = 50
      particlesRef.current.push({
        x: spell.endX + Math.cos(angle) * radius,
        y: spell.endY + Math.sin(angle) * radius,
        vx: -Math.cos(angle) * 1,
        vy: -Math.sin(angle) * 1 - 1,
        size: Math.random() * 8 + 4,
        life: 1,
        decay: 0.01,
        color: '#00ff00',
        type: 'heal',
        pulse: Math.random() * Math.PI * 2
      })
    }

    // Create upward floating particles
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: spell.endX + (Math.random() - 0.5) * 100,
        y: spell.endY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 2 - 1,
        size: Math.random() * 6 + 2,
        life: 1,
        decay: 0.008,
        color: '#88ff88',
        type: 'sparkle'
      })
    }
  }

  const createLightningEffect = (spell) => {
    // Create lightning bolt path
    const points = []
    const segments = 8
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = spell.startX + (spell.endX - spell.startX) * t + (Math.random() - 0.5) * 30
      const y = spell.startY + (spell.endY - spell.startY) * t + (Math.random() - 0.5) * 30
      points.push({ x, y })
    }

    projectileRef.current = {
      points,
      progress: 0,
      speed: 0.2,
      type: 'lightning',
      flashes: 3
    }

    // Create electric particles
    points.forEach(point => {
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: point.x,
          y: point.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          size: Math.random() * 4 + 1,
          life: 1,
          decay: 0.05,
          color: '#ffffff',
          type: 'electric'
        })
      }
    })
  }

  const createIceEffect = (spell) => {
    // Create ice shard projectile
    projectileRef.current = {
      startX: spell.startX,
      startY: spell.startY,
      endX: spell.endX,
      endY: spell.endY,
      progress: 0,
      speed: 0.07,
      rotation: 0,
      type: 'ice_shard'
    }

    // Create ice particles
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        x: spell.startX,
        y: spell.startY,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: Math.random() * 6 + 2,
        life: 1,
        decay: 0.02,
        color: '#88ddff',
        type: 'ice',
        shape: Math.random() > 0.5 ? 'square' : 'diamond'
      })
    }
  }

  const createPoisonEffect = (spell) => {
    // Create poison cloud
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 60
      particlesRef.current.push({
        x: spell.endX + Math.cos(angle) * distance,
        y: spell.endY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1 - 0.5,
        size: Math.random() * 20 + 10,
        life: 1,
        decay: 0.01,
        color: '#00ff00',
        type: 'poison',
        opacity: 0.3
      })
    }
  }

  const createTeleportEffect = (spell) => {
    // Create disappear effect at start
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30
      particlesRef.current.push({
        x: spell.startX,
        y: spell.startY,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        size: Math.random() * 8 + 2,
        life: 1,
        decay: 0.03,
        color: '#ff00ff',
        type: 'portal'
      })
    }

    // Create appear effect at end after delay
    setTimeout(() => {
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30
        particlesRef.current.push({
          x: spell.endX,
          y: spell.endY,
          vx: -Math.cos(angle) * 5,
          vy: -Math.sin(angle) * 5,
          size: Math.random() * 8 + 2,
          life: 1,
          decay: 0.03,
          color: '#ff00ff',
          type: 'portal'
        })
      }
    }, 300)
  }

  const createShieldEffect = (spell) => {
    // Create shield bubble
    const particleCount = 40
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const radius = 60
      particlesRef.current.push({
        x: spell.endX + Math.cos(angle) * radius,
        y: spell.endY + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        size: 5,
        life: 1,
        decay: 0.005,
        color: '#4169e1',
        type: 'shield',
        pulse: Math.random() * Math.PI * 2
      })
    }
  }

  const createHugEffect = (spell) => {
    // Calculate middle point between attacker and target
    const midX = (spell.startX + spell.endX) / 2
    const midY = (spell.startY + spell.endY) / 2
    
    // Create pulling effect particles from target to middle
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30
      const startRadius = 100
      particlesRef.current.push({
        x: midX + Math.cos(angle) * startRadius,
        y: midY + Math.sin(angle) * startRadius,
        vx: -Math.cos(angle) * 3,
        vy: -Math.sin(angle) * 3,
        size: Math.random() * 8 + 3,
        life: 1,
        decay: 0.02,
        color: spell.color || '#8B4513',
        type: 'hug'
      })
    }
    
    // Create heart particles for the hug effect
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x: midX + (Math.random() - 0.5) * 40,
        y: midY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 1,
        size: 15,
        life: 1,
        decay: 0.015,
        color: '#FF69B4',
        type: 'heart'
      })
    }

    // Trigger impact immediately for hug (no projectile)
    setTimeout(() => {
      createImpactEffect(spell)
      onComplete(spell)
    }, 1000)
  }

  const createDefaultEffect = (spell) => {
    // Create basic projectile
    projectileRef.current = {
      startX: spell.startX,
      startY: spell.startY,
      endX: spell.endX,
      endY: spell.endY,
      progress: 0,
      speed: 0.06,
      size: 10,
      type: 'orb'
    }

    // Create trail particles
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: spell.startX,
        y: spell.startY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 5 + 2,
        life: 1,
        decay: 0.02,
        color: spell.color || '#ffffff'
      })
    }
  }

  const createImpactEffect = (spell) => {
    // Create explosion at impact
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30
      const speed = Math.random() * 8 + 2
      particlesRef.current.push({
        x: spell.endX,
        y: spell.endY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 10 + 5,
        life: 1,
        decay: 0.03,
        color: spell.color || '#ffffff',
        type: 'impact'
      })
    }
  }

  const updateParticle = (particle, spellType) => {
    // Update position
    particle.x += particle.vx || 0
    particle.y += particle.vy || 0
    
    // Apply gravity for some effects
    if (particle.type === 'fire' || particle.type === 'meteor') {
      particle.vy += 0.1
    }
    
    // Update life
    particle.life -= particle.decay || 0.01
    
    // Special updates for specific types
    if (particle.type === 'heal' || particle.type === 'shield') {
      particle.pulse = (particle.pulse || 0) + 0.1
    }
    
    if (particle.type === 'meteor' && particle.targetY) {
      particle.progress += particle.speed
      particle.x = particle.x + (particle.targetX - particle.x) * particle.speed
      particle.y = particle.y + (particle.targetY - particle.y) * particle.speed
      
      if (particle.progress >= 1) {
        particle.life = 0
        createImpactEffect({ endX: particle.targetX, endY: particle.targetY, color: '#ff4500' })
      }
    }
  }

  const updateProjectile = (projectile, spell) => {
    projectile.progress += projectile.speed
    
    if (projectile.type === 'rainbow') {
      projectile.hue = (projectile.hue + 5) % 360
    }
    
    if (projectile.type === 'ice_shard') {
      projectile.rotation += 0.2
    }
    
    // Create trail particles for some projectiles
    if (projectile.type === 'fireball' && Math.random() < 0.8) {
      const x = projectile.startX + (projectile.endX - projectile.startX) * projectile.progress
      const y = projectile.startY + (projectile.endY - projectile.startY) * projectile.progress
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2,
        size: Math.random() * 8 + 2,
        life: 1,
        decay: 0.03,
        color: `hsl(${Math.random() * 60}, 100%, 50%)`,
        type: 'fire'
      })
    }
  }

  const drawParticle = (ctx, particle, defaultColor) => {
    if (particle.life <= 0) return
    
    ctx.save()
    ctx.globalAlpha = particle.opacity || particle.life
    
    // Set color
    if (particle.type === 'rainbow') {
      ctx.fillStyle = `hsl(${particle.hue}, 100%, 50%)`
    } else {
      ctx.fillStyle = particle.color || defaultColor || '#ffffff'
    }
    
    // Apply glow effect
    if (particle.glow || particle.type === 'electric' || particle.type === 'portal') {
      ctx.shadowBlur = 20
      ctx.shadowColor = ctx.fillStyle
    }
    
    // Draw based on shape
    if (particle.shape === 'square') {
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      )
    } else if (particle.shape === 'diamond') {
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
      ctx.restore()
    } else if (particle.type === 'heart') {
      // Draw heart emoji
      ctx.font = `${particle.size}px Arial`
      ctx.fillText('❤️', particle.x, particle.y)
    } else if (particle.type === 'shield') {
      const x = particle.x || (spell.endX + Math.cos(particle.angle) * particle.radius)
      const y = particle.y || (spell.endY + Math.sin(particle.angle) * particle.radius)
      const size = particle.size * (1 + Math.sin(particle.pulse) * 0.3)
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    } else if (particle.type === 'meteor') {
      // Draw meteor as a larger flaming rock
      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      
      // Add flame overlay
      ctx.fillStyle = `hsla(${Math.random() * 60}, 100%, 50%, 0.5)`
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 1.2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Default circle
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }

  const drawProjectile = (ctx, projectile, spell) => {
    const x = projectile.startX + (projectile.endX - projectile.startX) * projectile.progress
    const y = projectile.startY + (projectile.endY - projectile.startY) * projectile.progress
    
    ctx.save()
    
    switch (projectile.type) {
      case 'beam':
        // Draw laser beam
        const beamProgress = Math.min(projectile.progress * 2, 1)
        ctx.strokeStyle = spell.color || '#00ffff'
        ctx.lineWidth = projectile.width
        ctx.shadowBlur = 20
        ctx.shadowColor = ctx.strokeStyle
        ctx.beginPath()
        ctx.moveTo(projectile.startX, projectile.startY)
        ctx.lineTo(
          projectile.startX + (projectile.endX - projectile.startX) * beamProgress,
          projectile.startY + (projectile.endY - projectile.startY) * beamProgress
        )
        ctx.stroke()
        break
        
      case 'fireball':
        // Draw fireball
        ctx.fillStyle = '#ff4500'
        ctx.shadowBlur = 30
        ctx.shadowColor = '#ff4500'
        ctx.beginPath()
        ctx.arc(x, y, projectile.size, 0, Math.PI * 2)
        ctx.fill()
        
        // Inner core
        ctx.fillStyle = '#ffff00'
        ctx.beginPath()
        ctx.arc(x, y, projectile.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
        break
        
      case 'rainbow':
        // Draw rainbow beam
        const gradient = ctx.createLinearGradient(
          projectile.startX, projectile.startY,
          x, y
        )
        gradient.addColorStop(0, `hsla(${projectile.hue}, 100%, 50%, 0)`)
        gradient.addColorStop(0.2, `hsla(${projectile.hue}, 100%, 50%, 1)`)
        gradient.addColorStop(0.4, `hsla(${projectile.hue + 60}, 100%, 50%, 1)`)
        gradient.addColorStop(0.6, `hsla(${projectile.hue + 120}, 100%, 50%, 1)`)
        gradient.addColorStop(0.8, `hsla(${projectile.hue + 180}, 100%, 50%, 1)`)
        gradient.addColorStop(1, `hsla(${projectile.hue + 240}, 100%, 50%, 0)`)
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 20
        ctx.lineCap = 'round'
        ctx.shadowBlur = 30
        ctx.shadowColor = `hsl(${projectile.hue}, 100%, 50%)`
        ctx.beginPath()
        ctx.moveTo(projectile.startX, projectile.startY)
        ctx.lineTo(x, y)
        ctx.stroke()
        break
        
      case 'lightning':
        // Draw lightning bolt
        if (projectile.progress < 1) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 3
          ctx.shadowBlur = 20
          ctx.shadowColor = '#00ffff'
          ctx.beginPath()
          
          const visibleSegments = Math.floor(projectile.points.length * projectile.progress)
          ctx.moveTo(projectile.points[0].x, projectile.points[0].y)
          for (let i = 1; i <= visibleSegments; i++) {
            ctx.lineTo(projectile.points[i].x, projectile.points[i].y)
          }
          ctx.stroke()
          
          // Flash effect
          if (Math.random() < 0.3) {
            ctx.strokeStyle = '#00ffff'
            ctx.lineWidth = 8
            ctx.globalAlpha = 0.5
            ctx.stroke()
          }
        }
        break
        
      case 'ice_shard':
        // Draw rotating ice shard
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(projectile.rotation)
        ctx.fillStyle = '#88ddff'
        ctx.shadowBlur = 20
        ctx.shadowColor = '#88ddff'
        
        // Draw diamond shape
        ctx.beginPath()
        ctx.moveTo(0, -15)
        ctx.lineTo(10, 0)
        ctx.lineTo(0, 15)
        ctx.lineTo(-10, 0)
        ctx.closePath()
        ctx.fill()
        
        // Inner shine
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(0, -8)
        ctx.lineTo(5, 0)
        ctx.lineTo(0, 8)
        ctx.lineTo(-5, 0)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        break
        
      case 'orb':
      default:
        // Draw energy orb
        ctx.fillStyle = spell.color || '#ffffff'
        ctx.shadowBlur = 20
        ctx.shadowColor = ctx.fillStyle
        ctx.beginPath()
        ctx.arc(x, y, projectile.size || 10, 0, Math.PI * 2)
        ctx.fill()
        
        // Inner glow
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.arc(x, y, (projectile.size || 10) * 0.5, 0, Math.PI * 2)
        ctx.fill()
        break
    }
    
    ctx.restore()
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 100 }}
    />
  )
}

export default SpellEffects