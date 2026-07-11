"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { AppSession, PersonId, ViewScope } from "@/lib/types";
import { viewScopeFromSession } from "@/lib/types";

const SESSION_KEY = "phunda-session";

interface PersonSessionContextValue {
  session: AppSession | null;
  hydrated: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  personId: PersonId | null;
  viewScope: ViewScope | null;
  loginAsPerson: (personId: PersonId) => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const PersonSessionContext = createContext<PersonSessionContextValue | null>(
  null,
);

export function PersonSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession, hydrated] = useLocalStorage<AppSession | null>(
    SESSION_KEY,
    null,
  );

  const loginAsPerson = useCallback(
    (personId: PersonId) => {
      setSession({ role: "person", personId });
    },
    [setSession],
  );

  const loginAsAdmin = useCallback(() => {
    setSession({ role: "admin" });
  }, [setSession]);

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const value = useMemo<PersonSessionContextValue>(() => {
    const isLoggedIn = session !== null;
    const isAdmin = session?.role === "admin";
    const personId =
      session?.role === "person" ? session.personId : null;

    return {
      session,
      hydrated,
      isLoggedIn,
      isAdmin,
      personId,
      viewScope: session ? viewScopeFromSession(session) : null,
      loginAsPerson,
      loginAsAdmin,
      logout,
    };
  }, [session, hydrated, loginAsPerson, loginAsAdmin, logout]);

  return (
    <PersonSessionContext.Provider value={value}>
      {children}
    </PersonSessionContext.Provider>
  );
}

export function usePersonSession() {
  const ctx = useContext(PersonSessionContext);
  if (!ctx) {
    throw new Error("usePersonSession must be used within PersonSessionProvider");
  }
  return ctx;
}
