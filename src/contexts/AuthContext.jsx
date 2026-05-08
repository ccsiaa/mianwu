import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginApi, register as registerApi, getCurrentUser, setAuthToken } from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('mianwu_token');
    if (token) {
      setAuthToken(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const result = await getCurrentUser();
      setUser(result.data);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('获取当前用户失败：', err);
      setAuthToken(null);
      localStorage.removeItem('mianwu_token');
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload) => {
    const result = await loginApi(payload);
    const token = result.data?.access_token;
    if (token) {
      localStorage.setItem('mianwu_token', token);
      setAuthToken(token);
      setUser(result.data.user);
      setIsLoggedIn(true);
    }
    return result;
  };

  const register = async (payload) => {
    const result = await registerApi(payload);
    const token = result.data?.access_token;
    if (token) {
      localStorage.setItem('mianwu_token', token);
      setAuthToken(token);
      setUser(result.data.user);
      setIsLoggedIn(true);
    }
    return result;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('mianwu_token');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
