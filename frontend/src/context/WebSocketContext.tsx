import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import { authStorage } from '../services/api.ts';

export interface OnlineUser {
  id: string;
  name: string;
  avatarUrl: string;
  title?: string;
}

type EventCallback = (data: any) => void;

interface WebSocketContextType {
  connected: boolean;
  onlineUsers: OnlineUser[];
  joinProject: (projectId: string) => void;
  leaveProject: () => void;
  subscribe: (event: string, callback: EventCallback) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const currentProjectRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const subscribe = useCallback((event: string, callback: EventCallback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = authStorage.getToken();
    const wsUrl = `${protocol}//${host}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Authenticate with user token
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
        // Re-join current project if was in one
        if (currentProjectRef.current) {
          ws.send(JSON.stringify({ type: 'join:project', projectId: currentProjectRef.current }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          if (type === 'presence:update') {
            setOnlineUsers(data.users || []);
          }

          // Trigger all registered listeners for this event type
          const callbacks = listenersRef.current.get(type);
          if (callbacks) {
            callbacks.forEach(cb => {
              try {
                cb(data);
              } catch (e) {
                console.error(`Error in WS listener for ${type}:`, e);
              }
            });
          }
        } catch (e) {
          console.error('Failed to parse WS incoming message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setOnlineUsers([]);
        // Reconnect after 3 seconds
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection warning:', err);
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Re-authenticate when user changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const token = authStorage.getToken();
      if (token) {
        wsRef.current.send(JSON.stringify({ type: 'auth', token }));
      }
    }
  }, [user?.id]);

  const joinProject = useCallback((projectId: string) => {
    currentProjectRef.current = projectId;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join:project', projectId }));
    }
  }, []);

  const leaveProject = useCallback(() => {
    currentProjectRef.current = null;
    setOnlineUsers([]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave:project' }));
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        onlineUsers,
        joinProject,
        leaveProject,
        subscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
