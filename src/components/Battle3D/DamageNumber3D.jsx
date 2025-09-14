import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const DamageNumber3D = ({ value, position, isCritical = false, isHealing = false }) => {
  const groupRef = useRef();
  const startTime = useRef(Date.now());
  const duration = 2000; // 2 seconds
  const startY = useRef(position[1] + 2);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Float upward animation
    groupRef.current.position.y = startY.current + progress * 2;

    // Fade out is handled by HTML opacity style
  });

  const getColor = () => {
    if (isHealing) return '#10b981'; // green
    if (isCritical) return '#fbbf24'; // gold
    return '#ef4444'; // red
  };

  const getFontSize = () => {
    if (isCritical) return '2rem';
    return '1.5rem';
  };

  return (
    <group ref={groupRef} position={[position[0], position[1] + 2, position[2]]}>
      <Html center>
        <div
          style={{
            color: getColor(),
            fontSize: getFontSize(),
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            userSelect: 'none',
            pointerEvents: 'none',
            animation: 'fadeOut 2s forwards'
          }}
        >
          {isHealing ? `+${value}` : `-${value}`}
        </div>
      </Html>
    </group>
  );
};

export default DamageNumber3D;