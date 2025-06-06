import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { login, register, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { InsertUser } from '@shared/schema';

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();

  const { data, error, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('Failed to fetch profile');
        }

        return response.json();
      } catch (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  React.useEffect(() => {
    if (data === null) {
      clearUser();
    } else if (data) {
      setUser(data);
    }
  }, [data, setUser, clearUser]);

  return {
    user: data || user,
    isLoading,
    error
  };
}