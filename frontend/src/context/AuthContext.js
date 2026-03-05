import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on load
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', {
      email,
      password
    });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    return { token, user };
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', {
      name,
      email,
      password
    });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    return { token, user };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);