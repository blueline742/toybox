import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

/**
 * NFTCard3D - Clean NFT display following state-driven architecture
 * Renders only the NFT image without any UI overlays
 * All card data remains in state, visual is purely the NFT
 */
const NFTCard3D = ({
  character,      // Card state object
  position,       // [x, y, z] from state
  rotation = [0, 0, 0],
  onClick,
  isTargeting,
  isValidTarget,
  isActive,
  isDead
}) => {
  const [texture, setTexture] = useState(null);
  const [hovered, setHovered] = useState(false);

  // Card dimensions - slightly larger for better NFT visibility
  const cardWidth = 2.0;
  const cardHeight = 2.8;
  const cardThickness = 0.08;

  // Get NFT texture path from character state
  const getTexturePath = () => {
    // Use character's image property if it points to NFT
    if (character?.image && character.image.includes('/assets/nft/')) {
      return character.image;
    }

    // Map character names to NFT images
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

    // Default fallback
    return '/assets/nft/newnft/robotnft.png';
  };

  // Load NFT texture
  useEffect(() => {
    const texturePath = getTexturePath();
    const loader = new THREE.TextureLoader();

    loader.load(
      texturePath,
      (loadedTexture) => {
        // Configure for best quality
        loadedTexture.encoding = THREE.sRGBEncoding;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = true;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.warn('Failed to load NFT texture:', texturePath, error);
      }
    );
  }, [character?.name, character?.image]);

  // Handle interactions
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

  // Visual states based on game state
  const getGlowColor = () => {
    if (isActive) return '#ffcc00';           // Gold for active card
    if (isValidTarget && isTargeting) return '#00ff00';  // Green for valid target
    if (hovered && !isTargeting) return '#ffffff';       // White for hover
    return null;
  };

  // Scale based on state
  const scale = isActive ? 1.15 : (hovered && !isTargeting ? 1.05 : 1);
  const yOffset = isActive ? 0.5 : (hovered && !isTargeting ? 0.2 : 0);

  return (
    <group
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Card Frame - Minimal border */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[cardWidth, cardHeight, cardThickness]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.2}
          emissive={getGlowColor()}
          emissiveIntensity={getGlowColor() ? 0.3 : 0}
        />
      </mesh>

      {/* NFT Image - Full card face */}
      <mesh position={[0, 0, cardThickness / 2 + 0.001]}>
        <planeGeometry args={[cardWidth * 0.95, cardHeight * 0.95]} />
        {texture ? (
          <meshBasicMaterial
            map={texture}
            transparent={true}
            opacity={isDead ? 0.3 : 1}
            side={THREE.FrontSide}
            toneMapped={false}
          />
        ) : (
          // Fallback gradient while loading
          <meshBasicMaterial
            color="#2a2a2a"
            transparent
            opacity={0.9}
          />
        )}
      </mesh>

      {/* Back of card */}
      <mesh position={[0, 0, -cardThickness / 2 - 0.001]}>
        <planeGeometry args={[cardWidth * 0.95, cardHeight * 0.95]} />
        <meshBasicMaterial
          color="#0a0a0a"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Subtle health indicator - only visual, no text */}
      {character.currentHealth !== undefined && (
        <mesh position={[0, -cardHeight / 2 - 0.15, 0]}>
          <boxGeometry args={[cardWidth * (character.currentHealth / character.maxHealth), 0.08, 0.08]} />
          <meshBasicMaterial
            color={character.currentHealth > character.maxHealth * 0.3 ? '#00ff00' : '#ff0000'}
            emissive={character.currentHealth > character.maxHealth * 0.3 ? '#00ff00' : '#ff0000'}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Death overlay - subtle darkening */}
      {isDead && (
        <mesh position={[0, 0, cardThickness / 2 + 0.002]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Targeting indicator - glowing border only */}
      {isValidTarget && isTargeting && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[cardWidth + 0.1, cardHeight + 0.1, cardThickness + 0.01]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default NFTCard3D;