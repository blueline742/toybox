import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  Environment,
  BakeShadows,
  Loader,
  Sparkles,
  Float
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Card3DWithTexture from './Card3DWithTexture';
import DamageNumber3D from './DamageNumber3D';

// Import effects
import FireballEffect from '../effects/FireballEffect';
import ShieldEffect from '../effects/ShieldEffect';
import HealingEffect from '../effects/HealingEffect';
import ExplosionEffect from '../effects/ExplosionEffect';

// Preload the GLB model
useGLTF.preload('/assets/toy_box.glb');

// Toy Box Arena Component
const ToyBoxArena = () => {
  const { scene } = useGLTF('/assets/toy_box.glb');

  // Clone the scene to avoid issues with multiple instances
  const clonedScene = scene.clone();

  return (
    <primitive
      object={clonedScene}
      scale={[2, 2, 2]}
      position={[0, -3, 0]}
      receiveShadow
    />
  );
};

// Battle Arena with all 3D elements
const BattleArena = ({
  playerTeam,
  aiTeam,
  onCardClick,
  shieldedCharacters,
  frozenCharacters,
  isTargeting,
  validTargets,
  activeCharacterIndex,
  currentTurn,
  activeEffects
}) => {
  const isMobile = window.innerWidth <= 640;
  const scale = isMobile ? 0.7 : 1;

  // Load background texture
  const backgroundTexture = useLoader(THREE.TextureLoader, '/assets/backgrounds/toyboxare1na.png');

  const getCardPosition = (index, team) => {
    const spacing = isMobile ? 3 : 3.5;
    const row = Math.floor(index / 3);
    const col = index % 3;

    const x = (col - 1) * spacing;
    const y = row * -2 + 1; // Raised slightly
    const z = team === 'player' ? 4 : -4;

    return [x, y, z];
  };

  return (
    <>
      {/* Background sphere with arena texture */}
      <mesh scale={[-50, 50, 50]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          map={backgroundTexture}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Enhanced Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 5, 0]} intensity={0.5} color="#ff9999" />
      <pointLight position={[5, 5, 0]} intensity={0.5} color="#9999ff" />

      {/* Magical sparkles in the air */}
      <Sparkles
        count={100}
        scale={20}
        size={2}
        speed={0.4}
        color="#FFD700"
        opacity={0.3}
      />

      {/* Load the toy box arena */}
      <Suspense fallback={null}>
        <ToyBoxArena />
      </Suspense>

      {/* Player Team Cards */}
      {playerTeam.map((char, index) => {
        if (!char.isAlive) return null;

        const position = getCardPosition(index, 'player');
        const isActive = currentTurn === 'player' && index === activeCharacterIndex;
        const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

        return (
          <Float
            key={char.instanceId}
            speed={isActive ? 2 : 0} // Float when active
            rotationIntensity={isActive ? 0.1 : 0}
            floatIntensity={isActive ? 0.2 : 0}
          >
            <group>
              <Card3DWithTexture
                character={char}
                position={position}
                isDead={char.currentHealth <= 0}
                teamColor="blue"
                onClick={() => onCardClick(char)}
                scale={scale * (isActive ? 1.1 : 1)}
                isTargeting={isTargeting}
                isValidTarget={isValidTarget}
                isActive={isActive}
              />

              {shieldedCharacters?.has(char.instanceId) && (
                <ShieldEffect
                  position={position}
                  size={1.8 * scale}
                  type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
                />
              )}

              {frozenCharacters?.has(char.instanceId) && (
                <mesh position={position}>
                  <boxGeometry args={[2.5, 3.5, 2.5]} />
                  <meshPhysicalMaterial
                    color="#87CEEB"
                    transparent
                    opacity={0.6}
                    roughness={0.1}
                    metalness={0.3}
                    clearcoat={1}
                    transmission={0.5}
                  />
                </mesh>
              )}
            </group>
          </Float>
        );
      })}

      {/* AI Team Cards */}
      {aiTeam.map((char, index) => {
        if (!char.isAlive) return null;

        const position = getCardPosition(index, 'ai');
        const isActive = currentTurn === 'ai' && index === activeCharacterIndex;
        const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

        return (
          <Float
            key={char.instanceId}
            speed={isActive ? 2 : 0}
            rotationIntensity={isActive ? 0.1 : 0}
            floatIntensity={isActive ? 0.2 : 0}
          >
            <group>
              <Card3DWithTexture
                character={char}
                position={position}
                rotation={[0, Math.PI, 0]}
                isDead={char.currentHealth <= 0}
                teamColor="red"
                onClick={() => onCardClick(char)}
                scale={scale * (isActive ? 1.1 : 1)}
                isTargeting={isTargeting}
                isValidTarget={isValidTarget}
                isActive={isActive}
              />

              {shieldedCharacters?.has(char.instanceId) && (
                <ShieldEffect
                  position={position}
                  size={1.8 * scale}
                  type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
                />
              )}

              {frozenCharacters?.has(char.instanceId) && (
                <mesh position={position}>
                  <boxGeometry args={[2.5, 3.5, 2.5]} />
                  <meshPhysicalMaterial
                    color="#87CEEB"
                    transparent
                    opacity={0.6}
                    roughness={0.1}
                    metalness={0.3}
                    clearcoat={1}
                    transmission={0.5}
                  />
                </mesh>
              )}
            </group>
          </Float>
        );
      })}

      {/* Render active effects */}
      {activeEffects?.map((effect, index) => {
        switch (effect.type) {
          case 'fireball':
            return <FireballEffect key={index} {...effect} />;
          case 'explosion':
            return <ExplosionEffect key={index} {...effect} />;
          case 'healing':
            return <HealingEffect key={index} {...effect} />;
          default:
            return null;
        }
      })}

      {/* Bake shadows for performance */}
      <BakeShadows />
    </>
  );
};

// Main Scene Component
const Scene = ({
  playerTeam,
  aiTeam,
  onCardClick,
  shieldedCharacters,
  frozenCharacters,
  isTargeting,
  validTargets,
  activeCharacterIndex,
  currentTurn,
  activeEffects,
  damageNumbers
}) => {
  return (
    <div className="relative w-full h-screen">
      {/* Loading indicator */}
      <Loader />

      {/* R3F Canvas - All 3D rendering happens here */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 15], fov: 50 }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 8, 15]} fov={50} />

          {/* Main battle arena */}
          <BattleArena
            playerTeam={playerTeam}
            aiTeam={aiTeam}
            onCardClick={onCardClick}
            shieldedCharacters={shieldedCharacters}
            frozenCharacters={frozenCharacters}
            isTargeting={isTargeting}
            validTargets={validTargets}
            activeCharacterIndex={activeCharacterIndex}
            currentTurn={currentTurn}
            activeEffects={activeEffects}
          />

          {/* Damage Numbers */}
          {damageNumbers?.map(dn => (
            <DamageNumber3D
              key={dn.id}
              value={dn.value}
              position={dn.position}
              isCritical={dn.isCritical}
              isHealing={dn.isHealing}
            />
          ))}

          {/* Camera controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={!isTargeting}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 6}
            maxDistance={20}
            minDistance={8}
          />

          {/* Environment lighting */}
          <Environment preset="sunset" />

          {/* Post-processing effects - commented out for now due to compatibility issues
          <EffectComposer>
            <Bloom
              intensity={0.5}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.9}
              radius={0.8}
            />
            <ChromaticAberration
              offset={[0.0005, 0.0005]}
              radialModulation={false}
              modulationOffset={0}
            />
            <Vignette
              eskil={false}
              offset={0.1}
              darkness={0.4}
            />
          </EffectComposer> */}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;