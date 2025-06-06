// Debug version of parserServices.js with enhanced logging
// Replace your existing parserServices.js with this version temporarily

import { query } from '../db.js';

export class EmailParser {
  // Load all known subscription email templates
  async loadTemplates() {
    try {
      const { rows } = await query('SELECT * FROM email_templates');
      console.log(`📧 Loaded ${rows.length} email templates`);
      return rows;
    } catch (error) {
      console.error('Error loading email templates:', error);
      throw error;
    }
  }
  
  // Parse email headers
  parseHeaders(headers) {
    const result = {};
    if (!headers || !Array.isArray(headers)) return result;
    
    headers.forEach(header => {
      result[header.name.toLowerCase()] = header.value;
    });
    
    return result;
  }
  
  // Get plain text from Base64 encoded content
  decodeEmailBody(body) {
    if (!body) return '';
    
    try {
      // Gmail API returns base64url encoded content
      const text = Buffer.from(body.data, 'base64').toString('utf-8');
      return text;
    } catch (error) {
      console.error('Error decoding email body:', error);
      return '';
    }
  }
  
  // Try to match email with known templates
  async matchTemplates(email) {
    const templates = await this.loadTemplates();
    const headers = this.parseHeaders(email.payload.headers);
    const sender = headers.from || '';
    const subject = headers.subject || '';
    
    console.log(`🔍 Analyzing email:`);
    console.log(`  From: ${sender}`);
    console.log(`  Subject: ${subject}`);
    
    // Get email body content
    let bodyText = '';
    if (email.payload.body.size > 0) {
      bodyText = this.decodeEmailBody(email.payload.body);
    } else if (email.payload.parts) {
      // Handle multipart emails
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain') {
          bodyText += this.decodeEmailBody(part.body);
        }
      }
    }
    
    console.log(`  Body length: ${bodyText.length} characters`);
    console.log(`  Body preview: ${bodyText.substring(0, 200)}...`);
    
    // Try to match templates
    for (const template of templates) {
      console.log(`🧪 Testing template: ${template.service_name}`);
      
      // Check sender pattern
      let senderMatch = true;
      if (template.sender_pattern) {
        const senderRegex = new RegExp(template.sender_pattern, 'i');
        senderMatch = senderRegex.test(sender);
        console.log(`  Sender pattern "${template.sender_pattern}" vs "${sender}": ${senderMatch}`);
      }
      
      if (!senderMatch) {
        console.log(`  ❌ Sender pattern failed for ${template.service_name}`);
        continue;
      }
      
      // Check subject pattern
      let subjectMatch = true;
      if (template.subject_pattern) {
        const subjectRegex = new RegExp(template.subject_pattern, 'i');
        subjectMatch = subjectRegex.test(subject);
        console.log(`  Subject pattern "${template.subject_pattern}" vs "${subject}": ${subjectMatch}`);
      }
      
      if (!subjectMatch) {
        console.log(`  ❌ Subject pattern failed for ${template.service_name}`);
        continue;
      }
      
      // Try to extract data from body
      const extractedData = this.extractDataFromBody(bodyText, template.body_patterns);
      console.log(`  Extracted data:`, extractedData);
      
      if (extractedData && Object.keys(extractedData).length > 0) {
        console.log(`  ✅ Match found with template: ${template.service_name}`);
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
      } else {
        console.log(`  ❌ Data extraction failed for ${template.service_name}`);
      }
    }
    
    console.log(`  ❌ No templates matched for this email`);
    return { matched: false };
  }
  
  // Extract data from body using patterns
  extractDataFromBody(body, patterns) {
    if (!patterns || typeof patterns !== 'object') {
      console.log(`  ⚠️  No patterns provided or invalid patterns format`);
      return null;
    }
    
    const result = {};
    console.log(`  🔍 Extracting data with patterns:`, patterns);
    
    for (const [key, patternStr] of Object.entries(patterns)) {
      try {
        const regex = new RegExp(patternStr, 'i');
        const match = body.match(regex);
        
        console.log(`    Pattern "${key}": ${patternStr}`);
        console.log(`    Match result:`, match ? match[0] : 'No match');
        
        if (match && match[1]) {
          result[key] = match[1].trim();
          console.log(`    ✅ Extracted ${key}: ${result[key]}`);
        } else {
          console.log(`    ❌ No match for ${key}`);
        }
      } catch (error) {
        console.error(`    ❌ Regex error for ${key}:`, error.message);
      }
    }
    
    // Should find at least amount or date
    const hasRequiredData = result.amount || result.date;
    console.log(`  Required data check (amount or date): ${hasRequiredData}`);
    
    return hasRequiredData ? result : null;
  }
  
  // Get date from email headers
  getDateFromHeaders(headers) {
    const date = headers.date || headers['received'] || '';
    return date ? new Date(date) : new Date();
  }
  
  // Convert to subscription object
  convertToSubscription(matchResult) {
    if (!matchResult.matched) return null;
    
    console.log(`🔄 Converting match result to subscription:`, matchResult);
    
    // Handle amount, remove currency symbols, convert to number
    let amount = 0;
    if (matchResult.data.amount) {
      // Remove all non-numeric and decimal point characters
      const amountStr = matchResult.data.amount.replace(/[^0-9.]/g, '');
      amount = parseFloat(amountStr);
      console.log(`  Amount conversion: "${matchResult.data.amount}" -> ${amount}`);
    }
    
    // Try to determine currency
    let currency = 'USD'; // Default value
    if (matchResult.data.amount) {
      if (matchResult.data.amount.includes('€')) currency = 'EUR';
      else if (matchResult.data.amount.includes('£')) currency = 'GBP';
      else if (matchResult.data.amount.includes('¥')) currency = 'CNY';
      console.log(`  Currency detected: ${currency}`);
    }
    
    // Handle next billing date
    let nextBillingDate = null;
    if (matchResult.data.date) {
      try {
        nextBillingDate = new Date(matchResult.data.date);
        console.log(`  Date conversion: "${matchResult.data.date}" -> ${nextBillingDate}`);
      } catch (e) {
        console.log(`  Date parsing failed, using default`);
        // If parsing fails, use current date plus one month
        nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
    } else {
      console.log(`  No date found, using default (current + 1 month)`);
      // If no date info, default to current date plus one month
      nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    
    // Determine billing cycle
    let billingCycle = 'monthly'; // Default value
    if (matchResult.data.cycle) {
      const cycleStr = matchResult.data.cycle.toLowerCase();
      if (cycleStr.includes('year')) billingCycle = 'yearly';
      else if (cycleStr.includes('week')) billingCycle = 'weekly';
      else if (cycleStr.includes('day')) billingCycle = 'daily';
      console.log(`  Billing cycle detected: ${billingCycle}`);
    }
    
    const subscription = {
      company: matchResult.data.service,
      category: '', // Needs additional logic for categorization
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate.toISOString().split('T')[0],
      amount: amount,
      currency: currency,
      notes: `Automatically detected from email (ID: ${matchResult.data.email_id})`,
      is_active: true
    };
    
    console.log(`✅ Final subscription object:`, subscription);
    return subscription;
  }
}

export default new EmailParser();