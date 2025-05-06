// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import * as jwtDecode from 'jwt-decode'; // Correct import
import api from '../services/api';

// Create Auth Context
export const AuthContext = createContext(null);

// Custom hook for consuming AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  // Login function - calls backend API
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Login failed, please check your credentials';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;

      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed, please try again later';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local state regardless of API result
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('token');
      setLoading(false);
    }
  };

  // Fetch current user information
  const refreshUser = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      if (error.response?.status === 401) {
        logout(); // Token invalid, logout
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle token logic: set headers, validate expiration, fetch user
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);

      try {
        const decoded = jwtDecode.jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          refreshUser();
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        logout();
      }
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
