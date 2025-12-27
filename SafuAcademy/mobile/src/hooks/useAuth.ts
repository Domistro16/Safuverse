import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@services/authService';
import { User } from '@types/index';

export const AUTH_KEYS = {
  me: ['auth', 'me'] as const,
  isAuthenticated: ['auth', 'isAuthenticated'] as const,
};

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: () => authService.getMe(),
    retry: false,
    enabled: false, // Only fetch when explicitly needed
  });

  const { data: isAuthenticated, isLoading: isCheckingAuth } = useQuery({
    queryKey: AUTH_KEYS.isAuthenticated,
    queryFn: () => authService.isAuthenticated(),
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      signature,
      message,
    }: {
      walletAddress: string;
      signature: string;
      message: string;
    }) => {
      return await authService.verifySignature(walletAddress, signature, message);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_KEYS.me, data.user);
      queryClient.setQueryData(AUTH_KEYS.isAuthenticated, true);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_KEYS.me, null);
      queryClient.setQueryData(AUTH_KEYS.isAuthenticated, false);
      queryClient.clear();
    },
  });

  const getNonceMutation = useMutation({
    mutationFn: (walletAddress: string) => authService.getNonce(walletAddress),
  });

  return {
    user,
    isAuthenticated: !!isAuthenticated,
    isLoading: isLoadingUser || isCheckingAuth,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    getNonce: getNonceMutation.mutate,
    getNonceAsync: getNonceMutation.mutateAsync,
    isGettingNonce: getNonceMutation.isPending,
  };
};
