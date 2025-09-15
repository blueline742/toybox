import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Trail, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import HybridCard3D from './HybridCard3D';

/**
 * Battle State Manager - Controls turn flow and animations
 * Following state-driven architecture from our guide
 */
const useBattleState = (initialPlayerTeam, initialAiTeam) => {
  const [battleState, setBattleState] = useState({
    turn: 'player',
    turnCount: 0,
    isResolving: false,
    selectedCardId: null,
    targetCardId: null,
    pendingAnimation: null,
    battleEnded: false
  });

  const [playerTeam, setPlayerTeam] = useState(initialPlayerTeam);
  const [aiTeam, setAiTeam] = useState(initialAiTeam);

  // Get random alive card from team
  const getRandomAliveCard = useCallback((team) => {
    const alive = team.filter(c => c.isAlive && !c.frozen);
    if (alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  }, []);

  // Get random target from opposite team
  const getRandomTarget = useCallback((isPlayerTurn) => {
    const targetTeam = isPlayerTurn ? aiTeam : playerTeam;
    return getRandomAliveCard(targetTeam);
  }, [playerTeam, aiTeam, getRandomAliveCard]);

  // Queue animation
  const queueAnimation = useCallback((animation) => {
    setBattleState(prev => ({
      ...prev,
      pendingAnimation: animation,
      isResolving: true
    }));
  }, []);

  // Apply damage to target
  const applyDamage = useCallback((targetId, damage, targetTeam) => {
    const setTeam = targetTeam === 'player' ? setPlayerTeam : setAiTeam;

    setTeam(prev => prev.map(card => {
      if (card.instanceId === targetId) {
        const newHealth = Math.max(0, card.currentHealth - damage);
        return {
          ...card,
          currentHealth: newHealth,
          isAlive: newHealth > 0
        };
      }
      return card;
    }));
  }, []);

  // End turn and switch
  const endTurn = useCallback(() => {
    setBattleState(prev => ({
      ...prev,
      turn: prev.turn === 'player' ? 'ai' : 'player',
      turnCount: prev.turnCount + 1,
      isResolving: false,
      selectedCardId: null,
      targetCardId: null,
      pendingAnimation: null
    }));
  }, []);

  // Process turn
  const processTurn = useCallback(() => {
    if (battleState.isResolving || battleState.battleEnded) return;

    const isPlayerTurn = battleState.turn === 'player';
    const currentTeam = isPlayerTurn ? playerTeam : aiTeam;

    // Select random attacker
    const attacker = getRandomAliveCard(currentTeam);
    if (!attacker) {
      setBattleState(prev => ({ ...prev, battleEnded: true }));
      return;
    }

    // Select random target
    const target = getRandomTarget(isPlayerTurn);
    if (!target) {
      setBattleState(prev => ({ ...prev, battleEnded: true }));
      return;
    }

    // Set selected cards for visual feedback
    setBattleState(prev => ({
      ...prev,
      selectedCardId: attacker.instanceId,
      targetCardId: target.instanceId
    }));

    // Queue the attack animation
    const ability = attacker.abilities?.[0] || {
      name: 'Basic Attack',
      damage: 10,
      type: 'damage'
    };

    queueAnimation({
      type: 'spell',
      from: attacker.instanceId,
      to: target.instanceId,
      ability: ability,
      onComplete: () => {
        applyDamage(
          target.instanceId,
          ability.damage || 10,
          isPlayerTurn ? 'ai' : 'player'
        );

        // Delay before ending turn for visual clarity
        setTimeout(() => {
          endTurn();
        }, 500);
      }
    });
  }, [battleState, playerTeam, aiTeam, getRandomAliveCard, getRandomTarget, queueAnimation, applyDamage, endTurn]);

  return {
    battleState,
    playerTeam,
    aiTeam,
    processTurn
  };
};

/**
 * Animated Card Component with smooth selection
 */
const AnimatedCard = ({ card, position, rotation, isSelected, isTarget, ...props }) => {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    y: position[1],
    glowIntensity: 0
  }));

  useEffect(() => {
    if (isSelected) {
      api.start({
        scale: 1.2,
        y: position[1] + 0.8,
        glowIntensity: 1
      });
    } else {
      api.start({
        scale: 1,
        y: position[1],
        glowIntensity: 0
      });
    }
  }, [isSelected, position, api]);

  return (
    <animated.group
      scale={springs.scale}
      position-y={springs.y}
    >
      <HybridCard3D
        character={card}
        position={[position[0], 0, position[2]]}
        rotation={rotation}
        isActive={isSelected}
        isValidTarget={isTarget}
        {...props}
      />

      {/* Selection glow */}
      {isSelected && (
        <mesh position={[position[0], -0.5, position[2]]}>
          <ringGeometry args={[1.5, 2, 32]} />
          <animated.meshBasicMaterial
            color="#ffcc00"
            transparent
            opacity={springs.glowIntensity}
          />
        </mesh>
      )}
    </animated.group>
  );
};

