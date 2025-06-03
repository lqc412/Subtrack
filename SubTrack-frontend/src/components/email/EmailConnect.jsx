import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function EmailConnect() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 处理Gmail连接
  const connectGmail = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 获取授权URL
      const response = await api.get('/email/auth-url?provider=gmail');
      
      // 打开新窗口进行授权
      const authWindow = window.open(
        response.data.authUrl, 
        'EmailAuth',
        'width=600,height=700'
      );
      
      // 轮询窗口状态
      const checkInterval = setInterval(() => {
        try {
          // 如果窗口关闭，停止轮询
          if (authWindow.closed) {
            clearInterval(checkInterval);
            setLoading(false);
          }
        } catch (e) {
          // 窗口可能已关闭
          clearInterval(checkInterval);
          setLoading(false);
        }
      }, 1000);
      
      // 设置消息监听器，接收OAuth回调数据
      window.addEventListener('message', handleAuthCallback, { once: true });
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setError(error.response?.data?.message || 'Failed to connect Gmail');
      setLoading(false);
    }
  };
  
  // 处理授权回调
  const handleAuthCallback = async (event) => {
    // 确保消息来自我们信任的来源
    if (event.origin !== window.location.origin) return;
    
    const { code, provider } = event.data;
    
    if (!code || !provider) {
      setError('Authorization failed');
      setLoading(false);
      return;
    }
    
    try {
      // 将授权代码发送到后端
      await api.post('/email/callback', { code, provider });
      
      // 重新加载连接列表
      window.location.reload();
    } catch (error) {
      console.error('Error handling auth callback:', error);
      setError(error.response?.data?.message || 'Failed to complete authorization');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Connect Email Account</h2>
      
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}
      
      <p className="mb-4">
        Connect your email account to automatically find subscription services.
        We'll scan your inbox for receipt emails and extract subscription details.
      </p>
      
      <div className="flex flex-col space-y-3">
        <button 
          onClick={connectGmail}
          disabled={loading}
          className="btn btn-primary flex items-center justify-center"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.056 11.276c0-.81-.072-1.592-.22-2.34H12v4.51h5.654c-.246 1.29-1.002 2.378-2.137 3.094v2.572h3.448c2.018-1.836 3.177-4.544 3.177-7.836z" />
                <path d="M12 23c2.889 0 5.32-.95 7.092-2.577l-3.448-2.677c-.957.64-2.185 1.017-3.644 1.017-2.806 0-5.18-1.892-6.032-4.43H2.37v2.763C4.142 20.46 7.83 23 12 23z" />
                <path d="M5.968 14.333c-.216-.647-.337-1.338-.337-2.053 0-.715.121-1.406.337-2.053V7.465H2.37C1.492 9.135 1 10.988 1 13c0 2.012.492 3.865 1.37 5.535l3.598-2.767z" />
                <path d="M12 5.237c1.58 0 3.005.544 4.125 1.612l3.058-3.024C17.29 2.095 14.858 1 12 1 7.83 1 4.142 3.54 2.37 6.904l3.598 2.767c.852-2.538 3.226-4.434 6.032-4.434z" />
              </svg>
              Connect Gmail
            </>
          )}
        </button>
        
        {/* 未来可以添加其他邮件提供商，如Outlook、Yahoo等 */}
        <button 
          className="btn btn-outline flex items-center justify-center"
          disabled={true}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.4 10.512v9.6A1.888 1.888 0 0 0 4.32 22h15.36a1.888 1.888 0 0 0 1.92-1.888v-9.6l-8.4 4.8a1.92 1.92 0 0 1-1.92 0l-8.88-4.8z" />
            <path d="M21.6 7.488l-8.4 4.8a1.92 1.92 0 0 1-1.92 0l-8.88-4.8V5.888A1.888 1.888 0 0 1 4.32 4h15.36a1.888 1.888 0 0 1 1.92 1.888v1.6z" />
          </svg>
          Connect Outlook (Coming Soon)
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p className="font-medium">Your privacy is important to us:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>We only scan for subscription-related emails</li>
          <li>We don't store the content of your emails</li>
          <li>You can disconnect your account at any time</li>
          <li>We use read-only access to your inbox</li>
        </ul>
      </div>
    </div>
  );
}