import { query } from '../db.js';

export class EmailParser {
  // 加载所有已知的订阅邮件模板
  async loadTemplates() {
    try {
      const { rows } = await query('SELECT * FROM email_templates');
      return rows;
    } catch (error) {
      console.error('Error loading email templates:', error);
      throw error;
    }
  }
  
  // 解析邮件头部
  parseHeaders(headers) {
    const result = {};
    if (!headers || !Array.isArray(headers)) return result;
    
    headers.forEach(header => {
      result[header.name.toLowerCase()] = header.value;
    });
    
    return result;
  }
  
  // 从Base64编码的内容中获取纯文本
  decodeEmailBody(body) {
    if (!body) return '';
    
    try {
      // Gmail API 返回的是base64url编码的内容
      const text = Buffer.from(body.data, 'base64').toString('utf-8');
      return text;
    } catch (error) {
      console.error('Error decoding email body:', error);
      return '';
    }
  }
  
  // 尝试将邮件与已知模板匹配
  async matchTemplates(email) {
    const templates = await this.loadTemplates();
    const headers = this.parseHeaders(email.payload.headers);
    const sender = headers.from || '';
    const subject = headers.subject || '';
    
    // 获取正文内容
    let bodyText = '';
    if (email.payload.body.size > 0) {
      bodyText = this.decodeEmailBody(email.payload.body);
    } else if (email.payload.parts) {
      // 处理多部分邮件
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain') {
          bodyText += this.decodeEmailBody(part.body);
        }
      }
    }
    
    // 尝试匹配模板
    for (const template of templates) {
      // 检查发件人是否匹配
      if (template.sender_pattern && !sender.match(new RegExp(template.sender_pattern, 'i'))) {
        continue;
      }
      
      // 检查主题是否匹配
      if (template.subject_pattern && !subject.match(new RegExp(template.subject_pattern, 'i'))) {
        continue;
      }
      
      // 尝试解析正文中的订阅数据
      const extractedData = this.extractDataFromBody(bodyText, template.body_patterns);
      if (extractedData && Object.keys(extractedData).length > 0) {
        return {
          matched: true,
          template: template.service_name,
          data: {
            ...extractedData,
            service: template.service_name,
            email_id: email.id,
            received_at: this.getDateFromHeaders(headers)
          }
        };
      }
    }
    
    return { matched: false };
  }
  
  // 根据模式从正文中提取数据
  extractDataFromBody(body, patterns) {
    if (!patterns || typeof patterns !== 'object') return null;
    
    const result = {};
    
    for (const [key, patternStr] of Object.entries(patterns)) {
      const regex = new RegExp(patternStr, 'i');
      const match = body.match(regex);
      
      if (match && match[1]) {
        result[key] = match[1].trim();
      }
    }
    
    // 至少应该找到金额或者日期中的一个
    return (result.amount || result.date) ? result : null;
  }
  
  // 从邮件头获取日期
  getDateFromHeaders(headers) {
    const date = headers.date || headers['received'] || '';
    return date ? new Date(date) : new Date();
  }
  
  // 转换成订阅对象
  convertToSubscription(matchResult) {
    if (!matchResult.matched) return null;
    
    // 处理金额，移除货币符号，转换为数字
    let amount = 0;
    if (matchResult.data.amount) {
      // 移除所有非数字和小数点的字符
      const amountStr = matchResult.data.amount.replace(/[^0-9.]/g, '');
      amount = parseFloat(amountStr);
    }
    
    // 尝试确定货币
    let currency = 'USD'; // 默认值
    if (matchResult.data.amount) {
      if (matchResult.data.amount.includes('€')) currency = 'EUR';
      else if (matchResult.data.amount.includes('£')) currency = 'GBP';
      else if (matchResult.data.amount.includes('¥')) currency = 'CNY';
    }
    
    // 处理下一个账单日期
    let nextBillingDate = null;
    if (matchResult.data.date) {
      try {
        nextBillingDate = new Date(matchResult.data.date);
      } catch (e) {
        // 如果解析失败，使用当前日期加一个月
        nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
    } else {
      // 如果没有日期信息，默认为当前日期加一个月
      nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    
    // 确定账单周期
    let billingCycle = 'monthly'; // 默认值
    if (matchResult.data.cycle) {
      const cycleStr = matchResult.data.cycle.toLowerCase();
      if (cycleStr.includes('year')) billingCycle = 'yearly';
      else if (cycleStr.includes('week')) billingCycle = 'weekly';
      else if (cycleStr.includes('day')) billingCycle = 'daily';
    }
    
    return {
      company: matchResult.data.service,
      category: '', // 需要额外逻辑分类
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate.toISOString().split('T')[0],
      amount: amount,
      currency: currency,
      notes: `Automatically detected from email (ID: ${matchResult.data.email_id})`,
      is_active: true
    };
  }
}

export default new EmailParser();