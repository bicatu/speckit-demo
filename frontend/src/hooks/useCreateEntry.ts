import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

interface CreateEntryData {
  title: string;
  mediaType: 'film' | 'series';
  tagIds: string[];
  platformId?: string;
  initialRating?: number;
}

interface CreateEntryResponse {
  message: string;
  entryId: string;
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEntryData): Promise<CreateEntryResponse> => {
      const response = await apiClient.post<CreateEntryResponse>('/entries', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch entries list
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}
