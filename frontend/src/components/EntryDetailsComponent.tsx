import React from 'react';
import type { EntryDetails } from '../hooks/useEntryDetails';
import { RatingInput } from './RatingInput';
import { useAddRating } from '../hooks/useAddRating';
import { useUpdateEntry } from '../hooks/useUpdateEntry';
import { useTags } from '../hooks/useTags';
import { usePlatforms } from '../hooks/usePlatforms';

interface EntryDetailsComponentProps {
  entry: EntryDetails;
  onBack: () => void;
}

/**
 * Detailed view component showing full entry information
 */
export function EntryDetailsComponent({ entry, onBack }: EntryDetailsComponentProps) {
  const [ratingError, setRatingError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(entry.title);
  const [editMediaType, setEditMediaType] = React.useState<'film' | 'series'>(entry.mediaType);
  const [editPlatformId, setEditPlatformId] = React.useState<string | null>(entry.platformId);
  const [editTagIds, setEditTagIds] = React.useState<string[]>(entry.tags.map((t) => t.id));

  const { data: tags = [] } = useTags();
  const { data: platforms = [] } = usePlatforms();

  // TODO: Get current user's rating from entry details (requires backend update)
  // For now, we'll assume no existing rating (null)
  const currentUserRating: number | null = null;

  const addRatingMutation = useAddRating({
    entryId: entry.id,
    onSuccess: () => {
      setSuccessMessage('Rating submitted successfully!');
      setRatingError(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setRatingError(error.message || 'Failed to submit rating');
      setSuccessMessage(null);
    },
  });

  const updateEntryMutation = useUpdateEntry();

  const handleRatingSubmit = (stars: number) => {
    setRatingError(null);
    setSuccessMessage(null);
    addRatingMutation.mutate(stars);
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset form
      setEditTitle(entry.title);
      setEditMediaType(entry.mediaType);
      setEditPlatformId(entry.platformId);
      setEditTagIds(entry.tags.map((t) => t.id));
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      setRatingError('Title is required');
      return;
    }

    if (editTagIds.length < 1 || editTagIds.length > 3) {
      setRatingError('Please select between 1 and 3 tags');
      return;
    }

    updateEntryMutation.mutate(
      {
        entryId: entry.id,
        title: editTitle,
        mediaType: editMediaType,
        platformId: editPlatformId,
        tagIds: editTagIds,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Entry updated successfully!');
          setRatingError(null);
          setIsEditMode(false);
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error) => {
          setRatingError(error.message || 'Failed to update entry');
          setSuccessMessage(null);
        },
      }
    );
  };

  const handleTagToggle = (tagId: string) => {
    if (editTagIds.includes(tagId)) {
      setEditTagIds(editTagIds.filter((id) => id !== tagId));
    } else {
      if (editTagIds.length < 3) {
        setEditTagIds([...editTagIds, tagId]);
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Back to List
        </button>

        {!isEditMode && (
          <button
            onClick={handleEditToggle}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Entry Header */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
        {isEditMode ? (
          <div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                width: '100%',
                fontSize: '32px',
                fontWeight: '600',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <select
                value={editMediaType}
                onChange={(e) => setEditMediaType(e.target.value as 'film' | 'series')}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                }}
              >
                <option value="film">🎬 Film</option>
                <option value="series">📺 Series</option>
              </select>

              <select
                value={editPlatformId || ''}
                onChange={(e) => setEditPlatformId(e.target.value || null)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  flex: 1,
                }}
              >
                <option value="">No Platform</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                Select Tags (1-3):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      backgroundColor: editTagIds.includes(tag.id) ? '#1976d2' : '#fff',
                      color: editTagIds.includes(tag.id) ? '#fff' : '#000',
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveEdit}
                disabled={updateEntryMutation.isPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: updateEntryMutation.isPending ? '#ccc' : '#4CAF50',
                  color: 'white',
                  cursor: updateEntryMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {updateEntryMutation.isPending ? 'Updating...' : 'Save'}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={updateEntryMutation.isPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#fff',
                  cursor: updateEntryMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>{entry.title}</h1>
              {entry.averageRating !== null && (
                <div
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ★ {entry.averageRating.toFixed(1)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              <span style={{ textTransform: 'capitalize' }}>
                {entry.mediaType === 'film' ? '🎬 Film' : '📺 Series'}
              </span>
              <span>•</span>
              <span>{entry.platformName}</span>
            </div>

            {entry.ratingCount > 0 && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                Based on {entry.ratingCount} {entry.ratingCount === 1 ? 'rating' : 'ratings'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px 20px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Rating Input Section */}
      <RatingInput
        currentRating={currentUserRating}
        onSubmit={handleRatingSubmit}
        isSubmitting={addRatingMutation.isPending}
        error={ratingError}
      />

      {/* Tags Section */}
      {entry.tags.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Genres</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {entry.tags.map((tag) => (
              <span
                key={tag.id}
                style={{
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Creator Section */}
      {entry.creator && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Added By</h2>
          <div style={{ fontSize: '16px', color: '#666' }}>{entry.creator.name}</div>
        </div>
      )}

      {/* Metadata Section */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#999' }}>
          <span>Added: {new Date(entry.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(entry.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
