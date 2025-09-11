// FPSCounter.jsx - Performance monitoring for debugging
import React, { useEffect, useState, useRef } from 'react';

const FPSCounter = ({ show = false }) => {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const [minFps, setMinFps] = useState(60);
  const [deviceInfo, setDeviceInfo] = useState('');
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef([]);
  const animationId = useRef(null);

  useEffect(() => {
    if (!show) return;

    // Get device info
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 'unknown';
    const memory = navigator.deviceMemory || 'unknown';
    const connection = navigator.connection?.effectiveType || 'unknown';
    
    setDeviceInfo(`${isMobile ? 'Mobile' : 'Desktop'} | ${cores} cores | ${memory}GB RAM | ${connection}`);

    // FPS calculation loop
    const calculateFPS = (currentTime) => {
      frameCount.current++;
      
      // Calculate FPS every 100ms
      if (currentTime - lastTime.current >= 100) {
        const currentFps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        
        // Update FPS display
        setFps(currentFps);
        
        // Track history (last 60 samples = ~6 seconds)
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 60) {
          fpsHistory.current.shift();
        }
        
        // Calculate statistics
        if (fpsHistory.current.length > 0) {
          const avg = Math.round(
            fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
          );
          const min = Math.min(...fpsHistory.current);
          
          setAvgFps(avg);
          setMinFps(min);
        }
        
        // Reset counters
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationId.current = requestAnimationFrame(calculateFPS);
    };
    
    animationId.current = requestAnimationFrame(calculateFPS);
    
    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [show]);

  if (!show) return null;

  // Color coding for FPS
  const getFpsColor = (fpsValue) => {
    if (fpsValue >= 55) return 'text-green-400';
    if (fpsValue >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fps-counter fixed top-20 right-4 z-50 pointer-events-none">
      <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg font-mono text-xs">
        {/* Main FPS Display */}
        <div className="mb-2">
          <span className="text-gray-400">FPS: </span>
          <span className={`text-xl font-bold ${getFpsColor(fps)}`}>{fps}</span>
        </div>
        
        {/* Statistics */}
        <div className="space-y-1 text-[10px]">
          <div>
            <span className="text-gray-500">AVG: </span>
            <span className={getFpsColor(avgFps)}>{avgFps}</span>
          </div>
          <div>
            <span className="text-gray-500">MIN: </span>
            <span className={getFpsColor(minFps)}>{minFps}</span>
          </div>
        </div>
        
        {/* Performance Bar */}
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${
              fps >= 55 ? 'bg-green-400' : 
              fps >= 30 ? 'bg-yellow-400' : 
              'bg-red-400'
            }`}
            style={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
          />
        </div>
        
        {/* Device Info */}
        <div className="mt-2 text-[9px] text-gray-500">
          {deviceInfo}
        </div>
        
        {/* Performance Warnings */}
        {fps < 30 && (
          <div className="mt-2 text-[10px] text-red-400 animate-pulse">
            ⚠️ Low FPS detected
          </div>
        )}
      </div>
    </div>
  );
};

// Hook to use FPS counter programmatically
export const useFPSMonitor = () => {
  const [metrics, setMetrics] = useState({ fps: 60, avg: 60, min: 60 });
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const history = useRef([]);

  useEffect(() => {
    const measure = (currentTime) => {
      frameCount.current++;
      
      if (currentTime - lastTime.current >= 100) {
        const currentFps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        
        history.current.push(currentFps);
        if (history.current.length > 60) history.current.shift();
        
        const avg = Math.round(history.current.reduce((a, b) => a + b, 0) / history.current.length);
        const min = Math.min(...history.current);
        
        setMetrics({ fps: currentFps, avg, min });
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(measure);
    };
    
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, []);

  return metrics;
};

export default FPSCounter;