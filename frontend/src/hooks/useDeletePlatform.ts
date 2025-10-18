import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useDeletePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platformId: string) => {
      await api.delete(`/platforms/${platformId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });
}
