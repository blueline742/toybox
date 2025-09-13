import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Loader } from '@react-three/drei';
import * as THREE from 'three';
import Card3DNFTSimple from './Card3DNFT';
import Shield3D from './Shield3D';
import Pyroblast3D from './Pyroblast3D';
import IceNova3D from './IceNova3D';
import { ENHANCED_CHARACTERS } from '../game/enhancedCharacters';
import { Html } from '@react-three/drei';

// React overlay for health and stats
const CardOverlay = ({ character, position2D, isDead }) => {
  const healthPercentage = (character.currentHealth / character.maxHealth) * 100;
  
  if (!position2D) return null;
  
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${position2D.x}px`,
        top: `${position2D.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      }}
    >
      {/* Health bar */}
      <div className="relative">
        <div className="bg-gray-800 rounded-full h-2 w-24 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              healthPercentage > 50 ? 'bg-green-500' :
              healthPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <div className="text-white text-xs text-center mt-1 font-bold drop-shadow-lg">
          {character.currentHealth}/{character.maxHealth}
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex gap-2 justify-center mt-1">
        <span className="text-red-400 text-xs font-bold drop-shadow-lg">
          ⚔️{character.attack || 50}
        </span>
        <span className="text-blue-400 text-xs font-bold drop-shadow-lg">
          🛡️{character.defense || 30}
        </span>
      </div>
    </div>
  );
};

