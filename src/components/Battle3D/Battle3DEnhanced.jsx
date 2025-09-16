import React, { useState, useEffect, useRef } from 'react';
import HearthstoneScene from './HearthstoneScene';
import SpellNotification from '../SpellNotification';
import TargetingOverlay from './TargetingOverlay';
import { ENHANCED_CHARACTERS } from '../../game/enhancedCharacters';

const Battle3DEnhanced = ({ playerTeam: initialPlayerTeam, aiTeam: initialAiTeam, onBattleEnd }) => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null); // Start with null until loaded
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);

  // Targeting state
  const [isTargeting, setIsTargeting] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [showTargetingOverlay, setShowTargetingOverlay] = useState(false);

  // Effects state
  const [shieldedCharacters, setShieldedCharacters] = useState(new Map());
  const [frozenCharacters, setFrozenCharacters] = useState(new Map());
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [activeEffects, setActiveEffects] = useState([]);
  const [spellNotification, setSpellNotification] = useState(null);

  // Helper function to get card position - Hearthstone style
  const getCardPosition = (index, team, forSpell = false) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 2.5 : 2.2; // Match HearthstoneScene spacing exactly
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;

    const x = startX + index * spacing;
    // Add vertical offset for spells to appear above the flat cards
    const y = forSpell ? 1.5 : 0.4; // Higher for spells, normal for cards
    const z = team === 'player' ? 5.5 : -5.5; // Match HearthstoneScene positioning

    return [x, y, z];
  };

  // Deal damage
  const dealDamage = (target, damage, isHealing = false) => {
    const setTeam = target.team === 'player' ? setPlayerTeam : setAiTeam;
    const team = target.team === 'player' ? playerTeam : aiTeam;

    setTeam(prev => prev.map(char => {
      if (char.instanceId === target.instanceId) {
        const newHealth = isHealing
          ? Math.min(char.maxHealth, char.currentHealth + damage)
          : Math.max(0, char.currentHealth - damage);

        // Add damage number
        const charIndex = team.findIndex(c => c.instanceId === char.instanceId);
        const position = getCardPosition(charIndex, target.team);

        setDamageNumbers(prev => [...prev, {
          id: Date.now() + Math.random(),
          value: damage,
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

  // Execute ability with effects
  const executeAbility = async (caster, ability, targets) => {
    console.log(`${caster.name} uses ${ability.name}!`);
    console.log('🎯 PYROBLAST DEBUG - Caster:', caster);
    console.log('🎯 PYROBLAST DEBUG - Targets:', targets);

    // Show spell notification
    setSpellNotification({
      ability,
      caster,
      targets
    });

    // Get the caster's actual position on the battlefield
    const casterTeam = caster.team === 'player' ? playerTeam : aiTeam;
    const casterIndex = casterTeam.findIndex(c => c.instanceId === caster.instanceId);
    const startPosition = getCardPosition(casterIndex, caster.team, true); // true for spell position
    console.log('🎯 PYROBLAST DEBUG - Caster Index:', casterIndex);
    console.log('🎯 PYROBLAST DEBUG - Start Position:', startPosition);

    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create spell effects based on ability type
    targets.forEach(target => {
      const targetTeam = target.team === 'player' ? playerTeam : aiTeam;
      const targetIndex = targetTeam.findIndex(c => c.instanceId === target.instanceId);
      const targetPosition = getCardPosition(targetIndex, target.team, true); // true for spell position
      console.log('🎯 PYROBLAST DEBUG - Target:', target);
      console.log('🎯 PYROBLAST DEBUG - Target Index:', targetIndex);
      console.log('🎯 PYROBLAST DEBUG - Target Position:', targetPosition);

      // Add spell effect
      const effectType = getEffectType(ability);
      if (effectType) {
        const effectId = Date.now() + Math.random();
        // Pyroblast needs longer duration for charging + flight + explosion
        const effectDuration = effectType === 'pyroblast' ? 2500 : 1500;

        setActiveEffects(prev => [...prev, {
          id: effectId,
          type: effectType,
          startPosition,
          targetPosition,
          duration: effectDuration
        }]);

        // Remove effect after duration
        setTimeout(() => {
          setActiveEffects(prev => prev.filter(e => e.id !== effectId));
        }, effectDuration); // Effect component handles its own timing
      }

      // Apply damage/healing
      if (ability.damage) {
        setTimeout(() => dealDamage(target, ability.damage), 500);
      }
      if (ability.heal) {
        setTimeout(() => dealDamage(target, ability.heal, true), 500);
      }

      // Apply shields
      if (ability.shield) {
        setShieldedCharacters(prev => {
          const newMap = new Map(prev);
          newMap.set(target.instanceId, {
            type: ability.element || 'energy',
            amount: ability.shield
          });
          return newMap;
        });
      }

      // Apply freeze
      if (ability.freeze) {
        setFrozenCharacters(prev => {
          const newMap = new Map(prev);
          newMap.set(target.instanceId, true);
          return newMap;
        });

        // Remove freeze after 2 turns
        setTimeout(() => {
          setFrozenCharacters(prev => {
            const newMap = new Map(prev);
            newMap.delete(target.instanceId);
            return newMap;
          });
        }, 4000);
      }
    });

    // Clear notification
    setTimeout(() => setSpellNotification(null), 2000);
  };

  // Get effect type based on ability
  const getEffectType = (ability) => {
    const name = ability.name.toLowerCase();
    if (name.includes('pyroblast')) return 'pyroblast';
    if (name.includes('fireball')) return 'fireball';
    if (name.includes('heal')) return 'healing';
    if (name.includes('explosion') || (name.includes('blast') && !name.includes('pyroblast'))) return 'explosion';
    if (name.includes('shield')) return 'shield';
    return null;
  };

  // Handle card click
  const handleCardClick = async (target) => {
    if (!isTargeting || !validTargets.some(t => t.instanceId === target.instanceId)) {
      return;
    }

    const activeChar = playerTeam[currentCharacterIndex];
    setIsTargeting(false);
    setValidTargets([]);
    setShowTargetingOverlay(false);

    await executeAbility(activeChar, currentAbility, [target]);

    // Wait for spell animation to complete
    const isSpecialSpell = currentAbility.name.toLowerCase().includes('pyroblast') ||
                          currentAbility.name.toLowerCase().includes('ice nova');
    const turnDelay = isSpecialSpell ? 3000 : 2000;

    // Move to AI turn after animation
    setTimeout(() => {
      setCurrentTurn('ai');
      setTimeout(() => processAITurn(), 500);
    }, turnDelay);
  };

  // Process AI turn
  const processAITurn = async () => {
    const activeChar = aiTeam[currentCharacterIndex];

    if (!activeChar?.isAlive) {
      setCurrentTurn('player');
      setCurrentCharacterIndex((prev) => (prev + 1) % aiTeam.length);
      return;
    }

    // Skip if frozen
    if (frozenCharacters.has(activeChar.instanceId)) {
      console.log(`${activeChar.name} is frozen!`);

      // Show frozen notification
      setSpellNotification({
        ability: { name: 'Frozen!', description: 'Skipping turn' },
        caster: activeChar,
        targets: []
      });

      // Wait before switching turns
      setTimeout(() => {
        setSpellNotification(null);
        setCurrentTurn('player');
        setCurrentCharacterIndex((prev) => (prev + 1) % aiTeam.length);
      }, 1500);
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

    // Wait for spell animation to complete
    const isSpecialSpell = ability.name.toLowerCase().includes('pyroblast') ||
                          ability.name.toLowerCase().includes('ice nova');
    const turnDelay = isSpecialSpell ? 3000 : 2000;

    // Move back to player turn after animation
    setTimeout(() => {
      setCurrentTurn('player');
      setCurrentCharacterIndex((prev) => (prev + 1) % playerTeam.length);
    }, turnDelay);
  };

  // Initialize loading buffer
  useEffect(() => {
    if (isLoading) {
      const isMobile = window.innerWidth <= 768;
      const loadTime = isMobile ? 7000 : 5000; // 7 seconds for mobile, 5 for desktop
      const interval = 100; // Update every 100ms
      const increment = 100 / (loadTime / interval);

      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + increment;
          if (next >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setIsLoading(false);
              setCurrentTurn('player'); // Start the game after loading
            }, 500);
            return 100;
          }
          return next;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isLoading]);

  // Start player turn when it's their turn
  useEffect(() => {
    if (!isLoading && currentTurn === 'player' && !isTargeting && !battleEnded) {
      const activeChar = playerTeam[currentCharacterIndex];

      if (!activeChar?.isAlive) {
        setCurrentCharacterIndex((prev) => (prev + 1) % playerTeam.length);
        return;
      }

      // Skip if frozen
      if (frozenCharacters.has(activeChar.instanceId)) {
        console.log(`${activeChar.name} is frozen!`);

        // Show frozen notification
        setSpellNotification({
          ability: { name: 'Frozen!', description: 'Skipping turn' },
          caster: activeChar,
          targets: []
        });

        // Wait before switching turns
        setTimeout(() => {
          setSpellNotification(null);
          setCurrentTurn('ai');
          setTimeout(() => processAITurn(), 500);
        }, 1500);
        return;
      }

      // Select random ability
      const abilities = activeChar.abilities || [];
      if (abilities.length === 0) return;

      const ability = abilities[Math.floor(Math.random() * abilities.length)];
      setCurrentAbility(ability);

      // Set valid targets
      const targets = ability.targetType === 'ally'
        ? playerTeam.filter(c => c.isAlive)
        : aiTeam.filter(c => c.isAlive);

      if (targets.length > 0) {
        console.log(`${activeChar.name}'s turn - Select a target for ${ability.name}`);
        setValidTargets(targets);
        setIsTargeting(true);

        // Show 2D overlay for player targeting
        if (currentTurn === 'player') {
          setShowTargetingOverlay(true);
        }
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

  // Handle cancel targeting
  const handleCancelTargeting = () => {
    setShowTargetingOverlay(false);
    setIsTargeting(false);
    setValidTargets([]);
    setCurrentAbility(null);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8 animate-pulse">
              Loading Battle Arena...
            </h2>
            <div className="w-80 h-6 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-200"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-white text-lg">
              {Math.round(loadingProgress)}% - {window.innerWidth <= 768 ? 'Optimizing for mobile...' : 'Preparing arena...'}
            </p>
            <p className="text-gray-300 text-sm mt-4">
              Please wait while all assets load properly
            </p>
          </div>
        </div>
      )}

      {/* 2D Targeting Overlay - Shows instead of 3D view during player targeting */}
      {!isLoading && showTargetingOverlay && (
        <TargetingOverlay
          activeCard={playerTeam[currentCharacterIndex]}
          targets={validTargets}
          onTargetSelect={handleCardClick}
          onCancel={handleCancelTargeting}
          selectedAbility={currentAbility}
        />
      )}

      {/* Hearthstone-style 3D Scene - Blurred during overlay */}
      {!isLoading && (
        <div className={showTargetingOverlay ? 'blur-md scale-105 transition-all duration-300' : 'transition-all duration-300'}>
          <HearthstoneScene
          playerTeam={playerTeam}
          aiTeam={aiTeam}
          onCardClick={handleCardClick}
          shieldedCharacters={shieldedCharacters}
          frozenCharacters={frozenCharacters}
          isTargeting={isTargeting}
          validTargets={validTargets}
          activeCharacterIndex={currentCharacterIndex}
          currentTurn={currentTurn}
          activeEffects={activeEffects}
          damageNumbers={damageNumbers}
        />
        </div>
      )}

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

export default Battle3DEnhanced;