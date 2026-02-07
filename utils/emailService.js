const nodemailer = require('nodemailer');

/**
 * Email Service for sending password reset PINs
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    // Create reusable transporter
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send password reset PIN to user's email
   * @param {string} email - User's email address
   * @param {string} pin - 6-digit PIN
   * @param {string} userName - User's name
   */
  async sendPasswordResetPIN(email, pin, userName) {
    const fromName = process.env.EMAIL_FROM_NAME || 'MSU Nursing Portal';
    
    const mailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset PIN - MSU Nursing Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .pin-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>We received a request to reset your password for your MSU Nursing Portal account.</p>
              
              <p>Your password reset PIN is:</p>
              
              <div class="pin-box">${pin}</div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This PIN will expire in <strong>15 minutes</strong></li>
                  <li>Do not share this PIN with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>Enter this PIN on the password reset page to create a new password.</p>
              
              <p style="margin-top: 30px;">
                <strong>Need help?</strong><br>
                If you have any questions or concerns, please contact your administrator.
              </p>
            </div>
            <div class="footer">
              <p>MSU Nursing Student Portal<br>
              This is an automated email, please do not reply.</p>
              <p style="margin-top: 10px; color: #999;">
                © ${new Date().getFullYear()} Mindanao State University
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  /**
   * Send password reset notification to user
   * @param {string} email - User's email address
   * @param {string} tempPassword - Temporary password
   * @param {string} userName - User's name
   */
  async sendPasswordResetNotification(email, tempPassword, userName) {
    const fromName = process.env.EMAIL_FROM_NAME || 'MSU Nursing Portal';
    
    const mailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Has Been Reset - MSU Nursing Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .password-box { background: #f0f9ff; border: 2px dashed #0284c7; color: #0369a1; font-size: 20px; font-weight: bold; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Notification</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>An administrator has reset your password for your MSU Nursing Portal account.</p>
              
              <p><strong>Your new temporary password is:</strong></p>
              
              <div class="password-box">${tempPassword}</div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Login immediately</strong> and change this password</li>
                  <li>You will be <strong>required to change</strong> this password on your next login</li>
                  <li><strong>Do not share</strong> this password with anyone</li>
                  <li>Delete this email after changing your password</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>How to login:</strong><br>
                1. Go to the admin login page<br>
                2. Enter your email and the temporary password above<br>
                3. You'll be prompted to change your password immediately
              </p>
              
              <p style="margin-top: 20px;">
                <strong>Need help?</strong><br>
                If you have any questions or did not request this password reset, please contact your administrator immediately.
              </p>
            </div>
            <div class="footer">
              <p>MSU Nursing Student Portal<br>
              This is an automated email, please do not reply.</p>
              <p style="margin-top: 10px; color: #999;">
                © ${new Date().getFullYear()} Mindanao State University
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset notification sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('Failed to send email notification');
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      // Check if email is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️ Email service not configured (optional for basic features)');
        return false;
      }
      
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
