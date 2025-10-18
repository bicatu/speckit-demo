import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EntryDetailsPage } from '../../../../src/pages/EntryDetailsPage';
import * as useEntryDetailsModule from '../../../../src/hooks/useEntryDetails';
import * as useUpdateEntryModule from '../../../../src/hooks/useUpdateEntry';

describe('EntryDetailsPage - Edit Functionality', () => {
  const mockEntry = {
    id: 'entry-123',
    title: 'Original Title',
    mediaType: 'film' as const,
    platformId: 'platform-1',
    platformName: 'Netflix',
    tags: [
      { id: 'tag-1', name: 'Action' },
      { id: 'tag-2', name: 'Drama' },
    ],
    averageRating: 8.5,
    userRating: 9,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/entries/${mockEntry.id}`]}>
          <Routes>
            <Route path="/entries/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should show edit button when not in edit mode', () => {
    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });

  it('should show edit form when edit button clicked', () => {
    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue(mockEntry.title)).toBeInTheDocument();
  });

  it('should call update mutation with correct data', async () => {
    const mockMutate = vi.fn();

    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    const titleInput = screen.getByDisplayValue(mockEntry.title);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        entryId: mockEntry.id,
        title: 'Updated Title',
      });
    });
  });

  it('should cancel edit mode when cancel button clicked', () => {
    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    const titleInput = screen.getByDisplayValue(mockEntry.title);
    fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument();
    expect(screen.getByText(mockEntry.title)).toBeInTheDocument();
  });

  it('should show loading state during update', () => {
    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/updating/i)).toBeInTheDocument();
  });

  it('should exit edit mode after successful update', async () => {
    let mutateCallback: any;

    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: (data, options) => {
        mutateCallback = options?.onSuccess;
      },
      isPending: false,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    if (mutateCallback) {
      mutateCallback();
    }

    await waitFor(() => {
      expect(screen.queryByDisplayValue(mockEntry.title)).not.toBeInTheDocument();
    });
  });

  it('should validate required fields before submitting', async () => {
    const mockMutate = vi.fn();

    vi.spyOn(useEntryDetailsModule, 'useEntryDetails').mockReturnValue({
      data: mockEntry,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useUpdateEntryModule, 'useUpdateEntry').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    render(<EntryDetailsPage />, { wrapper: createWrapper() });

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    const titleInput = screen.getByDisplayValue(mockEntry.title);
    fireEvent.change(titleInput, { target: { value: '' } });

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });
});
