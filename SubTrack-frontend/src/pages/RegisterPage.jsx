// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState('');
  const { register, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // 客户端验证
    if (!formData.username || !formData.email || !formData.password) {
      setLocalError('所有字段都是必填的');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setLocalError('密码不匹配');
      return;
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      // 错误已经在AuthContext中处理
      console.error('注册处理错误:', err);
    }
  };

  // 显示错误信息（本地或从AuthContext获取）
  const displayError = localError || authError;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-full max-w-md">
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">创建账号</h1>
          <p className="mt-2 text-sm text-gray-600">
            已有账号? <Link to="/login" className="text-primary hover:underline">登录</Link>
          </p>
        </div>
        
        {displayError && (
          <div className="alert alert-error mb-4">
            <span>{displayError}</span>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">用户名</label>
            <input 
              type="text" 
              id="username" 
              name="username"
              className="input input-bordered w-full mt-1" 
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              className="input input-bordered w-full mt-1" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              className="input input-bordered w-full mt-1" 
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">密码至少需要6个字符</p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">确认密码</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword"
              className="input input-bordered w-full mt-1" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex items-center">
            <input id="terms" type="checkbox" className="checkbox checkbox-primary" required />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              我同意 <a href="#" className="text-primary hover:underline">服务条款</a> 和 <a href="#" className="text-primary hover:underline">隐私政策</a>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : '创建账号'}
          </button>
        </form>
      </div>
    </div>
  );
}