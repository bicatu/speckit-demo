import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface AddRatingResponse {
  message: string;
  rating: {
    userId: string;
    entryId: string;
    stars: number;
  };
}

interface UseAddRatingOptions {
  entryId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for adding or updating a rating for an entry
 * Handles optimistic updates and cache invalidation
 */
export function useAddRating({ entryId, onSuccess, onError }: UseAddRatingOptions) {
  const queryClient = useQueryClient();

  return useMutation<AddRatingResponse, Error, number>({
    mutationFn: async (stars: number) => {
      const response = await api.post<AddRatingResponse>(
        `/entries/${entryId}/ratings`,
        { stars }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch entry details to get updated average rating
      queryClient.invalidateQueries({ queryKey: ['entry', entryId] });
      
      // Invalidate entries list to update the average rating there too
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      
      // Call the optional success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      // Call the optional error callback
      if (onError) {
        onError(error);
      }
    },
  });
}
