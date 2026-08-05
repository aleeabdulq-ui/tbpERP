import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, setAccessToken } from "@/lib/api";
import type { LoginResponse, SessionUser } from "@/lib/types";

type AuthState = {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<SessionUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  const applySession = useCallback((data: LoginResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  // Restore the session on boot via the rotated refresh cookie.
  useEffect(() => {
    let cancelled = false;
    api
      .post<LoginResponse>("/auth/refresh")
      .then(({ data }) => !cancelled && applySession(data))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setReady(true));
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:expired", onExpired);
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const { data } = await api.post<LoginResponse>("/auth/login", { email, password, rememberMe });
      queryClient.clear();
      return applySession(data);
    },
    [applySession, queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
