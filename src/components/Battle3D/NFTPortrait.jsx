import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const NFTPortrait = ({ character, position, size, isDead, teamColor }) => {
  // Get the NFT path from character data
  const getNFTPath = () => {
    // First check if character has an image path
    if (character?.image && character.image.includes('/assets/nft/')) {
      return character.image;
    }

    // Map character names to NFT images
    const charName = character?.name?.toLowerCase() || '';

    if (charName.includes('robot') || charName.includes('guardian')) return '/assets/nft/newnft/robotnft.png';
    if (charName.includes('arch') && charName.includes('wizard')) return '/assets/nft/newnft/archwizardnft.png';
    if (charName.includes('wizard')) return '/assets/nft/newnft/wizardnft.png';
    if (charName.includes('duck') || charName.includes('rubber')) return '/assets/nft/newnft/duckienft.png';
    if (charName.includes('brick') || charName.includes('teddy')) return '/assets/nft/newnft/brickdudenft.png';
    if (charName.includes('wind') || charName.includes('soldier')) return '/assets/nft/newnft/winduptoynft.png';
    if (charName.includes('dino') || charName.includes('mecha')) return '/assets/nft/newnft/dinonft.png';
    if (charName.includes('voodoo') || charName.includes('curse') || charName.includes('marionette')) return '/assets/nft/newnft/voodoonft.png';

    // Default fallback
    return '/assets/nft/newnft/robotnft.png';
  };

  const texturePath = getNFTPath();

  // Load texture with R3F's useTexture
  const texture = useTexture(texturePath);

  // Configure texture for best quality
  React.useEffect(() => {
    if (texture) {
      texture.encoding = THREE.sRGBEncoding;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <group position={position}>
      {/* Card background for better contrast */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[size[0] * 1.05, size[1] * 1.05]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* NFT Image */}
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          opacity={isDead ? 0.3 : 1}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// Error boundary fallback
export const NFTPortraitFallback = ({ position, size, isDead, teamColor }) => {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        color={teamColor === 'blue' ? '#336699' : '#993333'}
        transparent
        opacity={isDead ? 0.3 : 0.9}
      />
    </mesh>
  );
};

export default NFTPortrait;