import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface StreamingPlatform {
  id: string;
  name: string;
}

interface PlatformsResponse {
  platforms: StreamingPlatform[];
}

/**
 * Hook to fetch all streaming platforms for filter dropdowns
 */
export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await api.get<PlatformsResponse>('/platforms');
      return response.data.platforms;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - platforms change infrequently
  });
}
