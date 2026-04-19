import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiPost, setToken, getToken, api } from "./api.ts";
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from "@lms/shared";

type AuthUser = AuthResponse["user"];

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      if (!getToken()) return;
      try {
        const res = await api.get<ApiResponse<AuthUser>>("/auth/me");
        if (alive && res.data.success) setUser(res.data.data);
      } catch {
        setToken(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (body) => {
        const data = await apiPost<AuthResponse, LoginRequest>("/auth/login", body);
        setToken(data.token);
        setUser(data.user);
      },
      register: async (body) => {
        const data = await apiPost<AuthResponse, RegisterRequest>("/auth/register", body);
        setToken(data.token);
        setUser(data.user);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
