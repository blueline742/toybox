import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  GodRays
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import Pyroblast from './Pyroblast';
import * as THREE from 'three';

// Scene with Pyroblast and Post-processing
const PyroblastScene = ({
  active = false,
  startPos = [-5, 1, 0],
  endPos = [5, 1, 0],
  onHit
}) => {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 5]} intensity={0.5} />

          {/* Environment for reflections */}
          <Environment preset="sunset" background={false} />

          {/* Pyroblast Effect */}
          <Pyroblast
            startPosition={startPos}
            endPosition={endPos}
            speed={3}
            active={active}
            onComplete={onHit}
          />

          {/* Ground plane for reference */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>

          {/* Test cubes as targets */}
          <mesh position={endPos}>
            <boxGeometry args={[1, 2, 1]} />
            <meshStandardMaterial color="#4444aa" />
          </mesh>

          {/* Camera controls */}
          <OrbitControls />

          {/* Post-processing effects */}
          <EffectComposer>
            {/* Bloom for fire glow */}
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.SCREEN}
              mipmapBlur
            />

            {/* Chromatic aberration for heat distortion */}
            <ChromaticAberration
              offset={[0.002, 0.002]}
              blendFunction={BlendFunction.NORMAL}
            />

            {/* Vignette for focus */}
            <Vignette
              offset={0.3}
              darkness={0.4}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default PyroblastScene;