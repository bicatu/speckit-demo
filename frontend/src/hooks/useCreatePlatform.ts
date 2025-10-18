import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface CreatePlatformData {
  name: string;
}

export function useCreatePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlatformData) => {
      const response = await api.post<{ platformId: string; message: string }>(
        '/platforms',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });
}
