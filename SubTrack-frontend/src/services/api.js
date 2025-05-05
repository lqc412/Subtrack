// src/services/api.js
import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // 允许发送凭据以支持跨域请求中的cookie
  withCredentials: true
});

// 请求拦截器，添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理会话超时或未授权访问
    if (error.response && error.response.status === 401) {
      // 清除本地存储的令牌
      localStorage.removeItem('token');
      
      // 如果不在登录页面，重定向到登录页面
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // 将错误转发给调用者
    return Promise.reject(error);
  }
);

export default api;