/**
 * Email service interface for sending notifications
 * Infrastructure layer implementation will use nodemailer
 */
export interface IEmailService {
  /**
   * Send an email
   * @param to Recipient email address
   * @param subject Email subject line
   * @param htmlBody HTML content of the email
   * @param textBody Plain text content (fallback)
   * @returns Promise that resolves to true if sent successfully, false otherwise
   * @throws Never throws - logs errors and returns false on failure per FR-006
   */
  sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody: string
  ): Promise<boolean>;

  /**
   * Send new user approval request notification to admin
   * @param userEmail Email of the user requesting access
   * @param userName Name of the user requesting access
   * @param requestedAt Timestamp when access was requested
   * @returns Promise that resolves to true if sent successfully, false otherwise
   */
  sendNewUserNotification(
    userEmail: string,
    userName: string,
    requestedAt: Date
  ): Promise<boolean>;
}