/**
 * Spell Effect Component - Casts from behind center
 */
const SpellEffect = ({ animation, onComplete }) => {
  const meshRef = useRef();
  const startTime = useRef(Date.now());
  const completed = useRef(false);

  // Spell origin is behind the center of the table
  const spellOrigin = [0, 2, -3];

  // Get target position from animation
  const getTargetPosition = () => {
    // This would be calculated based on the target card's actual position
    // For now, using placeholder
    return [0, 2, 5];
  };

  useEffect(() => {
    if (!animation) return;

    const duration = 1500; // 1.5 seconds for spell travel
    const timer = setTimeout(() => {
      if (!completed.current) {
        completed.current = true;
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [animation, onComplete]);

  if (!animation || animation.type !== 'spell') return null;

  const targetPos = getTargetPosition();

  return (
    <group>
      {/* Spell origin point */}
      <mesh position={spellOrigin}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Spell projectile */}
      <Trail
        width={4}
        length={8}
        color={new THREE.Color('#ff00ff')}
        attenuation={(width) => width}
      >
        <mesh ref={meshRef} position={spellOrigin}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={3}
          />
        </mesh>
      </Trail>

      {/* Target impact indicator */}
      <mesh position={targetPos}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
};

/**
 * Main Smooth Battle Scene
 */
const SmoothBattleSystem = ({ initialPlayerTeam, initialAiTeam, onBattleEnd }) => {
  const { battleState, playerTeam, aiTeam, processTurn } = useBattleState(
    initialPlayerTeam,
    initialAiTeam
  );

  // Auto-process turns
  useEffect(() => {
    if (!battleState.isResolving && !battleState.battleEnded) {
      const timer = setTimeout(() => {
        processTurn();
      }, 1000); // 1 second delay between turns

      return () => clearTimeout(timer);
    }
  }, [battleState.turn, battleState.isResolving, battleState.battleEnded, processTurn]);

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    if (battleState.pendingAnimation?.onComplete) {
      battleState.pendingAnimation.onComplete();
    }
  }, [battleState.pendingAnimation]);

  // Card positioning
  const getCardPosition = (index, team) => {
    const spacing = 2.5;
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;
    const x = startX + index * spacing;
    const y = 1.5;
    const z = team === 'player' ? 5 : -5;
    return [x, y, z];
  };

  return (
    <>
      {/* Spell Origin Point (behind center) */}
      <group position={[0, 0, -2]} name="spellOrigin">
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ff00ff" visible={false} />
        </mesh>
      </group>

      {/* Player Cards */}
      <group name="playerCards">
        {playerTeam.map((card, index) => {
          if (!card.isAlive) return null;
          const position = getCardPosition(index, 'player');

          return (
            <AnimatedCard
              key={card.instanceId}
              card={card}
              position={position}
              rotation={[0, 0, 0]}
              isSelected={battleState.selectedCardId === card.instanceId}
              isTarget={battleState.targetCardId === card.instanceId}
              teamColor="blue"
              isDead={!card.isAlive}
            />
          );
        })}
      </group>

      {/* AI Cards */}
      <group name="aiCards">
        {aiTeam.map((card, index) => {
          if (!card.isAlive) return null;
          const position = getCardPosition(index, 'ai');

          return (
            <AnimatedCard
              key={card.instanceId}
              card={card}
              position={position}
              rotation={[0, Math.PI, 0]}
              isSelected={battleState.selectedCardId === card.instanceId}
              isTarget={battleState.targetCardId === card.instanceId}
              teamColor="red"
              isDead={!card.isAlive}
            />
          );
        })}
      </group>

      {/* Spell Effects */}
      {battleState.pendingAnimation && (
        <SpellEffect
          animation={battleState.pendingAnimation}
          onComplete={handleAnimationComplete}
        />
      )}

      {/* Turn Indicator */}
      <Billboard position={[0, 5, 0]}>
        <mesh>
          <planeGeometry args={[4, 1]} />
          <meshBasicMaterial
            color={battleState.turn === 'player' ? '#00ff00' : '#ff0000'}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Billboard>

      {/* Battle End */}
      {battleState.battleEnded && (
        <Billboard position={[0, 3, 0]}>
          <mesh>
            <planeGeometry args={[6, 2]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </Billboard>
      )}
    </>
  );
};

export default SmoothBattleSystem;