/**
 * ============================================
 * EMAIL SERVICE
 * ============================================
 * Send emails using Nodemailer
 */

const nodemailer = require('nodemailer');
const {
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  passwordResetEmail,
  lowStockAlertEmail
} = require('../services/emailTemplates');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email
 * @param {object} options - Email options
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    // Don't throw error - email failures shouldn't break the application
    return null;
  }
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user) => {
  const html = welcomeEmail(user.fullName);
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Furniture Hub! 🪑',
    html
  });
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (order) => {
  const html = orderConfirmationEmail(order);
  
  return sendEmail({
    to: order.customer.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html
  });
};

/**
 * Send order status update email
 */
const sendOrderStatusEmail = async (order, newStatus) => {
  const html = orderStatusEmail(order, newStatus);
  
  return sendEmail({
    to: order.customer.email,
    subject: `Order Update - ${order.orderNumber}`,
    html
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = passwordResetEmail(user.fullName, resetUrl);
  
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html
  });
};

/**
 * Send low stock alert to admin
 */
const sendLowStockAlert = async (products) => {
  const html = lowStockAlertEmail(products);
  
  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: '⚠️ Low Stock Alert - Furniture Hub',
    html
  });
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
  sendLowStockAlert,
  testEmailConfig
};