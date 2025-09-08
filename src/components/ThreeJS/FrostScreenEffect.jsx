import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Frost Shader Material
const FrostShaderMaterial = shaderMaterial(
  {
    time: 0,
    progress: 0,
    frostTexture: null,
    sceneTexture: null,
    resolution: new THREE.Vector2(1, 1),
    frostiness: 0.5,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader (adapted from the GLSL code)
  `
    uniform float time;
    uniform float progress;
    uniform float frostiness;
    uniform vec2 resolution;
    uniform sampler2D frostTexture;
    uniform sampler2D sceneTexture;
    
    varying vec2 vUv;
    
    float rand(vec2 uv) {
      float a = dot(uv, vec2(92.0, 80.0));
      float b = dot(uv, vec2(41.0, 62.0));
      float x = sin(a) + cos(b) * 51.0;
      return fract(x);
    }
    
    // Noise function for ice crystals
    float noise(vec2 uv) {
      vec2 i = floor(uv);
      vec2 f = fract(uv);
      
      float a = rand(i);
      float b = rand(i + vec2(1.0, 0.0));
      float c = rand(i + vec2(0.0, 1.0));
      float d = rand(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Create frost pattern
      float frost1 = noise(uv * 20.0 + time * 0.1);
      float frost2 = noise(uv * 40.0 - time * 0.05);
      float frost3 = noise(uv * 60.0 + time * 0.02);
      
      vec3 frostPattern = vec3(frost1, frost2, frost3);
      
      // Calculate spreading effect from center
      float size = mix(progress, sqrt(progress), 0.5);
      size = size * 1.12 + 0.0000001;
      
      vec2 lens = vec2(size, pow(size, 4.0) / 2.0);
      float dist = distance(uv, vec2(0.5, 0.5));
      float vignette = pow(1.0 - smoothstep(lens.x, lens.y, dist), 2.0);
      
      // Apply distortion based on frost pattern
      vec2 rnd = vec2(
        rand(uv + frostPattern.r * 0.05),
        rand(uv + frostPattern.b * 0.05)
      );
      
      rnd *= frostPattern.rg * vignette * frostiness;
      rnd *= 1.0 - floor(vignette);
      
      // Sample the scene with distortion
      vec4 regular = texture2D(sceneTexture, uv);
      vec4 frozen = texture2D(sceneTexture, uv + rnd * 0.02);
      
      // Apply icy color tint
      frozen.rgb *= vec3(0.85, 0.9, 1.15);
      
      // Add frost crystals overlay
      float crystals = frost1 * frost2 * frost3;
      crystals = smoothstep(0.3, 0.9, crystals) * vignette;
      frozen.rgb = mix(frozen.rgb, vec3(0.9, 0.95, 1.0), crystals * 0.3);
      
      // Mix between frozen and regular based on vignette
      float mixFactor = smoothstep(0.0, 1.0, pow(vignette, 2.0));
      gl_FragColor = mix(regular, frozen, mixFactor);
      
      // Add subtle ice shimmer
      float shimmer = sin(time * 5.0 + uv.x * 10.0) * sin(time * 3.0 + uv.y * 15.0);
      shimmer = shimmer * 0.1 * vignette * progress;
      gl_FragColor.rgb += vec3(shimmer * 0.3, shimmer * 0.4, shimmer * 0.5);
    }
  `
)

// Extend for use in JSX
extend({ FrostShaderMaterial })

// Frost Screen Plane Component
const FrostScreenPlane = ({ progress }) => {
  const meshRef = useRef()
  const { size, scene, camera } = useThree()
  const startTime = useRef(Date.now())
  
  // Create render target for capturing the scene
  const renderTarget = useMemo(() => {
    return new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    })
  }, [size])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const elapsed = (Date.now() - startTime.current) / 1000
    
    // Update shader uniforms
    meshRef.current.material.uniforms.time.value = elapsed
    meshRef.current.material.uniforms.progress.value = progress
    meshRef.current.material.uniforms.resolution.value.set(size.width, size.height)
    
    // Capture current scene to texture (excluding this plane)
    meshRef.current.visible = false
    state.gl.setRenderTarget(renderTarget)
    state.gl.render(scene, camera)
    state.gl.setRenderTarget(null)
    meshRef.current.visible = true
    
    // Apply captured texture
    meshRef.current.material.uniforms.sceneTexture.value = renderTarget.texture
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, 8]}>
      <planeGeometry args={[size.width / 50, size.height / 50]} />
      <frostShaderMaterial
        transparent={true}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

// Main Frost Effect Component
const FrostScreenEffect = ({ duration = 3000, onComplete }) => {
  const [progress, setProgress] = React.useState(0)
  const startTime = useRef(Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      const prog = Math.min(elapsed / duration, 1)
      
      // Ease in and out
      let easedProgress
      if (prog < 0.3) {
        // Ease in
        easedProgress = (prog / 0.3) * 0.8
      } else if (prog < 0.7) {
        // Hold at max
        easedProgress = 0.8
      } else {
        // Ease out
        easedProgress = 0.8 * (1 - (prog - 0.7) / 0.3)
      }
      
      setProgress(easedProgress)
      
      if (prog >= 1) {
        clearInterval(interval)
        if (onComplete) onComplete()
      }
    }, 16)
    
    return () => clearInterval(interval)
  }, [duration, onComplete])
  
  return <FrostScreenPlane progress={progress} />
}

// Standalone Frost Overlay (CSS-based fallback)
export const CSSFrostOverlay = ({ duration = 3000, onComplete }) => {
  const [visible, setVisible] = React.useState(true)
  const [progress, setProgress] = React.useState(0)
  
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const prog = Math.min(elapsed / duration, 1)
      
      // Ease in and out
      let easedProgress
      if (prog < 0.3) {
        easedProgress = (prog / 0.3)
      } else if (prog < 0.7) {
        easedProgress = 1
      } else {
        easedProgress = 1 - (prog - 0.7) / 0.3
      }
      
      setProgress(easedProgress)
      
      if (prog >= 1) {
        clearInterval(interval)
        setVisible(false)
        if (onComplete) onComplete()
      }
    }, 16)
    
    return () => clearInterval(interval)
  }, [duration, onComplete])
  
  if (!visible) return null
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 9998,
        background: `radial-gradient(ellipse at center, 
          rgba(200, 230, 255, ${progress * 0.3}) 0%, 
          rgba(150, 200, 230, ${progress * 0.2}) 40%, 
          transparent 70%)`,
        backdropFilter: `blur(${progress * 3}px) brightness(${1 + progress * 0.1})`,
        WebkitBackdropFilter: `blur(${progress * 3}px) brightness(${1 + progress * 0.1})`,
      }}
    >
      {/* Animated frost crystals */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: progress * 0.5,
          background: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='frost' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50 30 L50 70 M30 50 L70 50 M35 35 L65 65 M65 35 L35 65' stroke='%23ffffff' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23frost)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          animation: 'frostMove 10s linear infinite',
          mixBlendMode: 'screen',
        }}
      />
      
      {/* Ice shimmer effect */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: progress * 0.3,
          background: `linear-gradient(45deg, 
            transparent 30%, 
            rgba(255, 255, 255, 0.2) 50%, 
            transparent 70%)`,
          backgroundSize: '200% 200%',
          animation: 'shimmerMove 3s ease-in-out infinite',
        }}
      />
      
      <style jsx>{`
        @keyframes frostMove {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-100px, -100px) rotate(10deg); }
        }
        
        @keyframes shimmerMove {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
      `}</style>
    </div>
  )
}

export default FrostScreenEffect