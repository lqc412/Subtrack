-- Complete database initialization for SubTrack application
-- Enhanced with comprehensive email detection templates
-- File: database/init.sql

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table - stores user account information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username CHARACTER VARYING(100) NOT NULL UNIQUE,
    email CHARACTER VARYING(255) NOT NULL UNIQUE,
    password_hash CHARACTER VARYING(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    profile_image CHARACTER VARYING(500)
);

-- User settings table - stores user preferences and configuration
-- Note: user_id is primary key, no separate id column
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme_preference CHARACTER VARYING(20) DEFAULT 'light',
    currency_preference CHARACTER VARYING(3) DEFAULT 'USD',
    notification_preferences JSONB DEFAULT '{"email_notifications": true, "payment_reminders": true}'
);

-- Auth tokens table - stores JWT tokens for authentication
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token CHARACTER VARYING(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table - stores user subscription data
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    company CHARACTER VARYING(255) NOT NULL,
    category CHARACTER VARYING(100),
    billing_cycle CHARACTER VARYING(20) NOT NULL,
    next_billing_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency CHARACTER VARYING(3) DEFAULT 'USD',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    source CHARACTER VARYING(50) DEFAULT 'manual',
    source_id CHARACTER VARYING(255)
);

-- Email connections table - stores OAuth connections to email providers
CREATE TABLE IF NOT EXISTS email_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider CHARACTER VARYING(50) NOT NULL,
    email_address CHARACTER VARYING(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Email import logs table - tracks email scanning operations
CREATE TABLE IF NOT EXISTS email_import_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    connection_id INTEGER REFERENCES email_connections(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    status CHARACTER VARYING(20) DEFAULT 'in_progress',
    emails_processed INTEGER DEFAULT 0,
    subscriptions_found INTEGER DEFAULT 0,
    error_message TEXT,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table - stores patterns for detecting subscription emails
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    service_name CHARACTER VARYING(255) NOT NULL,
    sender_pattern TEXT,
    subject_pattern TEXT,
    body_patterns JSONB,
    category CHARACTER VARYING(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Temporary detected subscriptions table - stores subscription candidates before user confirmation
CREATE TABLE IF NOT EXISTS temporary_detected_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    import_id INTEGER REFERENCES email_import_logs(id) ON DELETE CASCADE,
    company CHARACTER VARYING(255) NOT NULL,
    category CHARACTER VARYING(100),
    billing_cycle CHARACTER VARYING(20) NOT NULL,
    next_billing_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency CHARACTER VARYING(3) DEFAULT 'USD',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    source CHARACTER VARYING(50) DEFAULT 'email',
    source_id CHARACTER VARYING(255),
    detected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id ON email_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_email_import_logs_user_id ON email_import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_detected_subs_user_id ON temporary_detected_subscriptions(user_id);

-- ============================================================================
-- ENHANCED EMAIL TEMPLATES
-- ============================================================================

-- Clear any existing templates to avoid duplicates
DELETE FROM email_templates;

-- English/International Services
-- Streaming & Entertainment
INSERT INTO email_templates (service_name, sender_pattern, subject_pattern, body_patterns, category) VALUES
('Netflix', '.*(netflix).*', '.*(payment|billing|receipt|subscription|renewal).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('Spotify', '.*(spotify).*', '.*(premium|payment|receipt|subscription|billing).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('YouTube Premium', '.*(youtube).*', '.*(premium|membership|payment|subscription).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('Disney Plus', '.*(disney|disneyplus).*', '.*(payment|subscription|billing|receipt).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('HBO Max', '.*(hbo|hbomax).*', '.*(payment|subscription|billing|receipt).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('Hulu', '.*(hulu).*', '.*(payment|subscription|billing|receipt).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('Amazon Prime', '.*(amazon|amzn).*', '.*(prime|membership|subscription|renewal|payment).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('Twitch', '.*(twitch).*', '.*(subscription|payment|billing|receipt|turbo).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),
('Patreon', '.*(patreon).*', '.*(payment|pledge|subscription|receipt|thank you).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Entertainment'),

-- Cloud & Productivity
('Google Workspace', '.*(google|gmail|workspace).*', '.*(payment|subscription|billing|receipt|workspace).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Productivity'),
('Microsoft 365', '.*(microsoft|outlook|office).*', '.*(subscription|payment|billing|receipt|renewal).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Productivity'),
('Adobe Creative Cloud', '.*(adobe).*', '.*(creative|subscription|payment|billing|receipt).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Productivity'),
('Dropbox', '.*(dropbox).*', '.*(payment|subscription|billing|receipt|storage).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Cloud Storage'),
('iCloud', '.*(apple|icloud).*', '.*(payment|subscription|billing|receipt|storage).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Cloud Storage'),
('OneDrive', '.*(onedrive|microsoft).*', '.*(storage|payment|subscription|billing).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Cloud Storage'),
('Notion', '.*(notion).*', '.*(payment|subscription|billing|receipt|plan).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Productivity'),

-- Communication & Collaboration
('Slack', '.*(slack).*', '.*(payment|subscription|billing|receipt|workspace).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Communication'),
('Zoom', '.*(zoom).*', '.*(payment|subscription|billing|receipt|meeting).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Communication'),
('Discord Nitro', '.*(discord).*', '.*(nitro|payment|subscription|billing|receipt).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Communication'),

-- Development & Tech
('GitHub', '.*(github).*', '.*(payment|subscription|billing|receipt|plan).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Development'),
('GitLab', '.*(gitlab).*', '.*(payment|subscription|billing|receipt|plan).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Development'),
('JetBrains', '.*(jetbrains).*', '.*(payment|subscription|billing|receipt|license).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Development'),

-- Chinese Services (中文服务)
-- Video Streaming (视频流媒体)
('爱奇艺VIP', '.*(iqiyi|爱奇艺).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),
('腾讯视频VIP', '.*(tencent|腾讯|qq).*', '.*(会员|付费|订阅|续费|扣费|支付|视频).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),
('优酷VIP', '.*(youku|优酷).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),
('芒果TV', '.*(mgtv|芒果).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),
('哔哩哔哩大会员', '.*(bilibili|哔哩|b站).*', '.*(大会员|会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),

-- Music Streaming (音乐流媒体)
('QQ音乐', '.*(qq.*music|qq音乐|腾讯音乐).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),
('网易云音乐', '.*(netease|网易|云音乐).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),
('酷狗音乐', '.*(kugou|酷狗).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Entertainment'),

-- Cloud Storage (云存储)
('百度网盘', '.*(baidu|百度|网盘).*', '.*(会员|付费|订阅|续费|扣费|支付|超级会员).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Cloud Storage'),
('阿里云盘', '.*(aliyun|阿里|云盘).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Cloud Storage'),

-- E-commerce (电商)
('淘宝88VIP', '.*(taobao|tmall|淘宝|天猫).*', '.*(88vip|会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Shopping'),
('京东PLUS', '.*(jd|京东).*', '.*(plus|会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Shopping'),

-- Productivity (生产力)
('WPS会员', '.*(wps|金山).*', '.*(会员|付费|订阅|续费|扣费|支付|office).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Productivity'),
('石墨文档', '.*(shimo|石墨).*', '.*(会员|付费|订阅|续费|扣费|支付).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Productivity'),

-- Payment Processors & Generic Patterns
('PayPal', '.*(paypal).*', '.*(payment|receipt|subscription).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Payment'),
('Stripe', '.*(stripe).*', '.*(payment|receipt|subscription|invoice).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Payment'),
('支付宝', '.*(alipay|支付宝).*', '.*(付费|扣费|支付|交易|订阅).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Payment'),
('微信支付', '.*(wechat|微信|wxpay).*', '.*(付费|扣费|支付|交易|订阅).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})"}', 'Payment'),

-- Generic catch-all patterns
('订阅服务', '.*', '.*(订阅|续费|会员|付费|自动扣费|月费|年费).*', '{"amount": "([0-9]+\\.?[0-9]*)元|¥([0-9]+\\.?[0-9]*)|\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Other'),
('Subscription Service', '.*', '.*(subscription|monthly|recurring|payment|billing|invoice).*', '{"amount": "\\$([0-9]+\\.?[0-9]*)", "date": "([0-9]{1,2}/[0-9]{1,2}/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2}, [0-9]{4})"}', 'Other');

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant all privileges to postgres user (matches environment configuration)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Display template count and distribution
-- Uncomment these lines to see template statistics after initialization:
-- SELECT COUNT(*) as total_templates FROM email_templates;
-- SELECT category, COUNT(*) as count FROM email_templates GROUP BY category ORDER BY count DESC;