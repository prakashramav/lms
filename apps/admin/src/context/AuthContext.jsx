'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('apex_admin_token');
      const storedUser = localStorage.getItem('apex_admin_user');
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to restore admin session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (user.role === 'ADMIN') {
        return Array.isArray(user.permissions) && user.permissions.includes(permissionKey);
      }
      return false;
    },
    [user]
  );

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, expectedRole: 'ADMIN' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Administrative authentication failed');
      }

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem('apex_admin_token', data.data.accessToken);
      localStorage.setItem('apex_admin_user', JSON.stringify(data.data.user));
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout failed:', e);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('apex_admin_token');
      localStorage.removeItem('apex_admin_user');
    }
  };

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('apex_admin_token');
    localStorage.removeItem('apex_admin_user');
    window.location.href = '/login?expired=1';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        hasPermission,
        isLoading,
        error,
        login,
        logout,
        handleSessionExpired,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
