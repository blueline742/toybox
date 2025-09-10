// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://toybox-brawl-backend.onrender.com' // Your Render URL - will be updated after deployment
    : 'http://localhost:3003');

export const getSocketUrl = () => API_URL;