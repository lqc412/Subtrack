import { query } from '../db.js';
import GmailAPI from '../utils/gmailAPI.js';
import EmailParser from './parserServices.js';

export class EmailService {
  // Get all email connections for a user
  async getUserConnections(userId) {
    try {
      const { rows } = await query(
        'SELECT * FROM email_connections WHERE user_id = $1 AND is_active = TRUE',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching user email connections:', error);
      throw error;
    }
  }
  
  // Add a new email connection
  async addEmailConnection(userId, connectionData) {
    try {
      const { email_address, provider, access_token, refresh_token, expires_in } = connectionData;
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Check if connection already exists
      const existingResult = await query(
        'SELECT id FROM email_connections WHERE user_id = $1 AND email_address = $2 AND provider = $3',
        [userId, email_address, provider]
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing connection
        const { rows } = await query(
          `UPDATE email_connections 
           SET access_token = $1, refresh_token = $2, token_expires_at = $3, is_active = TRUE,
               updated_at = NOW() 
           WHERE id = $4 
           RETURNING *`,
          [access_token, refresh_token, expiresAt, existingResult.rows[0].id]
        );
        
        return rows[0];
      } else {
        // Insert new connection
        const { rows } = await query(
          `INSERT INTO email_connections 
           (user_id, email_address, provider, access_token, refresh_token, token_expires_at) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [userId, email_address, provider, access_token, refresh_token, expiresAt]
        );
        
        return rows[0];
      }
    } catch (error) {
      console.error('Error adding email connection:', error);
      throw error;
    }
  }
  
  // Get authorization URL based on the provider
  getAuthUrl(provider) {
    if (provider === 'gmail') {
      return GmailAPI.getAuthUrl();
    }
    // Add other providers as needed
    throw new Error(`Unsupported email provider: ${provider}`);
  }
  
  // Handle OAuth callback to get tokens
  async handleAuthCallback(provider, code) {
    if (provider === 'gmail') {
      try {
        const tokens = await GmailAPI.getTokensFromCode(code);
        return tokens;
      } catch (error) {
        console.error('Error handling Gmail auth callback:', error);
        throw new Error('Failed to authenticate with Gmail');
      }
    }
    // Add other providers as needed
    throw new Error(`Unsupported email provider: ${provider}`);
  }
  
  // Start a new email import task
  async startEmailImport(userId, connectionId) {
    try {
      // Create import log
      const { rows } = await query(
        `INSERT INTO email_import_logs
         (user_id, connection_id, started_at, status)
         VALUES ($1, $2, NOW(), 'in_progress')
         RETURNING id`,
        [userId, connectionId]
      );
      
      const importId = rows[0].id;
      
      // Get connection details
      const connectionResult = await query(
        'SELECT * FROM email_connections WHERE id = $1 AND user_id = $2',
        [connectionId, userId]
      );
      
      if (connectionResult.rows.length === 0) {
        throw new Error('Email connection not found');
      }
      
      const connection = connectionResult.rows[0];
      
      // Check if token is expired and refresh if needed
      const now = new Date();
      if (connection.token_expires_at && new Date(connection.token_expires_at) < now) {
        try {
          const api = new GmailAPI({
            access_token: connection.access_token,
            refresh_token: connection.refresh_token
          });
          
          const newCredentials = await api.refreshAccessToken();
          
          // Update the connection with new access token
          await query(
            `UPDATE email_connections
             SET access_token = $1, token_expires_at = $2, updated_at = NOW()
             WHERE id = $3`,
            [newCredentials.access_token, new Date(Date.now() + newCredentials.expires_in * 1000), connection.id]
          );
          
          // Update the connection object
          connection.access_token = newCredentials.access_token;
        } catch (error) {
          console.error('Error refreshing token:', error);
          await this.updateImportStatus(importId, 'failed', 'Failed to refresh authentication token');
          throw new Error('Authentication token expired and could not be refreshed');
        }
      }
      
      // Start async processing
      this.processEmailsAsync(userId, connection, importId);
      
      return importId;
    } catch (error) {
      console.error('Error starting email import:', error);
      throw error;
    }
  }
  
  // Process emails asynchronously
  async processEmailsAsync(userId, connection, importId) {
    try {
      let api;
      let userEmail = connection.email_address;
      
      if (connection.provider === 'gmail') {
        api = new GmailAPI({
          access_token: connection.access_token,
          refresh_token: connection.refresh_token
        });
        
        // Get user email if not already provided
        if (!userEmail) {
          try {
            const profile = await api.getUserProfile();
            userEmail = profile.emailAddress;
            
            // Update connection with email address
            await query(
              'UPDATE email_connections SET email_address = $1 WHERE id = $2',
              [userEmail, connection.id]
            );
          } catch (error) {
            console.error('Error getting user email:', error);
          }
        }
      } else {
        throw new Error(`Unsupported provider: ${connection.provider}`);
      }
      
      // Set 3 months ago as the start date
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const dateString = threeMonthsAgo.toISOString().split('T')[0].replace(/-/g, '/');
      
      // Search for potential subscription emails
      const messages = await api.searchSubscriptionEmails(dateString);
      let processed = 0;
      let found = 0;
      
      // Update progress
      await this.updateImportProgress(importId, processed, found);
      
      // No messages found
      if (!messages || messages.length === 0) {
        await this.completeImport(importId, connection.id, 0, 0);
        return;
      }
      
      // Process messages in batches to avoid memory issues
      const batchSize = 10;
      const detectedSubscriptions = [];
      
      for (let i = 0; i < messages.length; i += batchSize) {
        // Get the next batch of messages
        const batch = messages.slice(i, Math.min(i + batchSize, messages.length));
        
        // Process each email in the batch
        for (const message of batch) {
          try {
            const email = await api.getEmailDetails(message.id);
            
            // Try to match with a subscription template
            const matchResult = await EmailParser.matchTemplates(email);
            
            if (matchResult.matched) {
              // Convert to subscription data
              const subscriptionData = EmailParser.convertToSubscription(matchResult);
              
              if (subscriptionData) {
                // Add additional data
                subscriptionData.user_id = userId;
                subscriptionData.source = 'email';
                subscriptionData.source_id = `email_${connection.provider}_${message.id}`;
                
                // Check if a similar subscription already exists
                const existingResult = await query(
                  `SELECT id FROM subscriptions 
                   WHERE user_id = $1 AND company = $2 AND ABS(amount - $3) < 0.01`,
                  [userId, subscriptionData.company, subscriptionData.amount]
                );
                
                if (existingResult.rows.length === 0) {
                  // Store in our temporary array for later insertion
                  detectedSubscriptions.push(subscriptionData);
                  found++;
                }
              }
            }
            
            processed++;
            
            // Update progress every 5 emails
            if (processed % 5 === 0) {
              await this.updateImportProgress(importId, processed, found);
            }
          } catch (error) {
            console.error('Error processing email:', error);
            // Continue with next message
          }
        }
      }
      
      // Store detected subscriptions in the database
      if (detectedSubscriptions.length > 0) {
        await this.storeDetectedSubscriptions(userId, importId, detectedSubscriptions);
      }
      
      // Complete the import
      await this.completeImport(importId, connection.id, processed, found);
      
      return detectedSubscriptions;
    } catch (error) {
      console.error('Error in async email processing:', error);
      // Mark import as failed
      await query(
        `UPDATE email_import_logs
         SET status = 'failed', completed_at = NOW(), error_message = $1
         WHERE id = $2`,
        [error.message, importId]
      );
    }
  }
  
  // Update import status with error message
  async updateImportStatus(importId, status, errorMessage = null) {
    try {
      await query(
        `UPDATE email_import_logs
         SET status = $1, error_message = $2, updated_at = NOW()
         WHERE id = $3`,
        [status, errorMessage, importId]
      );
    } catch (error) {
      console.error('Error updating import status:', error);
    }
  }
  
  // Complete an import successfully
  async completeImport(importId, connectionId, processed, found) {
    try {
      // Update import log
      await query(
        `UPDATE email_import_logs
         SET status = 'completed', completed_at = NOW(), 
             emails_processed = $1, subscriptions_found = $2
         WHERE id = $3`,
        [processed, found, importId]
      );
      
      // Update connection's last sync time
      await query(
        'UPDATE email_connections SET last_sync_at = NOW() WHERE id = $1',
        [connectionId]
      );
    } catch (error) {
      console.error('Error completing import:', error);
    }
  }
  
  // Update import progress
  async updateImportProgress(importId, processed, found) {
    try {
      await query(
        `UPDATE email_import_logs
         SET emails_processed = $1, subscriptions_found = $2
         WHERE id = $3`,
        [processed, found, importId]
      );
    } catch (error) {
      console.error('Error updating import progress:', error);
    }
  }
  
  // Get import status
  async getImportStatus(importId, userId) {
    try {
      const { rows } = await query(
        `SELECT * FROM email_import_logs
         WHERE id = $1 AND user_id = $2`,
        [importId, userId]
      );
      
      if (rows.length === 0) {
        throw new Error('Import not found');
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error fetching import status:', error);
      throw error;
    }
  }
  
  // Mark connection as inactive (soft delete)
  async markConnectionInactive(userId, connectionId) {
    try {
      const { rowCount } = await query(
        `UPDATE email_connections
         SET is_active = FALSE, updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [connectionId, userId]
      );
      
      if (rowCount === 0) {
        throw new Error('Connection not found or already removed');
      }
      
      return true;
    } catch (error) {
      console.error('Error marking connection inactive:', error);
      throw error;
    }
  }
  
  // Store detected subscriptions for later review
  async storeDetectedSubscriptions(userId, importId, subscriptions) {
    try {
      // First clear any existing temporary detections for this import
      await query(
        'DELETE FROM temporary_detected_subscriptions WHERE import_id = $1',
        [importId]
      );
      
      // Insert each subscription
      for (const subscription of subscriptions) {
        await query(
          `INSERT INTO temporary_detected_subscriptions
           (user_id, import_id, company, category, billing_cycle, next_billing_date, 
            amount, currency, notes, is_active, source, source_id, detected_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            userId,
            importId,
            subscription.company,
            subscription.category,
            subscription.billing_cycle,
            subscription.next_billing_date,
            subscription.amount,
            subscription.currency,
            subscription.notes,
            subscription.is_active,
            subscription.source,
            subscription.source_id
          ]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error storing detected subscriptions:', error);
      throw error;
    }
  }
  
  // Get detected subscriptions for an import
  async getDetectedSubscriptions(userId, importId) {
    try {
      const { rows } = await query(
        `SELECT * FROM temporary_detected_subscriptions
         WHERE user_id = $1 AND import_id = $2`,
        [userId, importId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error fetching detected subscriptions:', error);
      throw error;
    }
  }
}

export default new EmailService();