/**
 * ============================================
 * M-PESA SERVICE
 * ============================================
 * Safaricom Daraja API integration
 */

const axios = require('axios');
const mpesaConfig = require('../config/mpesa');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * Generate M-Pesa access token
 * @returns {Promise<string>} Access token
 */
const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
    ).toString('base64');

    const endpoints = mpesaConfig.getEndpoints();
    
    const response = await axios.get(endpoints.oauth, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa Token Error:', error.response?.data || error.message);
    throw new ErrorResponse('Failed to generate M-Pesa access token', 500);
  }
};

/**
 * Generate M-Pesa password
 * @returns {object} Password and timestamp
 */
const generatePassword = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(
    `${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`
  ).toString('base64');

  return { password, timestamp };
};

/**
 * Format phone number to M-Pesa format (254XXXXXXXXX)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove spaces, dashes, and plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, '');

  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }

  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  // Validate length (should be 12 digits: 254XXXXXXXXX)
  if (cleaned.length !== 12) {
    throw new Error('Invalid phone number format');
  }

  return cleaned;
};

/**
 * Initiate M-Pesa STK Push
 * @param {string} phone - Customer phone number
 * @param {number} amount - Amount to charge
 * @param {string} accountReference - Order number or reference
 * @param {string} transactionDesc - Transaction description
 * @returns {Promise<object>} STK Push response
 */
const initiateSTKPush = async (phone, amount, accountReference, transactionDesc) => {
  try {
    // Validate inputs
    if (!phone || !amount || !accountReference) {
      throw new Error('Phone, amount, and account reference are required');
    }

    // Validate amount
    if (amount < 1) {
      throw new Error('Amount must be at least 1 KES');
    }

    // Get access token
    const accessToken = await generateAccessToken();

    // Generate password and timestamp
    const { password, timestamp } = generatePassword();

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Prepare request payload
    const payload = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: mpesaConfig.transactionType,
      Amount: Math.round(amount), // Round to nearest integer
      PartyA: formattedPhone,
      PartyB: mpesaConfig.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: mpesaConfig.callbackURL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc || mpesaConfig.transactionDesc
    };

    // Get endpoints
    const endpoints = mpesaConfig.getEndpoints();

    // Make STK Push request
    const response = await axios.post(endpoints.stkPush, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Check response
    if (response.data.ResponseCode === '0') {
      return {
        success: true,
        message: 'STK Push sent successfully',
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        customerMessage: response.data.CustomerMessage
      };
    } else {
      throw new Error(response.data.ResponseDescription || 'STK Push failed');
    }

  } catch (error) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    
    // Handle specific M-Pesa errors
    const errorMessage = error.response?.data?.errorMessage || 
                        error.response?.data?.ResponseDescription ||
                        error.message;

    throw new ErrorResponse(`M-Pesa payment failed: ${errorMessage}`, 400);
  }
};

/**
 * Query STK Push status
 * @param {string} checkoutRequestId - Checkout Request ID from STK Push
 * @returns {Promise<object>} Transaction status
 */
const querySTKPushStatus = async (checkoutRequestId) => {
  try {
    // Get access token
    const accessToken = await generateAccessToken();

    // Generate password and timestamp
    const { password, timestamp } = generatePassword();

    // Prepare request payload
    const payload = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    // Get endpoints
    const endpoints = mpesaConfig.getEndpoints();

    // Make query request
    const response = await axios.post(endpoints.stkQuery, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      status: response.data.ResultCode === '0' ? 'success' : 'failed'
    };

  } catch (error) {
    console.error('M-Pesa Query Error:', error.response?.data || error.message);
    throw new ErrorResponse('Failed to query payment status', 500);
  }
};

/**
 * Process M-Pesa callback
 * @param {object} callbackData - Callback data from M-Pesa
 * @returns {object} Processed payment details
 */
const processCallback = (callbackData) => {
  try {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    const result = {
      merchantRequestId: stkCallback.MerchantRequestID,
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc
    };

    // If payment was successful
    if (stkCallback.ResultCode === 0) {
      const callbackMetadata = stkCallback.CallbackMetadata.Item;

      result.success = true;
      result.amount = callbackMetadata.find(item => item.Name === 'Amount')?.Value;
      result.mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      result.transactionDate = callbackMetadata.find(item => item.Name === 'TransactionDate')?.Value;
      result.phoneNumber = callbackMetadata.find(item => item.Name === 'PhoneNumber')?.Value;
    } else {
      result.success = false;
    }

    return result;

  } catch (error) {
    console.error('M-Pesa Callback Processing Error:', error);
    throw new ErrorResponse('Failed to process M-Pesa callback', 500);
  }
};

module.exports = {
  generateAccessToken,
  initiateSTKPush,
  querySTKPushStatus,
  processCallback,
  formatPhoneNumber
};