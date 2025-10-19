import React, { useState } from 'react';
import { useTags, GenreTag } from '../hooks/useTags';
import { usePlatforms, StreamingPlatform } from '../hooks/usePlatforms';
import { useCreateTag } from '../hooks/useCreateTag';
import { useDeleteTag } from '../hooks/useDeleteTag';
import { useCreatePlatform } from '../hooks/useCreatePlatform';
import { useDeletePlatform } from '../hooks/useDeletePlatform';

/**
 * ManageResourcesPage component
 * Admin-only page for managing tags and streaming platforms
 */
export const ManageResourcesPage: React.FC = () => {
  const { data: tags, isLoading: tagsLoading, error: tagsError } = useTags();
  const { data: platforms, isLoading: platformsLoading, error: platformsError } = usePlatforms();
  
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const createPlatform = useCreatePlatform();
  const deletePlatform = useDeletePlatform();

  const [newTagName, setNewTagName] = useState('');
  const [newPlatformName, setNewPlatformName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<{
    type: 'tag' | 'platform';
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag.mutateAsync({ name: newTagName.trim() });
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;

    try {
      await createPlatform.mutateAsync({ name: newPlatformName.trim() });
      setNewPlatformName('');
    } catch (error) {
      console.error('Error creating platform:', error);
    }
  };

  const handleDeleteTag = (tag: GenreTag) => {
    setConfirmingDelete({ type: 'tag', id: tag.id, name: tag.name });
    setDeleteError(null);
  };

  const handleDeletePlatform = (platform: StreamingPlatform) => {
    setConfirmingDelete({ type: 'platform', id: platform.id, name: platform.name });
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!confirmingDelete) return;

    try {
      if (confirmingDelete.type === 'tag') {
        await deleteTag.mutateAsync(confirmingDelete.id);
      } else {
        await deletePlatform.mutateAsync(confirmingDelete.id);
      }
      setConfirmingDelete(null);
      setDeleteError(null);
    } catch (error: any) {
      // Handle deletion prevented error (tag/platform in use)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete';
      const affectedEntries = error?.response?.data?.affectedEntries || [];
      
      if (affectedEntries.length > 0) {
        setDeleteError(
          `Cannot delete this ${confirmingDelete.type} because it is used by ${affectedEntries.length} ${
            affectedEntries.length === 1 ? 'entry' : 'entries'
          }. Please remove it from those entries first.`
        );
      } else {
        setDeleteError(errorMessage);
      }
    }
  };

  const cancelDelete = () => {
    setConfirmingDelete(null);
    setDeleteError(null);
  };

  if (tagsLoading || platformsLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading resources...</p>
      </div>
    );
  }

  if (tagsError || platformsError) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="error-message">
          <p>Failed to load resources. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Manage Tags & Platforms</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Create and manage genre tags and streaming platforms for the application.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Genre Tags Section */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Genre Tags</h2>
          
          {/* Create Tag Form */}
          <form onSubmit={handleCreateTag} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
                disabled={createTag.isPending}
              />
              <button
                type="submit"
                disabled={!newTagName.trim() || createTag.isPending}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                {createTag.isPending ? 'Creating...' : 'Add Tag'}
              </button>
            </div>
          </form>

          {/* Tags List */}
          <div style={{ 
            backgroundColor: '#f9f9f9', 
            borderRadius: '8px', 
            padding: '1rem',
            minHeight: '200px',
          }}>
            {tags && tags.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tags.map((tag: GenreTag) => (
                  <li
                    key={tag.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{tag.name}</span>
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      disabled={deleteTag.isPending}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                No tags yet. Create your first tag above.
              </p>
            )}
          </div>
        </div>

        {/* Streaming Platforms Section */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Streaming Platforms</h2>
          
          {/* Create Platform Form */}
          <form onSubmit={handleCreatePlatform} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newPlatformName}
                onChange={(e) => setNewPlatformName(e.target.value)}
                placeholder="New platform name"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
                disabled={createPlatform.isPending}
              />
              <button
                type="submit"
                disabled={!newPlatformName.trim() || createPlatform.isPending}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                {createPlatform.isPending ? 'Creating...' : 'Add Platform'}
              </button>
            </div>
          </form>

          {/* Platforms List */}
          <div style={{ 
            backgroundColor: '#f9f9f9', 
            borderRadius: '8px', 
            padding: '1rem',
            minHeight: '200px',
          }}>
            {platforms && platforms.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {platforms.map((platform: StreamingPlatform) => (
                  <li
                    key={platform.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{platform.name}</span>
                    <button
                      onClick={() => handleDeletePlatform(platform)}
                      disabled={deletePlatform.isPending}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                No platforms yet. Create your first platform above.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmingDelete && (
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
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the {confirmingDelete.type}{' '}
              <strong>"{confirmingDelete.name}"</strong>?
            </p>
            {deleteError && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#ffebee',
                  border: '1px solid #ef5350',
                  borderRadius: '4px',
                  color: '#c62828',
                  marginTop: '1rem',
                }}
              >
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {!deleteError ? (
                <>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteTag.isPending || deletePlatform.isPending}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    {deleteTag.isPending || deletePlatform.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={cancelDelete}
                    disabled={deleteTag.isPending || deletePlatform.isPending}
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
                </>
              ) : (
                <button
                  onClick={cancelDelete}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
