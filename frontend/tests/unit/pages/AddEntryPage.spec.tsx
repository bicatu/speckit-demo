import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddEntryPage } from '../../../src/pages/AddEntryPage';
import * as useCreateEntryModule from '../../../src/hooks/useCreateEntry';
import * as useTagsModule from '../../../src/hooks/useTags';
import * as usePlatformsModule from '../../../src/hooks/usePlatforms';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AddEntryPage', () => {
  let queryClient: QueryClient;

  const mockTags = [
    { id: 'tag-1', name: 'Action' },
    { id: 'tag-2', name: 'Drama' },
    { id: 'tag-3', name: 'Comedy' },
    { id: 'tag-4', name: 'Sci-Fi' },
  ];

  const mockPlatforms = [
    { id: 'platform-1', name: 'Netflix' },
    { id: 'platform-2', name: 'Amazon Prime' },
    { id: 'platform-3', name: 'Disney+' },
  ];

  const mockCreateEntry = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockNavigate.mockClear();
    mockCreateEntry.mutateAsync.mockClear();

    // Mock hooks
    vi.spyOn(useCreateEntryModule, 'useCreateEntry').mockReturnValue(mockCreateEntry as any);
    vi.spyOn(useTagsModule, 'useTags').mockReturnValue({
      data: mockTags,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.spyOn(usePlatformsModule, 'usePlatforms').mockReturnValue({
      data: mockPlatforms,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
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

  it('should render the form with all required fields', () => {
    renderAddEntryPage();

    expect(screen.getByText('Add New Entry')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Genre Tags \(1-3\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Streaming Platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Rating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Entry/i })).toBeInTheDocument();
  });

  it('should display loading state when tags are loading', () => {
    vi.spyOn(useTagsModule, 'useTags').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    renderAddEntryPage();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display loading state when platforms are loading', () => {
    vi.spyOn(usePlatformsModule, 'usePlatforms').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    renderAddEntryPage();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show error when submitting without title', async () => {
    renderAddEntryPage();

    // The form has required attribute on title, so we need to remove it or fill it then clear it
    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    
    // Fill with whitespace only
    fireEvent.change(titleInput, { target: { value: '   ' } });

    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    expect(mockCreateEntry.mutateAsync).not.toHaveBeenCalled();
  });

  it('should show error when submitting without tags', async () => {
    renderAddEntryPage();

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Movie' } });

    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select at least 1 tag')).toBeInTheDocument();
    });

    expect(mockCreateEntry.mutateAsync).not.toHaveBeenCalled();
  });

  it('should prevent selecting more than 3 tags', async () => {
    renderAddEntryPage();

    // Select first 3 tags
    const tag1 = screen.getByLabelText('Action');
    const tag2 = screen.getByLabelText('Drama');
    const tag3 = screen.getByLabelText('Comedy');
    const tag4 = screen.getByLabelText('Sci-Fi');

    fireEvent.click(tag1);
    fireEvent.click(tag2);
    fireEvent.click(tag3);

    // Try to select 4th tag
    fireEvent.click(tag4);

    await waitFor(() => {
      expect(screen.getByText('You can select a maximum of 3 tags')).toBeInTheDocument();
    });

    // Verify 4th tag is not checked
    expect(tag4).not.toBeChecked();
  });

  it('should successfully submit form with valid required data', async () => {
    mockCreateEntry.mutateAsync.mockResolvedValue({ entryId: 'entry-123' });

    renderAddEntryPage();

    // Fill in title
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Movie' } });

    // Select media type
    const mediaTypeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(mediaTypeSelect, { target: { value: 'film' } });

    // Select tag
    const tag1 = screen.getByLabelText('Action');
    fireEvent.click(tag1);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateEntry.mutateAsync).toHaveBeenCalledWith({
        title: 'Test Movie',
        mediaType: 'film',
        tagIds: ['tag-1'],
        platformId: undefined,
        initialRating: undefined,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should successfully submit form with all optional fields', async () => {
    mockCreateEntry.mutateAsync.mockResolvedValue({ entryId: 'entry-123' });

    renderAddEntryPage();

    // Fill in title
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Series' } });

    // Select media type
    const mediaTypeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(mediaTypeSelect, { target: { value: 'series' } });

    // Select 2 tags
    const tag1 = screen.getByLabelText('Action');
    const tag2 = screen.getByLabelText('Drama');
    fireEvent.click(tag1);
    fireEvent.click(tag2);

    // Select platform
    const platformSelect = screen.getByLabelText(/Streaming Platform/i);
    fireEvent.change(platformSelect, { target: { value: 'platform-1' } });

    // Select rating
    const ratingSelect = screen.getByLabelText(/Your Rating/i);
    fireEvent.change(ratingSelect, { target: { value: '8' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateEntry.mutateAsync).toHaveBeenCalledWith({
        title: 'Test Series',
        mediaType: 'series',
        tagIds: ['tag-1', 'tag-2'],
        platformId: 'platform-1',
        initialRating: 8,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should display error message when API call fails', async () => {
    const errorMessage = 'Entry with this title already exists';
    mockCreateEntry.mutateAsync.mockRejectedValue({
      response: { data: { error: errorMessage } },
    });

    renderAddEntryPage();

    // Fill in form
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Duplicate Movie' } });

    const tag1 = screen.getByLabelText('Action');
    fireEvent.click(tag1);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should navigate back to browse when back button is clicked', () => {
    renderAddEntryPage();

    const backButton = screen.getByRole('button', { name: /Back to Browse/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should navigate back to browse when cancel button is clicked', () => {
    renderAddEntryPage();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should disable submit button when mutation is pending', () => {
    vi.spyOn(useCreateEntryModule, 'useCreateEntry').mockReturnValue({
      ...mockCreateEntry,
      isPending: true,
    } as any);

    renderAddEntryPage();

    const submitButton = screen.getByRole('button', { name: /Creating.../i });
    expect(submitButton).toBeDisabled();
  });

  it('should allow deselecting tags', () => {
    renderAddEntryPage();

    const tag1 = screen.getByLabelText('Action');

    // Select tag
    fireEvent.click(tag1);
    expect(tag1).toBeChecked();

    // Deselect tag
    fireEvent.click(tag1);
    expect(tag1).not.toBeChecked();
  });

  it('should show tag count indicator', () => {
    renderAddEntryPage();

    expect(screen.getByText('0/3 tags selected')).toBeInTheDocument();

    const tag1 = screen.getByLabelText('Action');
    fireEvent.click(tag1);

    expect(screen.getByText('1/3 tags selected')).toBeInTheDocument();
  });
});
