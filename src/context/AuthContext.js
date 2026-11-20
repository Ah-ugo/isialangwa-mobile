import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, isLoggedIn } from '../api/auth';
import { getUser } from '../utils/storage';
import { authEvents } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check stored credentials
    (async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          const storedUser = await getUser();
          setUser(storedUser);
          setToken('exists'); // We don't expose the raw token value here
        }
      } catch (err) {
        console.warn('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    })();

    // Listen for 401 events from axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    authEvents.on('unauthorized', handleUnauthorized);
    return () => authEvents.off('unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const result = await apiLogin(identifier, password);
    setToken(result.token);
    setUser(result.user || null);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
