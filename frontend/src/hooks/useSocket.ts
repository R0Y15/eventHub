"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Prevent socket initialization during SSR
const isBrowser = typeof window !== "undefined";

// Create a singleton socket instance
let socket: Socket | null = null;

export function useSocket(isAdmin?: boolean) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isBrowser) return;

    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eventhub-021d.onrender.com';
      console.log('Initializing socket connection to:', socketUrl);
      
      socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 60000,
        autoConnect: true,
        forceNew: false,
        withCredentials: true
      });

      // Debug logs
      socket.io.on("packet", ({ type, data }) => {
        console.log('Socket packet:', type, data);
      });

      socket.io.on("reconnect_attempt", (attempt) => {
        console.log('Socket reconnection attempt:', attempt);
      });
    }

    function onConnect() {
      console.log('Socket connected successfully with ID:', socket?.id);
      setIsConnected(true);
      
      // Join appropriate room based on user role
      if (isAdmin) {
        console.log('Attempting to join admin room...');
        socket?.emit('joinAdminRoom');
      } else {
        console.log('Attempting to join user room...');
        socket?.emit('joinUserRoom');
      }
    }

    function onDisconnect(reason: string) {
      console.log('Socket disconnected. Reason:', reason);
      setIsConnected(false);
    }

    function onConnectError(error: Error) {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
      
      // If WebSocket fails, try polling
      if (socket?.io?.opts?.transports?.includes('websocket')) {
        console.log('Falling back to polling transport');
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Connect if not already connected
    if (!socket.connected) {
      console.log('Initiating socket connection...');
      socket.connect();
    }

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('connect_error', onConnectError);
    };
  }, [isAdmin]);

  return socket;
} 