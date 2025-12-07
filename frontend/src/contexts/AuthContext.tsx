'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { apiClient } from '@/lib/api';

import type { UserAccount } from '@/lib/api';
import type { ReactNode } from 'react';

interface AuthContextValue {
  user: UserAccount | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const response = await apiClient.getCurrentUser();
        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiClient.login({ email, password });
    setUser(response.user);
  };

  const register = async (
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> => {
    const response = await apiClient.register({ email, password, confirmPassword });
    setUser(response.user);
  };

  const logout = async (): Promise<void> => {
    await apiClient.logout();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
