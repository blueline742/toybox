// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://toybox-tjpn.onrender.com' // Your actual Render URL
    : 'http://localhost:3003');

export const getSocketUrl = () => API_URL;