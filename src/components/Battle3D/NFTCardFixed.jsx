import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * NFTCardFixed - Properly loads and displays 512x768 NFT images
 * Following state-driven architecture with guaranteed texture loading
 */
const NFTCardFixed = ({
  character,      // Card state object
  position,       // [x, y, z] from state
  rotation = [0, 0, 0],
  onClick,
  isTargeting,
  isValidTarget,
  isActive,
  isDead
}) => {
  // Get NFT texture path from character state
  const getTexturePath = () => {
    if (character?.image && character.image.includes('/assets/nft/')) {
      return character.image;
    }

    const charName = character?.name?.toLowerCase() || '';

    if (charName.includes('robot') || charName.includes('guardian'))
      return '/assets/nft/newnft/robotnft.png';
    if (charName.includes('arch') && charName.includes('wizard'))
      return '/assets/nft/newnft/archwizardnft.png';
    if (charName.includes('wizard'))
      return '/assets/nft/newnft/wizardnft.png';
    if (charName.includes('duck') || charName.includes('rubber'))
      return '/assets/nft/newnft/duckienft.png';
    if (charName.includes('brick') || charName.includes('teddy'))
      return '/assets/nft/newnft/brickdudenft.png';
    if (charName.includes('wind') || charName.includes('soldier'))
      return '/assets/nft/newnft/winduptoynft.png';
    if (charName.includes('dino') || charName.includes('mecha'))
      return '/assets/nft/newnft/dinonft.png';
    if (charName.includes('voodoo') || charName.includes('curse') || charName.includes('marionette'))
      return '/assets/nft/newnft/voodoonft.png';

    return '/assets/nft/newnft/robotnft.png';
  };

  // Load texture using useTexture - guaranteed to load before render
  const texture = useTexture(getTexturePath());

  // Configure texture for best quality
  React.useEffect(() => {
    if (texture) {
      texture.encoding = THREE.sRGBEncoding;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  // Visual states based on game state
  const [hovered, setHovered] = React.useState(false);

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

  // Card dimensions for 512x768 (2:3 aspect ratio)
  const cardWidth = 2.0;
  const cardHeight = 3.0;  // Maintains 2:3 ratio

  // Scale and position based on state
  const scale = isActive ? 1.15 : (hovered && !isTargeting ? 1.05 : 1);
  const yOffset = isActive ? 0.5 : (hovered && !isTargeting ? 0.2 : 0);

  // Glow color based on state
  const getGlowColor = () => {
    if (isActive) return '#ffcc00';
    if (isValidTarget && isTargeting) return '#00ff00';
    if (hovered && !isTargeting) return '#ffffff';
    return '#000000';
  };

  return (
    <group
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* NFT Image Card - Using plane geometry for proper texture display */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          opacity={isDead ? 0.3 : 1}
          side={THREE.DoubleSide}  // Visible from both sides
          alphaTest={0.01}
        />
      </mesh>

      {/* Glow border frame */}
      {(isActive || isValidTarget || hovered) && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[cardWidth + 0.1, cardHeight + 0.1]} />
          <meshBasicMaterial
            color={getGlowColor()}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Health bar - minimal visual indicator */}
      {character.currentHealth !== undefined && (
        <group position={[0, -cardHeight / 2 - 0.2, 0]}>
          {/* Health bar background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[cardWidth * 0.8, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>

          {/* Health bar fill */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[
              cardWidth * 0.8 * (character.currentHealth / character.maxHealth),
              0.1
            ]} />
            <meshBasicMaterial
              color={character.currentHealth > character.maxHealth * 0.3 ? '#00ff00' : '#ff0000'}
              emissive={character.currentHealth > character.maxHealth * 0.3 ? '#00ff00' : '#ff0000'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      )}

      {/* Death overlay */}
      {isDead && (
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Shield effect indicator */}
      {character.shields > 0 && (
        <mesh position={[0, cardHeight / 2 + 0.2, 0]}>
          <ringGeometry args={[0.2, 0.3, 32]} />
          <meshBasicMaterial
            color="#00ccff"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Frozen effect indicator */}
      {character.frozen && (
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshPhysicalMaterial
            color="#87CEEB"
            transparent
            opacity={0.3}
            roughness={0.1}
            metalness={0.3}
            clearcoat={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

// Preload all NFT textures for better performance
const NFT_PATHS = [
  '/assets/nft/newnft/robotnft.png',
  '/assets/nft/newnft/wizardnft.png',
  '/assets/nft/newnft/archwizardnft.png',
  '/assets/nft/newnft/duckienft.png',
  '/assets/nft/newnft/brickdudenft.png',
  '/assets/nft/newnft/winduptoynft.png',
  '/assets/nft/newnft/dinonft.png',
  '/assets/nft/newnft/voodoonft.png'
];

// Preload textures
NFT_PATHS.forEach(path => {
  useTexture.preload(path);
});

export default NFTCardFixed;