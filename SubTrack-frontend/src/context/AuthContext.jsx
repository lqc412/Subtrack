// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
// import api from '../services/api';

// Create the context
export const AuthContext = createContext(null);

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  
  const isAuthenticated = !!token;
  
  // Login function - in a real app, this would call your API
  const login = async (email, password) => {
    setLoading(true);
    try {
      // In a real app, this would be an API call to your backend
      // const response = await api.post('/auth/login', { email, password });
      // For now, we'll simulate a successful login
      const mockResponse = {
        token: 'example-token',
        user: { username: email.split('@')[0], email }
      };
      
      setToken(mockResponse.token);
      setCurrentUser(mockResponse.user);
      localStorage.setItem('token', mockResponse.token);
      return mockResponse;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // In a real app, you might want to call an API endpoint to invalidate the token
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
  };
  
  // Function to get current user information
  const refreshUser = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // In a real app, this would be an API call to your backend
      // const response = await api.get('/users/me');
      // setCurrentUser(response.data);
      
      // For now, just use stored user or a default
      if (!currentUser) {
        setCurrentUser({ username: 'User', email: 'user@example.com' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };
  
  // Load user data when token changes
  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token]);
  
  // Provide the auth context to its children
  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      token, 
      login, 
      logout,
      refreshUser,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};