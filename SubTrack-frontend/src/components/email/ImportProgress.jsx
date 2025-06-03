import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function ImportProgress({ importId, onComplete }) {
  const [error, setError] = useState('');
  
  // Use React Query to poll the import status
  const { data: status, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['import-status', importId],
    queryFn: () => api.get(`/email/imports/${importId}`).then(res => res.data),
    refetchInterval: status => 
      (status?.status === 'completed' || status?.status === 'failed') ? false : 3000,
    enabled: !!importId,
  });
  
  // Call onComplete when import finishes
  useEffect(() => {
    if (status && ['completed', 'failed'].includes(status.status)) {
      if (status.status === 'completed' && onComplete) {
        onComplete(status);
      }
    }
  }, [status, onComplete]);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!status || status.emails_processed === 0) return 0;
    
    // If we have more than 20 emails processed, show progress based on that
    if (status.emails_processed > 20) {
      // Assume we're halfway through at 50 emails
      const estimatedTotal = 100;
      return Math.min(100, Math.round((status.emails_processed / estimatedTotal) * 100));
    }
    
    // Otherwise, use indeterminate progress for the first 20 emails
    return Math.min(100, status.emails_processed * 5); // 5% per email
  };
  
  // Format relative time for how long the import has been running
  const getImportDuration = () => {
    if (!status || !status.started_at) return 'Just started';
    
    const startTime = new Date(status.started_at);
    const endTime = status.completed_at ? new Date(status.completed_at) : new Date();
    
    // Calculate duration in seconds
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    
    if (durationSeconds < 60) {
      return `${durationSeconds} seconds`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Starting Analysis...</h2>
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }
  
  if (isError || error) {
    return (
      <div className="alert alert-error">
        <span>{error || queryError?.message || 'Error fetching import status'}</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Analyzing Your Emails</h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="font-medium">Status: {status?.status === 'in_progress' ? 'In Progress' : status?.status}</span>
          <span className="text-gray-500">Running for: {getImportDuration()}</span>
        </div>
        <progress 
          className="progress progress-primary w-full" 
          value={calculateProgress()} 
          max="100"
        ></progress>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Emails Analyzed</div>
            <div className="stat-value">{status?.emails_processed || 0}</div>
            <div className="stat-desc">
              {status?.status === 'in_progress' ? 'Scanning through your inbox...' : ''}
            </div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Subscriptions Found</div>
            <div className="stat-value">{status?.subscriptions_found || 0}</div>
            <div className="stat-desc">
              {status?.status === 'completed' ? 'Ready for review' : 'Detecting subscription patterns...'}
            </div>
          </div>
        </div>
      </div>
      
      {status?.status === 'completed' ? (
        <div className="alert alert-success mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Analysis Complete!</h3>
            <div className="text-sm">
              We found {status.subscriptions_found} subscription{status.subscriptions_found !== 1 ? 's' : ''}.
              {status.subscriptions_found > 0 ? ' Continue to review them.' : ' Try connecting a different email or adding subscriptions manually.'}
            </div>
          </div>
          {status.subscriptions_found > 0 && (
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => onComplete && onComplete(status)}
            >
              Review Subscriptions
            </button>
          )}
        </div>
      ) : status?.status === 'failed' ? (
        <div className="alert alert-error mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error During Analysis</h3>
            <div className="text-sm">{status.error_message || 'An unknown error occurred during the import process.'}</div>
          </div>
          <button 
            className="btn btn-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-base-200 p-4 rounded-lg">
          <h3 className="font-medium mb-2">What's happening?</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>We're scanning your inbox for emails related to subscriptions</li>
            <li>Looking for services like Netflix, Spotify, Amazon Prime, etc.</li>
            <li>Analyzing receipt emails to extract pricing and billing information</li>
            <li>This process can take a few minutes depending on your email volume</li>
            <li>You can leave this page and come back - the process will continue</li>
          </ul>
        </div>
      )}
    </div>
  );
}