import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface CreateTagData {
  name: string;
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTagData) => {
      const response = await api.post<{ tagId: string; message: string }>(
        '/tags',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
