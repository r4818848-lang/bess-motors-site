"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  isClientAuthenticated,
  logout,
  restoreSessionFromToken,
} from "@/lib/auth";
import type { User } from "@/lib/store";
import { DB_CHANGED_EVENT } from "@/lib/db-events";

interface AuthContextValue {
  sessionReady: boolean;
  clientUser: User | null;
  isClientLoggedIn: boolean;
  refreshAuth: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [clientUser, setClientUser] = useState<User | null>(null);

  const refreshAuth = useCallback(() => {
    setClientUser(isClientAuthenticated() ? getCurrentUser() : null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    restoreSessionFromToken()
      .then((user) => {
        if (cancelled) return;
        if (user?.role === "client") {
          setClientUser(user);
        } else {
          refreshAuth();
        }
      })
      .catch(() => {
        if (!cancelled) refreshAuth();
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshAuth]);

  useEffect(() => {
    const onDbChanged = () => refreshAuth();
    window.addEventListener(DB_CHANGED_EVENT, onDbChanged);
    return () => window.removeEventListener(DB_CHANGED_EVENT, onDbChanged);
  }, [refreshAuth]);

  const signOut = useCallback(() => {
    logout();
    setClientUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        sessionReady,
        clientUser,
        isClientLoggedIn: !!clientUser,
        refreshAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthSessionProvider");
  return ctx;
}
