import React from 'react';

// Wrapper component that renders children without StrictMode
// This is used for PvP components where StrictMode's double rendering
// causes issues with WebSocket connections and Three.js memory management
export const NoStrictModeWrapper = ({ children }) => {
  // Simply render children without StrictMode wrapper
  return <>{children}</>;
};

export default NoStrictModeWrapper;