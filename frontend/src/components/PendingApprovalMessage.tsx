/**
 * PendingApprovalMessage component
 * Displays a message to users whose account is pending admin approval
 */
export function PendingApprovalMessage() {
  return (
    <div className="pending-approval-container">
      <div className="pending-approval-card">
        <h2>Account Pending Approval</h2>
        <p>
          Your account has been created successfully, but it requires approval from an administrator before you can access the application.
        </p>
        <p>
          You will receive an email notification once your account has been approved. This typically takes 1-2 business days.
        </p>
        <div className="pending-approval-info">
          <strong>What happens next?</strong>
          <ul>
            <li>An administrator will review your account request</li>
            <li>You'll receive an email notification when approved</li>
            <li>After approval, you can log in and start using the application</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
