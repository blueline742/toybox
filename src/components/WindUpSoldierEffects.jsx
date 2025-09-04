import React, { useEffect } from 'react'

const WindUpSoldierEffects = ({ 
  ability, 
  sourcePosition, 
  targetPositions, 
  onComplete,
  activeCharacter 
}) => {
  
  useEffect(() => {
    if (!sourcePosition || !targetPositions || targetPositions.length === 0) {
      onComplete?.()
      return
    }

    const performAnimation = async () => {
      switch (ability.effect) {
        case 'buff_damage_all':
          await windTensionEffect()
          break
        case 'buff_critical_all':
          await forwardMarchEffect()
          break
        default:
          // For march attack, use the brick dude sword slash animation
          onComplete?.()
          break
      }
    }

    const windTensionEffect = async () => {
      // Get the caster element
      const casterElement = document.getElementById(`char-${activeCharacter.instanceId}`)
      if (!casterElement) {
        onComplete?.()
        return
      }

      // Create wind-up visual effect
      const windUpDiv = document.createElement('div')
      windUpDiv.style.cssText = `
        position: fixed;
        left: ${sourcePosition.x}px;
        top: ${sourcePosition.y}px;
        width: 100px;
        height: 100px;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
      `
      
      // Create rotating gears
      for (let i = 0; i < 3; i++) {
        const gear = document.createElement('div')
        gear.style.cssText = `
          position: absolute;
          width: ${40 + i * 20}px;
          height: ${40 + i * 20}px;
          border: 3px solid #FFD700;
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(${i * 30}deg);
          animation: rotate-gear-${i % 2 === 0 ? 'cw' : 'ccw'} ${1 + i * 0.2}s linear infinite;
        `
        
        // Add gear teeth
        for (let j = 0; j < 8; j++) {
          const tooth = document.createElement('div')
          tooth.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #FFD700;
            left: 50%;
            top: -4px;
            transform: translateX(-50%) rotate(${j * 45}deg);
            transform-origin: center ${(40 + i * 20) / 2 + 4}px;
          `
          gear.appendChild(tooth)
        }
        
        windUpDiv.appendChild(gear)
      }
      
      document.body.appendChild(windUpDiv)

      // Create buff particles going to allies
      setTimeout(() => {
        const alliedElements = document.querySelectorAll('[id^="char-player-"]')
        alliedElements.forEach((allyElement, index) => {
          const rect = allyElement.getBoundingClientRect()
          const targetX = rect.left + rect.width / 2
          const targetY = rect.top + rect.height / 2
          
          // Create energy particle
          const particle = document.createElement('div')
          particle.style.cssText = `
            position: fixed;
            left: ${sourcePosition.x}px;
            top: ${sourcePosition.y}px;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #FFD700, #FFA500);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 20px #FFD700;
          `
          
          document.body.appendChild(particle)
          
          // Animate to ally
          setTimeout(() => {
            particle.style.transition = 'all 0.5s ease-out'
            particle.style.left = `${targetX}px`
            particle.style.top = `${targetY}px`
            particle.style.opacity = '0'
            particle.style.transform = 'translate(-50%, -50%) scale(0)'
          }, index * 100)
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(particle)
          }, 600 + index * 100)
        })
      }, 500)

      // Clean up wind-up effect
      setTimeout(() => {
        document.body.removeChild(windUpDiv)
        onComplete?.()
      }, 1500)
    }

    const forwardMarchEffect = async () => {
      // Get the caster element
      const casterElement = document.getElementById(`char-${activeCharacter.instanceId}`)
      if (!casterElement) {
        onComplete?.()
        return
      }

      // Create marching effect
      const marchDiv = document.createElement('div')
      marchDiv.style.cssText = `
        position: fixed;
        left: ${sourcePosition.x}px;
        top: ${sourcePosition.y}px;
        width: 150px;
        height: 150px;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
      `

      // Create flag
      const flag = document.createElement('div')
      flag.style.cssText = `
        position: absolute;
        width: 60px;
        height: 40px;
        background: linear-gradient(135deg, #FF0000, #FFD700);
        left: 50%;
        top: 20px;
        transform: translateX(-50%);
        animation: wave-flag 1s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
      `
      
      // Create flag pole
      const pole = document.createElement('div')
      pole.style.cssText = `
        position: absolute;
        width: 4px;
        height: 80px;
        background: #8B4513;
        left: 50%;
        top: 20px;
        transform: translateX(-50%);
      `
      
      marchDiv.appendChild(pole)
      marchDiv.appendChild(flag)
      document.body.appendChild(marchDiv)

      // Ground shake effect DISABLED
      // const shakeDiv = document.createElement('div')
      // shakeDiv.style.cssText = `
      //   position: fixed;
      //   left: 0;
      //   top: 0;
      //   width: 100%;
      //   height: 100%;
      //   pointer-events: none;
      //   animation: ground-shake 0.5s ease-in-out 3;
      // `
      // document.body.appendChild(shakeDiv)

      // Create buff aura for all allies
      setTimeout(() => {
        const alliedElements = document.querySelectorAll('[id^="char-player-"]')
        alliedElements.forEach((allyElement) => {
          const rect = allyElement.getBoundingClientRect()
          
          // Create critical aura
          const aura = document.createElement('div')
          aura.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            width: ${rect.width * 1.5}px;
            height: ${rect.height * 1.5}px;
            border: 3px solid #FF0000;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
            animation: pulse-aura 1s ease-in-out infinite;
            box-shadow: 0 0 30px #FF0000, inset 0 0 30px #FF0000;
          `
          
          document.body.appendChild(aura)
          
          // Remove aura after 2 seconds
          setTimeout(() => {
            aura.style.transition = 'opacity 0.5s'
            aura.style.opacity = '0'
            setTimeout(() => document.body.removeChild(aura), 500)
          }, 2000)
        })
      }, 800)

      // Clean up
      setTimeout(() => {
        document.body.removeChild(marchDiv)
        // document.body.removeChild(shakeDiv) // DISABLED
        onComplete?.()
      }, 2500)
    }

    performAnimation()
  }, [ability, sourcePosition, targetPositions, activeCharacter])

  return (
    <style jsx>{`
      @keyframes rotate-gear-cw {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      @keyframes rotate-gear-ccw {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(-360deg); }
      }
      
      @keyframes wave-flag {
        0%, 100% { transform: translateX(-50%) skewX(0deg); }
        25% { transform: translateX(-50%) skewX(5deg); }
        75% { transform: translateX(-50%) skewX(-5deg); }
      }
      
      @keyframes ground-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @keyframes pulse-aura {
        0%, 100% { 
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.8;
        }
        50% { 
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 1;
        }
      }
    `}</style>
  )
}

export default WindUpSoldierEffects