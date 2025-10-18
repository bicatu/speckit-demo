import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../../../src/components/FilterBar';

describe('FilterBar', () => {
  const mockTags = [
    { id: 'tag-1', name: 'Action' },
    { id: 'tag-2', name: 'Drama' },
    { id: 'tag-3', name: 'Comedy' },
  ];

  const mockPlatforms = [
    { id: 'platform-1', name: 'Netflix' },
    { id: 'platform-2', name: 'Amazon Prime' },
  ];

  const defaultProps = {
    mediaType: '' as const,
    platformId: '',
    selectedTagIds: [],
    sortBy: 'recent' as const,
    newToMe: false,
    tags: mockTags,
    platforms: mockPlatforms,
    onMediaTypeChange: vi.fn(),
    onPlatformChange: vi.fn(),
    onTagToggle: vi.fn(),
    onSortByChange: vi.fn(),
    onNewToMeChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render all filter sections', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Platform')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
      expect(screen.getByText('Genres')).toBeInTheDocument();
    });

    it('should render "New to Me" checkbox', () => {
      render(<FilterBar {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /new to me/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render all genre tags as buttons', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Drama')).toBeInTheDocument();
      expect(screen.getByText('Comedy')).toBeInTheDocument();
    });

    it('should render all platforms in dropdown', () => {
      render(<FilterBar {...defaultProps} />);

      const platformSelect = screen.getByLabelText('Platform');
      expect(platformSelect).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Amazon Prime')).toBeInTheDocument();
    });
  });

  describe('Media Type Filter', () => {
    it('should call onMediaTypeChange when selecting film', async () => {
      const onMediaTypeChange = vi.fn();
      render(<FilterBar {...defaultProps} onMediaTypeChange={onMediaTypeChange} />);

      const select = screen.getByLabelText('Type');
      await userEvent.selectOptions(select, 'film');

      expect(onMediaTypeChange).toHaveBeenCalledWith('film');
    });

    it('should call onMediaTypeChange when selecting series', async () => {
      const onMediaTypeChange = vi.fn();
      render(<FilterBar {...defaultProps} onMediaTypeChange={onMediaTypeChange} />);

      const select = screen.getByLabelText('Type');
      await userEvent.selectOptions(select, 'series');

      expect(onMediaTypeChange).toHaveBeenCalledWith('series');
    });

    it('should show selected media type', () => {
      render(<FilterBar {...defaultProps} mediaType="film" />);

      const select = screen.getByLabelText('Type') as HTMLSelectElement;
      expect(select.value).toBe('film');
    });
  });

  describe('Platform Filter', () => {
    it('should call onPlatformChange when selecting a platform', async () => {
      const onPlatformChange = vi.fn();
      render(<FilterBar {...defaultProps} onPlatformChange={onPlatformChange} />);

      const select = screen.getByLabelText('Platform');
      await userEvent.selectOptions(select, 'platform-1');

      expect(onPlatformChange).toHaveBeenCalledWith('platform-1');
    });

    it('should show selected platform', () => {
      render(<FilterBar {...defaultProps} platformId="platform-1" />);

      const select = screen.getByLabelText('Platform') as HTMLSelectElement;
      expect(select.value).toBe('platform-1');
    });
  });

  describe('Sort By Filter', () => {
    it('should call onSortByChange when selecting a sort option', async () => {
      const onSortByChange = vi.fn();
      render(<FilterBar {...defaultProps} onSortByChange={onSortByChange} />);

      const select = screen.getByLabelText('Sort By');
      await userEvent.selectOptions(select, 'topRated');

      expect(onSortByChange).toHaveBeenCalledWith('topRated');
    });

    it('should show selected sort option', () => {
      render(<FilterBar {...defaultProps} sortBy="topRated" />);

      const select = screen.getByLabelText('Sort By') as HTMLSelectElement;
      expect(select.value).toBe('topRated');
    });
  });

  describe('Genre Tags Filter', () => {
    it('should call onTagToggle when clicking a tag', async () => {
      const onTagToggle = vi.fn();
      render(<FilterBar {...defaultProps} onTagToggle={onTagToggle} />);

      const actionButton = screen.getByText('Action');
      await userEvent.click(actionButton);

      expect(onTagToggle).toHaveBeenCalledWith('tag-1');
    });

    it('should highlight selected tags', () => {
      render(<FilterBar {...defaultProps} selectedTagIds={['tag-1', 'tag-3']} />);

      const actionButton = screen.getByText('Action');
      const dramaButton = screen.getByText('Drama');
      const comedyButton = screen.getByText('Comedy');

      expect(actionButton).toHaveStyle({ backgroundColor: '#e3f2fd' });
      expect(dramaButton).toHaveStyle({ backgroundColor: '#fff' });
      expect(comedyButton).toHaveStyle({ backgroundColor: '#e3f2fd' });
    });
  });

  describe('New To Me Filter (User Story 4)', () => {
    it('should call onNewToMeChange when checkbox is clicked', async () => {
      const onNewToMeChange = vi.fn();
      render(<FilterBar {...defaultProps} onNewToMeChange={onNewToMeChange} />);

      const checkbox = screen.getByRole('checkbox', { name: /new to me/i });
      await userEvent.click(checkbox);

      expect(onNewToMeChange).toHaveBeenCalledWith(true);
    });

    it('should uncheck when clicking checked checkbox', async () => {
      const onNewToMeChange = vi.fn();
      render(<FilterBar {...defaultProps} newToMe={true} onNewToMeChange={onNewToMeChange} />);

      const checkbox = screen.getByRole('checkbox', { name: /new to me/i });
      await userEvent.click(checkbox);

      expect(onNewToMeChange).toHaveBeenCalledWith(false);
    });

    it('should display checkbox as checked when newToMe is true', () => {
      render(<FilterBar {...defaultProps} newToMe={true} />);

      const checkbox = screen.getByRole('checkbox', { name: /new to me/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should display checkbox as unchecked when newToMe is false', () => {
      render(<FilterBar {...defaultProps} newToMe={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /new to me/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should have proper label for accessibility', () => {
      render(<FilterBar {...defaultProps} />);

      const label = screen.getByText(/new to me/i);
      expect(label).toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('should show "Clear all" button when filters are active', () => {
      render(<FilterBar {...defaultProps} mediaType="film" />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should show "Clear all" button when platform is selected', () => {
      render(<FilterBar {...defaultProps} platformId="platform-1" />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should show "Clear all" button when tags are selected', () => {
      render(<FilterBar {...defaultProps} selectedTagIds={['tag-1']} />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should show "Clear all" button when newToMe is active', () => {
      render(<FilterBar {...defaultProps} newToMe={true} />);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should not show "Clear all" button when no filters are active', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('should call onClearFilters when clicking "Clear all"', async () => {
      const onClearFilters = vi.fn();
      render(<FilterBar {...defaultProps} mediaType="film" onClearFilters={onClearFilters} />);

      const clearButton = screen.getByText('Clear all');
      await userEvent.click(clearButton);

      expect(onClearFilters).toHaveBeenCalled();
    });
  });

  describe('Multiple Filters Combined', () => {
    it('should handle multiple active filters simultaneously', () => {
      render(
        <FilterBar
          {...defaultProps}
          mediaType="film"
          platformId="platform-1"
          selectedTagIds={['tag-1', 'tag-2']}
          sortBy="topRated"
          newToMe={true}
        />
      );

      const typeSelect = screen.getByLabelText('Type') as HTMLSelectElement;
      const platformSelect = screen.getByLabelText('Platform') as HTMLSelectElement;
      const sortSelect = screen.getByLabelText('Sort By') as HTMLSelectElement;
      const checkbox = screen.getByRole('checkbox', { name: /new to me/i }) as HTMLInputElement;

      expect(typeSelect.value).toBe('film');
      expect(platformSelect.value).toBe('platform-1');
      expect(sortSelect.value).toBe('topRated');
      expect(checkbox.checked).toBe(true);
      expect(screen.getByText('Action')).toHaveStyle({ backgroundColor: '#e3f2fd' });
      expect(screen.getByText('Drama')).toHaveStyle({ backgroundColor: '#e3f2fd' });
    });
  });
});
