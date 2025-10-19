import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEntries } from '../hooks/useEntries';
import { EntryList } from '../components/EntryList';
import { PendingApprovalMessage } from '../components/PendingApprovalMessage';

/**
 * Home Page Component
 * 
 * US1: Returning User Direct Entry Access
 * - If authenticated and approved → show entry list
 * - If authenticated but pending → show pending approval message
 * - If not authenticated → redirect to login page
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Fetch entries for authenticated users
  const {
    data: entriesData,
    isLoading: entriesLoading,
    error: entriesError,
  } = useEntries({
    sortBy: 'recent',
    limit: 12,
    offset: 0,
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated → redirect to login page (US2)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but pending approval (US3)
  if (user?.approvalStatus === 'pending') {
    return <PendingApprovalMessage />;
  }

  // Authenticated but rejected
  if (user?.approvalStatus === 'rejected') {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          border: '1px solid #dc3545',
          borderRadius: '4px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{ marginTop: 0, color: '#721c24' }}>Account Access Rejected</h2>
          <p style={{ marginBottom: 0 }}>
            Your account access request has been rejected. Please contact the administrator for more information.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated and approved → show entry list (US1)
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to MovieTrack</h1>
      <p style={{ marginBottom: '2rem' }}>Browse and rate movies from the collection below.</p>
      <EntryList
        entries={entriesData?.entries || []}
        isLoading={entriesLoading}
        error={entriesError}
        onEntryClick={(id) => navigate(`/entries/${id}`)}
      />
    </div>
  );
};
