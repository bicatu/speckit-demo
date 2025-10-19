import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
    },
  });
}
