import EmailService from '../services/emailServices.js';

// 获取用户的邮箱连接
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const connections = await EmailService.getUserConnections(userId);
    
    // 不返回敏感令牌信息
    const safeConnections = connections.map(conn => ({
      id: conn.id,
      provider: conn.provider,
      email_address: conn.email_address,
      is_active: conn.is_active,
      last_sync_at: conn.last_sync_at,
      created_at: conn.created_at
    }));
    
    res.status(200).json(safeConnections);
  } catch (error) {
    console.error('Error fetching email connections:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 获取邮箱授权URL
export const getAuthUrl = async (req, res) => {
  try {
    const { provider } = req.query;
    
    if (!provider) {
      return res.status(400).json({ message: 'Email provider is required' });
    }
    
    const authUrl = EmailService.getAuthUrl(provider);
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 处理OAuth回调
export const handleCallback = async (req, res) => {
  try {
    const { code, provider, state } = req.body;
    
    if (!code || !provider) {
      return res.status(400).json({ message: 'Code and provider are required' });
    }
    
    // 获取令牌
    const tokens = await EmailService.handleAuthCallback(provider, code);
    
    // 获取邮箱地址（这里简单示例，实际可能需要额外调用）
    let emailAddress = '';
    if (provider === 'gmail') {
      // 这里应该有从token或用户信息中提取email的逻辑
      emailAddress = req.user.email; // 简化示例，实际应该通过API获取
    }
    
    // 添加连接
    const connection = await EmailService.addEmailConnection(req.user.id, {
      provider,
      email_address: emailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in
    });
    
    res.status(201).json({
      id: connection.id,
      provider: connection.provider,
      email_address: connection.email_address
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 开始导入邮件
export const startImport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;
    
    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }
    
    const importId = await EmailService.startEmailImport(userId, connectionId);
    
    res.status(202).json({
      importId,
      message: 'Email import started successfully'
    });
  } catch (error) {
    console.error('Error starting email import:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 获取导入状态
export const getImportStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { importId } = req.params;
    
    if (!importId) {
      return res.status(400).json({ message: 'Import ID is required' });
    }
    
    const status = await EmailService.getImportStatus(importId, userId);
    
    res.status(200).json(status);
  } catch (error) {
    console.error('Error fetching import status:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 删除邮箱连接
export const removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;
    
    // 不实际删除，而是标记为非活动
    await EmailService.markConnectionInactive(userId, connectionId);
    
    res.status(200).json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing email connection:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// Get recently detected subscriptions
export const getRecentSubscriptions = async (req, res) => {
    try {
      const userId = req.user.id;
      const { importId } = req.query;
      
      if (!importId) {
        return res.status(400).json({ message: 'Import ID is required' });
      }
      
      // Verify the import belongs to the user
      const importCheck = await EmailService.getImportStatus(importId, userId);
      
      if (!importCheck) {
        return res.status(404).json({ message: 'Import not found' });
      }
      
      // Get detected subscriptions for this import
      const subscriptions = await EmailService.getDetectedSubscriptions(userId, importId);
      
      // If the import completed but no subscriptions were found, return a more helpful message
      if (importCheck.status === 'completed' && subscriptions.length === 0) {
        return res.status(200).json([]);
      }
      
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error fetching recent subscriptions:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to retrieve subscription data' 
      });
    }
  };