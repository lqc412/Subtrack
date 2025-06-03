import api from './api';

const emailService = {
  // 获取用户的邮箱连接
  getUserConnections: () => {
    return api.get('/email/connections');
  },
  
  // 获取授权URL
  getAuthUrl: (provider) => {
    return api.get(`/email/auth-url?provider=${provider}`);
  },
  
  // 处理OAuth回调
  handleCallback: (code, provider) => {
    return api.post('/email/callback', { code, provider });
  },
  
  // 开始导入邮件
  startImport: (connectionId) => {
    return api.post(`/email/imports/${connectionId}`);
  },
  
  // 获取导入状态
  getImportStatus: (importId) => {
    return api.get(`/email/imports/${importId}`);
  },
  
  // 获取最近导入的订阅
  getRecentSubscriptions: (importId) => {
    return api.get('/subs/recent', { params: { importId } });
  }
};

export default emailService;