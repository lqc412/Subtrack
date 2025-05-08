import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function EmailCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // 从URL中提取授权码
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (!code) {
      navigate('/email-integration');
      return;
    }
    
    const processAuthCode = async () => {
      try {
        // 向父窗口发送消息
        if (window.opener) {
          window.opener.postMessage({ code, provider: 'gmail', state }, window.location.origin);
          window.close();
        } else {
          // 如果没有父窗口，直接处理授权码
          await api.post('/email/callback', { code, provider: 'gmail' });
          navigate('/email-integration');
        }
      } catch (error) {
        console.error('Error processing auth code:', error);
        navigate('/email-integration');
      }
    };
    
    processAuthCode();
  }, [navigate, location]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Authorization</h1>
        <p className="mb-4">Please wait while we complete the email connection...</p>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    </div>
  );
}