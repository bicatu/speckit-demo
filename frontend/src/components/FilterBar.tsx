import React from 'react';
import type { GenreTag } from '../hooks/useTags';
import type { StreamingPlatform } from '../hooks/usePlatforms';

interface FilterBarProps {
  mediaType: 'film' | 'series' | '';
  platformId: string;
  selectedTagIds: string[];
  sortBy: 'recent' | 'topRated' | 'title';
  tags: GenreTag[];
  platforms: StreamingPlatform[];
  onMediaTypeChange: (value: 'film' | 'series' | '') => void;
  onPlatformChange: (value: string) => void;
  onTagToggle: (tagId: string) => void;
  onSortByChange: (value: 'recent' | 'topRated' | 'title') => void;
  onClearFilters: () => void;
}

/**
 * Filter bar component with dropdowns and tag selection
 */
export function FilterBar({
  mediaType,
  platformId,
  selectedTagIds,
  sortBy,
  tags,
  platforms,
  onMediaTypeChange,
  onPlatformChange,
  onTagToggle,
  onSortByChange,
  onClearFilters,
}: FilterBarProps) {
  const hasActiveFilters = mediaType !== '' || platformId !== '' || selectedTagIds.length > 0;

  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#1976d2',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Media Type Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Type
          </label>
          <select
            value={mediaType}
            onChange={(e) => onMediaTypeChange(e.target.value as 'film' | 'series' | '')}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            <option value="">All</option>
            <option value="film">Films</option>
            <option value="series">Series</option>
          </select>
        </div>

        {/* Platform Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Platform
          </label>
          <select
            value={platformId}
            onChange={(e) => onPlatformChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'recent' | 'topRated' | 'title')}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="topRated">Top Rated</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Genre Tags */}
      {tags.length > 0 && (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Genres
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => onTagToggle(tag.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: isSelected ? '2px solid #1976d2' : '1px solid #ddd',
                    backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                    color: isSelected ? '#1976d2' : '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isSelected ? '500' : 'normal',
                    transition: 'all 0.2s',
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
