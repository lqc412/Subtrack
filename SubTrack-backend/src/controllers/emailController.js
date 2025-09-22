// SubTrack-backend/src/controllers/emailController.js - Fixed version
import EmailService from '../services/emailServices.js';
import { findUserById } from '../services/authServices.js';

// Get user's email connections
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const connections = await EmailService.getUserConnections(userId);
    
    // Don't return sensitive token information
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

// Get email authorization URL
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

// Handle OAuth callback
export const handleCallback = async (req, res) => {
  try {
    const { code, provider, state } = req.body;
    
    if (!code || !provider) {
      return res.status(400).json({ message: 'Code and provider are required' });
    }
    
    // Get tokens from OAuth provider
    const tokens = await EmailService.handleAuthCallback(provider, code);
    
    // Get user email address from the tokens
    let emailAddress = '';
    try {
      if (provider === 'gmail') {
        // Use the Gmail API to get user's email address
        const GmailAPI = (await import('../utils/gmailAPI.js')).default;
        const gmailApi = new GmailAPI({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        });
        const profile = await gmailApi.getUserProfile();
        emailAddress = profile.emailAddress;
      }
    } catch (emailError) {
      console.error('Error getting user email:', emailError);

      try {
        const user = await findUserById(req.user.id);
        emailAddress = user?.email || req.user?.email || 'unknown@email.com';
      } catch (lookupError) {
        console.error('Error retrieving user email from database:', lookupError);
        emailAddress = req.user?.email || 'unknown@email.com';
      }
    }
    
    // Add email connection to database
    const connection = await EmailService.addEmailConnection(req.user.id, {
      provider,
      email_address: emailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600
    });
    
    res.status(201).json({
      message: 'Email connection established successfully',
      connection: {
        id: connection.id,
        provider: connection.provider,
        email_address: connection.email_address
      }
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({ message: error.message || 'Failed to establish email connection' });
  }
};

// Start email import
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
    res.status(500).json({ message: error.message || 'Failed to start email import' });
  }
};

// Get import status
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
    res.status(500).json({ message: error.message || 'Failed to fetch import status' });
  }
};

// Remove email connection
export const removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;
    
    // Mark connection as inactive instead of deleting
    await EmailService.markConnectionInactive(userId, connectionId);
    
    res.status(200).json({ message: 'Email connection removed successfully' });
  } catch (error) {
    console.error('Error removing email connection:', error);
    res.status(500).json({ message: error.message || 'Failed to remove email connection' });
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
    const importStatus = await EmailService.getImportStatus(importId, userId);
    
    if (!importStatus) {
      return res.status(404).json({ message: 'Import not found' });
    }
    
    // Get detected subscriptions for this import
    const subscriptions = await EmailService.getDetectedSubscriptions(userId, importId);
    
    // If the import completed but no subscriptions were found, return empty array
    if (importStatus.status === 'completed' && subscriptions.length === 0) {
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