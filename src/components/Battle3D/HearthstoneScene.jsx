import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Text, RoundedBox, Loader, OrbitControls, useGLTF, useTexture, Line, Billboard } from '@react-three/drei';
import { EffectComposer, Vignette, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import DamageNumber3D from './DamageNumber3D';
import HybridCard3D from './HybridCard3D';

// Import effects
import FireballEffect from '../effects/FireballEffect';
import PyroblastEffect from './effects/Pyroblast';
import EnhancedPyroblast from './effects/EnhancedPyroblast';
import ShieldEffect from '../effects/ShieldEffect';
import HealingEffect from '../effects/HealingEffect';
import ExplosionEffect from '../effects/ExplosionEffect';
import { useSpellEffects } from './effects/useSpellEffects';

// Health and Shield Display Component
const HealthShieldDisplay = ({ currentHealth, maxHealth, shieldAmount = 0, position = [0, 0, 0.01], isActive = false }) => {
  const heartTexture = useLoader(THREE.TextureLoader, '/assets/effects/heart.png');
  const defenceTexture = useLoader(THREE.TextureLoader, '/assets/effects/defence.png');

  // Responsive sizing - even smaller
  const isMobile = window.innerWidth <= 768;
  const iconSize = isMobile ? 0.12 : 0.15;
  const fontSize = isMobile ? 0.1 : 0.12;

  const getHealthColor = () => {
    const healthPercentage = (currentHealth / maxHealth) * 100;
    if (healthPercentage > 60) return '#ffffff';
    if (healthPercentage > 30) return '#ffcc00';
    return '#ff4444';
  };

  // Hide when card is active
  if (isActive) return null;

  // Calculate positions for side-by-side layout
  const hasShield = shieldAmount > 0;
  const healthOffset = hasShield ? -iconSize * 1.5 : -iconSize * 0.4;
  const shieldOffset = iconSize * 1.5;

  return (
    <group position={position}>
      {/* Heart icon and health - left side */}
      <group position={[healthOffset, 0, 0]}>
        <mesh position={[-iconSize * 0.4, 0, 0]}>
          <planeGeometry args={[iconSize, iconSize]} />
          <meshBasicMaterial
            map={heartTexture}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>

        <Text
          position={[iconSize * 0.3, 0, 0.01]}
          fontSize={fontSize}
          color={getHealthColor()}
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
        >
          {currentHealth}
        </Text>
      </group>

      {/* Shield/Defence icon and value - right side */}
      {hasShield && (
        <group position={[shieldOffset, 0, 0]}>
          <mesh position={[-iconSize * 0.4, 0, 0]}>
            <planeGeometry args={[iconSize, iconSize]} />
            <meshBasicMaterial
              map={defenceTexture}
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>

          <Text
            position={[iconSize * 0.3, 0, 0.01]}
            fontSize={fontSize}
            color="#00ccff"
            anchorX="left"
            anchorY="middle"
            outlineWidth={0.008}
            outlineColor="#000000"
          >
            {shieldAmount}
          </Text>
        </group>
      )}
    </group>
  );
};

// Legacy card component - now using CardWithNFT
const HearthstoneCard_DEPRECATED = ({
  character,
  position,
  rotation = [0, 0, 0],
  isDead,
  teamColor,
  onClick,
  isTargeting,
  isValidTarget,
  isActive,
  shieldAmount = 0
}) => {
  const isMobile = window.innerWidth <= 768;
  const [hovered, setHovered] = useState(false);

  // Responsive sizing
  const cardWidth = isMobile ? 1.2 : 1.8;
  const cardHeight = isMobile ? 1.8 : 2.5;
  const cardThickness = 0.05;

  const handlePointerOver = (e) => {
    if (!isTargeting) {
      e.stopPropagation();
      setHovered(true);
    }
  };

  const handlePointerOut = (e) => {
    if (!isTargeting) {
      e.stopPropagation();
      setHovered(false);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  // Get border color based on state
  const getBorderColor = () => {
    if (isActive) return '#ffcc00';
    if (isValidTarget && isTargeting) return '#00ff00';
    if (teamColor === 'blue') return '#4a90e2';
    return '#e74c3c';
  };

  // Simple scale for active state
  const scale = isActive ? 1.15 : (hovered && !isTargeting ? 1.05 : 1);
  const yOffset = isActive ? 0.5 : (hovered && !isTargeting ? 0.2 : 0);

  return (
    <group
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Card body - using simple box */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[cardWidth, cardHeight, cardThickness]} />
        <meshStandardMaterial
          color={getBorderColor()}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Portrait placeholder - legacy */}
      <mesh position={[0, cardHeight * 0.15, cardThickness / 2 + 0.001]}>
        <planeGeometry args={[cardWidth * 0.85, cardHeight * 0.5]} />
        <meshBasicMaterial
          color={teamColor === 'blue' ? '#336699' : '#993333'}
          transparent
          opacity={isDead ? 0.3 : 0.9}
        />
      </mesh>

      {/* Character name */}
      <Text
        position={[0, -cardHeight * 0.25, cardThickness / 2 + 0.002]}
        fontSize={isMobile ? 0.12 : 0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={cardWidth * 0.8}
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {character.name}
      </Text>

      {/* Stats box background */}
      <mesh position={[0, -cardHeight * 0.4, cardThickness / 2 + 0.001]}>
        <planeGeometry args={[cardWidth * 0.9, cardHeight * 0.15]} />
        <meshBasicMaterial color="#2c3e50" opacity={0.8} transparent />
      </mesh>

      {/* Attack and Defense stats */}
      <Text
        position={[-cardWidth * 0.3, -cardHeight * 0.4, cardThickness / 2 + 0.003]}
        fontSize={isMobile ? 0.1 : 0.12}
        color="#ff6b6b"
        anchorX="center"
        anchorY="middle"
      >
        ⚔️ {character.attack}
      </Text>

      <Text
        position={[cardWidth * 0.3, -cardHeight * 0.4, cardThickness / 2 + 0.003]}
        fontSize={isMobile ? 0.1 : 0.12}
        color="#4ecdc4"
        anchorX="center"
        anchorY="middle"
      >
        🛡️ {character.defense}
      </Text>

      {/* Health and Shield Display */}
      <HealthShieldDisplay
        currentHealth={character.currentHealth}
        maxHealth={character.maxHealth}
        shieldAmount={shieldAmount}
        position={[0, cardHeight * 0.5 + 0.2, 0]}
        isActive={isActive}
      />

      {/* Death overlay */}
      {isDead && (
        <Text
          position={[0, 0, cardThickness / 2 + 0.01]}
          fontSize={isMobile ? 0.5 : 0.8}
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

// Spectator Toy Component - Memoized to prevent re-renders
const SpectatorToy = React.memo(({ modelPath, position, rotation = [0, 0, 0], scale = 1 }) => {
  const { scene } = useGLTF(modelPath);

  // Memoize the cloned scene to prevent recreation
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    />
  );
});

// NFT textures are preloaded in CardWithNFT component

// Simple Table Component
const SimpleTable = () => {
  const tableTexture = useLoader(THREE.TextureLoader, '/assets/backgrounds/table.png');

  return (
    <group>
      {/* Table surface - much bigger */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[12, 0.3, 14]} /> {/* Wider and longer table */}
        <meshStandardMaterial
          map={tableTexture}
          color="#888888"  // Darken the texture by multiplying with gray
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Table legs - adjusted for bigger table */}
      {[[-5, -2, -6], [5, -2, -6], [-5, -2, 6], [5, -2, 6]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.6, 4, 0.6]} />
          <meshStandardMaterial
            color="#654321"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
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
  activeEffects,
  pyroblastCaster,
  pyroblastTarget
}) => {
  // State for targeting system
  const [selectedCard, setSelectedCard] = useState(null); // { id, position: [x, y, z] }
  const [targetCard, setTargetCard] = useState(null); // { id, position: [x, y, z] }

  // Update selected card when it's player's turn and a card is active
  useEffect(() => {
    if (currentTurn === 'player' && activeCharacterIndex >= 0 && playerTeam[activeCharacterIndex]) {
      const activeChar = playerTeam[activeCharacterIndex];
      const [x, y, z] = getCardPosition(activeCharacterIndex, 'player', true);
      setSelectedCard({
        id: activeChar.instanceId,
        position: [x, y + 0.5, z] // Adjust for active card height
      });
    } else {
      setSelectedCard(null);
    }
  }, [currentTurn, activeCharacterIndex, playerTeam]);

  // Clear target when not targeting
  useEffect(() => {
    if (!isTargeting) {
      setTargetCard(null);
    }
  }, [isTargeting]);

  // Load textures for floor
  const floorTexture = useLoader(THREE.TextureLoader, '/assets/backgrounds/floor.png');

  // Create simple wall material
  const wallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.8,
      metalness: 0.1,
      opacity: 0.95,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  // Configure floor texture - no repeating, just stretch single image
  useEffect(() => {
    floorTexture.wrapS = floorTexture.wrapT = THREE.ClampToEdgeWrapping;
  }, [floorTexture]);

  // Tabletop-style card positioning - cards lay flat with slight tilt
  const getCardPosition = (index, team, isActive = false) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 2.5 : 2.2; // Increased mobile spacing to prevent clipping
    const totalCards = 4;

    // Center the 4 cards horizontally
    const startX = -(totalCards - 1) * spacing / 2;
    const x = startX + index * spacing;

    // Cards on table surface - always at same height
    const y = 0.4; // Just above table surface

    const z = team === 'player' ? 5.5 : -5.5; // Distance from center
    const scale = 1; // No scaling for active cards

    return [x, y, z, scale];
  };

  return (
    <>
      {/* Simple Table */}
      <SimpleTable />

      {/* Spectator toys */}
      <group dispose={null}>
        <Suspense fallback={null}>
          <SpectatorToy
            modelPath="/assets/toy_robot.glb"
            position={[-5.5, 0.2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            scale={1}
          />
          <SpectatorToy
            modelPath="/assets/toy_rocket_free_standard.glb"
            position={[5.5, 1.0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={1.5}
          />
          <SpectatorToy
            modelPath="/assets/wooden_toy_train.glb"
            position={[1.5, 0.4, 2.5]}
            rotation={[0, Math.PI / 2 + Math.PI / 4, 0]}
            scale={0.0042}
          />
        </Suspense>
      </group>

      {/* Toy arena floor with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Surrounding walls with simple material */}
      {/* Back wall */}
      <mesh position={[0, 6, -20]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <primitive object={wallMaterial} />
      </mesh>

      {/* Front wall (behind camera) */}
      <mesh position={[0, 6, 20]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <primitive object={wallMaterial} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-20, 6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <primitive object={wallMaterial} />
      </mesh>

      {/* Right wall */}
      <mesh position={[20, 6, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <primitive object={wallMaterial} />
      </mesh>

      {/* Enhanced Lighting System */}
      {/* Base ambient for overall brightness - increased for NFT visibility */}
      <ambientLight intensity={1.5} color="#ffffff" />

      {/* Main key light - stronger for better NFT visibility */}
      <directionalLight
        position={[8, 12, 6]}
        intensity={2.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Secondary fill light from opposite side */}
      <directionalLight
        position={[-6, 10, -4]}
        intensity={1.0}
        color="#e8f4ff"
      />

      {/* Spotlight on the table */}
      <spotLight
        position={[0, 10, 0]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={1.2}
        color="#ffffff"
        castShadow
        target-position={[0, 0, 0]}
      />

      {/* Card area lights */}
      <pointLight position={[0, 4, 6]} intensity={0.8} color="#ffffff" distance={10} />
      <pointLight position={[0, 4, -6]} intensity={0.8} color="#ffffff" distance={10} />

      {/* Side accent lights */}
      <pointLight position={[-6, 3, 0]} intensity={0.6} color="#ffeaa7" distance={12} />
      <pointLight position={[6, 3, 0]} intensity={0.6} color="#74b9ff" distance={12} />

      {/* Hemisphere light for natural lighting */}
      <hemisphereLight
        intensity={0.6}
        color="#ffffff"
        groundColor="#d4c4a0"
      />

      {/* Cards Group - Always renders all cards */}
      <group name="cards">
        {/* Player Team Cards (bottom) */}
        {playerTeam && playerTeam.map((char, index) => {
          // Check if card exists
          if (!char) return null;
          // Skip dead cards only if health is explicitly 0 or less
          const isDead = char.health === 0 || (char.health < 0) || (char.isAlive === false);
          if (isDead) return null;

          const isActive = currentTurn === 'player' && index === activeCharacterIndex;
          const [x, y, z, scale] = getCardPosition(index, 'player', isActive);
          const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

          return (
            <group key={char.instanceId}>
              <HybridCard3D
                character={char}
                position={[x, y, z]}
                rotation={[-Math.PI / 2, 0, 0]} // Lay flat on table
                isDead={(char.health !== undefined && char.health <= 0) || (char.isAlive !== undefined && !char.isAlive) || (char.currentHealth !== undefined && char.currentHealth <= 0)}
                teamColor="blue"
                onClick={() => {
                  if (isValidTarget && isTargeting) {
                    setTargetCard({
                      id: char.instanceId,
                      position: [x, y, z]
                    });
                  }
                  onCardClick(char);
                }}
                isTargeting={isTargeting}
                isValidTarget={isValidTarget}
                isActive={isActive}
                debugMode={false}
              />

            {shieldedCharacters?.has(char.instanceId) && (
              <ShieldEffect
                position={[x, y + 0.8, z]}
                size={window.innerWidth <= 768 ? 1.3 : 2.0}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}

            {frozenCharacters?.has(char.instanceId) && (
              <mesh position={[x, y + 0.8, z]}>
                <boxGeometry args={[2.5, 3.5, 0.8]} />
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
        {console.log('🎨 HearthstoneScene - Rendering AI Team:', aiTeam?.length || 0, 'cards:', aiTeam?.map(c => c?.name))}
        {aiTeam && aiTeam.map((char, index) => {
          // Check if card exists
          if (!char) return null;
          // Skip dead cards only if health is explicitly 0 or less
          const isDead = char.health === 0 || (char.health < 0) || (char.isAlive === false);
          if (isDead) return null;

          const isActive = (currentTurn === 'ai' || currentTurn === 'opponent') && index === activeCharacterIndex;
          const [x, y, z, scale] = getCardPosition(index, 'ai', isActive);
          const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

          return (
            <group key={char.instanceId}>
              <HybridCard3D
                character={char}
                position={[x, y, z]}
                rotation={[Math.PI / 2, Math.PI, 0]} // Lay flat on table, facing opposite direction
                isDead={(char.health !== undefined && char.health <= 0) || (char.isAlive !== undefined && !char.isAlive) || (char.currentHealth !== undefined && char.currentHealth <= 0)}
                teamColor="red"
                onClick={() => {
                  if (isValidTarget && isTargeting) {
                    setTargetCard({
                      id: char.instanceId,
                      position: [x, y, z]
                    });
                  }
                  onCardClick(char);
                }}
                isTargeting={isTargeting}
                isValidTarget={isValidTarget}
                isActive={isActive}
                debugMode={false}
              />

            {shieldedCharacters?.has(char.instanceId) && (
              <ShieldEffect
                position={[x, y + 0.8, z]}
                size={window.innerWidth <= 768 ? 1.3 : 2.0}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}

            {frozenCharacters?.has(char.instanceId) && (
              <mesh position={[x, y + 0.8, z]}>
                <boxGeometry args={[2.5, 3.5, 0.8]} />
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
      </group>

      {/* Effects Group - Visual effects like targeting lines */}
      <group name="effects">
        {/* Targeting Line - Only renders when both selected and target exist */}
        {selectedCard && targetCard && (
          <Line
            points={[
              selectedCard.position,
              targetCard.position
            ]}
            color="#ff0000"
            lineWidth={3}
            dashed={true}
            dashScale={50}
            dashSize={3}
            gapSize={1}
          />
        )}

        {/* Targeting indicator for valid targets */}
        {isTargeting && validTargets && validTargets.map(target => {
          // Find target position
          let targetPos = null;

          // Check in player team
          const playerIndex = playerTeam?.findIndex(c => c.instanceId === target.instanceId);
          if (playerIndex >= 0) {
            targetPos = getCardPosition(playerIndex, 'player', false);
          }

          // Check in AI team
          if (!targetPos) {
            const aiIndex = aiTeam?.findIndex(c => c.instanceId === target.instanceId);
            if (aiIndex >= 0) {
              targetPos = getCardPosition(aiIndex, 'ai', false);
            }
          }

          if (!targetPos) return null;

          return (
            <mesh key={target.instanceId} position={[targetPos[0], targetPos[1] + 1.5, targetPos[2]]}>
              <ringGeometry args={[0.4, 0.5, 32]} />
              <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
            </mesh>
          );
        })}
      </group>

      {/* Render active effects */}
      <Suspense fallback={null}>
        {activeEffects?.map((effect, index) => {
          console.log('Rendering effect:', effect.type, effect);
          switch (effect.type) {
            case 'fireball':
              return <FireballEffect key={index} {...effect} />;
            case 'pyroblast':
              console.log('🔥 Rendering Enhanced Pyroblast effect with props:', effect);
              return <EnhancedPyroblast
                key={index}
                startPosition={effect.startPosition}
                endPosition={effect.endPosition}
                onComplete={() => {
                  console.log('Pyroblast animation complete');
                }}
                casterCard={pyroblastCaster}
                targetCard={pyroblastTarget}
              />;
            case 'explosion':
              return <ExplosionEffect key={index} {...effect} />;
            case 'healing':
              return <HealingEffect key={index} {...effect} />;
            default:
              return null;
          }
        })}
      </Suspense>
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
  damageNumbers,
  pyroblastActive,
  pyroblastCaster,
  pyroblastTarget
}) => {
  // Add error state
  const [hasError, setHasError] = useState(false);

  // Reset error on component mount
  useEffect(() => {
    setHasError(false);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-xl mb-2">3D Scene Error</div>
          <button
            onClick={() => setHasError(false)}
            className="px-4 py-2 bg-blue-500 rounded"
          >
            Reload Scene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <Loader />

      <Canvas
        onError={(error) => {
          console.error('Canvas error:', error);
          setHasError(true);
        }}
        shadows
        camera={{
          position: window.innerWidth <= 768 ? [0, 8, 10] : [0, 8, 10], // Good angle to see table and cards
          fov: window.innerWidth <= 768 ? 50 : 50, // Good FOV for tabletop view
          near: 0.1,
          far: 1000
        }}
        onCreated={({ gl, camera }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.5;

          // Look at the center of the table
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
            pyroblastCaster={pyroblastCaster}
            pyroblastTarget={pyroblastTarget}
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

          {/* Camera controls - full orbit around the table */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={[0, 0, 0]} // Focus on center of table
            minDistance={3}
            maxDistance={30}
            minPolarAngle={0} // Can look straight down
            maxPolarAngle={Math.PI} // Can look from any angle
            zoomSpeed={0.8}
            rotateSpeed={0.7}
            panSpeed={0.8}
            // No azimuth limits - can rotate 360°
          />

          {/* Post-processing effects for dramatic spell visuals - DISABLED for debugging */}
          {false && pyroblastActive && (
            <EffectComposer>
              <Vignette
                eskil={false}
                offset={0.1}
                darkness={1.2}
              />
              <Bloom
                intensity={1.5}
                luminanceThreshold={0.5}
                luminanceSmoothing={0.7}
              />
              <ChromaticAberration
                offset={[0.002, 0.002]}
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HearthstoneScene;