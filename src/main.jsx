import { Buffer } from 'buffer'
window.Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Disable StrictMode for PvP testing - it causes double rendering
// which breaks WebSocket connections and Three.js memory management
const isDevelopment = import.meta.env.DEV;
const enableStrictMode = false; // Temporarily disabled to fix mobile PvP issues

ReactDOM.createRoot(document.getElementById('root')).render(
  enableStrictMode ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  ),
)