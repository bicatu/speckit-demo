import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface EntryDetails {
  id: string;
  title: string;
  mediaType: 'film' | 'series';
  platformId: string;
  platformName: string;
  averageRating: number | null;
  ratingCount: number;
  tags: Array<{ id: string; name: string }>;
  creator: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch a single entry by ID with full details
 */
export function useEntryDetails(entryId: string | undefined) {
  return useQuery({
    queryKey: ['entry', entryId],
    queryFn: async () => {
      if (!entryId) throw new Error('Entry ID is required');
      const response = await api.get<EntryDetails>(`/entries/${entryId}`);
      return response.data;
    },
    enabled: !!entryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
