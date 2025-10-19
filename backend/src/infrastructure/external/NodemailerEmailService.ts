import nodemailer from 'nodemailer';
import { IEmailService } from './IEmailService';

/**
 * Email service implementation using Nodemailer
 * Supports SMTP and other transports configured via environment variables
 */
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private adminEmail: string;

  constructor() {
    // Get configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  /**
   * Send an email
   * Never throws - catches all errors and returns false per FR-006
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text: textBody,
        html: htmlBody,
      });
      return true;
    } catch (error) {
      // Log error but don't throw - per FR-006
      console.error('Email sending failed:', {
        timestamp: new Date().toISOString(),
        to,
        subject,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send new user approval request notification to admin
   */
  async sendNewUserNotification(
    userEmail: string,
    userName: string,
    requestedAt: Date
  ): Promise<boolean> {
    const subject = 'New User Access Request';
    
    const htmlBody = `
      <h2>New User Access Request</h2>
      <p>A new user has requested access to the application.</p>
      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${this.escapeHtml(userName)}</li>
        <li><strong>Email:</strong> ${this.escapeHtml(userEmail)}</li>
        <li><strong>Request Time:</strong> ${requestedAt.toLocaleString()}</li>
      </ul>
      <p>Please log in to the admin panel to review and approve/reject this request.</p>
    `;

    const textBody = `
New User Access Request

A new user has requested access to the application.

User Details:
- Name: ${userName}
- Email: ${userEmail}
- Request Time: ${requestedAt.toLocaleString()}

Please log in to the admin panel to review and approve/reject this request.
    `;

    return this.sendEmail(this.adminEmail, subject, htmlBody, textBody);
  }

  /**
   * Basic HTML escaping to prevent XSS in emails
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
