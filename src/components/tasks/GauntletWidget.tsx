"use client";

import { evaluateActiveChallenge } from "@/lib/challenges";
import { useHouseholdStats } from "@/hooks/useHouseholdStats";

export function GauntletWidget() {
  const { completions, customTasks, todos, outsideEatingDays, loading } = useHouseholdStats();

  if (loading) return null;

  const { challenge, result } = evaluateActiveChallenge(
    completions,
    customTasks,
    todos,
    outsideEatingDays
  );

  const pct = Math.min(Math.round((result.progress / result.target) * 100), 100);
  
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${
      result.completed 
        ? "border-sea-500/40 bg-sea-950/20 shadow-[0_0_20px_rgba(17,238,139,0.1)]"
        : "border-fawn-500/30 bg-fawn-950/20 shadow-[0_0_20px_rgba(209,155,46,0.05)]"
    }`}>
      {result.completed && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(17,238,139,0.15),_transparent_70%)]" />
      )}
      
      <div className="relative flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ring-1 ${
          result.completed
            ? "bg-sea-500/20 ring-sea-500/50"
            : "bg-fawn-500/20 ring-fawn-500/40"
        }`}>
          {challenge.icon}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`font-black tracking-tight ${result.completed ? "text-sea-400" : "text-fawn-300"}`}>
              The Gauntlet: {challenge.title}
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              result.completed ? "bg-sea-500/20 text-sea-300" : "bg-onyx-800 text-onyx-400"
            }`}>
              {result.completed ? "Completed!" : "Active"}
            </span>
          </div>
          
          <p className="mt-1 text-xs text-onyx-300">{challenge.description}</p>
          
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] font-medium text-onyx-400">
              <span>{result.label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-onyx-900 ring-1 ring-inset ring-onyx-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.completed ? "bg-sea-500 shadow-[0_0_10px_rgba(17,238,139,0.5)]" : "bg-fawn-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
