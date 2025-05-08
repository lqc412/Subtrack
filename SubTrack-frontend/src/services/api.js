import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Allow credentials for cross-origin requests with cookies
  withCredentials: true
});

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Log the request for debugging (remove in production)
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Handle special case for FormData (don't set application/json content type)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle common auth errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging (remove in production)
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle authentication errors
    if (error.response) {
      console.log(`Error response status: ${error.response.status}`);
      
      if (error.response.status === 401) {
        console.log('Authentication error - redirecting to login');
        
        // Remove token from local storage
        localStorage.removeItem('token');

        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Utility method for making authenticated requests
api.authRequest = async (method, url, data = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(url, config);
        break;
      case 'post':
        response = await api.post(url, data, config);
        break;
      case 'put':
        response = await api.put(url, data, config);
        break;
      case 'delete':
        response = await api.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`AuthRequest failed for ${method} ${url}:`, error);
    throw error;
  }
};

export default api;