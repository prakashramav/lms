'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getStoredAdminUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('apex_admin_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (['ADMIN', 'SUPER_ADMIN'].includes(parsed.role) || !parsed.role)) {
      return parsed;
    }
  } catch {}
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredAdminUser);
  const [isLoading, setIsLoading] = useState(() => !getStoredAdminUser());
  const [error, setError] = useState(null);

  /**
   * Fetch current admin profile via 7-day HTTP-only cookie
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'admin',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apex_admin_user');
        }
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Administrative session expired');
      }

      const userData = data.user || data.data?.user;
      if (userData && !['ADMIN', 'SUPER_ADMIN'].includes(userData.role)) {
        // Prevent cross-portal role pollution
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apex_admin_user');
        }
        return null;
      }

      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_admin_user', JSON.stringify(userData));
      }
      return userData;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Purge any legacy localStorage tokens
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('apex_admin_token');
          localStorage.removeItem('accessToken');
        } catch {
          // Ignore storage errors
        }
      }

      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

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
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'admin',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, expectedRole: 'ADMIN' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Administrative authentication failed');
      }

      const userData = data.user || data.data?.user;
      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_admin_user', JSON.stringify(userData));
      }
      return userData;
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
        headers: { 'X-Portal': 'admin' },
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout failed:', e);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('apex_admin_user');
      }
    }
  };

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('apex_admin_token');
        localStorage.removeItem('apex_admin_user');
      } catch {
        // Ignore
      }
      const currentPath = window.location.pathname + window.location.search;
      const redirectParam = currentPath && currentPath !== '/login' ? `&redirect=${encodeURIComponent(currentPath)}` : '';
      window.location.href = `/login?expired=1${redirectParam}`;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: user ? (user._id || user.id || 'cookie-session') : null,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        hasPermission,
        isLoading,
        error,
        login,
        logout,
        refreshUser,
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
