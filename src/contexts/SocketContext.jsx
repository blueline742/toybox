import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getSocketUrl } from '../config/api';

// Get backend URL from centralized config
const BACKEND_URL = getSocketUrl();

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('Creating socket connection to:', BACKEND_URL);
    // Create socket connection
    const newSocket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'], // Start with polling first
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      console.error('Error type:', error.type);
      console.error('Trying to connect to:', BACKEND_URL);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};