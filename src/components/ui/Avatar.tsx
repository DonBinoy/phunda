"use client";

import { useMemo } from "react";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { getPersonColors } from "@/lib/personColors";
import { computePersonLevel, type LevelTier } from "@/lib/levels";
import type { PersonId } from "@/lib/types";

const TIER_STYLES: Record<LevelTier, { border: string; badge: string; shadow: string }> = {
  wood: {
    border: "ring-onyx-800",
    badge: "bg-onyx-800 text-onyx-400 border-onyx-900",
    shadow: "shadow-none",
  },
  bronze: {
    border: "ring-[#cd7f32]/60",
    badge: "bg-gradient-to-br from-[#e6a87c] to-[#a05a2c] text-white border-onyx-950",
    shadow: "shadow-[0_0_15px_rgba(205,127,50,0.2)]",
  },
  silver: {
    border: "ring-slate-300/80",
    badge: "bg-gradient-to-br from-slate-100 to-slate-400 text-slate-900 border-onyx-950",
    shadow: "shadow-[0_0_15px_rgba(148,163,184,0.3)]",
  },
  gold: {
    border: "ring-fawn-400",
    badge: "bg-gradient-to-br from-fawn-200 to-fawn-600 text-onyx-950 border-onyx-950",
    shadow: "shadow-[0_0_20px_rgba(209,155,46,0.4)]",
  },
  platinum: {
    border: "ring-teal-300",
    badge: "bg-gradient-to-br from-teal-100 to-teal-500 text-onyx-950 border-onyx-950",
    shadow: "shadow-[0_0_25px_rgba(45,212,191,0.5)]",
  },
  diamond: {
    border: "ring-fuchsia-400",
    badge: "bg-gradient-to-br from-fuchsia-200 to-purple-600 text-white border-onyx-950",
    shadow: "shadow-[0_0_30px_rgba(192,38,211,0.5)]",
  },
  radiant: {
    border: "ring-rose-500 ring-offset-2 ring-offset-onyx-950",
    badge: "bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 text-white border-onyx-950",
    shadow: "shadow-[0_0_40px_rgba(244,63,94,0.6)]",
  },
};

interface AvatarProps {
  personId: PersonId;
  completedTasks: number;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Avatar({ personId, completedTasks, size = "md" }: AvatarProps) {
  const { people, personIds } = useHouseholdConfig();
  const person = people.find((p) => p.id === personId);
  const colors = getPersonColors(personId, personIds);
  
  const levelInfo = useMemo(() => computePersonLevel(completedTasks), [completedTasks]);
  const tier = TIER_STYLES[levelInfo.tier];

  const sizeClasses = {
    sm: "h-8 w-8 text-xs ring-1",
    md: "h-11 w-11 text-lg ring-2",
    lg: "h-16 w-16 text-2xl ring-2",
    xl: "h-24 w-24 text-4xl ring-[3px]",
  };

  const badgeSizeClasses = {
    sm: "-bottom-1.5 -right-1.5 h-4 min-w-4 px-0.5 text-[9px] border",
    md: "-bottom-1.5 -right-1.5 h-5 min-w-5 px-1 text-[10px] border-2",
    lg: "-bottom-2 -right-2 h-6 min-w-6 px-1.5 text-xs border-2",
    xl: "-bottom-3 -right-3 h-8 min-w-8 px-2 text-sm border-[3px]",
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`flex items-center justify-center rounded-[1.25rem] font-black ${colors.bg} ${colors.text} ${sizeClasses[size]} ${tier.border} ${tier.shadow}`}
      >
        {person?.name[0] ?? "?"}
      </div>
      <div
        className={`absolute flex items-center justify-center rounded-full font-black tracking-tighter ${tier.badge} ${badgeSizeClasses[size]}`}
        title={`Level ${levelInfo.level} (${levelInfo.tier})`}
      >
        {levelInfo.level}
      </div>
    </div>
  );
}
