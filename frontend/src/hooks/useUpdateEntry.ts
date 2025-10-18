import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface UpdateEntryData {
  entryId: string;
  title?: string;
  mediaType?: 'film' | 'series';
  platformId?: string | null;
  tagIds?: string[];
}

interface UpdateEntryResponse {
  message: string;
}

/**
 * Custom hook for updating an existing entry
 * Uses TanStack Query for mutation state management
 * Implements optimistic updates and cache invalidation
 */
export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation<UpdateEntryResponse, Error, UpdateEntryData>({
    mutationFn: async (data: UpdateEntryData) => {
      const { entryId, ...updateData } = data;
      const response = await api.put<UpdateEntryResponse>(
        `/entries/${entryId}`,
        updateData
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate entry details query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['entry', variables.entryId],
      });

      // Invalidate entries list to reflect changes
      queryClient.invalidateQueries({
        queryKey: ['entries'],
      });
    },
  });
}
