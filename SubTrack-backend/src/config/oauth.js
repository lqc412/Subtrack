// SubTrack-backend/src/config/oauth.js
// OAuth configuration file - manages authentication settings for third-party services

export default {
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly'
    ]
  },
  
  // Future email providers can be added here
  outlook: {
    client_id: process.env.OUTLOOK_CLIENT_ID,
    client_secret: process.env.OUTLOOK_CLIENT_SECRET,
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
    auth_uri: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token_uri: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://graph.microsoft.com/Mail.Read'
    ]
  },
  
  yahoo: {
    client_id: process.env.YAHOO_CLIENT_ID,
    client_secret: process.env.YAHOO_CLIENT_SECRET,
    redirect_uri: process.env.YAHOO_REDIRECT_URI,
    auth_uri: 'https://api.login.yahoo.com/oauth2/request_auth',
    token_uri: 'https://api.login.yahoo.com/oauth2/get_token',
    scopes: [
      'mail-r'
    ]
  }
};
