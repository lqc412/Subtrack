import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Simple client-side validation
    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is already handled and set in AuthContext
      console.error('Login handling error:', err);
    }
  };

  // Display error message (local or from AuthContext)
  const displayError = localError || authError;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-full max-w-md">
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to SubTrack</h1>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
          </p>
        </div>
        
        {displayError && (
          <div className="alert alert-error mb-4">
            <span>{displayError}</span>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              id="email" 
              className="input input-bordered w-full mt-1" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              id="password" 
              className="input input-bordered w-full mt-1" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="checkbox checkbox-primary" />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">Remember me</label>
            </div>
            <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}