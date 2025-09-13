import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Card3D from './Card3D';

// Camera controller that adjusts for mobile/desktop
const ResponsiveCamera = ({ isMobile }) => {
  const { camera, size } = useThree();
  
  useEffect(() => {
    // Adjust camera based on screen size
    if (isMobile) {
      camera.position.set(0, 8, 12);
      camera.fov = 60;
    } else {
      camera.position.set(0, 6, 10);
      camera.fov = 50;
    }
    camera.updateProjectionMatrix();
  }, [isMobile, camera]);
  
  return (
    <PerspectiveCamera
      makeDefault
      position={isMobile ? [0, 8, 12] : [0, 6, 10]}
      fov={isMobile ? 60 : 50}
    />
  );
};

// Arena floor and background
const ArenaEnvironment = ({ arenaBackground }) => {
  return (
    <>
      {/* Arena Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Background Wall */}
      <mesh position={[0, 3, -8]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial 
          color="#87CEEB"
          emissive="#87CEEB"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 5, 0]} intensity={0.3} color="#ffddaa" />
    </>
  );
};

// Card layout manager
const CardLayout = ({ 
  playerTeam, 
  aiTeam,
  onCardClick,
  onCardHover,
  onCardUnhover,
  isTargeting,
  validTargets,
  currentTurn,
  playerCharacterIndex,
  aiCharacterIndex,
  scale
}) => {
  // Calculate positions for cards in a grid layout
  const getCardPosition = (index, team, total) => {
    const isMobile = window.innerWidth <= 640;
    const spacing = isMobile ? 2.2 : 2.5;
    const rowOffset = isMobile ? 2.5 : 3;
    
    // Calculate grid position (2 rows, 3 columns max)
    const row = Math.floor(index / 3);
    const col = index % 3;
    
    // Center the cards
    const xOffset = (col - 1) * spacing;
    const yOffset = row * -1.5;
    const zPosition = team === 'player' ? 3 : -3;
    
    return [xOffset, yOffset, zPosition];
  };
  
  return (
    <>
      {/* Player Team Cards */}
      {playerTeam.map((char, index) => {
        const isActive = currentTurn === 'player' && 
          playerTeam.filter(c => c.currentHealth > 0).indexOf(char) === 
          (playerCharacterIndex % playerTeam.filter(c => c.currentHealth > 0).length);
        
        const isValidTarget = isTargeting && validTargets?.includes(char);
        
        return (
          <Card3D
            key={char.instanceId}
            character={char}
            position={getCardPosition(index, 'player', playerTeam.length)}
            isActive={isActive}
            currentHealth={char.currentHealth}
            maxHealth={char.maxHealth}
            teamColor="blue"
            onClick={onCardClick}
            onHover={onCardHover}
            onUnhover={onCardUnhover}
            isTargeting={isTargeting}
            isValidTarget={isValidTarget}
            scale={scale}
          />
        );
      })}
      
      {/* AI Team Cards */}
      {aiTeam.map((char, index) => {
        const isActive = currentTurn === 'ai' && 
          aiTeam.filter(c => c.currentHealth > 0).indexOf(char) === 
          (aiCharacterIndex % aiTeam.filter(c => c.currentHealth > 0).length);
        
        const isValidTarget = isTargeting && validTargets?.includes(char);
        
        return (
          <Card3D
            key={char.instanceId}
            character={char}
            position={getCardPosition(index, 'ai', aiTeam.length)}
            isActive={isActive}
            currentHealth={char.currentHealth}
            maxHealth={char.maxHealth}
            teamColor="red"
            onClick={onCardClick}
            onHover={onCardHover}
            onUnhover={onCardUnhover}
            isTargeting={isTargeting}
            isValidTarget={isValidTarget}
            scale={scale}
          />
        );
      })}
    </>
  );
};

// Main Battle Arena component
const BattleArena3D = ({
  playerTeam,
  aiTeam,
  arenaBackground,
  currentTurn,
  playerCharacterIndex,
  aiCharacterIndex,
  isTargeting,
  validTargets,
  onTargetSelect,
  onCardHover,
  onCardUnhover
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const mountRef = useRef();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleCardClick = (character) => {
    if (isTargeting && validTargets?.includes(character)) {
      onTargetSelect(character);
    }
  };
  
  const scale = isMobile ? 0.8 : 1;
  
  return (
    <div ref={mountRef} className="w-full h-full">
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <ResponsiveCamera isMobile={isMobile} />
          
          <ArenaEnvironment arenaBackground={arenaBackground} />
          
          <CardLayout
            playerTeam={playerTeam}
            aiTeam={aiTeam}
            onCardClick={handleCardClick}
            onCardHover={onCardHover}
            onCardUnhover={onCardUnhover}
            isTargeting={isTargeting}
            validTargets={validTargets}
            currentTurn={currentTurn}
            playerCharacterIndex={playerCharacterIndex}
            aiCharacterIndex={aiCharacterIndex}
            scale={scale}
          />
          
          {/* Camera controls (disabled during targeting) */}
          {!isTargeting && (
            <OrbitControls
              enablePan={false}
              enableZoom={!isMobile}
              enableRotate={!isMobile}
              maxPolarAngle={Math.PI / 2.5}
              minPolarAngle={Math.PI / 4}
              maxAzimuthAngle={Math.PI / 6}
              minAzimuthAngle={-Math.PI / 6}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default BattleArena3D;