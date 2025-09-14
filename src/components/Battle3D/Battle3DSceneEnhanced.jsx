import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Loader } from '@react-three/drei';
import * as THREE from 'three';
import Card3DNFT from '../Card3DNFT';
import HealthBar3D from './HealthBar3D';
import Shield3D from '../Shield3D';
import Pyroblast3D from '../Pyroblast3D';
import IceNova3D from '../IceNova3D';
import LightningZap3D from '../LightningZap3D';
import DamageNumber3D from './DamageNumber3D';
import SpellNotification from '../SpellNotification';
import SimpleTargetingArrow from '../SimpleTargetingArrow';
import { ENHANCED_CHARACTERS } from '../../game/enhancedCharacters';

const BattleArena = ({
  playerTeam,
  aiTeam,
  onCardClick,
  shieldedCharacters,
  frozenCharacters,
  isTargeting,
  validTargets,
  hoveredTarget,
  onCardHover,
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
      <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" />

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
        const isHovered = hoveredTarget?.instanceId === char.instanceId;

        return (
          <group key={char.instanceId}>
            <Card3DNFT
              character={char}
              position={position}
              isDead={char.currentHealth <= 0}
              teamColor="blue"
              onClick={() => onCardClick(char)}
              onPointerEnter={() => onCardHover(char)}
              onPointerLeave={() => onCardHover(null)}
              scale={scale * (isActive ? 1.1 : 1)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              isActive={isActive}
            />

            <HealthBar3D
              position={position}
              health={char.currentHealth}
              maxHealth={char.maxHealth}
              characterName={char.name}
              attack={char.stats?.attack || char.attack}
              defense={char.stats?.defense || char.defense}
              scale={scale}
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

            {/* Target indicator */}
            {isValidTarget && isTargeting && (
              <mesh position={[position[0], position[1] - 2, position[2]]}>
                <ringGeometry args={[1.5, 2, 32]} />
                <meshBasicMaterial
                  color={isHovered ? "#ffff00" : "#00ff00"}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            )}

            {/* Active character glow */}
            {isActive && (
              <pointLight position={position} color="#0099ff" intensity={2} distance={5} />
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
        const isHovered = hoveredTarget?.instanceId === char.instanceId;

        return (
          <group key={char.instanceId}>
            <Card3DNFT
              character={char}
              position={position}
              rotation={[0, Math.PI, 0]}
              isDead={char.currentHealth <= 0}
              teamColor="red"
              onClick={() => onCardClick(char)}
              onPointerEnter={() => onCardHover(char)}
              onPointerLeave={() => onCardHover(null)}
              scale={scale * (isActive ? 1.1 : 1)}
              isTargeting={isTargeting}
              isValidTarget={isValidTarget}
              isActive={isActive}
            />

            <HealthBar3D
              position={position}
              health={char.currentHealth}
              maxHealth={char.maxHealth}
              characterName={char.name}
              attack={char.stats?.attack || char.attack}
              defense={char.stats?.defense || char.defense}
              scale={scale}
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

            {/* Target indicator */}
            {isValidTarget && isTargeting && (
              <mesh position={[position[0], position[1] - 2, position[2]]}>
                <ringGeometry args={[1.5, 2, 32]} />
                <meshBasicMaterial
                  color={isHovered ? "#ffff00" : "#ff0000"}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            )}

            {/* Active character glow */}
            {isActive && (
              <pointLight position={position} color="#ff0099" intensity={2} distance={5} />
            )}
          </group>
        );
      })}
    </>
  );
};

const Battle3DSceneEnhanced = ({ playerTeam: initialPlayerTeam, aiTeam: initialAiTeam, onBattleEnd }) => {
  // Initialize teams with proper health and instance IDs
  const [playerTeam, setPlayerTeam] = useState(() => {
    const team = initialPlayerTeam.map((char, index) => ({
      ...char,
      instanceId: `player-${index}`,
      currentHealth: char.maxHealth || 100,
      isAlive: true,
      team: 'player'
    }));
    console.log('Initialized player team:', team);
    return team;
  });

  const [aiTeam, setAiTeam] = useState(() => {
    const team = initialAiTeam.map((char, index) => ({
      ...char,
      instanceId: `ai-${index}`,
      currentHealth: char.maxHealth || 100,
      isAlive: true,
      team: 'ai'
    }));
    console.log('Initialized AI team:', team);
    return team;
  });

  // Battle state
  const [currentTurn, setCurrentTurn] = useState('player');
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);

  // Targeting state
  const [isTargeting, setIsTargeting] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hoveredTarget, setHoveredTarget] = useState(null);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [casterElement, setCasterElement] = useState(null);
  const [targetElement, setTargetElement] = useState(null);

  // Effects state
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map());
  const [frozenCharacters, setFrozenCharacters] = useState(new Map());
  const [damageNumbers, setDamageNumbers] = useState([]);

  // Spell effects state
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

  // Deal damage to a character
  const dealDamage = (target, damage, isCritical = false) => {
    const team = target.team === 'player' ? playerTeam : aiTeam;
    const setTeam = target.team === 'player' ? setPlayerTeam : setAiTeam;

    setTeam(prev => prev.map(char => {
      if (char.instanceId === target.instanceId) {
        const shield = shieldedCharacters.get(char.instanceId);
        let actualDamage = damage;

        if (shield) {
          actualDamage = Math.max(0, damage - shield.amount);
          if (actualDamage < damage) {
            const newShieldAmount = shield.amount - (damage - actualDamage);
            if (newShieldAmount > 0) {
              setShieldedCharacters(prev => new Map(prev).set(char.instanceId, { ...shield, amount: newShieldAmount }));
            } else {
              setShieldedCharacters(prev => {
                const newMap = new Map(prev);
                newMap.delete(char.instanceId);
                return newMap;
              });
            }
          }
        }

        const newHealth = Math.max(0, char.currentHealth - actualDamage);

        // Add damage number
        const charIndex = team.findIndex(c => c.instanceId === char.instanceId);
        const position = getCardPosition(charIndex, target.team);

        setDamageNumbers(prev => [...prev, {
          id: Date.now() + Math.random(),
          value: actualDamage,
          position,
          isCritical,
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

  // Heal a character
  const healCharacter = (target, amount) => {
    const setTeam = target.team === 'player' ? setPlayerTeam : setAiTeam;
    const team = target.team === 'player' ? playerTeam : aiTeam;

    setTeam(prev => prev.map(char => {
      if (char.instanceId === target.instanceId) {
        const newHealth = Math.min(char.maxHealth, char.currentHealth + amount);

        // Add healing number
        const charIndex = team.findIndex(c => c.instanceId === char.instanceId);
        const position = getCardPosition(charIndex, target.team);

        setDamageNumbers(prev => [...prev, {
          id: Date.now() + Math.random(),
          value: amount,
          position,
          isCritical: false,
          isHealing: true
        }]);

        return {
          ...char,
          currentHealth: newHealth
        };
      }
      return char;
    }));
  };

  // Apply shield to a character
  const applyShield = (target, amount, type = 'energy') => {
    setShieldedCharacters(prev => new Map(prev).set(target.instanceId, { amount, type }));
  };

  // Freeze characters
  const freezeCharacters = (targets, duration = 2000) => {
    targets.forEach(target => {
      setFrozenCharacters(prev => new Map(prev).set(target.instanceId, true));
    });

    setTimeout(() => {
      targets.forEach(target => {
        setFrozenCharacters(prev => {
          const newMap = new Map(prev);
          newMap.delete(target.instanceId);
          return newMap;
        });
      });
    }, duration);
  };

  // Execute an ability
  const executeAbility = async (caster, ability, targets) => {
    console.log(`${caster.name} uses ${ability.name}!`);

    // Show spell notification
    setSpellNotification({
      ability,
      caster,
      targets
    });

    // Wait for notification to display
    await new Promise(resolve => setTimeout(resolve, 1500));

    const casterTeam = caster.team === 'player' ? playerTeam : aiTeam;
    const casterIndex = casterTeam.findIndex(c => c.instanceId === caster.instanceId);
    const casterPos = getCardPosition(casterIndex, caster.team);

    // Handle different ability types
    if (ability.damage) {
      if (ability.name === 'Pyroblast') {
        const target = targets[0];
        const targetTeam = target.team === 'player' ? playerTeam : aiTeam;
        const targetIndex = targetTeam.findIndex(c => c.instanceId === target.instanceId);
        const targetPos = getCardPosition(targetIndex, target.team);

        setActiveSpellEffect({
          type: 'pyroblast',
          startPosition: casterPos,
          targetPosition: targetPos
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        dealDamage(target, ability.damage);
        setActiveSpellEffect(null);

      } else if (ability.name === 'Ice Nova') {
        setActiveSpellEffect({
          type: 'iceNova',
          casterPosition: casterPos,
          targets: targets.map(t => {
            const tTeam = t.team === 'player' ? playerTeam : aiTeam;
            const tIndex = tTeam.findIndex(c => c.instanceId === t.instanceId);
            return getCardPosition(tIndex, t.team);
          })
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        targets.forEach(target => {
          dealDamage(target, ability.damage);
        });

        if (ability.freeze) {
          freezeCharacters(targets, ability.freezeDuration || 2000);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        setActiveSpellEffect(null);

      } else if (ability.name === 'Lightning Zap') {
        // Chain lightning effect
        const targetPositions = targets.map(t => {
          const tTeam = t.team === 'player' ? playerTeam : aiTeam;
          const tIndex = tTeam.findIndex(c => c.instanceId === t.instanceId);
          return getCardPosition(tIndex, t.team);
        });

        setActiveSpellEffect({
          type: 'lightning',
          startPosition: casterPos,
          targetPositions
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        targets.forEach(target => {
          dealDamage(target, ability.damage);
        });

        setActiveSpellEffect(null);

      } else {
        // Generic damage ability
        targets.forEach(target => dealDamage(target, ability.damage));
      }
    }

    if (ability.heal) {
      targets.forEach(target => healCharacter(target, ability.heal));
    }

    if (ability.shield) {
      targets.forEach(target => applyShield(target, ability.shield));
    }

    // Clear spell notification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSpellNotification(null);
  };

  // Process player turn with manual targeting
  const processPlayerTurn = async () => {
    const activeChar = playerTeam[currentCharacterIndex];
    console.log('Processing player turn for:', activeChar?.name);

    if (!activeChar?.isAlive) {
      console.log('Character is dead, moving to next');
      moveToNextCharacter();
      return;
    }

    if (frozenCharacters.has(activeChar.instanceId)) {
      console.log(`${activeChar.name} is frozen!`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      moveToNextCharacter();
      return;
    }

    // Select random ability
    const abilities = activeChar.abilities || [];
    console.log('Character abilities:', abilities);
    if (abilities.length === 0) {
      console.log('No abilities found, moving to next');
      moveToNextCharacter();
      return;
    }

    const ability = abilities[Math.floor(Math.random() * abilities.length)];
    console.log('Selected ability:', ability.name);
    setCurrentAbility(ability);

    // Determine valid targets
    let targets = [];
    if (ability.effect === 'damage' || ability.effect === 'damage_all') {
      targets = aiTeam.filter(c => c.isAlive);
    } else if (ability.effect === 'heal' || ability.effect === 'shield') {
      targets = playerTeam.filter(c => c.isAlive);
    }

    if (targets.length === 0) {
      moveToNextCharacter();
      return;
    }

    // For AoE abilities, execute immediately
    if (ability.effect === 'damage_all') {
      await executeAbility(activeChar, ability, targets);
      moveToNextCharacter();
      return;
    }

    // Enable manual targeting for single target abilities
    console.log('Setting up targeting with targets:', targets);
    setValidTargets(targets);
    setIsTargeting(true);

    // Set caster element for arrow
    const casterCard = document.querySelector(`[data-character-id="${activeChar.instanceId}"]`);
    setCasterElement(casterCard);
    console.log('Waiting for player to select target...');
  };

  // Process AI turn automatically
  const processAITurn = async () => {
    const activeChar = aiTeam[currentCharacterIndex];

    if (!activeChar?.isAlive) {
      moveToNextCharacter();
      return;
    }

    if (frozenCharacters.has(activeChar.instanceId)) {
      console.log(`${activeChar.name} is frozen!`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      moveToNextCharacter();
      return;
    }

    // Select random ability
    const abilities = activeChar.abilities || [];
    if (abilities.length === 0) {
      moveToNextCharacter();
      return;
    }

    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    // Select targets automatically
    let targets = [];
    if (ability.effect === 'damage' || ability.effect === 'damage_all') {
      targets = playerTeam.filter(c => c.isAlive);
      if (ability.effect === 'damage' && targets.length > 0) {
        targets = [targets[Math.floor(Math.random() * targets.length)]];
      }
    } else if (ability.effect === 'heal' || ability.effect === 'shield') {
      targets = [activeChar];
    }

    if (targets.length > 0) {
      await executeAbility(activeChar, ability, targets);
    }

    moveToNextCharacter();
  };

  // Move to next character
  const moveToNextCharacter = () => {
    const activeTeam = currentTurn === 'player' ? playerTeam : aiTeam;
    let nextIndex = (currentCharacterIndex + 1) % activeTeam.length;

    // Check if we've cycled through all characters
    if (nextIndex === 0) {
      // Switch turns
      setCurrentTurn(prev => prev === 'player' ? 'ai' : 'player');
    }

    setCurrentCharacterIndex(nextIndex);
    setIsProcessingTurn(false);
  };

  // Handle card click during targeting
  const handleCardClick = async (target) => {
    if (!isTargeting || !validTargets.some(t => t.instanceId === target.instanceId)) {
      return;
    }

    // Execute ability on selected target
    const activeChar = playerTeam[currentCharacterIndex];
    setSelectedTarget(target);
    setIsTargeting(false);
    setValidTargets([]);
    setCasterElement(null);
    setTargetElement(null);

    await executeAbility(activeChar, currentAbility, [target]);
    moveToNextCharacter();
  };

  // Handle card hover
  const handleCardHover = (target) => {
    if (isTargeting && target && validTargets.some(t => t.instanceId === target.instanceId)) {
      setHoveredTarget(target);
      const targetCard = document.querySelector(`[data-character-id="${target.instanceId}"]`);
      setTargetElement(targetCard);
    } else {
      setHoveredTarget(null);
      setTargetElement(null);
    }
  };

  // Start battle and process first turn
  useEffect(() => {
    console.log('Starting battle...');
    setBattleStarted(true);

    // Start the first turn after a short delay
    const startTimer = setTimeout(() => {
      console.log('Processing first turn...');
      if (playerTeam.length > 0 && playerTeam[0].isAlive) {
        processPlayerTurn();
      }
    }, 2000);

    return () => clearTimeout(startTimer);
  }, []); // Empty dependency to run only once

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
            onCardHover={handleCardHover}
            shieldedCharacters={shieldedCharacters}
            frozenCharacters={frozenCharacters}
            isTargeting={isTargeting}
            validTargets={validTargets}
            hoveredTarget={hoveredTarget}
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

          {activeSpellEffect?.type === 'iceNova' && (
            <IceNova3D
              casterPosition={activeSpellEffect.casterPosition}
              targets={activeSpellEffect.targets}
              isActive={true}
              onComplete={() => {}}
            />
          )}

          {activeSpellEffect?.type === 'lightning' && (
            <LightningZap3D
              startPosition={activeSpellEffect.startPosition}
              targetPositions={activeSpellEffect.targetPositions}
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

      {/* Targeting Arrow */}
      {isTargeting && casterElement && targetElement && (
        <SimpleTargetingArrow
          startElement={casterElement}
          endElement={targetElement}
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
          {isTargeting && (
            <p className="text-yellow-400 text-sm font-bold animate-pulse">
              Select a target!
            </p>
          )}
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

export default Battle3DSceneEnhanced;