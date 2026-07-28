"use client";

import { PersonSessionProvider } from "@/context/PersonSessionContext";
import { AchievementProvider } from "@/context/AchievementProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PersonSessionProvider>
      <AchievementProvider>
        {children}
      </AchievementProvider>
    </PersonSessionProvider>
  );
}
