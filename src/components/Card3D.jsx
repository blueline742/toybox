import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Card3D = ({ 
  character,
  position = [0, 0, 0],
  isActive = false,
  currentHealth,
  maxHealth,
  teamColor = 'blue',
  onClick,
  onHover,
  onUnhover,
  isTargeting = false,
  isValidTarget = false,
  scale = 1
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  
  // Calculate health percentage
  const healthPercentage = (currentHealth / maxHealth) * 100;
  const isDead = currentHealth <= 0;
  
  // Rarity colors
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return '#ff6b00';
      case 'legendary': return '#ffa500';
      case 'epic': return '#9c27b0';
      case 'rare': return '#2196f3';
      default: return '#757575';
    }
  };
  
  const rarityColor = getRarityColor(character.rarity);
  
  // Card dimensions
  const cardWidth = 2 * scale;
  const cardHeight = 3 * scale;
  const cardDepth = 0.1 * scale;
  
  // Animation for active card
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation for active card
      if (isActive) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
        groupRef.current.position.y = position[1];
      }
      
      // Pulse effect for valid targets
      if (isValidTarget && meshRef.current) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        meshRef.current.scale.set(pulse, pulse, 1);
      } else if (meshRef.current) {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });
  
  // Create card texture from image
  const cardTexture = useMemo(() => {
    if (character.image) {
      const loader = new THREE.TextureLoader();
      return loader.load(character.image);
    }
    return null;
  }, [character.image]);
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (!isDead && onClick) {
      onClick(character);
    }
  };
  
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    if (onHover) onHover(character);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    if (onUnhover) onUnhover();
    document.body.style.cursor = 'default';
  };
  
  return (
    <group ref={groupRef} position={position}>
      {/* Card Background */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
        <meshStandardMaterial 
          color={isDead ? '#333333' : (hovered ? '#444444' : '#2a2a2a')}
          emissive={isActive ? rarityColor : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
      
      {/* Card Border/Frame */}
      <mesh position={[0, 0, cardDepth/2 + 0.01]}>
        <planeGeometry args={[cardWidth + 0.1, cardHeight + 0.1]} />
        <meshBasicMaterial 
          color={rarityColor}
          transparent
          opacity={isValidTarget ? 1 : 0.7}
        />
      </mesh>
      
      {/* Character Image */}
      {cardTexture && (
        <mesh position={[0, cardHeight * 0.2, cardDepth/2 + 0.02]}>
          <planeGeometry args={[cardWidth * 0.8, cardHeight * 0.4]} />
          <meshBasicMaterial 
            map={cardTexture}
            transparent
            opacity={isDead ? 0.3 : 1}
          />
        </mesh>
      )}
      
      {/* Character Emoji Fallback */}
      {!cardTexture && character.emoji && (
        <Text
          position={[0, cardHeight * 0.2, cardDepth/2 + 0.02]}
          fontSize={0.8 * scale}
          color={isDead ? '#666666' : '#ffffff'}
        >
          {character.emoji}
        </Text>
      )}
      
      {/* Character Name */}
      <Text
        position={[0, cardHeight * 0.42, cardDepth/2 + 0.02]}
        fontSize={0.15 * scale}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={cardWidth * 0.9}
      >
        {character.name}
      </Text>
      
      {/* Rarity Label */}
      <Text
        position={[0, cardHeight * 0.35, cardDepth/2 + 0.02]}
        fontSize={0.1 * scale}
        color={rarityColor}
        anchorX="center"
        anchorY="middle"
      >
        {character.rarity.toUpperCase()}
      </Text>
      
      {/* Health Bar Background */}
      <mesh position={[0, -cardHeight * 0.35, cardDepth/2 + 0.02]}>
        <planeGeometry args={[cardWidth * 0.8, 0.15 * scale]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Health Bar Fill */}
      <mesh position={[
        -cardWidth * 0.4 + (cardWidth * 0.8 * healthPercentage / 100) / 2,
        -cardHeight * 0.35,
        cardDepth/2 + 0.03
      ]}>
        <planeGeometry args={[cardWidth * 0.8 * healthPercentage / 100, 0.12 * scale]} />
        <meshBasicMaterial 
          color={
            healthPercentage > 50 ? '#4caf50' :
            healthPercentage > 25 ? '#ff9800' : '#f44336'
          }
        />
      </mesh>
      
      {/* HP Text */}
      <Text
        position={[0, -cardHeight * 0.35, cardDepth/2 + 0.04]}
        fontSize={0.1 * scale}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`${currentHealth}/${maxHealth}`}
      </Text>
      
      {/* Stats Row */}
      <group position={[0, -cardHeight * 0.45, cardDepth/2 + 0.02]}>
        {/* Attack */}
        <Text
          position={[-cardWidth * 0.3, 0, 0]}
          fontSize={0.12 * scale}
          color="#ff4444"
          anchorX="center"
        >
          ⚔️ {character.attack || 50}
        </Text>
        
        {/* Defense */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.12 * scale}
          color="#4444ff"
          anchorX="center"
        >
          🛡️ {character.defense || 30}
        </Text>
        
        {/* Speed */}
        <Text
          position={[cardWidth * 0.3, 0, 0]}
          fontSize={0.12 * scale}
          color="#ffff44"
          anchorX="center"
        >
          ⚡ {character.speed || 40}
        </Text>
      </group>
      
      {/* Death Overlay */}
      {isDead && (
        <>
          <mesh position={[0, 0, cardDepth/2 + 0.05]}>
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshBasicMaterial 
              color="#000000"
              transparent
              opacity={0.7}
            />
          </mesh>
          
          {/* Red X */}
          <group position={[0, 0, cardDepth/2 + 0.06]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <planeGeometry args={[cardWidth * 0.8, 0.2]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <planeGeometry args={[cardWidth * 0.8, 0.2]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </group>
          
          <Text
            position={[0, 0, cardDepth/2 + 0.07]}
            fontSize={0.3 * scale}
            color="#ff0000"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, 0.2]}
          >
            DEFEATED
          </Text>
        </>
      )}
      
      {/* Active Glow */}
      {isActive && !isDead && (
        <pointLight
          position={[0, 0, 1]}
          intensity={0.5}
          color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
          distance={5}
        />
      )}
      
      {/* Target Highlight */}
      {isValidTarget && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[cardWidth * 1.2, cardHeight * 1.2]} />
          <meshBasicMaterial 
            color="#ffd700"
            transparent
            opacity={0.3 + Math.sin(Date.now() * 0.004) * 0.2}
          />
        </mesh>
      )}
    </group>
  );
};

export default Card3D;