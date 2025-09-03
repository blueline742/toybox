import React, { useEffect, useRef } from 'react'

const ParticleEffects = ({ type = 'stars', count = 50 }) => {
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => {
      if (type === 'stars') {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          pulse: Math.random() * Math.PI * 2
        }
      } else if (type === 'fire') {
        return {
          x: canvas.width / 2 + (Math.random() - 0.5) * 100,
          y: canvas.height,
          size: Math.random() * 5 + 2,
          speedX: (Math.random() - 0.5) * 2,
          speedY: -(Math.random() * 3 + 2),
          life: 1,
          color: `hsl(${Math.random() * 60}, 100%, 50%)`
        }
      } else if (type === 'explosion') {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 5 + 2
        return {
          x: canvas.width / 2,
          y: canvas.height / 2,
          size: Math.random() * 8 + 2,
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          life: 1,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`
        }
      }
    })

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        if (type === 'stars') {
          // Update star position
          particle.x += particle.speedX
          particle.y += particle.speedY
          particle.pulse += 0.05

          // Wrap around screen
          if (particle.x < 0) particle.x = canvas.width
          if (particle.x > canvas.width) particle.x = 0
          if (particle.y < 0) particle.y = canvas.height
          if (particle.y > canvas.height) particle.y = 0

          // Draw star
          ctx.save()
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * (0.5 + Math.sin(particle.pulse) * 0.5)})`
          ctx.shadowBlur = 10
          ctx.shadowColor = 'white'
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else if (type === 'fire') {
          // Update fire particle
          particle.x += particle.speedX
          particle.y += particle.speedY
          particle.life -= 0.02
          particle.speedY -= 0.05

          if (particle.life <= 0) {
            // Reset particle
            particle.x = canvas.width / 2 + (Math.random() - 0.5) * 100
            particle.y = canvas.height
            particle.speedX = (Math.random() - 0.5) * 2
            particle.speedY = -(Math.random() * 3 + 2)
            particle.life = 1
          }

          // Draw fire particle
          ctx.save()
          ctx.globalAlpha = particle.life
          ctx.fillStyle = particle.color
          ctx.shadowBlur = 20
          ctx.shadowColor = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else if (type === 'explosion') {
          // Update explosion particle
          particle.x += particle.speedX
          particle.y += particle.speedY
          particle.life -= 0.02
          particle.speedX *= 0.98
          particle.speedY *= 0.98

          // Draw explosion particle
          if (particle.life > 0) {
            ctx.save()
            ctx.globalAlpha = particle.life
            ctx.fillStyle = particle.color
            ctx.shadowBlur = 30
            ctx.shadowColor = particle.color
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [type, count])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

export default ParticleEffects