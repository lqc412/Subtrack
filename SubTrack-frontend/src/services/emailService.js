import api from './api';

const emailService = {
  // Retrieve the user's email connections
  getUserConnections: () => {
    return api.get('/email/connections');
  },
  
  // Get the authorization URL
  getAuthUrl: (provider) => {
    return api.get(`/email/auth-url?provider=${provider}`);
  },
  
  // Handle the OAuth callback
  handleCallback: (code, provider) => {
    return api.post('/email/callback', { code, provider });
  },
  
  // Start importing emails
  startImport: (connectionId) => {
    return api.post(`/email/imports/${connectionId}`);
  },
  
  // Check the status of an import job
  getImportStatus: (importId) => {
    return api.get(`/email/imports/${importId}`);
  },
  
  // Fetch the most recently imported subscriptions
  getRecentSubscriptions: (importId) => {
    return api.get('/subs/recent', { params: { importId } });
  }
};

export default emailService;
