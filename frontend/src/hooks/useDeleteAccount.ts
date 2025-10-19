import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook for deleting user account
 * Implements FR-019: User account deletion with data anonymization
 * 
 * @returns Mutation object with deleteAccount function
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/api/users/me');
      return response.data;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to logout or home page
      // This should trigger the authentication flow to clear the session
      window.location.href = '/';
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete account';
      console.error('Account deletion failed:', errorMessage);
      
      // Show error to user
      alert(errorMessage);
    },
  });
}
