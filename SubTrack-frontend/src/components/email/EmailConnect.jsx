// src/components/email/EmailConnect.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Mail, Shield, Eye, Clock, Trash2 } from 'lucide-react';

export default function EmailConnect({ onConnect }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle Gmail connection
  const connectGmail = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get authorization URL from backend
      const response = await api.get('/email/auth-url?provider=gmail');
      
      // Open popup window for OAuth authorization
      const authWindow = window.open(
        response.data.authUrl, 
        'EmailAuth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Set up message listener for OAuth callback
      const handleMessage = async (event) => {
        // Ensure message is from trusted origin
        if (event.origin !== window.location.origin) return;
        
        const { code, provider, error: authError } = event.data;
        
        // Clean up event listener
        window.removeEventListener('message', handleMessage);
        
        if (authError) {
          setError(`Authorization failed: ${authError}`);
          setLoading(false);
          return;
        }
        
        if (!code || !provider) {
          setError('Authorization was cancelled or failed');
          setLoading(false);
          return;
        }
        
        try {
          // Send authorization code to backend
          await api.post('/email/callback', { code, provider });
          
          // Notify parent component of successful connection
          if (onConnect) onConnect();
          
          setError('');
        } catch (error) {
          console.error('Error handling auth callback:', error);
          setError(error.response?.data?.message || 'Failed to complete authorization');
        } finally {
          setLoading(false);
        }
      };
      
      // Add message listener
      window.addEventListener('message', handleMessage);
      
      // Poll window status to detect if user closed it manually
      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setError(error.response?.data?.message || 'Failed to initialize Gmail connection');
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="text-primary" size={24} />
        <h2 className="text-xl font-semibold">Connect Email Account</h2>
      </div>
      
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button 
            className="btn btn-sm btn-ghost"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Connect your email account to automatically discover subscription services. 
          We'll scan your inbox for receipt emails and extract subscription details to help you track your spending.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Connect your email account securely through OAuth</li>
            <li>We scan the last 3 months of emails for subscription patterns</li>
            <li>Extract subscription details from receipts and billing emails</li>
            <li>Present findings for you to review and import</li>
          </ol>
        </div>
      </div>
      
      {/* Gmail Connection Button */}
      <div className="space-y-3 mb-6">
        <button 
          onClick={connectGmail}
          disabled={loading}
          className="btn btn-primary w-full flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.056 11.276c0-.81-.072-1.592-.22-2.34H12v4.51h5.654c-.246 1.29-1.002 2.378-2.137 3.094v2.572h3.448c2.018-1.836 3.177-4.544 3.177-7.836z" />
                <path d="M12 23c2.889 0 5.32-.95 7.092-2.577l-3.448-2.677c-.957.64-2.185 1.017-3.644 1.017-2.806 0-5.18-1.892-6.032-4.43H2.37v2.763C4.142 20.46 7.83 23 12 23z" />
                <path d="M5.968 14.333c-.216-.647-.337-1.338-.337-2.053 0-.715.121-1.406.337-2.053V7.465H2.37C1.492 9.135 1 10.988 1 13c0 2.012.492 3.865 1.37 5.535l3.598-2.767z" />
                <path d="M12 5.237c1.58 0 3.005.544 4.125 1.612l3.058-3.024C17.29 2.095 14.858 1 12 1 7.83 1 4.142 3.54 2.37 6.904l3.598 2.767c.852-2.538 3.226-4.434 6.032-4.434z" />
              </svg>
              Connect Gmail Account
            </>
          )}
        </button>
        
        {/* Future email providers */}
        <button 
          className="btn btn-outline w-full flex items-center justify-center gap-3"
          disabled={true}
          title="Coming soon"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.4 10.512v9.6A1.888 1.888 0 0 0 4.32 22h15.36a1.888 1.888 0 0 0 1.92-1.888v-9.6l-8.4 4.8a1.92 1.92 0 0 1-1.92 0l-8.88-4.8z" />
            <path d="M21.6 7.488l-8.4 4.8a1.92 1.92 0 0 1-1.92 0l-8.88-4.8V5.888A1.888 1.888 0 0 1 4.32 4h15.36a1.888 1.888 0 0 1 1.92 1.888v1.6z" />
          </svg>
          Connect Outlook (Coming Soon)
        </button>
        
        <button 
          className="btn btn-outline w-full flex items-center justify-center gap-3"
          disabled={true}
          title="Coming soon"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Connect Yahoo Mail (Coming Soon)
        </button>
      </div>
      
      {/* Privacy and Security Information */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="text-green-600" size={18} />
          <h3 className="font-medium text-gray-900">Your Privacy & Security</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <Eye className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="font-medium">Read-Only Access</p>
              <p>We only request permission to read your emails, never send or modify them.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Mail className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="font-medium">Targeted Scanning</p>
              <p>We only scan for subscription-related emails and billing receipts.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="text-purple-500 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="font-medium">Limited Time Range</p>
              <p>We only scan the last 3 months of emails to find recent subscriptions.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Trash2 className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="font-medium">No Email Storage</p>
              <p>We don't store the content of your emails, only extracted subscription data.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You can disconnect your email account at any time from the settings page. 
            This will revoke our access to your email but won't affect subscriptions you've already imported.
          </p>
        </div>
      </div>
    </div>
  );
}