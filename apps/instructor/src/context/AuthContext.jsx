'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getStoredInstructorUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('apex_instructor_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === 'INSTRUCTOR' || !parsed.role)) {
      return parsed;
    }
  } catch {}
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredInstructorUser);
  const [isLoading, setIsLoading] = useState(() => !getStoredInstructorUser());
  const [error, setError] = useState(null);

  /**
   * Fetch current faculty user profile via 7-day HTTP-only cookie
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'instructor',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apex_instructor_user');
        }
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Faculty session expired');
      }

      const userData = data.user || data.data?.user;
      if (userData && userData.role && userData.role !== 'INSTRUCTOR') {
        // Prevent cross-portal role pollution
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apex_instructor_user');
        }
        return null;
      }

      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_instructor_user', JSON.stringify(userData));
      }
      return userData;
    } catch {
      return null;
    }
  }, []);

  // Initialize session exclusively via HTTP-only cookie
  useEffect(() => {
    const initAuth = async () => {
      // Purge any legacy localStorage tokens
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('apex_instructor_token');
          localStorage.removeItem('apex_instructor_refresh_token');
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

  /**
   * Faculty Login
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'instructor',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, expectedRole: 'INSTRUCTOR' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Instructor sign in failed');
      }

      const userData = data.user || data.data?.user;
      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_instructor_user', JSON.stringify(userData));
      }
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Faculty Registration
   */
  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'instructor',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role: 'INSTRUCTOR' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Faculty registration failed');
      }

      const userData = data.user || data.data?.user;
      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_instructor_user', JSON.stringify(userData));
      }
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Faculty Logout
   */
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'X-Portal': 'instructor' },
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout failed:', e);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('apex_instructor_user');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: user ? (user._id || user.id || 'cookie-session') : null,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshUser,
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
