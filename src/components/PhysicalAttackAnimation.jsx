import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

export default function PhysicalAttackAnimation({ 
  isActive, 
  attackerElement, 
  targetElement, 
  onComplete,
  attackerImage 
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current || !isActive || !attackerElement || !targetElement) return

    // Get positions
    const attackerRect = attackerElement.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    
    // Setup Three.js scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1,
      1000
    )
    camera.position.z = 10

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    
    // Clear and add to mount
    mountRef.current.innerHTML = ''
    mountRef.current.appendChild(renderer.domElement)

    // Create attacker card representation
    const cardGeometry = new THREE.PlaneGeometry(
      attackerRect.width * 0.8, 
      attackerRect.height * 0.8
    )
    
    // Load texture if image provided
    const cardMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })

    if (attackerImage) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(attackerImage, (texture) => {
        cardMaterial.map = texture
        cardMaterial.needsUpdate = true
      })
    }

    const attackerCard = new THREE.Mesh(cardGeometry, cardMaterial)
    
    // Position at attacker location
    const startX = attackerRect.left + attackerRect.width / 2 - window.innerWidth / 2
    const startY = -(attackerRect.top + attackerRect.height / 2 - window.innerHeight / 2)
    attackerCard.position.set(startX, startY, 5)
    
    scene.add(attackerCard)

    // Add glowing effect
    const glowGeometry = new THREE.PlaneGeometry(
      attackerRect.width * 1.2,
      attackerRect.height * 1.2
    )
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
    const glowCard = new THREE.Mesh(glowGeometry, glowMaterial)
    glowCard.position.copy(attackerCard.position)
    glowCard.position.z = 4
    scene.add(glowCard)

    // Create impact effect sprites
    const impactSprites = []
    const particleCount = 15
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.CircleGeometry(5, 8)
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.5),
        transparent: true,
        opacity: 0
      })
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.set(
        targetRect.left + targetRect.width / 2 - window.innerWidth / 2,
        -(targetRect.top + targetRect.height / 2 - window.innerHeight / 2),
        6
      )
      scene.add(particle)
      impactSprites.push(particle)
    }

    // Calculate target position
    const targetX = targetRect.left + targetRect.width / 2 - window.innerWidth / 2
    const targetY = -(targetRect.top + targetRect.height / 2 - window.innerHeight / 2)

    // Create attack animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Cleanup
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        renderer.dispose()
        if (onComplete) onComplete()
      }
    })

    // Animation sequence (Hearthstone style)
    tl.to(attackerCard.scale, {
      x: 1.2,
      y: 1.2,
      duration: 0.2,
      ease: "back.out(2)"
    })
    .to(glowMaterial, {
      opacity: 0.6,
      duration: 0.2
    }, "<")
    .to(attackerCard.position, {
      x: targetX,
      y: targetY,
      duration: 0.3,
      ease: "power2.in"
    })
    .to(attackerCard.rotation, {
      z: Math.PI * 2,
      duration: 0.3,
      ease: "power2.in"
    }, "<")
    .to(attackerCard.scale, {
      x: 1.5,
      y: 1.5,
      duration: 0.1,
      ease: "power2.out"
    })
    .to(impactSprites, {
      onStart: () => {
        // Screen shake effect
        const shakeIntensity = 10
        gsap.to(camera.position, {
          x: shakeIntensity,
          duration: 0.05,
          yoyo: true,
          repeat: 5,
          ease: "power2.inOut",
          onUpdate: () => renderer.render(scene, camera)
        })
      }
    }, ">")
    .to(impactSprites.map(sprite => sprite.material), {
      opacity: 1,
      duration: 0.1,
      stagger: 0.02
    }, "<")
    .to(impactSprites.map(sprite => sprite.position), {
      x: (index) => targetX + (Math.random() - 0.5) * 200,
      y: (index) => targetY + (Math.random() - 0.5) * 200,
      duration: 0.5,
      stagger: 0.02,
      ease: "power2.out"
    }, "<")
    .to(impactSprites.map(sprite => sprite.material), {
      opacity: 0,
      duration: 0.3,
      stagger: 0.02
    }, "-=0.3")
    .to(attackerCard.scale, {
      x: 0.8,
      y: 0.8,
      duration: 0.1
    }, "-=0.4")
    .to(attackerCard.position, {
      x: startX,
      y: startY,
      duration: 0.4,
      ease: "back.out(1.5)"
    })
    .to(attackerCard.rotation, {
      z: 0,
      duration: 0.4,
      ease: "back.out(1.5)"
    }, "<")
    .to(attackerCard.scale, {
      x: 1,
      y: 1,
      duration: 0.2
    }, "-=0.2")
    .to(glowMaterial, {
      opacity: 0,
      duration: 0.2
    }, "<")
    .to(cardMaterial, {
      opacity: 0,
      duration: 0.2
    })

    animationRef.current = tl

    // Render loop
    const animate = () => {
      if (rendererRef.current && sceneRef.current) {
        renderer.render(scene, camera)
        requestAnimationFrame(animate)
      }
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      camera.left = window.innerWidth / -2
      camera.right = window.innerWidth / 2
      camera.top = window.innerHeight / 2
      camera.bottom = window.innerHeight / -2
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        animationRef.current.kill()
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [isActive, attackerElement, targetElement, onComplete, attackerImage])

  if (!isActive) return null

  return (
    <div 
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  )
}