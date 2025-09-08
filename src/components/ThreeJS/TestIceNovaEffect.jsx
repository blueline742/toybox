import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

// Super simple test - just a blue box
const TestIceNovaEffect = ({ sourcePos, targets, onComplete }) => {
  console.log('🧊 TestIceNovaEffect MOUNTED with:', { sourcePos, targets })
  
  useEffect(() => {
    console.log('🧊 TestIceNovaEffect useEffect running')
    
    // Add a visible DOM element to confirm the component is rendering
    const testDiv = document.createElement('div')
    testDiv.id = 'ice-nova-test'
    testDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(0,255,255,0.8) 0%, rgba(0,100,255,0.4) 100%);
      border-radius: 50%;
      z-index: 99999;
      pointer-events: none;
      animation: iceNovaPulse 2s ease-out;
      box-shadow: 0 0 100px rgba(0,200,255,0.8);
    `
    document.body.appendChild(testDiv)
    
    // Add animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes iceNovaPulse {
        0% {
          width: 50px;
          height: 50px;
          opacity: 1;
        }
        100% {
          width: 800px;
          height: 800px;
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
    
    // Clean up after 2 seconds
    const timer = setTimeout(() => {
      console.log('🧊 TestIceNovaEffect completing')
      if (testDiv.parentNode) {
        document.body.removeChild(testDiv)
      }
      if (style.parentNode) {
        document.head.removeChild(style)
      }
      if (onComplete) onComplete()
    }, 2000)
    
    return () => {
      console.log('🧊 TestIceNovaEffect unmounting')
      clearTimeout(timer)
      if (testDiv.parentNode) {
        document.body.removeChild(testDiv)
      }
      if (style.parentNode) {
        document.head.removeChild(style)
      }
    }
  }, [onComplete])
  
  // Also try Three.js canvas
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 10000
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1} />
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="cyan" />
        </mesh>
      </Canvas>
    </div>
  )
}

export default TestIceNovaEffect