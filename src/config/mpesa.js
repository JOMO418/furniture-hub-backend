/**
 * ============================================
 * M-PESA DARAJA API CONFIGURATION
 * ============================================
 * Safaricom M-Pesa payment integration
 */

const mpesaConfig = {
    // Environment (sandbox or production)
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    
    // Consumer credentials
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    
    // Business shortcode
    shortcode: process.env.MPESA_SHORTCODE,
    
    // Passkey for generating password
    passkey: process.env.MPESA_PASSKEY,
    
    // Callback URL for payment confirmation
    callbackURL: process.env.MPESA_CALLBACK_URL,
    
    // API endpoints
    endpoints: {
      sandbox: {
        oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      },
      production: {
        oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      }
    },
    
    // Transaction type
    transactionType: 'CustomerPayBillOnline',
    
    // Account reference (your business name)
    accountReference: 'Furniture Hub',
    
    // Transaction description
    transactionDesc: 'Payment for furniture order'
  };
  
  // Get current environment endpoints
  mpesaConfig.getEndpoints = function() {
    const env = this.environment === 'production' ? 'production' : 'sandbox';
    return this.endpoints[env];
  };
  
  // Validate configuration
  mpesaConfig.validate = function() {
    const required = ['consumerKey', 'consumerSecret', 'shortcode', 'passkey', 'callbackURL'];
    const missing = required.filter(key => !this[key]);
    
    if (missing.length > 0) {
      console.warn(`⚠️  M-Pesa Config Warning: Missing ${missing.join(', ')}`);
      return false;
    }
    
    console.log(`✅ M-Pesa Configured (${this.environment} mode)`);
    return true;
  };
  
  // Run validation on startup
  if (process.env.NODE_ENV === 'development') {
    mpesaConfig.validate();
  }
  
  module.exports = mpesaConfig;