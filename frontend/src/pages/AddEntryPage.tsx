import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEntry } from '../hooks/useCreateEntry';
import { useTags } from '../hooks/useTags';
import { usePlatforms } from '../hooks/usePlatforms';
import '../index.css';

export function AddEntryPage() {
  const navigate = useNavigate();
  const createEntry = useCreateEntry();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const { data: platforms, isLoading: platformsLoading } = usePlatforms();

  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'film' | 'series'>('film');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [platformId, setPlatformId] = useState<string>('');
  const [initialRating, setInitialRating] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string>('');

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      if (prev.length >= 3) {
        setError('You can select a maximum of 3 tags');
        return prev;
      }
      return [...prev, tagId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (selectedTags.length === 0) {
      setError('Please select at least 1 tag');
      return;
    }

    if (selectedTags.length > 3) {
      setError('You can select a maximum of 3 tags');
      return;
    }

    try {
      const data = {
        title: title.trim(),
        mediaType,
        tagIds: selectedTags,
        platformId: platformId || undefined,
        initialRating: initialRating || undefined,
      };

      await createEntry.mutateAsync(data);
      navigate('/');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to create entry';
      setError(errorMessage);
    }
  };

  if (tagsLoading || platformsLoading) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Add New Entry</h1>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Back to Browse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-entry-form">
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">
            Title <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Enter movie or series title"
            required
          />
        </div>

        {/* Media Type */}
        <div className="form-group">
          <label htmlFor="mediaType">
            Type <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            id="mediaType"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as 'film' | 'series')}
            required
          >
            <option value="film">Film</option>
            <option value="series">Series</option>
          </select>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>
            Genre Tags (1-3) <span style={{ color: 'red' }}>*</span>
          </label>
          <div className="tag-selection">
            {tags?.map((tag) => (
              <label key={tag.id} className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
          <small>{selectedTags.length}/3 tags selected</small>
        </div>

        {/* Platform */}
        <div className="form-group">
          <label htmlFor="platform">Streaming Platform (Optional)</label>
          <select
            id="platform"
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
          >
            <option value="">-- None --</option>
            {platforms?.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Rating */}
        <div className="form-group">
          <label htmlFor="rating">Your Rating (Optional)</label>
          <select
            id="rating"
            value={initialRating || ''}
            onChange={(e) =>
              setInitialRating(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">-- No rating --</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <option key={score} value={score}>
                {score} {score === 1 ? 'star' : 'stars'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={createEntry.isPending}>
            {createEntry.isPending ? 'Creating...' : 'Create Entry'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
            disabled={createEntry.isPending}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
