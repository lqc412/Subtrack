import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ImportProgress({ importId, onComplete }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    let intervalId;
    
    const fetchStatus = async () => {
      try {
        const response = await api.get(`/email/imports/${importId}`);
        setStatus(response.data);
        
        // 如果导入完成或失败，停止轮询
        if (['completed', 'failed'].includes(response.data.status)) {
          clearInterval(intervalId);
          setLoading(false);
          
          if (response.data.status === 'completed' && onComplete) {
            onComplete(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching import status:', error);
        setError(error.response?.data?.message || 'Failed to fetch import status');
        clearInterval(intervalId);
        setLoading(false);
      }
    };
    
    // 立即获取一次
    fetchStatus();
    
    // 每3秒轮询一次
    intervalId = setInterval(fetchStatus, 3000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [importId, onComplete]);
  
  // 计算进度百分比
  const calculateProgress = () => {
    if (!status) return 0;
    
    // 如果总数为0，则进度为0
    if (status.emails_processed === 0) return 0;
    
    // 这里假设我们有一个预计的总邮件数，实际中可能需要调整
    const estimatedTotal = 100; // 假设值
    const progress = Math.min(100, Math.round((status.emails_processed / estimatedTotal) * 100));
    
    return progress;
  };
  
  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Analyzing Your Emails</h2>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span>Scanning for subscriptions...</span>
          <span>{status?.status || 'Starting...'}</span>
        </div>
        <progress 
          className="progress progress-primary w-full" 
          value={calculateProgress()} 
          max="100"
        ></progress>
      </div>
      
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Emails Analyzed</div>
          <div className="stat-value">{status?.emails_processed || 0}</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Subscriptions Found</div>
          <div className="stat-value">{status?.subscriptions_found || 0}</div>
        </div>
      </div>
      
      {status?.status === 'completed' ? (
        <div className="alert alert-success mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Analysis complete! We found {status.subscriptions_found} subscriptions.</span>
        </div>
      ) : status?.status === 'failed' ? (
        <div className="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error: {status.error_message || 'Import failed'}</span>
        </div>
      ) : (
        <div className="text-sm text-gray-500 mt-4">
          <p>This process might take a few minutes. We're scanning your email for subscription receipts and invoices.</p>
          <p className="mt-2">You can leave this page and come back later - the analysis will continue in the background.</p>
        </div>
      )}
    </div>
  );
}