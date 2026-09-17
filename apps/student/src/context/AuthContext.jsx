'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    // Buffer by 30 seconds
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('apex_student_refresh_token') : null;
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.data?.accessToken) {
        throw new Error(data.message || 'Session expired');
      }

      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apex_student_token', newToken);
        if (data.data.refreshToken) {
          localStorage.setItem('apex_student_refresh_token', data.data.refreshToken);
        }
      }
      return newToken;
    } catch {
      setUser(null);
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('apex_student_token');
        localStorage.removeItem('apex_student_refresh_token');
        localStorage.removeItem('apex_student_user');
      }
      return null;
    }
  };

  // Restore session from localStorage on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('apex_student_token');
        const storedUser = localStorage.getItem('apex_student_user');
        const storedRefresh = localStorage.getItem('apex_student_refresh_token');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          if (!isTokenExpired(storedToken)) {
            setAccessToken(storedToken);
            setUser(parsedUser);
          } else if (storedRefresh) {
            // Token expired, attempt silent renewal
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              setUser(parsedUser);
            }
          } else {
            // Expired with no refresh token
            localStorage.removeItem('apex_student_token');
            localStorage.removeItem('apex_student_user');
            localStorage.removeItem('apex_student_refresh_token');
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, expectedRole: 'STUDENT' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem('apex_student_token', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('apex_student_refresh_token', data.data.refreshToken);
      }
      localStorage.setItem('apex_student_user', JSON.stringify(data.data.user));
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem('apex_student_token', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('apex_student_refresh_token', data.data.refreshToken);
      }
      localStorage.setItem('apex_student_user', JSON.stringify(data.data.user));
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
      console.warn('Logout API call failed:', e);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('apex_student_token');
      localStorage.removeItem('apex_student_refresh_token');
      localStorage.removeItem('apex_student_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshAccessToken,
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
