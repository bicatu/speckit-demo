import { useState } from 'react';
import { usePlatforms } from '../hooks/usePlatforms';
import { useTags } from '../hooks/useTags';
import { useCreatePlatform } from '../hooks/useCreatePlatform';
import { useDeletePlatform } from '../hooks/useDeletePlatform';
import { useCreateTag } from '../hooks/useCreateTag';
import { useDeleteTag } from '../hooks/useDeleteTag';

export function AdminPage() {
  const [platformName, setPlatformName] = useState('');
  const [tagName, setTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: platforms = [], isLoading: platformsLoading } = usePlatforms();
  const { data: tags = [], isLoading: tagsLoading } = useTags();

  const createPlatform = useCreatePlatform();
  const deletePlatform = useDeletePlatform();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await createPlatform.mutateAsync({ name: platformName });
      setSuccess('Platform created successfully');
      setPlatformName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create platform');
    }
  };

  const handleDeletePlatform = async (platformId: string) => {
    if (!confirm('Are you sure you want to delete this platform?')) return;
    
    setError(null);
    setSuccess(null);

    try {
      await deletePlatform.mutateAsync(platformId);
      setSuccess('Platform deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete platform');
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await createTag.mutateAsync({ name: tagName });
      setSuccess('Tag created successfully');
      setTagName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    setError(null);
    setSuccess(null);

    try {
      await deleteTag.mutateAsync(tagId);
      setSuccess('Tag deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tag');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Admin Panel</h1>

      {error && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: '#efe', 
          border: '1px solid #cfc',
          borderRadius: '4px',
          color: '#3c3'
        }}>
          {success}
        </div>
      )}

      {/* Platform Management */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Streaming Platforms</h2>
        
        <form onSubmit={handleCreatePlatform} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Platform name"
              style={{ 
                flex: 1, 
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
            <button 
              type="submit" 
              disabled={createPlatform.isPending}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: createPlatform.isPending ? 'not-allowed' : 'pointer'
              }}
            >
              {createPlatform.isPending ? 'Creating...' : 'Add Platform'}
            </button>
          </div>
        </form>

        {platformsLoading ? (
          <p>Loading platforms...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {platforms.map((platform) => (
              <li 
                key={platform.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px',
                  marginBottom: '5px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <span>{platform.name}</span>
                <button
                  onClick={() => handleDeletePlatform(platform.id)}
                  disabled={deletePlatform.isPending}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deletePlatform.isPending ? 'not-allowed' : 'pointer'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tag Management */}
      <section>
        <h2>Genre Tags</h2>
        
        <form onSubmit={handleCreateTag} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Tag name"
              style={{ 
                flex: 1, 
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
            <button 
              type="submit" 
              disabled={createTag.isPending}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: createTag.isPending ? 'not-allowed' : 'pointer'
              }}
            >
              {createTag.isPending ? 'Creating...' : 'Add Tag'}
            </button>
          </div>
        </form>

        {tagsLoading ? (
          <p>Loading tags...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tags.map((tag) => (
              <li 
                key={tag.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px',
                  marginBottom: '5px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={deleteTag.isPending}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleteTag.isPending ? 'not-allowed' : 'pointer'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
