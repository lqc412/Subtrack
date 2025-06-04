// src/components/email/ImportProgress.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  Scan, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Search,
  FileText,
  Zap
} from 'lucide-react';

export default function ImportProgress({ importId, onComplete }) {
  const [error, setError] = useState('');
  const [estimatedTotal, setEstimatedTotal] = useState(100);
  
  // Use React Query to poll the import status
  const { 
    data: status, 
    isLoading, 
    isError, 
    error: queryError 
  } = useQuery({
    queryKey: ['import-status', importId],
    queryFn: () => api.get(`/email/imports/${importId}`).then(res => res.data),
    refetchInterval: (data) => {
      // Stop polling when import is complete or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      // Poll more frequently at the beginning, then slow down
      const processed = data?.emails_processed || 0;
      if (processed < 10) return 2000; // Every 2 seconds for first 10 emails
      if (processed < 50) return 3000; // Every 3 seconds for next 40 emails
      return 5000; // Every 5 seconds after that
    },
    enabled: !!importId,
    retry: 3
  });
  
  // Update estimated total based on processing rate
  useEffect(() => {
    if (status && status.emails_processed > 20) {
      // After processing 20 emails, estimate total based on rate
      const processingTime = new Date() - new Date(status.started_at);
      const processingRate = status.emails_processed / (processingTime / 1000 / 60); // emails per minute
      
      // Estimate total emails (conservative estimate)
      const estimated = Math.max(status.emails_processed * 1.5, 50);
      setEstimatedTotal(Math.min(estimated, 500)); // Cap at 500
    }
  }, [status]);
  
  // Call onComplete when import finishes successfully
  useEffect(() => {
    if (status && status.status === 'completed') {
      // Small delay to show completion state
      const timer = setTimeout(() => {
        if (onComplete) onComplete(status);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!status) return 0;
    
    if (status.status === 'completed') return 100;
    if (status.status === 'failed') return 0;
    
    const processed = status.emails_processed || 0;
    
    if (processed === 0) return 5; // Show some progress when starting
    
    // Use estimated total for progress calculation
    const progressPercent = Math.min(95, (processed / estimatedTotal) * 100);
    return Math.max(5, progressPercent); // Minimum 5% to show activity
  };
  
  // Format duration from start time
  const getImportDuration = () => {
    if (!status || !status.started_at) return 'Starting...';
    
    const startTime = new Date(status.started_at);
    const endTime = status.completed_at ? new Date(status.completed_at) : new Date();
    
    const durationMs = endTime - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    
    if (durationSeconds < 60) {
      return `${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  // Get status icon and color
  const getStatusDisplay = () => {
    if (!status) return { icon: Clock, color: 'text-gray-400', text: 'Initializing...' };
    
    switch (status.status) {
      case 'in_progress':
        return { icon: Scan, color: 'text-blue-500', text: 'Scanning emails...' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', text: 'Scan completed!' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', text: 'Scan failed' };
      default:
        return { icon: Clock, color: 'text-gray-400', text: 'Processing...' };
    }
  };
  
  // Render loading state
  if (isLoading && !status) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="loading loading-spinner loading-md text-primary"></span>
          <h2 className="text-xl font-semibold">Starting Email Analysis...</h2>
        </div>
        <p className="text-gray-600">Connecting to your email and preparing to scan for subscriptions...</p>
      </div>
    );
  }
  
  // Render error state
  if (isError || error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold">Error Loading Import Status</h2>
        </div>
        <div className="alert alert-error">
          <span>{error || queryError?.message || 'Failed to load import status'}</span>
          <button 
            className="btn btn-sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const progress = calculateProgress();
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <StatusIcon className={statusDisplay.color} size={24} />
        <h2 className="text-xl font-semibold">Analyzing Your Emails</h2>
      </div>
      
      {/* Progress section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">{statusDisplay.text}</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>{getImportDuration()}</span>
          </div>
        </div>
        
        <div className="w-full bg-base-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              status?.status === 'completed' ? 'bg-green-500' :
              status?.status === 'failed' ? 'bg-red-500' :
              'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>{progress.toFixed(0)}% complete</span>
          {status?.status === 'in_progress' && (
            <span>Processing emails...</span>
          )}
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="text-blue-500" size={18} />
            <div className="stat-title text-sm">Emails Analyzed</div>
          </div>
          <div className="stat-value text-2xl">{status?.emails_processed || 0}</div>
          <div className="stat-desc text-xs">
            {status?.status === 'in_progress' ? 'Scanning your inbox...' : 
             status?.status === 'completed' ? 'Analysis complete' :
             'Processing emails'}
          </div>
        </div>
        
        <div className="stat bg-base-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="text-green-500" size={18} />
            <div className="stat-title text-sm">Subscriptions Found</div>
          </div>
          <div className="stat-value text-2xl">{status?.subscriptions_found || 0}</div>
          <div className="stat-desc text-xs">
            {status?.status === 'completed' ? 'Ready for review' : 
             'Detecting patterns...'}
          </div>
        </div>
        
        <div className="stat bg-base-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-purple-500" size={18} />
            <div className="stat-title text-sm">Processing Rate</div>
          </div>
          <div className="stat-value text-2xl">
            {status && status.started_at ? 
              Math.round((status.emails_processed || 0) / ((new Date() - new Date(status.started_at)) / 1000 / 60) || 0) :
              0
            }
          </div>
          <div className="stat-desc text-xs">emails per minute</div>
        </div>
      </div>
      
      {/* Status-specific content */}
      {status?.status === 'completed' && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          <div>
            <h3 className="font-bold">Email Analysis Complete!</h3>
            <div className="text-sm">
              {status.subscriptions_found > 0 ? (
                <>
                  We found <strong>{status.subscriptions_found}</strong> potential subscription{status.subscriptions_found !== 1 ? 's' : ''} in your emails.
                  Click continue to review and import them.
                </>
              ) : (
                <>
                  We analyzed {status.emails_processed} emails but didn't find any recognizable subscription patterns.
                  You can try connecting a different email account or add subscriptions manually.
                </>
              )}
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
      )}
      
      {status?.status === 'failed' && (
        <div className="alert alert-error">
          <XCircle size={20} />
          <div>
            <h3 className="font-bold">Email Analysis Failed</h3>
            <div className="text-sm">
              {status.error_message || 'An error occurred while analyzing your emails. This might be due to connection issues or email access problems.'}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
            <button 
              className="btn btn-sm"
              onClick={() => onComplete && onComplete({ status: 'failed', subscriptions_found: 0 })}
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}
      
      {status?.status === 'in_progress' && (
        <div className="bg-base-100 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FileText size={16} />
            What's happening?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium">Scanning your inbox</p>
                <p>We're looking through the last 3 months of emails for subscription-related messages.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                (status?.emails_processed || 0) > 10 ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-medium">Identifying subscription services</p>
                <p>Looking for emails from Netflix, Spotify, Amazon Prime, and other popular services.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                (status?.emails_processed || 0) > 50 ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-medium">Extracting billing information</p>
                <p>Analyzing receipt emails to find pricing, billing cycles, and payment dates.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                status?.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <p className="font-medium">Preparing results</p>
                <p>Organizing detected subscriptions for your review and approval.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Taking longer than expected?</strong> This can happen with large inboxes. 
              You can safely leave this page - the analysis will continue in the background.
            </p>
          </div>
        </div>
      )}
      
      {/* Help section for long-running imports */}
      {status?.status === 'in_progress' && (status?.emails_processed || 0) > 100 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Large inbox detected:</strong> We're processing a lot of emails. 
            The analysis may take a few more minutes to complete thoroughly.
          </p>
        </div>
      )}
    </div>
  );
}