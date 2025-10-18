import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface Entry {
  id: string;
  title: string;
  mediaType: 'film' | 'series';
  platformId: string;
  platformName: string;
  averageRating: number | null;
  tags: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface EntriesFilters {
  mediaType?: 'film' | 'series';
  platformId?: string;
  tagIds?: string[];
  newToMe?: boolean;
  sortBy?: 'recent' | 'topRated' | 'title';
  limit?: number;
  offset?: number;
}

interface EntriesResponse {
  entries: Entry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Hook to fetch entries with filters, sorting, and pagination
 */
export function useEntries(filters: EntriesFilters = {}) {
  return useQuery({
    queryKey: ['entries', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.mediaType) params.append('mediaType', filters.mediaType);
      if (filters.platformId) params.append('platformId', filters.platformId);
      if (filters.tagIds && filters.tagIds.length > 0) {
        filters.tagIds.forEach(tagId => params.append('tagIds', tagId));
      }
      if (filters.newToMe) params.append('newToMe', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
      if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

      const response = await api.get<EntriesResponse>(`/entries?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
