import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// NFT texture paths
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

const CardWithNFT = ({
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
  const [hovered, setHovered] = React.useState(false);

  // Responsive sizing
  const cardWidth = isMobile ? 1.2 : 1.8;
  const cardHeight = isMobile ? 1.8 : 2.5;
  const cardThickness = 0.05;

  // Get NFT texture path based on character and death status
  const getTexturePath = useMemo(() => {
    // Show cardback for defeated cards
    if (isDead) {
      return '/assets/nft/newnft/cardback.png';
    }

    if (character?.image && character.image.includes('/assets/nft/')) {
      return character.image;
    }

    const charName = character?.name?.toLowerCase() || '';

    if (charName.includes('robot') || charName.includes('guardian')) return NFT_PATHS[0];
    if (charName.includes('arch') && charName.includes('wizard')) return NFT_PATHS[2];
    if (charName.includes('wizard')) return NFT_PATHS[1];
    if (charName.includes('duck') || charName.includes('rubber')) return NFT_PATHS[3];
    if (charName.includes('brick') || charName.includes('teddy')) return NFT_PATHS[4];
    if (charName.includes('wind') || charName.includes('soldier')) return NFT_PATHS[5];
    if (charName.includes('dino') || charName.includes('mecha')) return NFT_PATHS[6];
    if (charName.includes('voodoo') || charName.includes('curse') || charName.includes('marionette')) return NFT_PATHS[7];

    return NFT_PATHS[0]; // default
  }, [character?.name, character?.image, isDead]);

  // Load the specific texture - with fallback
  let texture = null;
  try {
    texture = useTexture(getTexturePath);
  } catch (error) {
    console.warn('Failed to load texture:', getTexturePath);
  }

  // Configure texture once
  useMemo(() => {
    if (texture) {
      texture.encoding = THREE.sRGBEncoding;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
    }
  }, [texture]);

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

  const getBorderColor = () => {
    if (isActive) return '#ffcc00';
    if (isValidTarget && isTargeting) return '#00ff00';
    if (teamColor === 'blue') return '#4a90e2';
    return '#e74c3c';
  };

  const scale = isActive ? 1.15 : (hovered && !isTargeting ? 1.05 : 1);
  const yOffset = isActive ? 0.5 : (hovered && !isTargeting ? 0.2 : 0);

  return (
    <group
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Card body */}
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

      {/* NFT Portrait Background */}
      <mesh position={[0, cardHeight * 0.15, cardThickness / 2 + 0.001]}>
        <planeGeometry args={[cardWidth * 0.88, cardHeight * 0.52]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* NFT Portrait */}
      <mesh position={[0, cardHeight * 0.15, cardThickness / 2 + 0.002]}>
        <planeGeometry args={[cardWidth * 0.85, cardHeight * 0.5]} />
        {texture ? (
          <meshBasicMaterial
            map={texture}
            transparent={true}
            opacity={1}
            side={THREE.FrontSide}
            toneMapped={false}
          />
        ) : (
          <meshBasicMaterial
            color={teamColor === 'blue' ? '#336699' : '#993333'}
            transparent
            opacity={isDead ? 0.3 : 0.9}
          />
        )}
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
        ⚔️ {character.attack || character.stats?.attack || 5}
      </Text>

      <Text
        position={[cardWidth * 0.3, -cardHeight * 0.4, cardThickness / 2 + 0.003]}
        fontSize={isMobile ? 0.1 : 0.12}
        color="#4ecdc4"
        anchorX="center"
        anchorY="middle"
      >
        🛡️ {character.defense || character.stats?.defense || 5}
      </Text>

      {/* Health Display */}
      <group position={[0, cardHeight * 0.5 + 0.2, 0]}>
        <Text
          fontSize={isMobile ? 0.12 : 0.15}
          color={character.currentHealth > character.maxHealth * 0.3 ? '#ffffff' : '#ff4444'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
        >
          ❤️ {character.currentHealth}/{character.maxHealth}
        </Text>
      </group>

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

export default CardWithNFT;