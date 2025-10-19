import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  approvalRequestedAt: string;
  createdAt: string;
}

interface PendingUsersResponse {
  users: PendingUser[];
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ['users', 'pending'],
    queryFn: async () => {
      const response = await api.get<PendingUsersResponse>('/users/pending');
      return response.data;
    },
  });
}
