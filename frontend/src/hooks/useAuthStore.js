import { useProjectStore } from '../store/useProjectStore';

export const useAuthStore = () => {
  const auth = useProjectStore((state) => state.auth);
  const setAuthData = useProjectStore((state) => state.setAuthData);
  const setAuthUser = useProjectStore((state) => state.setAuthUser);
  const setAuthToken = useProjectStore((state) => state.setAuthToken);
  const setAuthLoading = useProjectStore((state) => state.setAuthLoading);
  const setAuthError = useProjectStore((state) => state.setAuthError);
  const clearAuth = useProjectStore((state) => state.clearAuth);

  const login = (authData) => {
    setAuthData(authData);
  };

  const logout = () => {
    clearAuth();
  };

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    setAuthUser,
    setAuthToken,
    setAuthLoading,
    setAuthError,
  };
};
