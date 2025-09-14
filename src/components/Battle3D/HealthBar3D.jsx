import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const HealthBar3D = ({
  position,
  health,
  maxHealth,
  characterName,
  showStats = true,
  attack = 0,
  defense = 0,
  scale = 1
}) => {
  const healthPercentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  const getHealthColor = () => {
    if (healthPercentage > 60) return '#10b981'; // green
    if (healthPercentage > 30) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Html
      position={[position[0], position[1] + 2.5 * scale, position[2]]}
      center
      distanceFactor={8}
      style={{
        transition: 'all 0.3s',
        pointerEvents: 'none'
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Character Name */}
        <div className="text-white text-xs font-bold drop-shadow-lg whitespace-nowrap">
          {characterName}
        </div>

        {/* Health Bar Container */}
        <div className="relative">
          <div className="bg-gray-900 rounded-full h-2 w-20 border border-gray-700 overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${healthPercentage}%`,
                backgroundColor: getHealthColor()
              }}
            />
          </div>

          {/* Health Text */}
          <div className="text-white text-xs text-center mt-0.5 font-bold drop-shadow-lg">
            {health}/{maxHealth}
          </div>
        </div>

        {/* Stats */}
        {showStats && (attack > 0 || defense > 0) && (
          <div className="flex gap-2 justify-center">
            {attack > 0 && (
              <span className="text-red-400 text-xs font-bold drop-shadow-lg">
                ⚔️{attack}
              </span>
            )}
            {defense > 0 && (
              <span className="text-blue-400 text-xs font-bold drop-shadow-lg">
                🛡️{defense}
              </span>
            )}
          </div>
        )}
      </div>
    </Html>
  );
};

export default HealthBar3D;