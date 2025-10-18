import { useState } from 'react';
import { useDeleteAccount } from '../hooks/useDeleteAccount';

/**
 * User Settings Page
 * Provides account management functionality including account deletion (FR-019)
 */
export function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteAccount = useDeleteAccount();

  const handleDeleteAccount = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    // User confirmed deletion
    deleteAccount.mutate();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Account Settings</h1>

      <div style={{ marginTop: '3rem' }}>
        <h2>Danger Zone</h2>
        <div
          style={{
            border: '2px solid #dc3545',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '1rem',
          }}
        >
          <h3 style={{ color: '#dc3545', marginTop: 0 }}>Delete Account</h3>
          <p>
            Once you delete your account, there is no going back. Your account
            will be permanently deleted.
          </p>
          <p>
            <strong>Note:</strong> Your contributions (entries and ratings) will
            be preserved but anonymized as "Deleted User" to maintain data
            integrity.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: '1rem',
              }}
            >
              Delete Account
            </button>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccount.isPending}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: deleteAccount.isPending ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: deleteAccount.isPending ? 0.6 : 1,
                  }}
                >
                  {deleteAccount.isPending ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={deleteAccount.isPending}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: deleteAccount.isPending ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteAccount.isError && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                border: '1px solid #f5c6cb',
              }}
            >
              Failed to delete account. Please try again or contact support if
              the problem persists.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
