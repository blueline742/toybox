import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// 3D Health Bar Component
const HealthBar3D = ({ currentHealth, maxHealth, position = [0, 2.3, 0.1], width = 2 }) => {
  const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));

  const getHealthColor = () => {
    if (healthPercentage > 60) return '#10b981';
    if (healthPercentage > 30) return '#eab308';
    return '#ef4444';
  };

  return (
    <group position={position}>
      {/* Background bar */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.15, 0.05]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* Health fill */}
      <mesh position={[-(width / 2) + (width * healthPercentage / 100) / 2, 0, 0.01]}>
        <boxGeometry args={[width * healthPercentage / 100, 0.12, 0.05]} />
        <meshBasicMaterial color={getHealthColor()} />
      </mesh>

      {/* Health text */}
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

// 3D Stats Display Component
const Stats3D = ({ attack, defense, position = [0, -2.3, 0.1] }) => {
  return (
    <group position={position}>
      {/* Attack stat */}
      <group position={[-0.5, 0, 0]}>
        <Text
          fontSize={0.2}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          ⚔️ {attack}
        </Text>
      </group>

      {/* Defense stat */}
      <group position={[0.5, 0, 0]}>
        <Text
          fontSize={0.2}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          🛡️ {defense}
        </Text>
      </group>
    </group>
  );
};

// 3D Rarity Badge Component
const RarityBadge3D = ({ rarity, position = [0, 1.8, 0.1] }) => {
  const getRarityColor = () => {
    switch (rarity) {
      case 'mythic': return '#ff0000';
      case 'legendary': return '#ffa500';
      case 'epic': return '#9333ea';
      case 'rare': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <group position={position}>
      <RoundedBox args={[0.8, 0.25, 0.05]} radius={0.05}>
        <meshBasicMaterial color={getRarityColor()} />
      </RoundedBox>
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {rarity?.toUpperCase() || 'COMMON'}
      </Text>
    </group>
  );
};

// Main Card Component with all UI elements
const Card3DComplete = ({
  character,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isActive = false,
  isDead = false,
  teamColor = 'blue',
  onClick,
  onPointerEnter,
  onPointerLeave,
  isTargeting = false,
  isValidTarget = false,
  scale = 1
}) => {
  const groupRef = useRef();
  const cardRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Map character names to NFT image files
  const getNFTImagePath = (character) => {
    const nameMap = {
      'Wizard Toy': '/assets/nft/nftwizard.png',
      'Robot Guardian': '/assets/nft/Robotguardian.png',
      'Rubber Duckie': '/assets/nft/duckie.png',
      'Brick Dude': '/assets/nft/brickdude.png',
      'Wind-Up Soldier': '/assets/nft/windupsoldier.png',
      'Doctor Toy': '/assets/nft/doctor.png',
      'Voodoo Doll': '/assets/nft/voodoo.png',
      'Baby Doll': '/assets/nft/babydoll.png',
      'Mecha Dino': '/assets/nft/nftmechadino.png',
    };

    return nameMap[character.name] || '/assets/nft/11.png';
  };

  // Card dimensions
  const cardWidth = 2.2 * scale;
  const cardHeight = 3.3 * scale;
  const cardDepth = 0.1 * scale;

  // Load textures with error handling
  const frontPath = getNFTImagePath(character);
  const backPath = '/assets/nft/cardback.png';

  let frontTexture, backTexture;
  try {
    frontTexture = useLoader(THREE.TextureLoader, frontPath);
    backTexture = useLoader(THREE.TextureLoader, backPath);
  } catch (error) {
    console.error('Error loading textures:', error);
  }

  // Animation for active card and targeting
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation for active card
      if (isActive) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        groupRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime) * 0.03;
      } else {
        groupRef.current.position.y = position[1];
        groupRef.current.rotation.y = rotation[1];
      }

      // Hover effect
      if (cardRef.current) {
        const targetScale = hovered && !isDead ? 1.05 : 1;
        cardRef.current.scale.x += (targetScale - cardRef.current.scale.x) * 0.1;
        cardRef.current.scale.y = cardRef.current.scale.x;
        cardRef.current.scale.z = cardRef.current.scale.x;
      }
    }
  });

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
      if (onPointerEnter) {
        onPointerEnter(e);
      }
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
    if (onPointerLeave) {
      onPointerLeave(e);
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      userData={{ characterId: character.instanceId }}
    >
      {/* Main card mesh */}
      <group ref={cardRef}>
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />

          {/* Materials array for box faces: [right, left, top, bottom, front, back] */}
          <meshStandardMaterial attach="material-0" color="#1a1a1a" /> {/* Right */}
          <meshStandardMaterial attach="material-1" color="#1a1a1a" /> {/* Left */}
          <meshStandardMaterial attach="material-2" color="#1a1a1a" /> {/* Top */}
          <meshStandardMaterial attach="material-3" color="#1a1a1a" /> {/* Bottom */}
          <meshStandardMaterial
            attach="material-4"
            map={frontTexture}
            color={frontTexture ? "#ffffff" : teamColor === 'blue' ? "#4169E1" : "#DC143C"}
          /> {/* Front */}
          <meshStandardMaterial
            attach="material-5"
            map={backTexture}
            color={backTexture ? "#ffffff" : "#2a2a2a"}
          /> {/* Back */}
        </mesh>

        {/* Character name */}
        <Text
          position={[0, 1.95 * scale, 0.1]}
          fontSize={0.18 * scale}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
          fontWeight={700}
        >
          {character.name}
        </Text>

        {/* Health bar */}
        <HealthBar3D
          currentHealth={character.currentHealth}
          maxHealth={character.maxHealth}
          position={[0, 2.3 * scale, 0.1]}
          width={2 * scale}
        />

        {/* Stats */}
        <Stats3D
          attack={character.stats?.attack || character.attack || 50}
          defense={character.stats?.defense || character.defense || 30}
          position={[0, -2.3 * scale, 0.1]}
        />

        {/* Rarity badge */}
        <RarityBadge3D
          rarity={character.rarity}
          position={[0, 1.5 * scale, 0.1]}
        />

        {/* Active glow */}
        {isActive && !isDead && (
          <mesh position={[0, 0, -cardDepth * 2]}>
            <planeGeometry args={[cardWidth * 1.3, cardHeight * 1.3]} />
            <meshBasicMaterial
              color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}

        {/* Valid target highlight ring */}
        {isValidTarget && isTargeting && (
          <mesh position={[0, -cardHeight / 2 - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2 * scale, 1.5 * scale, 32]} />
            <meshBasicMaterial
              color={hovered ? "#ffff00" : (teamColor === 'blue' ? "#00ff00" : "#ff0000")}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}

        {/* Death overlay */}
        {isDead && (
          <mesh position={[0, 0, cardDepth + 0.01]}>
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshBasicMaterial
              color="#000000"
              transparent
              opacity={0.7}
            />
          </mesh>
        )}

        {/* Death X mark */}
        {isDead && (
          <Text
            position={[0, 0, cardDepth + 0.02]}
            fontSize={1.5 * scale}
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
    </group>
  );
};

export default Card3DComplete;