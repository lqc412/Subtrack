import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import EmailConnect from '../components/email/EmailConnect';
import ImportProgress from '../components/email/ImportProgress';
import SubscriptionMatcher from '../components/email/SubscriptionMatcher';

export default function EmailIntegrationPage() {
  const [activeStep, setActiveStep] = useState('connect'); // 'connect', 'import', 'review'
  const [importId, setImportId] = useState(null);
  const [newSubscriptions, setNewSubscriptions] = useState([]);
  
  // 获取用户的邮箱连接
  const { data: connections, isLoading, error, refetch } = useQuery({
    queryKey: ['email-connections'],
    queryFn: () => api.get('/email/connections').then(res => res.data)
  });
  
  // 处理连接完成后的操作
  useEffect(() => {
    if (connections && connections.length > 0 && activeStep === 'connect') {
      // 已有连接，可以进入导入步骤
      setActiveStep('ready');
    }
  }, [connections, activeStep]);
  
  // 开始导入
  const startImport = async (connectionId) => {
    try {
      const response = await api.post(`/email/imports/${connectionId}`);
      setImportId(response.data.importId);
      setActiveStep('import');
    } catch (error) {
      console.error('Error starting import:', error);
    }
  };
  
  // 导入完成处理
  const handleImportComplete = async (result) => {
    // 获取新添加的订阅
    try {
      // 假设后端提供了一个接口来获取最近导入的订阅
      const response = await api.get('/subs/recent', {
        params: { importId: result.id }
      });
      setNewSubscriptions(response.data);
      setActiveStep('review');
    } catch (error) {
      console.error('Error fetching new subscriptions:', error);
    }
  };
  
  // 根据当前步骤渲染不同的组件
  const renderStep = () => {
    switch (activeStep) {
      case 'connect':
        return <EmailConnect onConnect={() => refetch()} />;
        
      case 'ready':
        return (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Connected Email Accounts</h2>
            
            {connections && connections.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Provider</th>
                        <th>Last Synced</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connections.map((connection) => (
                        <tr key={connection.id}>
                          <td>{connection.email_address}</td>
                          <td className="capitalize">{connection.provider}</td>
                          <td>
                            {connection.last_sync_at 
                              ? new Date(connection.last_sync_at).toLocaleString() 
                              : 'Never'}
                          </td>
                          <td>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => startImport(connection.id)}
                            >
                              Scan for Subscriptions
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4">
                  <button 
                    className="btn btn-outline"
                    onClick={() => setActiveStep('connect')}
                  >
                    Connect Another Email
                  </button>
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                <span>No email accounts connected yet. Please connect an email account to continue.</span>
              </div>
            )}
          </div>
        );
        
      case 'import':
        return <ImportProgress importId={importId} onComplete={handleImportComplete} />;
        
      case 'review':
        return (
          <SubscriptionMatcher 
            newSubscriptions={newSubscriptions} 
            onComplete={() => {
              // 导入完成后，重置状态并返回到准备状态
              setActiveStep('ready');
              setNewSubscriptions([]);
              setImportId(null);
            }}
          />
        );
        
      default:
        return <EmailConnect onConnect={() => refetch()} />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error) {
    return <div className="alert alert-error">Error loading email connections</div>;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Email Integration</h1>
      
      <div className="bg-base-100 shadow rounded-lg">
        <ul className="steps w-full p-4">
          <li className={`step ${activeStep !== 'connect' ? 'step-primary' : ''}`}>Connect Email</li>
          <li className={`step ${['import', 'review'].includes(activeStep) ? 'step-primary' : ''}`}>Scan Emails</li>
          <li className={`step ${activeStep === 'review' ? 'step-primary' : ''}`}>Review Subscriptions</li>
        </ul>
        
        <div className="p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}