import React, { useState, useEffect, memo } from 'react';
import StaticTargetingLine from '../effects/StaticTargetingLine';

// This component manages targeting independently to avoid re-renders
const TargetingSystem = memo(({
  isTargeting,
  activeCharacterIndex,
  currentTurn,
  playerTeam,
  aiTeam,
  validTargets
}) => {
  const [lineStart, setLineStart] = useState(null);
  const [lineEnd, setLineEnd] = useState(null);

  // Calculate card position (duplicated to avoid dependency)
  const getCardPosition = (index, team) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 1.5 : 2.2;
    const totalCards = 4;
    const startX = -(totalCards - 1) * spacing / 2;
    const x = startX + index * spacing;
    const y = 2.3; // Active card height
    const z = team === 'player' ? 5.5 : -5.5;
    return [x, y, z];
  };

  // Set start position when targeting begins
  useEffect(() => {
    if (isTargeting && currentTurn === 'player' && activeCharacterIndex !== null) {
      const startPos = getCardPosition(activeCharacterIndex, 'player');
      setLineStart(startPos);
    } else {
      setLineStart(null);
      setLineEnd(null);
    }
  }, [isTargeting, currentTurn, activeCharacterIndex]);

  // For now, show line to first valid target (you can enhance this with hover later)
  useEffect(() => {
    if (isTargeting && validTargets && validTargets.length > 0 && lineStart) {
      // Find first valid enemy target
      const firstTarget = validTargets[0];
      if (firstTarget) {
        // Find target in teams
        let targetIndex = -1;
        let targetTeam = null;

        // Check AI team
        aiTeam.forEach((char, idx) => {
          if (char.instanceId === firstTarget.instanceId) {
            targetIndex = idx;
            targetTeam = 'ai';
          }
        });

        // Check player team (for friendly targets)
        if (targetIndex === -1) {
          playerTeam.forEach((char, idx) => {
            if (char.instanceId === firstTarget.instanceId) {
              targetIndex = idx;
              targetTeam = 'player';
            }
          });
        }

        if (targetIndex !== -1 && targetTeam) {
          const endPos = getCardPosition(targetIndex, targetTeam);
          setLineEnd(endPos);
        }
      }
    } else {
      setLineEnd(null);
    }
  }, [isTargeting, validTargets, lineStart, playerTeam, aiTeam]);

  return (
    <StaticTargetingLine
      startPos={lineStart}
      endPos={lineEnd}
      isActive={isTargeting && lineStart && lineEnd}
    />
  );
});

export default TargetingSystem;