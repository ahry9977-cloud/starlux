import { useCallback, useMemo, useState } from "react";

type User = {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (_email: string, _password: string) => {
    setIsLoading(true);
    try {
      // TODO: wire to real API (tRPC)
      setUser({ id: 1, email: _email, name: _email.split("@")[0] ?? "User", role: "user" });
      return { success: true } as const;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return useMemo(
    () => ({
      user,
      isLoading,
      loading: isLoading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, isLoading, isAuthenticated, login, logout]
  );
}
