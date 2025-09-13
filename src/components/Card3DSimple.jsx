import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const Card3DSimple = ({ 
  character,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isActive = false,
  isDead = false,
  teamColor = 'blue',
  onClick,
  isTargeting = false,
  isValidTarget = false,
  scale = 1
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
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
      // Default fallback
      'default': '/assets/nft/cardback.png'
    };
    
    return nameMap[character.name] || nameMap['default'];
  };
  
  // Load the NFT texture
  const texture = useLoader(THREE.TextureLoader, getNFTImagePath(character));
  
  // Card dimensions (aspect ratio based on actual card images)
  const cardWidth = 2.5 * scale;
  const cardHeight = 3.5 * scale;
  const cardDepth = 0.05 * scale;
  
  // Animation for active card and targeting
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation for active card
      if (isActive) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15;
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.05;
      } else {
        groupRef.current.position.y = position[1];
        groupRef.current.rotation.y = 0;
      }
      
      // Scale pulse for valid targets
      if (isValidTarget) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
        groupRef.current.scale.set(pulse, pulse, 1);
      } else if (hovered && !isDead) {
        groupRef.current.scale.set(1.05, 1.05, 1);
      } else {
        groupRef.current.scale.set(1, 1, 1);
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
    }
  };
  
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
  };
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main Card */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
        
        {/* Front face with NFT texture */}
        <meshStandardMaterial 
          attachArray="material"
          map={texture}
          side={THREE.FrontSide}
        />
        
        {/* Back face */}
        <meshStandardMaterial 
          attachArray="material"
          color="#1a1a1a"
          side={THREE.BackSide}
        />
        
        {/* Edges */}
        {[...Array(4)].map((_, i) => (
          <meshStandardMaterial 
            key={i}
            attachArray="material"
            color="#2a2a2a"
          />
        ))}
      </mesh>
      
      {/* Glow effect for active card */}
      {isActive && !isDead && (
        <>
          {/* Backlight glow */}
          <mesh position={[0, 0, -0.5]}>
            <planeGeometry args={[cardWidth * 1.3, cardHeight * 1.3]} />
            <meshBasicMaterial 
              color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Point light */}
          <pointLight
            position={[0, 0, 1]}
            intensity={0.5}
            color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
            distance={4}
          />
        </>
      )}
      
      {/* Target highlight ring */}
      {isValidTarget && (
        <mesh position={[0, 0, 0.1]}>
          <ringGeometry args={[cardWidth * 0.6, cardWidth * 0.65, 32]} />
          <meshBasicMaterial 
            color="#ffd700"
            transparent
            opacity={0.8 + Math.sin(Date.now() * 0.005) * 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Death overlay */}
      {isDead && (
        <>
          {/* Dark overlay */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshBasicMaterial 
              color="#000000"
              transparent
              opacity={0.7}
            />
          </mesh>
          
          {/* Red X */}
          <group position={[0, 0, 0.07]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <planeGeometry args={[cardWidth * 0.7, cardWidth * 0.1]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <planeGeometry args={[cardWidth * 0.7, cardWidth * 0.1]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </group>
        </>
      )}
      
      {/* Hover highlight */}
      {hovered && !isDead && !isValidTarget && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[cardWidth * 1.1, cardHeight * 1.1]} />
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

export default Card3DSimple;