import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types.ts';
import { api, authStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  availableUsers: User[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; department?: string; title?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAvailableUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const refreshAvailableUsers = useCallback(async () => {
    try {
      const res = await api.auth.getUsers();
      setAvailableUsers(res.users);
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.auth.me();
      setUser(res.user);
      await refreshAvailableUsers();
    } catch {
      authStorage.clearToken();
      setUser(null);
    }
  }, [refreshAvailableUsers]);

  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getToken();
      if (token) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
          await refreshAvailableUsers();
        } catch {
          authStorage.clearToken();
          setUser(null);
        }
      } else {
        setUser(null);
        await refreshAvailableUsers();
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshAvailableUsers]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      await refreshAvailableUsers();
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; department?: string; title?: string }) => {
    setLoading(true);
    try {
      const res = await api.auth.register(data);
      setUser(res.user);
      await refreshAvailableUsers();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
    }
  };

  const switchDemoUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.auth.demoSwitch(userId);
      setUser(res.user);
      await refreshAvailableUsers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        availableUsers,
        login,
        register,
        logout,
        switchDemoUser,
        refreshUser,
        refreshAvailableUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
