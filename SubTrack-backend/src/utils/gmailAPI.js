import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import oauthConfig from '../config/oauth.js';

export class GmailAPI {
  constructor(credentials) {
    this.oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.oAuth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });
    
    this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });
  }
  
  // Generate authorization URL
  static getAuthUrl() {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    const scopes = oauthConfig.google.scopes;
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Always show consent screen to get refresh token
    });
  }
  
  // Get initial tokens from authorization code
  static async getTokensFromCode(code) {
    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      
      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }
  
  // Refresh access token if expired
  async refreshAccessToken() {
    try {
      const { credentials } = await this.oAuth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }
  
  // Search for emails that might contain subscription information
  async searchSubscriptionEmails(afterDate, maxResults = 100) {
    try {
      // Build search query
      // Look for common keywords related to subscriptions and receipts
      const keywords = [
        'subscription',
        'receipt',
        'payment',
        'invoice',
        'billing',
        'renew',
        'membership',
        'monthly',
        'annual',
        'yearly'
      ];
      
      // Common sender domains for subscription services
      const domains = [
        'netflix.com',
        'spotify.com',
        'amazon.com',
        'apple.com',
        'google.com',
        'microsoft.com',
        'adobe.com',
        'hulu.com',
        'disneyplus.com',
        'github.com',
        'dropbox.com',
        'slack.com',
        'zoom.us'
      ];
      
      // Prepare the query parts for keywords and domains
      const keywordQuery = keywords.map(keyword => `subject:(${keyword})`).join(' OR ');
      const domainQuery = domains.map(domain => `from:(${domain})`).join(' OR ');
      
      // Combine into a single query
      // Filter by date and one of the keywords or domains
      const query = `after:${afterDate} ((${keywordQuery}) OR (${domainQuery}))`;
      
      console.log('Gmail search query:', query);
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });
      
      if (!response.data.messages) {
        console.log('No messages found matching the criteria');
        return [];
      }
      
      console.log(`Found ${response.data.messages.length} messages matching criteria`);
      return response.data.messages;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
  
  // Get detailed content of a specific email
  async getEmailDetails(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full' // Get the full email content
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      throw error;
    }
  }
  
  // Get user profile to obtain email address
  async getUserProfile() {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
  
  // Process a batch of emails in parallel for better performance
  async processBatch(messageIds, batchSize = 5) {
    const results = [];
    
    // Process in chunks to avoid rate limiting
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      
      // Process each batch in parallel
      const batchPromises = batch.map(msgId => this.getEmailDetails(msgId.id));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Filter successful results
      const successfulResults = batchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      results.push(...successfulResults);
      
      // Pause briefly between batches to avoid rate limits
      if (i + batchSize < messageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }
}

export default GmailAPI;