import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * LogoutButton - terminates user session and clears tokens
 * Optionally redirects to identity provider logout
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className,
  children = 'Logout',
}) => {
  const { logout, error } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setLogoutError(null);
      await logout();
      // Navigation handled by authService (provider logout redirect or stay on page)
    } catch (err) {
      console.error('Logout failed:', err);
      setLogoutError(err instanceof Error ? err.message : 'Logout failed');
      // Even if logout fails, user state is cleared in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={className}
        style={{
          padding: '0.5rem 1rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Logging out...' : children}
      </button>
      {(logoutError || error) && (
        <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {logoutError || error}
        </p>
      )}
    </div>
  );
};
