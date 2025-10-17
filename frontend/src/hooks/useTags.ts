import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface GenreTag {
  id: string;
  name: string;
}

interface TagsResponse {
  tags: GenreTag[];
}

/**
 * Hook to fetch all genre tags for filter dropdowns
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get<TagsResponse>('/tags');
      return response.data.tags;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - tags change infrequently
  });
}
