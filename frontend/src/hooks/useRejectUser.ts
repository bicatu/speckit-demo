import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useRejectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
    },
  });
}
