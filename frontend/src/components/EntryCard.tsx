import type { Entry } from '../hooks/useEntries';

interface EntryCardProps {
  entry: Entry;
  onClick?: () => void;
}

/**
 * Card component displaying a single entry with its details
 */
export function EntryCard({ entry, onClick }: EntryCardProps) {
  return (
    <div
      className="entry-card"
      onClick={onClick}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        backgroundColor: '#fff',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          {entry.title}
        </h3>
        {entry.averageRating && (
          <div
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ★ {entry.averageRating.toFixed(1)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
        <span style={{ textTransform: 'capitalize' }}>
          {entry.mediaType === 'film' ? '🎬 Film' : '📺 Series'}
        </span>
        <span>•</span>
        <span>{entry.platformName}</span>
      </div>

      {entry.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {entry.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
        Added {new Date(entry.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
