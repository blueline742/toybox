import React, { useRef, useState, Suspense } from 'react';
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

// Card face with texture
const CardFace = ({ texturePath, color = "#4169E1" }) => {
  const texture = useLoader(THREE.TextureLoader, texturePath);

  return (
    <meshStandardMaterial map={texture} />
  );
};

// Fallback face without texture
const CardFaceFallback = ({ color = "#4169E1" }) => {
  return <meshStandardMaterial color={color} />;
};

// Main Card Component
const Card3DWithTexture = ({
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
      'Wizard Toy': '/assets/nft/newnft/wizardnft.png',
      'Robot Guardian': '/assets/nft/newnft/robotnft.png',
      'Rubber Duckie': '/assets/nft/newnft/duckienft.png',
      'Brick Dude': '/assets/nft/newnft/brickdudenft.png',
      'Cursed Marionette': '/assets/nft/newnft/voodoonft.png',
      'Mecha Dino': '/assets/nft/newnft/dinonft.png',
      // Fallback mappings for other characters
      'Wind-Up Soldier': '/assets/nft/windupsoldier.png',
      'Doctor Toy': '/assets/nft/doctor.png',
      'Baby Doll': '/assets/nft/babydoll.png',
    };

    return nameMap[character.name] || '/assets/nft/newnft/wizardnft.png';
  };

  // Card dimensions
  const cardWidth = 2.2 * scale;
  const cardHeight = 3.3 * scale;
  const cardDepth = 0.1 * scale;

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

  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      if (isActive) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        groupRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime) * 0.03;
      } else {
        groupRef.current.position.y = position[1];
        groupRef.current.rotation.y = rotation[1];
      }

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
      if (onPointerEnter) onPointerEnter(e);
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
    if (onPointerLeave) onPointerLeave(e);
  };

  const frontPath = getNFTImagePath(character);
  const backPath = '/assets/nft/cardback.png';

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      userData={{ characterId: character.instanceId }}
    >
      <group ref={cardRef}>
        {/* Main card */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />

          {/* Edge materials */}
          <meshStandardMaterial attach="material-0" color="#1a1a1a" />
          <meshStandardMaterial attach="material-1" color="#1a1a1a" />
          <meshStandardMaterial attach="material-2" color="#1a1a1a" />
          <meshStandardMaterial attach="material-3" color="#1a1a1a" />

          {/* Front face with texture */}
          <Suspense fallback={<CardFaceFallback color={teamColor === 'blue' ? "#4169E1" : "#DC143C"} />}>
            <CardFace texturePath={frontPath} />
          </Suspense>

          {/* Back face with texture */}
          <Suspense fallback={<CardFaceFallback color="#2a2a2a" />}>
            <CardFace texturePath={backPath} />
          </Suspense>
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
        <group position={[0, -2.3 * scale, 0.1]}>
          <Text
            position={[-0.5, 0, 0]}
            fontSize={0.2}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            ⚔️ {character.stats?.attack || character.attack || 50}
          </Text>
          <Text
            position={[0.5, 0, 0]}
            fontSize={0.2}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            🛡️ {character.stats?.defense || character.defense || 30}
          </Text>
        </group>

        {/* Rarity badge */}
        <group position={[0, 1.5 * scale, 0.1]}>
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
            {character.rarity?.toUpperCase() || 'COMMON'}
          </Text>
        </group>

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

        {/* Target ring */}
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
          <>
            <mesh position={[0, 0, cardDepth + 0.01]}>
              <planeGeometry args={[cardWidth, cardHeight]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
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
          </>
        )}
      </group>
    </group>
  );
};

export default Card3DWithTexture;