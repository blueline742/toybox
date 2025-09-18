import { useState, useCallback } from 'react';

// Custom hook for managing spell effects
export const useSpellEffects = () => {
  const [activeSpells, setActiveSpells] = useState([]);

  const castPyroblast = useCallback((caster, target, onHit) => {
    const spellId = `pyroblast-${Date.now()}`;

    // Calculate positions from caster and target
    const startPos = caster?.position || [0, 1, 0];
    const endPos = target?.position || [5, 1, 0];

    const spell = {
      id: spellId,
      type: 'pyroblast',
      active: true,
      startPosition: startPos,
      endPosition: endPos,
      caster,
      target,
      onComplete: () => {
        // Remove spell from active list
        setActiveSpells(prev => prev.filter(s => s.id !== spellId));

        // Trigger hit callback
        if (onHit) {
          onHit({
            spell: 'pyroblast',
            damage: 50,
            caster,
            target
          });
        }
      }
    };

    setActiveSpells(prev => [...prev, spell]);

    return spellId;
  }, []);

  const castSpell = useCallback((spellName, caster, target, onHit) => {
    switch (spellName.toLowerCase()) {
      case 'pyroblast':
        return castPyroblast(caster, target, onHit);
      // Add more spells here
      default:
        console.warn(`Unknown spell: ${spellName}`);
        return null;
    }
  }, [castPyroblast]);

  const clearSpell = useCallback((spellId) => {
    setActiveSpells(prev => prev.filter(s => s.id !== spellId));
  }, []);

  const clearAllSpells = useCallback(() => {
    setActiveSpells([]);
  }, []);

  return {
    activeSpells,
    castSpell,
    castPyroblast,
    clearSpell,
    clearAllSpells
  };
};