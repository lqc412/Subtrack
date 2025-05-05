// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import * as jwtDecode from 'jwt-decode'; // 修复导入方式
import api from '../services/api';

// 创建认证上下文
export const AuthContext = createContext(null);

// 使用认证的自定义Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 认证Provider组件
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isAuthenticated = !!token;
  
  // 登录函数 - 真实调用后端API
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // 实际调用后端API
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      const errorMessage = error.response?.data?.message || '登录失败，请检查您的凭据';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 注册函数
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
      console.error('注册失败:', error);
      const errorMessage = error.response?.data?.message || '注册失败，请稍后再试';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 登出函数
  const logout = async () => {
    setLoading(true);
    
    try {
      // 调用后端登出API来使令牌失效
      await api.post('/auth/logout');
    } catch (error) {
      console.error('登出过程中出错:', error);
    } finally {
      // 即使API调用失败，也清除本地状态
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('token');
      setLoading(false);
    }
  };
  
  // 获取当前用户信息
  const refreshUser = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('获取用户信息出错:', error);
      if (error.response?.status === 401) {
        // 如果令牌无效，登出用户
        logout();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 当令牌变化时，设置请求头和校验令牌有效性
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      // 检查令牌是否过期
      try {
        const decoded = jwtDecode.jwtDecode(token); // 使用正确的导入方式
        // 如果令牌过期，登出用户
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          // 获取用户信息
          refreshUser();
        }
      } catch (error) {
        console.error('令牌解析错误:', error);
        logout();
      }
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);
  
  // 提供上下文值
  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      token, 
      login, 
      register, 
      logout,
      refreshUser,
      isAuthenticated,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};