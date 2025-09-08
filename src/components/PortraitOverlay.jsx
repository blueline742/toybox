import React from 'react'

const PortraitOverlay = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="portrait-overlay">
      <div className="portrait-content">
        <div className="rotate-icon">
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="animate-pulse"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mt-6 mb-4">
          Please Rotate Your Device
        </h2>
        <p className="text-xl text-gray-200">
          Portrait mode is required for the best battle experience!
        </p>
        <div className="rotation-hint mt-8">
          <div className="phone-icon landscape">📱</div>
          <div className="arrow-icon">➜</div>
          <div className="phone-icon portrait">📱</div>
        </div>
      </div>
    </div>
  );
};

export default PortraitOverlay;