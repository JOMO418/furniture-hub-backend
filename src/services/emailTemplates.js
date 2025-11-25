/**
 * ============================================
 * EMAIL TEMPLATES
 * ============================================
 * HTML email templates for various notifications
 */

/**
 * Welcome email template
 */
const welcomeEmail = (name) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5f2d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { background: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🪑 Welcome to Furniture Hub!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for joining Furniture Hub. We're excited to have you as part of our community.</p>
            <p>Explore our wide range of quality furniture for your home and office.</p>
            <a href="${process.env.FRONTEND_URL}/products" class="button">Start Shopping</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Furniture Hub. All rights reserved.</p>
            <p>Nairobi, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  /**
   * Order confirmation email template
   */
  const orderConfirmationEmail = (order) => {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Ksh ${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Ksh ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5f2d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #2c5f2d; }
          .button { background: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order, ${order.customer.fullName}!</h2>
            <p>Your order has been confirmed and will be delivered soon.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
              <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
              
              <h3>Items Ordered</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                    <td style="padding: 10px; text-align: right;">Ksh ${order.subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Delivery Fee:</strong></td>
                    <td style="padding: 10px; text-align: right;">Ksh ${order.deliveryFee.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;" class="total">TOTAL:</td>
                    <td style="padding: 10px; text-align: right;" class="total">Ksh ${order.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              
              <h3>Delivery Address</h3>
              <p>
                ${order.customer.fullName}<br>
                ${order.customer.phone}<br>
                ${order.customer.address}<br>
                ${order.customer.city}
              </p>
              
              <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">Track Order</a>
            
            <p>We'll send you another email when your order ships.</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at ${process.env.EMAIL_FROM}</p>
            <p>&copy; ${new Date().getFullYear()} Furniture Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  /**
   * Order status update email
   */
  const orderStatusEmail = (order, newStatus) => {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is being processed and will ship soon.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered. Enjoy your new furniture!',
      cancelled: 'Your order has been cancelled.'
    };
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5f2d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; 
                        border-left: 4px solid #2c5f2d; }
          .button { background: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Order Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${order.customer.fullName},</h2>
            
            <div class="status-box">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Status:</strong> ${newStatus.toUpperCase()}</p>
              <p>${statusMessages[newStatus]}</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">View Order Details</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Furniture Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  /**
   * Password reset email
   */
  const passwordResetEmail = (name, resetUrl) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5f2d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { background: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 5px; display: inline-block; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 30 minutes.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Furniture Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  /**
   * Low stock alert email (for admins)
   */
  const lowStockAlertEmail = (products) => {
    const productsHtml = products.map(product => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${product.stock}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${product.category}</td>
      </tr>
    `).join('');
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <h2>Low Stock Products</h2>
            <p>The following products are running low on stock:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Stock</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>
            
            <p>Please restock these items to avoid running out.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Furniture Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  module.exports = {
    welcomeEmail,
    orderConfirmationEmail,
    orderStatusEmail,
    passwordResetEmail,
    lowStockAlertEmail
  };