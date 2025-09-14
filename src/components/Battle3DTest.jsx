import React, { useState } from 'react';
import Battle3DEnhanced from './Battle3D/Battle3DEnhanced';
import { ENHANCED_CHARACTERS } from '../game/enhancedCharacters';

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
    const characters = ['Brick Dude', 'Mecha Dino', 'Cursed Marionette'];
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

  const handleBattleEnd = (winner) => {
    console.log('Battle ended! Winner:', winner);
  };

  return (
    <Battle3DEnhanced
      playerTeam={playerTeam}
      aiTeam={aiTeam}
      onBattleEnd={handleBattleEnd}
    />
  );
};

export default Battle3DTest;