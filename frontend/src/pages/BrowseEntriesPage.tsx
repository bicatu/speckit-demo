import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { useEntryDetails } from '../hooks/useEntryDetails';
import { useTags } from '../hooks/useTags';
import { usePlatforms } from '../hooks/usePlatforms';
import { FilterBar } from '../components/FilterBar';
import { EntryList } from '../components/EntryList';
import { Pagination } from '../components/Pagination';
import { EntryDetailsComponent } from '../components/EntryDetailsComponent';

/**
 * Main page for browsing and discovering entries (User Story 1)
 */
export function BrowseEntriesPage() {
  const navigate = useNavigate();
  const { entryId } = useParams<{ entryId?: string }>();

  // Filter state
  const [mediaType, setMediaType] = useState<'film' | 'series' | ''>('');
  const [platformId, setPlatformId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newToMe, setNewToMe] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recent' | 'topRated' | 'title'>('recent');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch data
  const { data: tagsData, isLoading: tagsLoading } = useTags();
  const { data: platformsData, isLoading: platformsLoading } = usePlatforms();
  
  const {
    data: entriesData,
    isLoading: entriesLoading,
    error: entriesError,
  } = useEntries({
    mediaType: mediaType || undefined,
    platformId: platformId || undefined,
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    newToMe: newToMe || undefined,
    sortBy,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });

  const {
    data: entryDetails,
    isLoading: detailsLoading,
    error: detailsError,
  } = useEntryDetails(entryId);

  // Handlers
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setMediaType('');
    setPlatformId('');
    setSelectedTagIds([]);
    setNewToMe(false);
    setCurrentPage(1);
  };

  const handleMediaTypeChange = (value: 'film' | 'series' | '') => {
    setMediaType(value);
    setCurrentPage(1);
  };

  const handlePlatformChange = (value: string) => {
    setPlatformId(value);
    setCurrentPage(1);
  };

  const handleSortByChange = (value: 'recent' | 'topRated' | 'title') => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleNewToMeChange = (value: boolean) => {
    setNewToMe(value);
    setCurrentPage(1);
  };

  const handleEntryClick = (id: string) => {
    navigate(`/entries/${id}`);
  };

  const handleBackToList = () => {
    navigate('/entries');
  };

  // Show details view if entryId is present
  if (entryId) {
    if (detailsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '18px' }}>Loading entry details...</div>
        </div>
      );
    }

    if (detailsError) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: '#d32f2f', fontSize: '18px', marginBottom: '8px' }}>
            Error loading entry details
          </div>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            {detailsError.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={handleBackToList}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back to List
          </button>
        </div>
      );
    }

    if (!entryDetails) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: '#666', fontSize: '18px', marginBottom: '16px' }}>Entry not found</div>
          <button
            onClick={handleBackToList}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back to List
          </button>
        </div>
      );
    }

    return <EntryDetailsComponent entry={entryDetails} onBack={handleBackToList} />;
  }

  // Show list view
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>
          Browse Movies & Series
        </h1>
        <button
          onClick={() => navigate('/entries/add')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + Add Entry
        </button>
      </div>

      <FilterBar
        mediaType={mediaType}
        platformId={platformId}
        selectedTagIds={selectedTagIds}
        sortBy={sortBy}
        newToMe={newToMe}
        tags={tagsData || []}
        platforms={platformsData || []}
        onMediaTypeChange={handleMediaTypeChange}
        onPlatformChange={handlePlatformChange}
        onTagToggle={handleTagToggle}
        onSortByChange={handleSortByChange}
        onNewToMeChange={handleNewToMeChange}
        onClearFilters={handleClearFilters}
      />

      <EntryList
        entries={entriesData?.entries || []}
        isLoading={entriesLoading || tagsLoading || platformsLoading}
        error={entriesError}
        onEntryClick={handleEntryClick}
      />

      {entriesData && entriesData.total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={entriesData.total}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
