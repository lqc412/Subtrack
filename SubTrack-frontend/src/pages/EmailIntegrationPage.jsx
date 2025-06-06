// src/pages/EmailIntegrationPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import EmailConnect from '../components/email/EmailConnect';
import ImportProgress from '../components/email/ImportProgress';
import SubscriptionMatcher from '../components/email/SubscriptionMatcher';
import { 
  Mail, 
  Scan, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  RefreshCw,
  Calendar,
  Clock,
  Unlink
} from 'lucide-react';

export default function EmailIntegrationPage() {
  const [activeStep, setActiveStep] = useState('connect'); // 'connect', 'ready', 'import', 'review'
  const [importId, setImportId] = useState(null);
  const [newSubscriptions, setNewSubscriptions] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Fetch user's email connections
  const { 
    data: connections, 
    isLoading, 
    error, 
    refetch: refetchConnections 
  } = useQuery({
    queryKey: ['email-connections'],
    queryFn: () => api.get('/email/connections').then(res => res.data),
    refetchOnWindowFocus: false
  });
  
  // Mutation to remove email connection
  const removeConnectionMutation = useMutation({
    mutationFn: (connectionId) => api.delete(`/email/connections/${connectionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-connections'] });
      // Reset to connect step if no connections left
      refetchConnections().then((result) => {
        if (!result.data || result.data.length === 0) {
          setActiveStep('connect');
        }
      });
    }
  });
  
  // Determine active step based on connections
  useEffect(() => {
    if (connections && connections.length > 0 && activeStep === 'connect') {
      setActiveStep('ready');
    } else if ((!connections || connections.length === 0) && activeStep === 'ready') {
      setActiveStep('connect');
    }
  }, [connections, activeStep]);
  
  // Handle successful email connection
  const handleEmailConnected = () => {
    refetchConnections();
    setActiveStep('ready');
  };
  
  // Start email import process
  const startImport = async (connectionId) => {
    try {
      setSelectedConnection(connectionId);
      const response = await api.post(`/email/imports/${connectionId}`);
      setImportId(response.data.importId);
      setActiveStep('import');
    } catch (error) {
      console.error('Error starting import:', error);
      alert(error.response?.data?.message || 'Failed to start email import');
    }
  };
  
  // Handle import completion
  const handleImportComplete = async (result) => {
    try {
      // Fetch detected subscriptions
      const response = await api.get('/email/recent-subscriptions', {
        params: { importId: result.id }
      });
      
      setNewSubscriptions(response.data);
      setActiveStep('review');
    } catch (error) {
      console.error('Error fetching detected subscriptions:', error);
      
      // If no subscriptions found, show message and reset
      if (error.response?.status === 404 || (result && result.subscriptions_found === 0)) {
        alert('No subscriptions were detected in your emails. You can try again or add subscriptions manually.');
        setActiveStep('ready');
      } else {
        alert('Error loading detected subscriptions. Please try again.');
        setActiveStep('ready');
      }
    }
  };
  
  // Handle subscription import completion
  const handleSubscriptionImportComplete = () => {
    setActiveStep('ready');
    setNewSubscriptions([]);
    setImportId(null);
    setSelectedConnection(null);
    
    // Invalidate subscriptions query to refresh main subscription list
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Remove email connection
  const handleRemoveConnection = async (connectionId, emailAddress) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the connection to ${emailAddress}? This will not affect already imported subscriptions.`
    );
    
    if (confirmed) {
      try {
        await removeConnectionMutation.mutateAsync(connectionId);
      } catch (error) {
        console.error('Error removing connection:', error);
        alert(error.response?.data?.message || 'Failed to remove email connection');
      }
    }
  };
  
  // Render connect step
  const renderConnectStep = () => (
    <EmailConnect onConnect={handleEmailConnected} />
  );
  
  // Render ready step with connection management
  const renderReadyStep = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="text-green-500" size={24} />
        <h2 className="text-xl font-semibold">Connected Email Accounts</h2>
      </div>
      
      {connections && connections.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              Your email accounts are connected and ready to scan for subscriptions. 
              Click "Scan for Subscriptions" to analyze your recent emails.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Email Account</th>
                  <th>Provider</th>
                  <th>Connected</th>
                  <th>Last Scanned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => (
                  <tr key={connection.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="font-medium">{connection.email_address}</span>
                      </div>
                    </td>
                    <td>
                      <div className="capitalize flex items-center gap-2">
                        {connection.provider === 'gmail' && (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.056 11.276c0-.81-.072-1.592-.22-2.34H12v4.51h5.654c-.246 1.29-1.002 2.378-2.137 3.094v2.572h3.448c2.018-1.836 3.177-4.544 3.177-7.836z" />
                            <path d="M12 23c2.889 0 5.32-.95 7.092-2.577l-3.448-2.677c-.957.64-2.185 1.017-3.644 1.017-2.806 0-5.18-1.892-6.032-4.43H2.37v2.763C4.142 20.46 7.83 23 12 23z" />
                            <path d="M5.968 14.333c-.216-.647-.337-1.338-.337-2.053 0-.715.121-1.406.337-2.053V7.465H2.37C1.492 9.135 1 10.988 1 13c0 2.012.492 3.865 1.37 5.535l3.598-2.767z" />
                            <path d="M12 5.237c1.58 0 3.005.544 4.125 1.612l3.058-3.024C17.29 2.095 14.858 1 12 1 7.83 1 4.142 3.54 2.37 6.904l3.598 2.767c.852-2.538 3.226-4.434 6.032-4.434z" />
                          </svg>
                        )}
                        {connection.provider}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm">{formatDate(connection.created_at)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm">{formatDate(connection.last_sync_at)}</span>
                      </div>
                    </td>
                    <td>
                      {connection.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-error">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => startImport(connection.id)}
                          disabled={!connection.is_active}
                        >
                          <Scan size={16} />
                          Scan for Subscriptions
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleRemoveConnection(connection.id, connection.email_address)}
                          disabled={removeConnectionMutation.isPending}
                        >
                          {removeConnectionMutation.isPending ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <Unlink size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <button 
              className="btn btn-outline"
              onClick={() => setActiveStep('connect')}
            >
              Connect Another Email
            </button>
            
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => refetchConnections()}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500 mb-4">No email accounts connected yet.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveStep('connect')}
          >
            Connect Email Account
          </button>
        </div>
      )}
    </div>
  );
  
  // Render import progress step
  const renderImportStep = () => (
    <ImportProgress 
      importId={importId} 
      onComplete={handleImportComplete}
    />
  );
  
  // Render subscription review step
  const renderReviewStep = () => (
    <SubscriptionMatcher 
      newSubscriptions={newSubscriptions}
      onComplete={handleSubscriptionImportComplete}
    />
  );
  
  // Main render logic
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Email Integration</h1>
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>
            <p>Error loading email connections</p>
            <p className="text-sm">{error.message}</p>
          </div>
          <button className="btn btn-sm" onClick={() => refetchConnections()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Email Integration</h1>
        {activeStep !== 'connect' && (
          <div className="text-sm text-gray-500">
            {connections?.length || 0} email account{connections?.length !== 1 ? 's' : ''} connected
          </div>
        )}
      </div>
      
      {/* Progress Steps */}
      <div className="bg-base-100 shadow rounded-lg">
        <div className="p-4">
          <ul className="steps w-full">
            <li className={`step ${activeStep !== 'connect' ? 'step-primary' : ''}`}>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Connect Email
              </div>
            </li>
            <li className={`step ${['import', 'review'].includes(activeStep) ? 'step-primary' : ''}`}>
              <div className="flex items-center gap-2">
                <Scan size={16} />
                Scan Emails
              </div>
            </li>
            <li className={`step ${activeStep === 'review' ? 'step-primary' : ''}`}>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                Review Subscriptions
              </div>
            </li>
          </ul>
        </div>
        
        <div className="p-6 border-t">
          {activeStep === 'connect' && renderConnectStep()}
          {activeStep === 'ready' && renderReadyStep()}
          {activeStep === 'import' && renderImportStep()}
          {activeStep === 'review' && renderReviewStep()}
        </div>
      </div>
      
      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>No subscriptions found?</strong> Try connecting a different email account or add subscriptions manually.</p>
          <p>• <strong>Connection issues?</strong> Make sure you're allowing popups and completing the authorization process.</p>
          <p>• <strong>Missing subscriptions?</strong> We scan the last 3 months of emails - older subscriptions won't be detected.</p>
          <p>• <strong>Privacy concerns?</strong> We only read subscription-related emails and don't store email content.</p>
        </div>
      </div>
    </div>
  );
}