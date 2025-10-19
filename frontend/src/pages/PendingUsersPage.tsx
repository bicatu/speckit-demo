import React, { useState } from 'react';
import { usePendingUsers, PendingUser } from '../hooks/usePendingUsers';
import { useApproveUser } from '../hooks/useApproveUser';
import { useRejectUser } from '../hooks/useRejectUser';

/**
 * PendingUsersPage component
 * Admin-only page for managing user approval requests
 */
export const PendingUsersPage: React.FC = () => {
  const { data, isLoading, error } = usePendingUsers();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const [confirmingAction, setConfirmingAction] = useState<{
    userId: string;
    action: 'approve' | 'reject';
  } | null>(null);

  const handleApprove = async (userId: string) => {
    setConfirmingAction({ userId, action: 'approve' });
  };

  const handleReject = async (userId: string) => {
    setConfirmingAction({ userId, action: 'reject' });
  };

  const confirmAction = async () => {
    if (!confirmingAction) return;

    try {
      if (confirmingAction.action === 'approve') {
        await approveUser.mutateAsync(confirmingAction.userId);
      } else {
        await rejectUser.mutateAsync(confirmingAction.userId);
      }
      setConfirmingAction(null);
    } catch (err) {
      console.error('Error processing user approval:', err);
    }
  };

  const cancelAction = () => {
    setConfirmingAction(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading pending users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="error-message">
          <p>Failed to load pending users. Please try again later.</p>
        </div>
      </div>
    );
  }

  const pendingUsers = data?.users || [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Pending User Approvals</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Review and approve or reject user access requests.
      </p>

      {pendingUsers.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            No pending user approvals at this time.
          </p>
        </div>
      ) : (
        <div className="pending-users-list">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Requested</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user: PendingUser) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>{user.name}</td>
                  <td style={{ padding: '1rem' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    {formatDate(user.approvalRequestedAt)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={approveUser.isPending || rejectUser.isPending}
                      style={{
                        padding: '0.5rem 1rem',
                        marginRight: '0.5rem',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={approveUser.isPending || rejectUser.isPending}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmingAction && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Confirm {confirmingAction.action === 'approve' ? 'Approval' : 'Rejection'}</h2>
            <p>
              Are you sure you want to {confirmingAction.action} this user's access request?
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={confirmAction}
                disabled={approveUser.isPending || rejectUser.isPending}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: confirmingAction.action === 'approve' ? '#4caf50' : '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Confirm
              </button>
              <button
                onClick={cancelAction}
                disabled={approveUser.isPending || rejectUser.isPending}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
