import React, { useState, useEffect, useRef } from 'react';
import HearthstoneScene from './HearthstoneScene';
import SpellNotification from '../SpellNotification';
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
  const [activeEffects, setActiveEffects] = useState([]);
  const [spellNotification, setSpellNotification] = useState(null);

  // Helper function to get card position - Hearthstone style
  const getCardPosition = (index, team) => {
    const spacing = 2.5;
    const totalCards = 3;
    const startX = -(totalCards - 1) * spacing / 2;

    const x = startX + index * spacing;
    const y = team === 'player' ? -3 : 3;
    const z = 0;

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

    // Show spell notification
    setSpellNotification({
      ability,
      caster,
      targets
    });

    // Get caster position
    const casterTeam = caster.team === 'player' ? playerTeam : aiTeam;
    const casterIndex = casterTeam.findIndex(c => c.instanceId === caster.instanceId);
    const startPosition = getCardPosition(casterIndex, caster.team);

    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create spell effects based on ability type
    targets.forEach(target => {
      const targetTeam = target.team === 'player' ? playerTeam : aiTeam;
      const targetIndex = targetTeam.findIndex(c => c.instanceId === target.instanceId);
      const targetPosition = getCardPosition(targetIndex, target.team);

      // Add spell effect
      const effectType = getEffectType(ability);
      if (effectType) {
        const effectId = Date.now() + Math.random();
        setActiveEffects(prev => [...prev, {
          id: effectId,
          type: effectType,
          startPosition,
          targetPosition,
          duration: 1000
        }]);

        // Remove effect after duration
        setTimeout(() => {
          setActiveEffects(prev => prev.filter(e => e.id !== effectId));
        }, 1000);
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
    if (name.includes('fireball') || name.includes('pyroblast')) return 'fireball';
    if (name.includes('heal')) return 'healing';
    if (name.includes('explosion') || name.includes('blast')) return 'explosion';
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

    // Skip if frozen
    if (frozenCharacters.has(activeChar.instanceId)) {
      console.log(`${activeChar.name} is frozen!`);
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

      // Skip if frozen
      if (frozenCharacters.has(activeChar.instanceId)) {
        console.log(`${activeChar.name} is frozen!`);
        setCurrentTurn('ai');
        setTimeout(() => processAITurn(), 1000);
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
      {/* Hearthstone-style 3D Scene */}
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