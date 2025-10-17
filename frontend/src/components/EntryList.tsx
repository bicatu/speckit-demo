import React from 'react';
import { EntryCard } from './EntryCard';
import type { Entry } from '../hooks/useEntries';

interface EntryListProps {
  entries: Entry[];
  isLoading: boolean;
  error: Error | null;
  onEntryClick: (entryId: string) => void;
}

/**
 * List component displaying multiple entry cards with loading and error states
 */
export function EntryList({ entries, isLoading, error, onEntryClick }: EntryListProps) {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '18px' }}>Loading entries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#d32f2f', fontSize: '18px', marginBottom: '8px' }}>
          Error loading entries
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          {error.message || 'An unexpected error occurred'}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '18px' }}>No entries found</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Try adjusting your filters or add new entries
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        padding: '20px 0',
      }}
    >
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry.id)} />
      ))}
    </div>
  );
}
