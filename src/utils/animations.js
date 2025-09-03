// Animation utilities for juicy game effects

export const animateElement = (element, animation, duration = 500) => {
  if (!element) return Promise.resolve()

  return new Promise(resolve => {
    element.classList.add(animation)
    setTimeout(() => {
      element.classList.remove(animation)
      resolve()
    }, duration)
  })
}

export const createParticleEffect = (x, y, color = '#FFD700', count = 8) => {
  const particles = []
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 4px;
      height: 4px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
    `
    
    document.body.appendChild(particle)
    
    const angle = (i / count) * Math.PI * 2
    const velocity = 50 + Math.random() * 30
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity
    
    let posX = x
    let posY = y
    let alpha = 1
    
    const animate = () => {
      posX += vx * 0.016
      posY += vy * 0.016 + 50 * 0.016 // gravity
      alpha -= 0.02
      
      particle.style.left = posX + 'px'
      particle.style.top = posY + 'px'
      particle.style.opacity = alpha
      
      if (alpha > 0) {
        requestAnimationFrame(animate)
      } else {
        document.body.removeChild(particle)
      }
    }
    
    requestAnimationFrame(animate)
  }
}

export const shakeScreen = (duration = 500, intensity = 2) => {
  const body = document.body
  const originalTransform = body.style.transform
  
  let startTime = null
  
  const shake = (timestamp) => {
    if (!startTime) startTime = timestamp
    
    const elapsed = timestamp - startTime
    const progress = elapsed / duration
    
    if (progress < 1) {
      const x = (Math.random() - 0.5) * intensity
      const y = (Math.random() - 0.5) * intensity
      body.style.transform = `translate(${x}px, ${y}px)`
      requestAnimationFrame(shake)
    } else {
      body.style.transform = originalTransform
    }
  }
  
  requestAnimationFrame(shake)
}

export const flashScreen = (color = 'rgba(255, 255, 255, 0.5)', duration = 200) => {
  const flash = document.createElement('div')
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: ${color};
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
  `
  
  document.body.appendChild(flash)
  
  // Fade in then out
  requestAnimationFrame(() => {
    flash.style.transition = `opacity ${duration / 2}ms ease-out`
    flash.style.opacity = '1'
    
    setTimeout(() => {
      flash.style.opacity = '0'
      setTimeout(() => {
        if (flash.parentNode) {
          document.body.removeChild(flash)
        }
      }, duration / 2)
    }, duration / 2)
  })
}

// Bounce animation for UI elements
export const bounceIn = (element, delay = 0) => {
  if (!element) return
  
  element.style.transform = 'scale(0)'
  element.style.opacity = '0'
  
  setTimeout(() => {
    element.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    element.style.transform = 'scale(1)'
    element.style.opacity = '1'
  }, delay)
}

// Damage number animation
export const createDamageNumber = (x, y, value, type = 'damage') => {
  const numberEl = document.createElement('div')
  numberEl.textContent = type === 'damage' ? `-${value}` : `+${value}`
  numberEl.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    font-size: 24px;
    font-weight: bold;
    color: ${type === 'damage' ? '#ff4757' : '#2ed573'};
    pointer-events: none;
    z-index: 1000;
    font-family: 'Comic Neue', cursive;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
  `
  
  document.body.appendChild(numberEl)
  
  // Animate upward float
  let posY = y
  let opacity = 1
  let scale = 1
  
  const animate = () => {
    posY -= 2
    opacity -= 0.02
    scale += 0.01
    
    numberEl.style.top = posY + 'px'
    numberEl.style.opacity = opacity
    numberEl.style.transform = `scale(${scale})`
    
    if (opacity > 0) {
      requestAnimationFrame(animate)
    } else {
      if (numberEl.parentNode) {
        document.body.removeChild(numberEl)
      }
    }
  }
  
  requestAnimationFrame(animate)
}