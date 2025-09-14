import React, { Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Text, RoundedBox, Loader, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import DamageNumber3D from './DamageNumber3D';

// Import effects
import FireballEffect from '../effects/FireballEffect';
import ShieldEffect from '../effects/ShieldEffect';
import HealingEffect from '../effects/HealingEffect';
import ExplosionEffect from '../effects/ExplosionEffect';

// 3D Health Bar Component
const HealthBar3D = ({ currentHealth, maxHealth, position = [0, 0, 0.01], width = 1.8 }) => {
  const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));

  const getHealthColor = () => {
    if (healthPercentage > 60) return '#10b981';
    if (healthPercentage > 30) return '#eab308';
    return '#ef4444';
  };

  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.15, 0.01]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[-(width / 2) + (width * healthPercentage / 100) / 2, 0, 0.005]}>
        <boxGeometry args={[width * healthPercentage / 100, 0.12, 0.01]} />
        <meshBasicMaterial color={getHealthColor()} />
      </mesh>

      <Text
        position={[0, -0.25, 0.01]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {`${currentHealth}/${maxHealth}`}
      </Text>
    </group>
  );
};

// Hearthstone-style Card Component
const HearthstoneCard = ({
  character,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isActive = false,
  isDead = false,
  teamColor = 'blue',
  onClick,
  isTargeting = false,
  isValidTarget = false
}) => {
  const cardRef = useRef();
  const [hovered, setHovered] = React.useState(false);

  // Map character names to NFT image files
  const getNFTImagePath = (character) => {
    const nameMap = {
      'Wizard Toy': '/assets/nft/newnft/wizardnft.png',
      'Robot Guardian': '/assets/nft/newnft/robotnft.png',
      'Rubber Duckie': '/assets/nft/newnft/duckienft.png',
      'Brick Dude': '/assets/nft/newnft/brickdudenft.png',
      'Cursed Marionette': '/assets/nft/newnft/voodoonft.png',
      'Mecha Dino': '/assets/nft/newnft/dinonft.png',
    };
    return nameMap[character.name] || '/assets/nft/newnft/wizardnft.png';
  };

  // Load textures
  const frontTexture = useLoader(THREE.TextureLoader, getNFTImagePath(character));
  const backTexture = useLoader(THREE.TextureLoader, '/assets/nft/cardback.png');

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isDead && onClick) {
      onClick(character);
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (!isDead) {
      setHovered(true);
      document.body.style.cursor = isTargeting ? 'crosshair' : 'pointer';
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  // Get rarity color
  const getRarityColor = () => {
    switch (character.rarity) {
      case 'mythic': return '#ff0000';
      case 'legendary': return '#ffa500';
      case 'epic': return '#9333ea';
      case 'rare': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const isMobile = window.innerWidth <= 768;
  const baseScale = isMobile ? 0.5 : 1; // Half size on mobile
  const scale = (hovered && !isDead ? 1.05 : 1) * baseScale * (isActive ? 1.1 : 1);
  const zOffset = 0; // No z offset

  return (
    <group position={[position[0], position[1], position[2] + zOffset]} rotation={rotation}>
      {/* Card mesh - flat plane */}
      <mesh
        ref={cardRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={[scale, scale, 1]}
      >
        <planeGeometry args={[2, 3]} />
        <meshBasicMaterial
          map={teamColor === 'blue' ? frontTexture : frontTexture}
          side={THREE.DoubleSide}
          transparent={isDead}
          opacity={isDead ? 0.3 : 1}
        />
      </mesh>

      {/* Character name removed */}

      {/* Health bar */}
      <HealthBar3D
        currentHealth={character.currentHealth}
        maxHealth={character.maxHealth}
        position={[0, 1.6, 0.01]}
        width={1.8}
      />

      {/* Stats removed */}

      {/* Rarity badge removed */}

      {/* Active glow */}
      {isActive && !isDead && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[2.3, 3.3]} />
          <meshBasicMaterial
            color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Valid target highlight */}
      {isValidTarget && isTargeting && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[2.2, 3.2]} />
          <meshBasicMaterial
            color="#ffff00"
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Death X mark */}
      {isDead && (
        <Text
          position={[0, 0, 0.02]}
          fontSize={1.5}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          ✖
        </Text>
      )}
    </group>
  );
};

// Battle Arena with Hearthstone layout
const HearthstoneBattleArena = ({
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
  // Load background texture
  const backgroundTexture = useLoader(THREE.TextureLoader, '/assets/backgrounds/toyboxare1na.png');

  // Hearthstone-style card positioning - responsive for mobile
  const getCardPosition = (index, team, isActive = false) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 1.0 : 2.5; // Very tight spacing on mobile
    const totalCards = 3;

    // Simple fixed positioning
    const positions = [-spacing, 0, spacing]; // Left, center, right
    const x = positions[index];

    const y = team === 'player' ? -2 : 2; // Player bottom, AI top
    const z = 0; // All cards on same plane

    // Scale active card slightly bigger
    const scale = isActive && currentTurn === team ? 1.1 : 1;

    return [x, y, z, scale];
  };

  return (
    <>
      {/* Spherical background for fisheye effect */}
      <mesh scale={[-30, 30, 30]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          map={backgroundTexture}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[0, 10, 5]} intensity={1.2} />
      <pointLight position={[0, 5, 2]} intensity={0.8} />

      {/* Player Team Cards (bottom) */}
      {playerTeam.map((char, index) => {
        if (!char.isAlive) return null;

        const isActive = currentTurn === 'player' && index === activeCharacterIndex;
        const [x, y, z, scale] = getCardPosition(index, 'player', isActive);
        const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

        return (
          <group key={char.instanceId}>
            <HearthstoneCard
              character={char}
              position={[x, y, z]}
              rotation={[-Math.PI * 0.05, 0, 0]} // Very slight tilt
              isDead={char.currentHealth <= 0}
              teamColor="blue"
              onClick={() => onCardClick(char)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              isActive={isActive}
            />

            {shieldedCharacters?.has(char.instanceId) && (
              <ShieldEffect
                position={[x, y, z]}
                size={window.innerWidth <= 768 ? 1.0 : 1.5}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}

            {frozenCharacters?.has(char.instanceId) && (
              <mesh position={[x, y, z]}>
                <boxGeometry args={[2.2, 3.2, 0.5]} />
                <meshPhysicalMaterial
                  color="#87CEEB"
                  transparent
                  opacity={0.6}
                  roughness={0.1}
                  metalness={0.3}
                  clearcoat={1}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* AI Team Cards (top) */}
      {aiTeam.map((char, index) => {
        if (!char.isAlive) return null;

        const isActive = currentTurn === 'ai' && index === activeCharacterIndex;
        const [x, y, z, scale] = getCardPosition(index, 'ai', isActive);
        const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

        return (
          <group key={char.instanceId}>
            <HearthstoneCard
              character={char}
              position={[x, y, z]}
              rotation={[Math.PI * 0.05, Math.PI, 0]} // Face down, very slight tilt
              isDead={char.currentHealth <= 0}
              teamColor="red"
              onClick={() => onCardClick(char)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              isActive={isActive}
            />

            {shieldedCharacters?.has(char.instanceId) && (
              <ShieldEffect
                position={[x, y, z]}
                size={window.innerWidth <= 768 ? 1.0 : 1.5}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}

            {frozenCharacters?.has(char.instanceId) && (
              <mesh position={[x, y, z]}>
                <boxGeometry args={[2.2, 3.2, 0.5]} />
                <meshPhysicalMaterial
                  color="#87CEEB"
                  transparent
                  opacity={0.6}
                  roughness={0.1}
                  metalness={0.3}
                  clearcoat={1}
                />
              </mesh>
            )}
          </group>
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
    </>
  );
};

// Main Hearthstone Scene Component
const HearthstoneScene = ({
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
      <Loader />

      <Canvas
        shadows
        camera={{
          position: window.innerWidth <= 768 ? [0, -4, 7] : [0, -8, 10], // Pulled back for mobile
          fov: window.innerWidth <= 768 ? 75 : 45, // Even wider FOV for mobile
          near: 0.1,
          far: 100
        }}
        onCreated={({ gl, camera }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;

          // Lock camera to look at center
          camera.lookAt(0, 0, 0);
        }}
      >
        <Suspense fallback={null}>
          <HearthstoneBattleArena
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

          {/* Camera controls - limited movement to prevent cards going off screen */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={12}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.2}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
            zoomSpeed={0.5}
            rotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HearthstoneScene;