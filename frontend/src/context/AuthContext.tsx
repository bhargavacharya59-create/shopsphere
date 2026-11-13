/**
 * Auth context — manages login state, JWT token, and user object.
 * Persists to localStorage so sessions survive page refresh.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types';
import api, { getErrorMessage } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const persistAuth = (authResponse: AuthResponse) => {
    localStorage.setItem('token', authResponse.access_token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    setToken(authResponse.access_token);
    setUser(authResponse.user);
  };

  const login = useCallback(async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    persistAuth(response.data);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    persistAuth(response.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
