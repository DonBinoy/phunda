"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import confetti from "canvas-confetti";
import { evaluateAchievements, type EvaluatedAchievement } from "@/lib/achievements";
import { useHouseholdStats } from "@/hooks/useHouseholdStats";
import { usePersonSession } from "@/context/PersonSessionContext";

interface AchievementContextValue {
  achievements: EvaluatedAchievement[];
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { personId, isLoggedIn } = usePersonSession();
  const { completions, customTasks, todos, outsideEatingDays, loading } = useHouseholdStats();
  
  // Track previous unlocked IDs to detect *newly* unlocked achievements
  const prevUnlockedIdsRef = useRef<Set<string> | null>(null);
  
  const [achievements, setAchievements] = useState<EvaluatedAchievement[]>([]);
  const [toast, setToast] = useState<EvaluatedAchievement | null>(null);

  useEffect(() => {
    if (loading || !isLoggedIn || !personId) return;

    const currentAchievements = evaluateAchievements(
      personId,
      completions,
      customTasks,
      todos,
      outsideEatingDays
    );
    
    setAchievements(currentAchievements);

    const unlockedIds = new Set(currentAchievements.filter((a) => a.unlocked).map((a) => a.id));

    if (prevUnlockedIdsRef.current) {
      const newUnlocked = currentAchievements.filter(
        (a) => a.unlocked && !prevUnlockedIdsRef.current!.has(a.id)
      );

      if (newUnlocked.length > 0) {
        // Pop toast for the first new unlocked
        const popped = newUnlocked[0];
        setToast(popped);
        
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4ade80', '#fbbf24', '#f472b6', '#38bdf8']
        });
        
        // Hide after 5s
        setTimeout(() => setToast(null), 5000);
      }
    }

    prevUnlockedIdsRef.current = unlockedIds;
  }, [loading, isLoggedIn, personId, completions, customTasks, todos, outsideEatingDays]);

  return (
    <AchievementContext.Provider value={{ achievements }}>
      {children}
      
      {/* Toast Notification */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-4 rounded-2xl border border-fawn-500/40 bg-onyx-900/95 p-4 py-3 pl-4 pr-5 shadow-2xl shadow-fawn-500/20 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fawn-500/10 text-2xl text-fawn-400 ring-1 ring-fawn-500/30">
              🎉
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-fawn-400">
                Badge Unlocked
              </p>
              <p className="text-sm font-semibold text-onyx-50">
                {toast.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error("useAchievements must be used within AchievementProvider");
  return ctx;
}
