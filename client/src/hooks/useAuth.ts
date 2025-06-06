import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { login, register, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { InsertUser } from '@shared/schema';

export function useAuth() {
  const { user, token, isAuthenticated, login: setAuth, logout: clearAuth } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: InsertUser) => register(userData),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast({
        title: "Registration successful",
        description: `Welcome to ACEPlacementHub, ${data.user.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isAuthenticated && !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  return {
    user: currentUser || user,
    token,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
