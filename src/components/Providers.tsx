"use client";

import { PersonSessionProvider } from "@/context/PersonSessionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PersonSessionProvider>{children}</PersonSessionProvider>;
}
