import React, { useState, useEffect, useRef } from 'react';
import HearthstoneScene from './HearthstoneScene';
import SpellNotification from '../SpellNotification';
import { ENHANCED_CHARACTERS } from '../../game/enhancedCharacters';

/**
 * Battle3DSmooth - Enhanced battle with smooth turn-based system
 * Following the state-driven architecture with deterministic turns
 */
const Battle3DSmooth = ({ playerTeam: initialPlayerTeam, aiTeam: initialAiTeam, onBattleEnd }) => {
  // Initialize teams with proper structure
  const [playerTeam, setPlayerTeam] = useState(() =>
    initialPlayerTeam.map((char, index) => ({
      ...char,
      instanceId: `player-${index}`,
      currentHealth: char.maxHealth || 100,
      isAlive: true,
      team: 'player',
      frozen: false,
      shields: 0,
      effects: []
    }))
  );

  const [aiTeam, setAiTeam] = useState(() =>
    initialAiTeam.map((char, index) => ({
      ...char,
      instanceId: `ai-${index}`,
      currentHealth: char.maxHealth || 100,
      isAlive: true,
      team: 'ai',
      frozen: false,
      shields: 0,
      effects: []
    }))
  );

  // Battle state
  const [battleState, setBattleState] = useState({
    turn: 'player',
    turnCount: 0,
    isResolving: false,
    selectedCardIndex: null,
    targetCardIndex: null,
    pendingAnimation: null
  });

  const [battleEnded, setBattleEnded] = useState(false);
  const [spellNotification, setSpellNotification] = useState(null);
  const [activeEffects, setActiveEffects] = useState([]);
  const [damageNumbers, setDamageNumbers] = useState([]);

  // State for visual feedback
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map());
  const [frozenCharacters, setFrozenCharacters] = useState(new Map());

  // Animation queue reference
  const animationQueue = useRef([]);
  const isProcessing = useRef(false);

  // Get random alive card from team
  const getRandomAliveCard = (team) => {
    const alive = team.filter(c => c.isAlive && !c.frozen);
    if (alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  };

  // Get random ability from character
  const getRandomAbility = (character) => {
    if (!character.abilities || character.abilities.length === 0) {
      return {
        name: 'Basic Attack',
        damage: 10,
        type: 'damage',
        targetType: 'enemy'
      };
    }
    return character.abilities[Math.floor(Math.random() * character.abilities.length)];
  };

  // Apply damage with visual feedback
  const applyDamage = (targetId, damage, isHealing = false) => {
    const targetTeam = targetId.startsWith('player') ? 'player' : 'ai';
    const setTeam = targetTeam === 'player' ? setPlayerTeam : setAiTeam;

    setTeam(prev => prev.map(char => {
      if (char.instanceId === targetId) {
        // Apply shields first
        let actualDamage = damage;
        if (!isHealing && char.shields > 0) {
          const absorbed = Math.min(char.shields, damage);
          actualDamage = damage - absorbed;
          char.shields -= absorbed;
        }

        const newHealth = isHealing
          ? Math.min(char.maxHealth, char.currentHealth + damage)
          : Math.max(0, char.currentHealth - actualDamage);

        // Add damage number
        const charIndex = prev.findIndex(c => c.instanceId === char.instanceId);
        const position = getCardPosition(charIndex, targetTeam);

        setDamageNumbers(prev => [...prev, {
          id: Date.now() + Math.random(),
          value: isHealing ? damage : actualDamage,
          position,
          isCritical: false,
          isHealing
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

  // Apply effect (freeze, shield, etc.)
  const applyEffect = (targetId, effect) => {
    const targetTeam = targetId.startsWith('player') ? 'player' : 'ai';
    const setTeam = targetTeam === 'player' ? setPlayerTeam : setAiTeam;

    setTeam(prev => prev.map(char => {
      if (char.instanceId === targetId) {
        const updatedChar = { ...char };

        switch (effect.type) {
          case 'freeze':
            updatedChar.frozen = true;
            setFrozenCharacters(prev => {
              const newMap = new Map(prev);
              newMap.set(targetId, true);
              return newMap;
            });

            // Remove freeze after duration
            setTimeout(() => {
              setTeam(t => t.map(c => c.instanceId === targetId ? { ...c, frozen: false } : c));
              setFrozenCharacters(prev => {
                const newMap = new Map(prev);
                newMap.delete(targetId);
                return newMap;
              });
            }, (effect.duration || 2) * 1000);
            break;

          case 'shield':
            updatedChar.shields += effect.value || 20;
            setShieldedCharacters(prev => {
              const newMap = new Map(prev);
              newMap.set(targetId, { amount: updatedChar.shields, type: 'energy' });
              return newMap;
            });
            break;

          default:
            break;
        }

        return updatedChar;
      }
      return char;
    }));
  };

  // Get card position
  const getCardPosition = (index, team) => {
    const spacing = 2.2;
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;
    const x = startX + index * spacing;
    const y = 1.8;
    const z = team === 'player' ? 5.5 : -5.5;
    return [x, y, z];
  };

  // Process animation queue
  const processAnimationQueue = async () => {
    if (isProcessing.current || animationQueue.current.length === 0) return;

    isProcessing.current = true;
    const animation = animationQueue.current.shift();

    // Show spell notification
    if (animation.ability) {
      setSpellNotification({
        ability: animation.ability,
        caster: animation.caster,
        targets: animation.targets
      });
    }

    // Create visual effect
    const effectType = getEffectType(animation.ability);
    if (effectType) {
      const effectId = Date.now() + Math.random();
      const effectDuration = effectType === 'pyroblast' ? 2500 : 1500;

      setActiveEffects(prev => [...prev, {
        id: effectId,
        type: effectType,
        startPosition: animation.startPosition,
        targetPosition: animation.targetPosition,
        duration: effectDuration
      }]);

      // Remove effect after duration
      setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => e.id !== effectId));
      }, effectDuration);
    }

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Apply game logic
    if (animation.onComplete) {
      animation.onComplete();
    }

    // Clear notification
    setSpellNotification(null);

    // Process next animation
    isProcessing.current = false;
    processAnimationQueue();
  };

  // Get effect type from ability
  const getEffectType = (ability) => {
    if (!ability) return null;
    const name = ability.name.toLowerCase();
    if (name.includes('pyroblast')) return 'pyroblast';
    if (name.includes('fireball')) return 'fireball';
    if (name.includes('heal')) return 'healing';
    if (name.includes('shield')) return 'shield';
    if (name.includes('freeze') || name.includes('ice')) return 'freeze';
    return 'explosion';
  };

  // Process turn
  const processTurn = () => {
    if (battleState.isResolving || battleEnded) return;

    setBattleState(prev => ({ ...prev, isResolving: true }));

    const currentTeam = battleState.turn === 'player' ? playerTeam : aiTeam;
    const oppositeTeam = battleState.turn === 'player' ? aiTeam : playerTeam;

    // Select random attacker
    const attacker = getRandomAliveCard(currentTeam);
    if (!attacker) {
      handleBattleEnd();
      return;
    }

    // Skip if frozen
    if (attacker.frozen) {
      console.log(`${attacker.name} is frozen!`);
      setSpellNotification({
        ability: { name: 'Frozen!', description: 'Skipping turn' },
        caster: attacker,
        targets: []
      });

      setTimeout(() => {
        setSpellNotification(null);
        endTurn();
      }, 1500);
      return;
    }

    // Get random ability
    const ability = getRandomAbility(attacker);

    // Select target based on ability type
    let target;
    if (ability.targetType === 'ally' || ability.heal) {
      target = getRandomAliveCard(currentTeam);
    } else {
      target = getRandomAliveCard(oppositeTeam);
    }

    if (!target) {
      handleBattleEnd();
      return;
    }

    // Get positions
    const attackerIndex = currentTeam.findIndex(c => c.instanceId === attacker.instanceId);
    const targetIndex = oppositeTeam.findIndex(c => c.instanceId === target.instanceId);

    const startPos = getCardPosition(attackerIndex, battleState.turn);
    const targetPos = getCardPosition(
      targetIndex >= 0 ? targetIndex : currentTeam.findIndex(c => c.instanceId === target.instanceId),
      ability.targetType === 'ally' ? battleState.turn : (battleState.turn === 'player' ? 'ai' : 'player')
    );

    // Queue animation
    animationQueue.current.push({
      ability,
      caster: attacker,
      targets: [target],
      startPosition: startPos,
      targetPosition: targetPos,
      onComplete: () => {
        // Apply ability effects
        if (ability.damage) {
          applyDamage(target.instanceId, ability.damage);
        }
        if (ability.heal) {
          applyDamage(target.instanceId, ability.heal, true);
        }
        if (ability.freeze) {
          applyEffect(target.instanceId, { type: 'freeze', duration: 2 });
        }
        if (ability.shield) {
          applyEffect(target.instanceId, { type: 'shield', value: ability.shield });
        }

        // End turn after effect
        setTimeout(() => {
          endTurn();
        }, 500);
      }
    });

    // Update visual state
    setBattleState(prev => ({
      ...prev,
      selectedCardIndex: attackerIndex,
      targetCardIndex: targetIndex >= 0 ? targetIndex : currentTeam.findIndex(c => c.instanceId === target.instanceId)
    }));

    // Start processing animations
    processAnimationQueue();
  };

  // End turn
  const endTurn = () => {
    setBattleState(prev => ({
      ...prev,
      turn: prev.turn === 'player' ? 'ai' : 'player',
      turnCount: prev.turnCount + 1,
      isResolving: false,
      selectedCardIndex: null,
      targetCardIndex: null
    }));
  };

  // Handle battle end
  const handleBattleEnd = () => {
    const playerAlive = playerTeam.some(c => c.isAlive);
    const aiAlive = aiTeam.some(c => c.isAlive);

    if (!playerAlive || !aiAlive) {
      setBattleEnded(true);
      if (onBattleEnd) {
        onBattleEnd(playerAlive ? 'player' : 'ai');
      }
    }
  };

  // Auto-process turns
  useEffect(() => {
    if (!battleState.isResolving && !battleEnded) {
      const timer = setTimeout(() => {
        processTurn();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [battleState.turn, battleState.isResolving]);

  // Check for battle end
  useEffect(() => {
    handleBattleEnd();
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
      {/* 3D Scene */}
      <HearthstoneScene
        playerTeam={playerTeam}
        aiTeam={aiTeam}
        onCardClick={() => {}} // Disabled manual clicking in auto-battle
        shieldedCharacters={shieldedCharacters}
        frozenCharacters={frozenCharacters}
        isTargeting={false}
        validTargets={[]}
        activeCharacterIndex={battleState.selectedCardIndex}
        currentTurn={battleState.turn}
        activeEffects={activeEffects}
        damageNumbers={damageNumbers}
      />

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

      {/* Turn Counter */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/50 text-white px-4 py-2 rounded-lg">
          <div>Turn: {battleState.turnCount}</div>
          <div className={battleState.turn === 'player' ? 'text-green-400' : 'text-red-400'}>
            {battleState.turn === 'player' ? 'Player Turn' : 'AI Turn'}
          </div>
        </div>
      </div>

      {/* Battle End Screen */}
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

export default Battle3DSmooth;