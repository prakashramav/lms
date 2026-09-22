'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getStoredStudentUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('apex_student_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === 'STUDENT' || !parsed.role)) {
      return parsed;
    }
  } catch {}
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredStudentUser);
  const [isLoading, setIsLoading] = useState(() => !getStoredStudentUser());
  const [error, setError] = useState(null);

  /**
   * Fetch current user profile via 7-day HTTP-only cookie
   * Backend cookie is the single source of truth.
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'student',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apex_student_user');
        }
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to authenticate');
      }

      const userData = data.user || data.data?.user;
      if (userData && userData.role && userData.role !== 'STUDENT') {
        // Cross-portal safety: ensure student portal only binds student accounts
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apex_student_user');
        }
        return null;
      }

      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_student_user', JSON.stringify(userData));
      }
      return userData;
    } catch {
      return null;
    }
  }, []);

  // Initialize session on mount exclusively via HTTP-only cookie
  useEffect(() => {
    const initAuth = async () => {
      // Purge any legacy localStorage tokens to prevent raw JWT leakage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('apex_student_token');
          localStorage.removeItem('apex_student_refresh_token');
          localStorage.removeItem('accessToken');
        } catch {
          // Ignore localStorage access errors
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
   * Student Login
   * Browser stores token in HTTP-only cookie; React context stores only user profile
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'student',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, expectedRole: 'STUDENT' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const userData = data.user || data.data?.user;
      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_student_user', JSON.stringify(userData));
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
   * Student Registration
   */
  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'student',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const userData = data.user || data.data?.user;
      setUser(userData);
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('apex_student_user', JSON.stringify(userData));
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
   * Student Logout
   * Backend clears HTTP-only cookie and revokes session
   */
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'X-Portal': 'student' },
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout API call failed:', e);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('apex_student_user');
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
        refreshAccessToken: refreshUser,
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
