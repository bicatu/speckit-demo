import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  className?: string;
}

/**
 * UserProfile - displays authenticated user information
 * Shows user's display name, email, and admin badge if applicable
 */
export const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={className} style={{ padding: '0.5rem' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 'bold' }}>{user.displayName}</div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>{user.email}</div>
      </div>
      {user.isAdmin && (
        <span
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: '#f59e0b',
            color: 'white',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          ADMIN
        </span>
      )}
      {import.meta.env.MODE === 'development' && (
        <span
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: '#fbbf24',
            color: '#78350f',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
          title="Development environment - using local auth provider"
        >
          DEV
        </span>
      )}
    </div>
  );
};
