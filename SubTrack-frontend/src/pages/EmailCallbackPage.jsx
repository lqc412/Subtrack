// src/pages/EmailCallbackPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

export default function EmailCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing authorization...');
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract authorization code from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        // Handle OAuth errors
        if (error) {
          const errorMsg = errorDescription || error;
          setStatus('error');
          setMessage(`Authorization failed: ${errorMsg}`);
          
          // Send error to parent window if it exists
          if (window.opener) {
            window.opener.postMessage({ 
              error: errorMsg, 
              provider: 'gmail' 
            }, window.location.origin);
            
            setTimeout(() => window.close(), 3000);
          } else {
            setTimeout(() => navigate('/email-integration'), 3000);
          }
          return;
        }
        
        // Check if we have authorization code
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received. Please try connecting again.');
          
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({ 
                error: 'No authorization code received' 
              }, window.location.origin);
              window.close();
            } else {
              navigate('/email-integration');
            }
          }, 3000);
          return;
        }
        
        setMessage('Completing email connection...');
        
        // Send authorization code to parent window if popup
        if (window.opener) {
          window.opener.postMessage({ 
            code, 
            provider: 'gmail', 
            state 
          }, window.location.origin);
          
          setStatus('success');
          setMessage('Email connection successful! This window will close automatically.');
          
          // Close popup after short delay
          setTimeout(() => window.close(), 2000);
        } else {
          // If not in popup, handle directly
          const response = await api.post('/email/callback', { 
            code, 
            provider: 'gmail' 
          });
          
          setStatus('success');
          setMessage('Email connection successful! Redirecting...');
          
          // Redirect to email integration page
          setTimeout(() => navigate('/email-integration'), 2000);
        }
        
      } catch (error) {
        console.error('Error processing auth callback:', error);
        
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Failed to complete email connection';
        
        setStatus('error');
        setMessage(errorMessage);
        
        // Handle error for popup or direct navigation
        if (window.opener) {
          window.opener.postMessage({ 
            error: errorMessage,
            provider: 'gmail' 
          }, window.location.origin);
          
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => navigate('/email-integration'), 3000);
        }
      }
    };
    
    processCallback();
  }, [navigate, location]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="flex justify-center mb-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex justify-center mb-4">
              <XCircle className="text-red-500" size={48} />
            </div>
          )}
          
          <div className="flex justify-center mb-4">
            <Mail className="text-primary" size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          {status === 'processing' && 'Processing Authorization'}
          {status === 'success' && 'Connection Successful!'}
          {status === 'error' && 'Connection Failed'}
        </h1>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        {status === 'processing' && (
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Verifying authorization code</p>
            <p>• Establishing secure connection</p>
            <p>• Preparing email integration</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm">
              Your email account has been successfully connected. 
              You can now scan for subscriptions and manage your email integrations.
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">
                Unable to complete the email connection. Please try again or contact support if the problem persists.
              </p>
            </div>
            
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  navigate('/email-integration');
                }
              }}
            >
              Return to Email Integration
            </button>
          </div>
        )}
        
        {(status === 'success' || status === 'error') && (
          <div className="mt-4 text-xs text-gray-400">
            {window.opener ? 'This window will close automatically...' : 'Redirecting...'}
          </div>
        )}
      </div>
    </div>
  );
}