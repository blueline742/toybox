import React, { Suspense } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SafeNFTCard - Component that loads and displays NFT texture with card back
 * Wrapped in Suspense boundary for safe loading
 */
const SafeNFTCard = ({
  texturePath,
  cardWidth,
  cardHeight,
  isDead,
  character
}) => {
  // This will suspend until textures are loaded
  const [frontTexture, backTexture] = useTexture([
    texturePath,
    '/assets/nft/newnft/cardback.png'
  ]);

  // Guard against null textures
  if (!frontTexture || !backTexture) return null;

  return (
    <>
      {/* Card Group */}
      <group>
        {/* Front Face - NFT Image */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            map={frontTexture}
            transparent
            opacity={isDead ? 0.3 : 1}
            side={THREE.FrontSide}
            alphaTest={0.1}
          />
        </mesh>

        {/* Back Face - Card Back */}
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            map={backTexture}
            transparent
            opacity={isDead ? 0.3 : 1}
            side={THREE.BackSide}
            alphaTest={0.1}
          />
        </mesh>
      </group>

      {/* Simple health bar */}
      {character.currentHealth !== undefined && (
        <mesh position={[0, -cardHeight/2 - 0.15, 0.01]}>
          <planeGeometry args={[
            cardWidth * 0.8 * (character.currentHealth / character.maxHealth),
            0.08
          ]} />
          <meshBasicMaterial
            color={character.currentHealth > character.maxHealth * 0.3 ? '#00ff00' : '#ff0000'}
          />
        </mesh>
      )}
    </>
  );
};

/**
 * FallbackCard - Simple colored card with basic back shown while texture loads or on error
 */
const FallbackCard = ({
  cardWidth,
  cardHeight,
  teamColor,
  character,
  isDead
}) => {
  return (
    <>
      {/* Card Group */}
      <group>
        {/* Front Face - Colored card */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            color={teamColor === 'blue' ? '#2255aa' : '#aa2255'}
            transparent
            opacity={isDead ? 0.3 : 0.9}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Back Face - Dark card back */}
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            color="#1a0f2e"
            transparent
            opacity={isDead ? 0.3 : 0.9}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Character name */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[cardWidth * 0.9, cardHeight * 0.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
    </>
  );
};

/**
 * HybridCard3D - Robust card that always shows something
 * Either NFT image or colored fallback
 */
const HybridCard3D = ({
  character,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  isTargeting,
  isValidTarget,
  isActive,
  isDead,
  teamColor = 'blue',
  debugMode = false
}) => {
  const [hovered, setHovered] = React.useState(false);

  // Card dimensions for 512x768 (2:3 ratio)
  const cardWidth = 2.0;
  const cardHeight = 3.0;

  // Get texture path
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

  const texturePath = getTexturePath();

  // Interaction handlers
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

  // No scaling or position changes for active/hover states
  const scale = 1;
  const yOffset = 0;

  // Glow color - only show on hover
  const glowColor = hovered ? '#ffffff' : null;

  return (
    <group
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Debug helpers */}
      {debugMode && (
        <>
          <axesHelper args={[1]} />
          <mesh position={[0, cardHeight/2 + 0.3, 0]}>
            <planeGeometry args={[1, 0.2]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
        </>
      )}

      {/* Card content with Suspense boundary */}
      <Suspense fallback={
        <FallbackCard
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          teamColor={teamColor}
          character={character}
          isDead={isDead}
        />
      }>
        <SafeNFTCard
          texturePath={texturePath}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          isDead={isDead}
          character={character}
        />
      </Suspense>

      {/* Glow effect when active/targeted/hovered */}
      {glowColor && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[cardWidth + 0.15, cardHeight + 0.15]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}


      {/* Death overlay */}
      {isDead && (
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Frozen effect */}
      {character.frozen && (
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial
            color="#87CEEB"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default HybridCard3D;