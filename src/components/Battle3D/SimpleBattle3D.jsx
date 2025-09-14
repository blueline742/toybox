import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Loader } from '@react-three/drei';
import * as THREE from 'three';
import Card3DWithTexture from './Card3DWithTexture';
import Shield3D from '../Shield3D';
import Pyroblast3D from '../Pyroblast3D';
import IceNova3D from '../IceNova3D';
import DamageNumber3D from './DamageNumber3D';
import SpellNotification from '../SpellNotification';
import { ENHANCED_CHARACTERS } from '../../game/enhancedCharacters';

const BattleArena = ({
  playerTeam,
  aiTeam,
  onCardClick,
  shieldedCharacters,
  frozenCharacters,
  isTargeting,
  validTargets,
  activeCharacterIndex,
  currentTurn
}) => {
  const isMobile = window.innerWidth <= 640;
  const scale = isMobile ? 0.7 : 1;

  const arenaTexture = useLoader(THREE.TextureLoader, '/assets/backgrounds/toyboxare1na.png');

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
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
      <pointLight position={[-5, 5, 0]} intensity={0.5} color="#ffffff" />

      {/* Arena Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      {/* Background Wall */}
      <mesh position={[0, 5, -15]}>
        <planeGeometry args={[40, 25]} />
        <meshBasicMaterial map={arenaTexture} />
      </mesh>

      {/* Player Team */}
      {playerTeam.map((char, index) => {
        if (!char.isAlive) return null;

        const position = getCardPosition(index, 'player');
        const isFrozen = frozenCharacters?.has(char.instanceId);
        const isActive = currentTurn === 'player' && index === activeCharacterIndex;
        const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

        return (
          <group key={char.instanceId}>
            <Card3DWithTexture
              character={char}
              position={position}
              isDead={char.currentHealth <= 0}
              teamColor="blue"
              onClick={() => onCardClick(char)}
              scale={scale * (isActive ? 1.1 : 1)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              isActive={isActive}
            />

            {shieldedCharacters?.has(char.instanceId) && (
              <Shield3D
                position={position}
                size={1.8 * scale}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}

            {isFrozen && (
              <mesh position={position}>
                <boxGeometry args={[2.5, 3.5, 2.5]} />
                <meshPhysicalMaterial
                  color="#87CEEB"
                  transparent
                  opacity={0.6}
                  roughness={0.1}
                  metalness={0.3}
                  clearcoat={1}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* AI Team */}
      {aiTeam.map((char, index) => {
        if (!char.isAlive) return null;

        const position = getCardPosition(index, 'ai');
        const isFrozen = frozenCharacters?.has(char.instanceId);
        const isActive = currentTurn === 'ai' && index === activeCharacterIndex;
        const isValidTarget = validTargets.some(t => t.instanceId === char.instanceId);

        return (
          <group key={char.instanceId}>
            <Card3DWithTexture
              character={char}
              position={position}
              rotation={[0, Math.PI, 0]}
              isDead={char.currentHealth <= 0}
              teamColor="red"
              onClick={() => onCardClick(char)}
              scale={scale * (isActive ? 1.1 : 1)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              isActive={isActive}
            />

            {shieldedCharacters?.has(char.instanceId) && (
              <Shield3D
                position={position}
                size={1.8 * scale}
                type={shieldedCharacters.get(char.instanceId)?.type || 'energy'}
              />
            )}

            {isFrozen && (
              <mesh position={position}>
                <boxGeometry args={[2.5, 3.5, 2.5]} />
                <meshPhysicalMaterial
                  color="#87CEEB"
                  transparent
                  opacity={0.6}
                  roughness={0.1}
                  metalness={0.3}
                  clearcoat={1}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
};

const SimpleBattle3D = ({ playerTeam: initialPlayerTeam, aiTeam: initialAiTeam, onBattleEnd }) => {
  // Initialize teams
  const [playerTeam, setPlayerTeam] = useState(() =>
    initialPlayerTeam.map((char, index) => ({
      ...char,
      instanceId: `player-${index}`,
      currentHealth: char.maxHealth || 100,
      isAlive: true,
      team: 'player'
    }))
  );

  const [aiTeam, setAiTeam] = useState(() =>
    initialAiTeam.map((char, index) => ({
      ...char,
      instanceId: `ai-${index}`,
      currentHealth: char.maxHealth || 100,
      isAlive: true,
      team: 'ai'
    }))
  );

  // Battle state
  const [currentTurn, setCurrentTurn] = useState('player');
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);

  // Targeting state
  const [isTargeting, setIsTargeting] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);

  // Effects state
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map());
  const [frozenCharacters, setFrozenCharacters] = useState(new Map());
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [activeSpellEffect, setActiveSpellEffect] = useState(null);
  const [spellNotification, setSpellNotification] = useState(null);

  // Helper function to get card position
  const getCardPosition = (index, team) => {
    const isMobile = window.innerWidth <= 640;
    const spacing = isMobile ? 3 : 3.5;
    const row = Math.floor(index / 3);
    const col = index % 3;

    const x = (col - 1) * spacing;
    const y = row * -2;
    const z = team === 'player' ? 4 : -4;

    return [x, y, z];
  };

  // Deal damage
  const dealDamage = (target, damage) => {
    const setTeam = target.team === 'player' ? setPlayerTeam : setAiTeam;
    const team = target.team === 'player' ? playerTeam : aiTeam;

    setTeam(prev => prev.map(char => {
      if (char.instanceId === target.instanceId) {
        const newHealth = Math.max(0, char.currentHealth - damage);

        // Add damage number
        const charIndex = team.findIndex(c => c.instanceId === char.instanceId);
        const position = getCardPosition(charIndex, target.team);

        setDamageNumbers(prev => [...prev, {
          id: Date.now() + Math.random(),
          value: damage,
          position,
          isCritical: false,
          isHealing: false
        }]);

        return {
          ...char,
          currentHealth: newHealth,
          isAlive: newHealth > 0
        };
      }
      return char;
    }));
  };

  // Execute ability
  const executeAbility = async (caster, ability, targets) => {
    console.log(`${caster.name} uses ${ability.name}!`);

    // Show spell notification
    setSpellNotification({
      ability,
      caster,
      targets
    });

    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Deal damage
    if (ability.damage) {
      targets.forEach(target => dealDamage(target, ability.damage));
    }

    // Clear notification
    setSpellNotification(null);
  };

  // Handle card click
  const handleCardClick = async (target) => {
    if (!isTargeting || !validTargets.some(t => t.instanceId === target.instanceId)) {
      return;
    }

    const activeChar = playerTeam[currentCharacterIndex];
    setIsTargeting(false);
    setValidTargets([]);

    await executeAbility(activeChar, currentAbility, [target]);

    // Move to AI turn
    setCurrentTurn('ai');
    setTimeout(() => processAITurn(), 1500);
  };

  // Process AI turn
  const processAITurn = async () => {
    const activeChar = aiTeam[currentCharacterIndex];

    if (!activeChar?.isAlive) {
      setCurrentTurn('player');
      setCurrentCharacterIndex((prev) => (prev + 1) % aiTeam.length);
      return;
    }

    // Select random ability
    const abilities = activeChar.abilities || [];
    if (abilities.length === 0) return;

    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    // Select random target
    const alivePlayerTeam = playerTeam.filter(c => c.isAlive);
    if (alivePlayerTeam.length === 0) return;

    const target = alivePlayerTeam[Math.floor(Math.random() * alivePlayerTeam.length)];

    await executeAbility(activeChar, ability, [target]);

    // Move back to player turn
    setCurrentTurn('player');
    setCurrentCharacterIndex((prev) => (prev + 1) % playerTeam.length);
  };

  // Start player turn when it's their turn
  useEffect(() => {
    if (currentTurn === 'player' && !isTargeting && !battleEnded) {
      const activeChar = playerTeam[currentCharacterIndex];

      if (!activeChar?.isAlive) {
        setCurrentCharacterIndex((prev) => (prev + 1) % playerTeam.length);
        return;
      }

      // Select random ability
      const abilities = activeChar.abilities || [];
      if (abilities.length === 0) return;

      const ability = abilities[Math.floor(Math.random() * abilities.length)];
      setCurrentAbility(ability);

      // Set valid targets
      const targets = aiTeam.filter(c => c.isAlive);
      if (targets.length > 0) {
        console.log(`${activeChar.name}'s turn - Select a target for ${ability.name}`);
        setValidTargets(targets);
        setIsTargeting(true);
      }
    }
  }, [currentTurn, currentCharacterIndex, battleEnded]);

  // Check for battle end
  useEffect(() => {
    const playerAlive = playerTeam.some(c => c.isAlive);
    const aiAlive = aiTeam.some(c => c.isAlive);

    if (!playerAlive || !aiAlive) {
      setBattleEnded(true);
      if (onBattleEnd) {
        onBattleEnd(playerAlive ? 'player' : 'ai');
      }
    }
  }, [playerTeam, aiTeam]);

  // Clear old damage numbers
  useEffect(() => {
    const timer = setInterval(() => {
      setDamageNumbers(prev => prev.filter(dn => Date.now() - dn.id < 2000));
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      <Loader />

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

          <BattleArena
            playerTeam={playerTeam}
            aiTeam={aiTeam}
            onCardClick={handleCardClick}
            shieldedCharacters={shieldedCharacters}
            frozenCharacters={frozenCharacters}
            isTargeting={isTargeting}
            validTargets={validTargets}
            activeCharacterIndex={currentCharacterIndex}
            currentTurn={currentTurn}
          />

          {/* Spell Effects */}
          {activeSpellEffect?.type === 'pyroblast' && (
            <Pyroblast3D
              startPosition={activeSpellEffect.startPosition}
              targetPosition={activeSpellEffect.targetPosition}
              isActive={true}
              onComplete={() => {}}
            />
          )}

          {/* Damage Numbers */}
          {damageNumbers.map(dn => (
            <DamageNumber3D
              key={dn.id}
              value={dn.value}
              position={dn.position}
              isCritical={dn.isCritical}
              isHealing={dn.isHealing}
            />
          ))}

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={!isTargeting}
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={Math.PI / 6}
          />
        </Suspense>
      </Canvas>

      {/* Spell Notification */}
      {spellNotification && (
        <SpellNotification
          ability={spellNotification.ability}
          caster={spellNotification.caster}
          targets={spellNotification.targets}
          onComplete={() => setSpellNotification(null)}
        />
      )}

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
        >
          Back to Menu
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 text-white">
        <div className="bg-black/50 backdrop-blur p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">3D Battle</h2>
          <p className="text-sm">Turn: {currentTurn}</p>
          <p className="text-sm">Character: {
            currentTurn === 'player'
              ? playerTeam[currentCharacterIndex]?.name
              : aiTeam[currentCharacterIndex]?.name
          }</p>
        </div>
      </div>

      {/* Targeting Instructions */}
      {isTargeting && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold animate-pulse shadow-xl">
            Click an enemy to cast {currentAbility?.name}!
          </div>
        </div>
      )}

      {battleEnded && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-black/80 p-8 rounded-lg text-white">
            <h2 className="text-3xl font-bold mb-4">
              {playerTeam.some(c => c.isAlive) ? 'Victory!' : 'Defeat!'}
            </h2>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBattle3D;