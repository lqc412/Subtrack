import { query } from '../db.js';
import GmailAPI from '../utils/gmailAPI.js';
import EmailParser from './parserServices.js';

export class EmailService {
  // 获取用户的所有邮箱连接
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
  
  // 添加新的邮箱连接
  async addEmailConnection(userId, connectionData) {
    try {
      const { email_address, provider, access_token, refresh_token, expires_in } = connectionData;
      
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      const { rows } = await query(
        `INSERT INTO email_connections 
         (user_id, email_address, provider, access_token, refresh_token, token_expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [userId, email_address, provider, access_token, refresh_token, expiresAt]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error adding email connection:', error);
      throw error;
    }
  }
  
  // 获取授权URL
  getAuthUrl(provider) {
    if (provider === 'gmail') {
      return GmailAPI.getAuthUrl();
    }
    // 可扩展其他邮件提供商
    throw new Error(`Unsupported email provider: ${provider}`);
  }
  
  // 处理OAuth回调，获取访问令牌
  async handleAuthCallback(provider, code) {
    if (provider === 'gmail') {
      return await GmailAPI.getTokensFromCode(code);
    }
    // 可扩展其他邮件提供商
    throw new Error(`Unsupported email provider: ${provider}`);
  }
  
  // 开始一个新的邮件导入任务
  async startEmailImport(userId, connectionId) {
    try {
      // 创建导入日志
      const { rows } = await query(
        `INSERT INTO email_import_logs
         (user_id, connection_id, started_at, status)
         VALUES ($1, $2, NOW(), 'in_progress')
         RETURNING id`,
        [userId, connectionId]
      );
      
      const importId = rows[0].id;
      
      // 获取连接详情
      const connectionResult = await query(
        'SELECT * FROM email_connections WHERE id = $1 AND user_id = $2',
        [connectionId, userId]
      );
      
      if (connectionResult.rows.length === 0) {
        throw new Error('Email connection not found');
      }
      
      const connection = connectionResult.rows[0];
      
      // 开始异步处理
      this.processEmailsAsync(userId, connection, importId);
      
      return importId;
    } catch (error) {
      console.error('Error starting email import:', error);
      throw error;
    }
  }
  
  // 异步处理邮件（这个函数会在后台运行）
  async processEmailsAsync(userId, connection, importId) {
    try {
      let api;
      
      if (connection.provider === 'gmail') {
        api = new GmailAPI({
          access_token: connection.access_token,
          refresh_token: connection.refresh_token
        });
      } else {
        throw new Error(`Unsupported provider: ${connection.provider}`);
      }
      
      // 设置3个月前的日期作为起点
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const dateString = threeMonthsAgo.toISOString().split('T')[0].replace(/-/g, '/');
      
      // 搜索可能的订阅邮件
      const messages = await api.searchSubscriptionEmails(dateString);
      let processed = 0;
      let found = 0;
      
      // 更新进度
      await this.updateImportProgress(importId, processed, found);
      
      // 处理每封邮件
      for (const message of messages) {
        try {
          const email = await api.getEmailDetails(message.id);
          
          // 尝试将邮件与模板匹配
          const matchResult = await EmailParser.matchTemplates(email);
          
          if (matchResult.matched) {
            // 转换为订阅数据
            const subscriptionData = EmailParser.convertToSubscription(matchResult);
            
            if (subscriptionData) {
              // 添加用户ID
              subscriptionData.user_id = userId;
              
              // 检查是否已存在类似订阅
              const existingResult = await query(
                `SELECT id FROM subscriptions 
                 WHERE user_id = $1 AND company = $2 AND ABS(amount - $3) < 0.01`,
                [userId, subscriptionData.company, subscriptionData.amount]
              );
              
              if (existingResult.rows.length === 0) {
                // 插入新订阅
                await query(
                  `INSERT INTO subscriptions
                   (user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                  [
                    subscriptionData.user_id,
                    subscriptionData.company,
                    subscriptionData.category,
                    subscriptionData.billing_cycle,
                    subscriptionData.next_billing_date,
                    subscriptionData.amount,
                    subscriptionData.currency,
                    subscriptionData.notes,
                    subscriptionData.is_active
                  ]
                );
                
                found++;
              }
            }
          }
          
          processed++;
          
          // 每10封邮件更新一次进度
          if (processed % 10 === 0) {
            await this.updateImportProgress(importId, processed, found);
          }
        } catch (error) {
          console.error('Error processing email:', error);
          // 继续处理下一封
        }
      }
      
      // 完成导入
      await query(
        `UPDATE email_import_logs
         SET status = 'completed', completed_at = NOW(), 
             emails_processed = $1, subscriptions_found = $2
         WHERE id = $3`,
        [processed, found, importId]
      );
      
      // 更新连接的最后同步时间
      await query(
        'UPDATE email_connections SET last_sync_at = NOW() WHERE id = $1',
        [connection.id]
      );
    } catch (error) {
      console.error('Error in async email processing:', error);
      // 标记导入失败
      await query(
        `UPDATE email_import_logs
         SET status = 'failed', completed_at = NOW(), error_message = $1
         WHERE id = $2`,
        [error.message, importId]
      );
    }
  }
  
  // 更新导入进度
  async updateImportProgress(importId, processed, found) {
    await query(
      `UPDATE email_import_logs
       SET emails_processed = $1, subscriptions_found = $2
       WHERE id = $3`,
      [processed, found, importId]
    );
  }
  
  // 获取导入状态
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
}

export default new EmailService();