// 3D Scene
const BattleScene = ({ 
  playerTeam, 
  aiTeam, 
  onCardClick,
  isTargeting,
  validTargets,
  shieldedCharacters,
  currentTurn,
  activeCharacterIndex,
  pyroblastActive,
  pyroblastStart,
  pyroblastTarget
}) => {
  const isMobile = window.innerWidth <= 640;
  const scale = isMobile ? 0.7 : 1;
  
  // Load arena background texture
  const arenaTexture = useLoader(THREE.TextureLoader, '/assets/backgrounds/toyboxare1na.png');
  
  // Card positions
  const getCardPosition = (index, team) => {
    const spacing = isMobile ? 3 : 3.5;
    const row = Math.floor(index / 3);
    const col = index % 3;
    
    const x = (col - 1) * spacing;
    const y = row * -2;
    const z = team === 'player' ? 4 : -4;
    
    return [x, y, z];
  };
  
  return (
    <>
      {/* Improved Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
      <pointLight position={[-5, 5, 0]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" />
      
      {/* Arena Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Background Wall - ToyBox Arena */}
      <mesh position={[0, 5, -15]}>
        <planeGeometry args={[40, 25]} />
        <meshBasicMaterial map={arenaTexture} />
      </mesh>
      
      {/* Side Walls with Arena Texture */}
      <mesh position={[-20, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 25]} />
        <meshBasicMaterial map={arenaTexture} opacity={0.7} transparent />
      </mesh>
      
      <mesh position={[20, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 25]} />
        <meshBasicMaterial map={arenaTexture} opacity={0.7} transparent />
      </mesh>
      
      {/* Player Team Cards */}
      {playerTeam.map((char, index) => {
        const position = getCardPosition(index, 'player');
        const isActive = currentTurn === 'player' && index === activeCharacterIndex;
        const isValidTarget = isTargeting && validTargets?.includes(char);
        
        return (
          <group key={char.instanceId}>
            <Card3DNFTSimple
              character={char}
              position={position}
              isActive={isActive}
              isDead={char.currentHealth <= 0}
              teamColor="blue"
              onClick={() => onCardClick(char)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              scale={scale}
            />
            
            {/* Shield effect if shielded */}
            {shieldedCharacters?.has(char.instanceId) && (
              <Shield3D
                position={position}
                size={1.8 * scale}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}
          </group>
        );
      })}
      
      {/* AI Team Cards */}
      {aiTeam.map((char, index) => {
        const position = getCardPosition(index, 'ai');
        const isActive = currentTurn === 'ai' && index === activeCharacterIndex;
        const isValidTarget = isTargeting && validTargets?.includes(char);
        
        return (
          <group key={char.instanceId}>
            <Card3DNFTSimple
              character={char}
              position={position}
              rotation={[0, Math.PI, 0]} // Face towards player
              isActive={isActive}
              isDead={char.currentHealth <= 0}
              teamColor="red"
              onClick={() => onCardClick(char)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              scale={scale}
            />
            
            {/* Shield effect if shielded */}
            {shieldedCharacters?.has(char.instanceId) && (
              <Shield3D
                position={position}
                size={1.8 * scale}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}
          </group>
        );
      })}
      
    </>
  );
};

// Main Test Component
const Battle3DTest = () => {
  // Sample teams for testing
  const [playerTeam] = useState(() => {
    const allCharacters = Object.values(ENHANCED_CHARACTERS);
    const characters = ['Wizard Toy', 'Robot Guardian', 'Rubber Duckie'];
    return characters.map((name, index) => {
      const baseChar = allCharacters.find(c => c.name === name) || allCharacters[0];
      return {
        ...baseChar,
        instanceId: `player-${index}`,
        currentHealth: baseChar.maxHealth,
        team: 'player'
      };
    });
  });
  
  const [aiTeam] = useState(() => {
    const allCharacters = Object.values(ENHANCED_CHARACTERS);
    const characters = ['Brick Dude', 'Wind-Up Soldier', 'Doctor Toy'];
    return characters.map((name, index) => {
      const baseChar = allCharacters.find(c => c.name === name) || allCharacters[1];
      return {
        ...baseChar,
        instanceId: `ai-${index}`,
        currentHealth: baseChar.maxHealth,
        team: 'ai'
      };
    });
  });
  
  const [isTargeting, setIsTargeting] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('player');
  const [shieldedCharacters] = useState(new Map([
    ['player-0', { type: 'arcane' }],
    ['ai-1', { type: 'holy' }]
  ]));
  
  // Pyroblast spell state
  const [pyroblastActive, setPyroblastActive] = useState(false);
  const [pyroblastStart, setPyroblastStart] = useState([0, 0, 0]);
  const [pyroblastTarget, setPyroblastTarget] = useState([0, 0, 0]);
  
  // Ice Nova spell state
  const [iceNovaActive, setIceNovaActive] = useState(false);
  const [iceNovaCaster, setIceNovaCaster] = useState([0, 0, 0]);
  const [iceNovaTargets, setIceNovaTargets] = useState([]);
  
  const canvasRef = useRef();
  const [cardPositions2D, setCardPositions2D] = useState({});
  
  // Convert 3D positions to 2D screen coordinates for overlays
  const update2DPositions = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const camera = canvas.querySelector('canvas')?.camera;
    if (!camera) return;
    
    // This would need proper implementation with Three.js projection
    // For now, using approximate positions
    const positions = {};
    
    [...playerTeam, ...aiTeam].forEach((char, index) => {
      // Simplified positioning - would need actual 3D to 2D projection
      const isPlayer = char.team === 'player';
      const teamIndex = isPlayer ? 
        playerTeam.findIndex(c => c.instanceId === char.instanceId) :
        aiTeam.findIndex(c => c.instanceId === char.instanceId);
      
      positions[char.instanceId] = {
        x: window.innerWidth / 2 + ((teamIndex - 1) * 150),
        y: isPlayer ? window.innerHeight * 0.65 : window.innerHeight * 0.35
      };
    });
    
    setCardPositions2D(positions);
  };
  
  useEffect(() => {
    update2DPositions();
    window.addEventListener('resize', update2DPositions);
    return () => window.removeEventListener('resize', update2DPositions);
  }, []);
  
  const handleCardClick = (character) => {
    console.log('Card clicked:', character.name);
    if (isTargeting && validTargets.includes(character)) {
      console.log('Target selected:', character.name);
      setIsTargeting(false);
      setValidTargets([]);
    }
  };
  
  const handleTestTargeting = () => {
    setIsTargeting(true);
    setValidTargets(currentTurn === 'player' ? aiTeam : playerTeam);
  };
  
  const handleCastPyroblast = () => {
    // Find wizard position (first player card for demo)
    const wizardIndex = 0;
    const wizardPos = [
      (wizardIndex % 3 - 1) * 3.5,
      Math.floor(wizardIndex / 3) * -2 + 1, // Slightly higher
      4
    ];
    
    // Target first enemy
    const targetIndex = 0;
    const targetPos = [
      (targetIndex % 3 - 1) * 3.5,
      Math.floor(targetIndex / 3) * -2,
      -4
    ];
    
    console.log('Casting Pyroblast from', wizardPos, 'to', targetPos);
    setPyroblastStart(wizardPos);
    setPyroblastTarget(targetPos);
    setPyroblastActive(true);
  };
  
  const handleCastIceNova = () => {
    // Cast from wizard position
    const wizardIndex = 0;
    const wizardPos = [
      (wizardIndex % 3 - 1) * 3.5,
      Math.floor(wizardIndex / 3) * -2,
      4
    ];
    
    // Target all enemies
    const enemyPositions = aiTeam.map((_, index) => [
      (index % 3 - 1) * 3.5,
      Math.floor(index / 3) * -2,
      -4
    ]);
    
    console.log('Casting Ice Nova from', wizardPos, 'on', enemyPositions);
    setIceNovaCaster(wizardPos);
    setIceNovaTargets(enemyPositions);
    setIceNovaActive(true);
  };
  
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Loading indicator */}
      <Loader />
      
      {/* Three.js Canvas */}
      <div ref={canvasRef} className="absolute inset-0">
        <Canvas
          shadows
          camera={{ position: [0, 8, 12], fov: 50 }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <Suspense fallback={
            <Html center>
              <div className="text-white text-xl">Loading 3D Battle...</div>
            </Html>
          }>
            <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
            
            <BattleScene
              playerTeam={playerTeam}
              aiTeam={aiTeam}
              onCardClick={handleCardClick}
              isTargeting={isTargeting}
              validTargets={validTargets}
              shieldedCharacters={shieldedCharacters}
              currentTurn={currentTurn}
              activeCharacterIndex={0}
              pyroblastActive={pyroblastActive}
              pyroblastStart={pyroblastStart}
              pyroblastTarget={pyroblastTarget}
            />
            
            {/* Pyroblast Spell Effect - Outside BattleScene */}
            {pyroblastActive && (
              <Pyroblast3D
                startPosition={pyroblastStart}
                targetPosition={pyroblastTarget}
                isActive={pyroblastActive}
                onComplete={() => {
                  console.log('Pyroblast complete!');
                  setPyroblastActive(false);
                }}
              />
            )}
            
            {/* Ice Nova Spell Effect */}
            {iceNovaActive && (
              <IceNova3D
                casterPosition={iceNovaCaster}
                targets={iceNovaTargets}
                isActive={iceNovaActive}
                onComplete={() => {
                  console.log('Ice Nova complete!');
                  setIceNovaActive(false);
                }}
              />
            )}
            
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2.5}
              minPolarAngle={Math.PI / 6}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* React Overlays for Health/Stats */}
      <div className="absolute inset-0 pointer-events-none">
        {[...playerTeam, ...aiTeam].map(char => (
          <CardOverlay
            key={char.instanceId}
            character={char}
            position2D={cardPositions2D[char.instanceId]}
            isDead={char.currentHealth <= 0}
          />
        ))}
      </div>
      
      {/* UI Controls */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
        >
          Back to Menu
        </button>
      </div>
      
      <div className="absolute top-4 right-4 z-20 text-white">
        <div className="bg-black/50 backdrop-blur p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">3D Battle Test</h2>
          <p className="text-sm mb-2">Turn: {currentTurn}</p>
          <p className="text-sm mb-2">Targeting: {isTargeting ? 'Yes' : 'No'}</p>
          <button
            onClick={handleTestTargeting}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Test Targeting
          </button>
          <button
            onClick={() => setCurrentTurn(currentTurn === 'player' ? 'ai' : 'player')}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-2"
          >
            Switch Turn
          </button>
          <button
            onClick={handleCastPyroblast}
            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 ml-2"
          >
            Cast Pyroblast 🔥
          </button>
          <button
            onClick={handleCastIceNova}
            className="bg-cyan-600 text-white px-3 py-1 rounded text-sm hover:bg-cyan-700 ml-2"
          >
            Cast Ice Nova ❄️
          </button>
        </div>
      </div>
      
      {/* Targeting indicator */}
      {isTargeting && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold animate-pulse">
            Select a target!
          </div>
        </div>
      )}
    </div>
  );
};

export default Battle3DTest;