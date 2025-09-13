import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Card3DNFT = ({ 
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
    };
    
    return nameMap[character.name] || '/assets/nft/11.png'; // Default to 11.png
  };
  
  // Card dimensions
  const cardWidth = 2.2 * scale;
  const cardHeight = 3.3 * scale;
  const cardDepth = 0.1 * scale;
  
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
      
      // Scale pulse for valid targets
      if (isValidTarget) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        groupRef.current.scale.set(pulse, pulse, pulse);
      } else if (hovered && !isDead) {
        groupRef.current.scale.set(1.03, 1.03, 1.03);
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
      {/* Card as a box with front and back textures */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
        
        {/* Front face - NFT image */}
        <meshStandardMaterial attachArray="material">
          <texture 
            attach="map" 
            image={(() => {
              const img = new Image();
              img.src = getNFTImagePath(character);
              return img;
            })()}
          />
        </meshStandardMaterial>
        
        {/* Back face - Card back */}
        <meshStandardMaterial attachArray="material">
          <texture 
            attach="map" 
            image={(() => {
              const img = new Image();
              img.src = '/assets/nft/cardback.png';
              return img;
            })()}
          />
        </meshStandardMaterial>
        
        {/* Side faces - Dark edges */}
        <meshStandardMaterial attachArray="material" color="#1a1a1a" />
        <meshStandardMaterial attachArray="material" color="#1a1a1a" />
        <meshStandardMaterial attachArray="material" color="#1a1a1a" />
        <meshStandardMaterial attachArray="material" color="#1a1a1a" />
      </mesh>
      
      {/* Active glow */}
      {isActive && !isDead && (
        <mesh position={[0, 0, -cardDepth * 2]}>
          <planeGeometry args={[cardWidth * 1.2, cardHeight * 1.2]} />
          <meshBasicMaterial 
            color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Valid target highlight */}
      {isValidTarget && (
        <mesh position={[0, 0, cardDepth * 2]}>
          <planeGeometry args={[cardWidth * 1.15, cardHeight * 1.15]} />
          <meshBasicMaterial 
            color="#ffd700"
            transparent
            opacity={0.4 + Math.sin(Date.now() * 0.005) * 0.2}
          />
        </mesh>
      )}
      
      {/* Death overlay */}
      {isDead && (
        <>
          <mesh position={[0, 0, cardDepth * 3]}>
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshBasicMaterial 
              color="#000000"
              transparent
              opacity={0.7}
            />
          </mesh>
          
          <Text
            position={[0, 0, cardDepth * 4]}
            fontSize={0.4 * scale}
            color="#ff0000"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, -0.2]}
          >
            DEFEATED
          </Text>
        </>
      )}
    </group>
  );
};

// Simpler version using proper texture loading
export const Card3DNFTSimple = ({ 
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
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Get NFT image paths - using new NFT images
  const nameMap = {
    'Wizard Toy': '/assets/nft/newnft/wizardnft.png',
    'Robot Guardian': '/assets/nft/newnft/robotnft.png',
    'Rubber Duckie': '/assets/nft/newnft/duckienft.png',
    'Brick Dude': '/assets/nft/newnft/brickdudenft.png',
    'Wind-Up Soldier': '/assets/nft/windupsoldier.png',
    'Doctor Toy': '/assets/nft/doctor.png',
    'Voodoo Doll': '/assets/nft/newnft/voodoonft.png',
    'Baby Doll': '/assets/nft/babydoll.png',
    'Mecha Dino': '/assets/nft/newnft/dinonft.png',
    'Magic Unicorn': '/assets/nft/unicorn.png',
    'Super Action Figure': '/assets/nft/superaction.png',
    'Plush Bear': '/assets/nft/plushbear.png'
  };
  
  const frontPath = nameMap[character.name] || '/assets/nft/11.png';
  const backPath = '/assets/nft/cardback.png';
  
  // Load textures using Three.js loader with proper settings
  const frontTexture = useLoader(THREE.TextureLoader, frontPath);
  const backTexture = useLoader(THREE.TextureLoader, backPath);
  
  // Configure textures to remove borders
  React.useEffect(() => {
    if (frontTexture) {
      frontTexture.wrapS = THREE.ClampToEdgeWrapping;
      frontTexture.wrapT = THREE.ClampToEdgeWrapping;
      frontTexture.minFilter = THREE.LinearFilter;
      frontTexture.magFilter = THREE.LinearFilter;
    }
    if (backTexture) {
      backTexture.wrapS = THREE.ClampToEdgeWrapping;
      backTexture.wrapT = THREE.ClampToEdgeWrapping;
      backTexture.minFilter = THREE.LinearFilter;
      backTexture.magFilter = THREE.LinearFilter;
    }
  }, [frontTexture, backTexture]);
  
  const cardWidth = 2.2 * scale;
  const cardHeight = 3.3 * scale;
  
  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      if (isActive) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
        groupRef.current.position.y = position[1];
      }
      
      if (isValidTarget) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        groupRef.current.scale.set(pulse, pulse, pulse);
      } else if (hovered && !isDead) {
        groupRef.current.scale.set(1.05, 1.05, 1.05);
      } else {
        groupRef.current.scale.set(1, 1, 1);
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Card as double-sided with front and back textures */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!isDead && onClick) onClick(character);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!isDead) {
            setHovered(true);
            document.body.style.cursor = isTargeting ? 'crosshair' : 'pointer';
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[cardWidth, cardHeight]} />
        {/* Single-sided plane with NFT image */}
        <meshBasicMaterial 
          map={frontTexture}
          transparent={true}
          opacity={isDead ? 0.3 : 1}
          side={THREE.FrontSide}
          alphaTest={0.01}
        />
      </mesh>
      
      {/* Soft feathered edge frame */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[cardWidth * 1.02, cardHeight * 1.02]} />
        <shaderMaterial
          transparent={true}
          uniforms={{
            uColor: { value: new THREE.Color('#000000') }
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              // Distance from edges
              float distX = min(vUv.x, 1.0 - vUv.x);
              float distY = min(vUv.y, 1.0 - vUv.y);
              float dist = min(distX, distY);
              
              // Soft fade at edges
              float alpha = smoothstep(0.0, 0.05, dist);
              alpha = 1.0 - alpha;
              alpha *= 0.3; // Make it subtle
              
              gl_FragColor = vec4(uColor, alpha);
            }
          `}
        />
      </mesh>
      
      {/* Back side - separate plane */}
      <mesh
        position={[0, 0, -0.01]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshBasicMaterial 
          map={backTexture}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Active glow - subtle glow behind card */}
      {isActive && !isDead && (
        <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[cardWidth * 1.3, cardHeight * 1.3]} />
          <meshBasicMaterial 
            color={teamColor === 'blue' ? '#0088ff' : '#ff0088'}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
      
      {/* Target highlight - golden glow */}
      {isValidTarget && (
        <mesh position={[0, 0, -0.15]}>
          <planeGeometry args={[cardWidth * 1.2, cardHeight * 1.2]} />
          <meshBasicMaterial 
            color="#ffd700"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

export default Card3DNFTSimple;