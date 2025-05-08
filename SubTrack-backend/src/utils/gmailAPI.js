import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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
  
  // 生成授权URL
  static getAuthUrl() {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent'
    });
  }
  
  // 获取初始令牌
  static async getTokensFromCode(code) {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }
  
  // 刷新令牌
  async refreshAccessToken() {
    try {
      const { credentials } = await this.oAuth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }
  
  // 搜索可能包含订阅信息的邮件
  async searchSubscriptionEmails(afterDate, maxResults = 100) {
    try {
      // 构建查询字符串，寻找常见的订阅相关关键词
      const query = `after:${afterDate} (subject:(subscription OR receipt OR payment OR invoice OR billing) OR from:(netflix.com OR spotify.com OR amazon.com))`;
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });
      
      return response.data.messages || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
  
  // 获取特定邮件的详细内容
  async getEmailDetails(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      throw error;
    }
  }
}

export default GmailAPI;