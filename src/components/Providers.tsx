"use client";

import { PersonSessionProvider } from "@/context/PersonSessionContext";
import { HouseholdConfigProvider } from "@/context/HouseholdConfigContext";
import { AchievementProvider } from "@/context/AchievementProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdConfigProvider>
      <PersonSessionProvider>
        <AchievementProvider>
          {children}
        </AchievementProvider>
      </PersonSessionProvider>
    </HouseholdConfigProvider>
  );
}
