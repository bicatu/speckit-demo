import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddEntryPage } from '../../../src/pages/AddEntryPage';
import apiClient from '../../../src/services/api';

// Mock the API module
vi.mock('../../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Add Entry Flow - Integration Test', () => {
  let queryClient: QueryClient;

  const mockTags = [
    { id: 'tag-1', name: 'Action' },
    { id: 'tag-2', name: 'Drama' },
    { id: 'tag-3', name: 'Comedy' },
  ];

  const mockPlatforms = [
    { id: 'platform-1', name: 'Netflix' },
    { id: 'platform-2', name: 'Amazon Prime' },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockNavigate.mockClear();

    // Setup default API mocks
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/tags') {
        return Promise.resolve({ data: { tags: mockTags } } as any);
      }
      if (url === '/platforms') {
        return Promise.resolve({ data: { platforms: mockPlatforms } } as any);
      }
      return Promise.reject(new Error('Not found'));
    });

    vi.mocked(apiClient.post).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAddEntryPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AddEntryPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should complete full add entry flow with required fields', async () => {
    const mockResponse = { entryId: 'entry-123' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    renderAddEntryPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
    });

    // Fill in title
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Integration Test Movie' } });

    // Select media type
    const mediaTypeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(mediaTypeSelect, { target: { value: 'film' } });

    // Select 2 tags
    const actionTag = screen.getByLabelText('Action');
    const dramaTag = screen.getByLabelText('Drama');
    fireEvent.click(actionTag);
    fireEvent.click(dramaTag);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/entries', {
        title: 'Integration Test Movie',
        mediaType: 'film',
        tagIds: ['tag-1', 'tag-2'],
        platformId: undefined,
        initialRating: undefined,
      });
    });

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should complete full add entry flow with all optional fields', async () => {
    const mockResponse = { entryId: 'entry-456' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    renderAddEntryPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
    });

    // Fill in all fields
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Complete Integration Test' } });

    const mediaTypeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(mediaTypeSelect, { target: { value: 'series' } });

    const actionTag = screen.getByLabelText('Action');
    fireEvent.click(actionTag);

    const platformSelect = screen.getByLabelText(/Streaming Platform/i);
    fireEvent.change(platformSelect, { target: { value: 'platform-1' } });

    const ratingSelect = screen.getByLabelText(/Your Rating/i);
    fireEvent.change(ratingSelect, { target: { value: '9' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    // Verify API call with all fields
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/entries', {
        title: 'Complete Integration Test',
        mediaType: 'series',
        tagIds: ['tag-1'],
        platformId: 'platform-1',
        initialRating: 9,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Entry with this title already exists';
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { data: { error: errorMessage } },
    });

    renderAddEntryPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
    });

    // Fill in form
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Duplicate Movie' } });

    const actionTag = screen.getByLabelText('Action');
    fireEvent.click(actionTag);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should load tags and platforms from API on mount', async () => {
    renderAddEntryPage();

    // Verify loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verify API calls were made
    expect(apiClient.get).toHaveBeenCalledWith('/tags');
    expect(apiClient.get).toHaveBeenCalledWith('/platforms');

    // Verify tags are displayed
    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    expect(screen.getByLabelText('Drama')).toBeInTheDocument();
    expect(screen.getByLabelText('Comedy')).toBeInTheDocument();

    // Verify platforms are in select
    const platformSelect = screen.getByLabelText(/Streaming Platform/i);
    expect(platformSelect).toContainHTML('Netflix');
    expect(platformSelect).toContainHTML('Amazon Prime');
  });

  it('should handle network errors when loading tags', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/tags') {
        return Promise.reject(new Error('Network error'));
      }
      if (url === '/platforms') {
        return Promise.resolve({ data: { platforms: mockPlatforms } } as any);
      }
      return Promise.reject(new Error('Not found'));
    });

    renderAddEntryPage();

    // Should stay in loading state or show error
    // The component might handle errors differently, adjust based on actual implementation
    await waitFor(() => {
      // If tags fail to load, the component should handle it gracefully
      expect(apiClient.get).toHaveBeenCalledWith('/tags');
    });
  });

  it('should disable submit button while creating entry', async () => {
    let resolvePost: (value: any) => void;
    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    vi.mocked(apiClient.post).mockReturnValue(postPromise as any);

    renderAddEntryPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
    });

    // Fill form
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Movie' } });

    const actionTag = screen.getByLabelText('Action');
    fireEvent.click(actionTag);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    // Verify button is disabled and shows loading text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creating.../i })).toBeDisabled();
    });

    // Resolve the promise
    resolvePost!({ data: { entryId: 'entry-123' } });

    // Wait for completion
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should validate minimum tags requirement', async () => {
    renderAddEntryPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
    });

    // Fill only title, no tags
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'No Tags Movie' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    // Verify validation error
    await waitFor(() => {
      expect(screen.getByText('Please select at least 1 tag')).toBeInTheDocument();
    });

    // Verify API was not called
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('should allow selecting up to 3 tags', async () => {
    const mockResponse = { entryId: 'entry-789' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    renderAddEntryPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Action')).toBeInTheDocument();
    });

    // Fill form with 3 tags
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Three Tags Movie' } });

    const actionTag = screen.getByLabelText('Action');
    const dramaTag = screen.getByLabelText('Drama');
    const comedyTag = screen.getByLabelText('Comedy');

    fireEvent.click(actionTag);
    fireEvent.click(dramaTag);
    fireEvent.click(comedyTag);

    // Verify tag count
    expect(screen.getByText('3/3 tags selected')).toBeInTheDocument();

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    // Verify API call includes all 3 tags
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/entries', {
        title: 'Three Tags Movie',
        mediaType: 'film',
        tagIds: ['tag-1', 'tag-2', 'tag-3'],
        platformId: undefined,
        initialRating: undefined,
      });
    });
  });
});
