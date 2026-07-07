import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLogin, useLogout, useMe } from '../hooks/queries/auth';
import type { User } from '../types/template.types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | undefined>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const { data: user, isLoading, refetch } = useMe(Boolean(token));
  const loginMutation = useLogin();
  const clearSession = useLogout();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation.mutateAsync({ email, password });
      setToken(result.token);
    },
    [loginMutation],
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const result = await refetch();
    return result.data;
  }, [refetch]);

  const value = useMemo(
    () => ({
      user: user ?? null,
      token,
      loading: Boolean(token) && isLoading && !user,
      login,
      logout,
      refreshUser,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
