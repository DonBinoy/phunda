"use client";

import { useEffect, useState } from "react";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { getPersonColors } from "@/lib/personColors";
import type { PerformanceSummary } from "@/lib/performance";
import type { PersonId } from "@/lib/types";

interface RivalryWidgetProps {
  weekPerformance: PerformanceSummary;
}

export function RivalryWidget({ weekPerformance }: RivalryWidgetProps) {
  const { people, personIds } = useHouseholdConfig();
  const defaultP1 = personIds[0] ?? "don";
  const defaultP2 = personIds[1] ?? personIds[0] ?? "suraj";
  const [person1, setPerson1] = useState<PersonId>(defaultP1);
  const [person2, setPerson2] = useState<PersonId>(defaultP2);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("phunda_rivalry");
      if (stored) {
        const { p1, p2 } = JSON.parse(stored);
        if (p1 && p2) {
          setPerson1(p1);
          setPerson2(p2);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  if (!mounted) return null;

  const saveRivals = (p1: PersonId, p2: PersonId) => {
    setPerson1(p1);
    setPerson2(p2);
    localStorage.setItem("phunda_rivalry", JSON.stringify({ p1, p2 }));
  };

  const p1Stats = weekPerformance.people.find((p) => p.personId === person1);
  const p2Stats = weekPerformance.people.find((p) => p.personId === person2);

  const p1Score = p1Stats?.completed ?? 0;
  const p2Score = p2Stats?.completed ?? 0;
  const total = p1Score + p2Score || 1; // prevent divide by zero
  const p1Pct = (p1Score / total) * 100;

  const c1 = getPersonColors(person1, personIds);
  const c2 = getPersonColors(person2, personIds);
  const n1 = people.find((p) => p.id === person1)?.name ?? person1;
  const n2 = people.find((p) => p.id === person2)?.name ?? person2;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-onyx-800 bg-onyx-950/40 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <h3 className="font-semibold text-onyx-50">Head-to-Head</h3>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-medium text-onyx-400 hover:text-onyx-200"
        >
          {isEditing ? "Done" : "Change Rivals"}
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 flex gap-4">
          <select
            value={person1}
            onChange={(e) => saveRivals(e.target.value as PersonId, person2)}
            className="w-full rounded-xl border border-onyx-700 bg-onyx-900 p-2 text-sm text-onyx-100 outline-none"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="self-center text-xs font-bold text-onyx-500">VS</span>
          <select
            value={person2}
            onChange={(e) => saveRivals(person1, e.target.value as PersonId)}
            className="w-full rounded-xl border border-onyx-700 bg-onyx-900 p-2 text-sm text-onyx-100 outline-none"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="flex w-full justify-between px-1 text-sm font-bold">
          <span className={c1.text}>{n1} <span className="text-xl">{p1Score}</span></span>
          <span className={c2.text}><span className="text-xl">{p2Score}</span> {n2}</span>
        </div>
        <div className="relative mt-1 h-3.5 w-full overflow-hidden rounded-full bg-onyx-900 ring-1 ring-inset ring-onyx-800">
          <div
            className={`absolute bottom-0 left-0 top-0 transition-all duration-1000 ${c1.bg}`}
            style={{ width: `${p1Pct}%` }}
          />
          <div
            className={`absolute bottom-0 right-0 top-0 transition-all duration-1000 ${c2.bg}`}
            style={{ width: `${100 - p1Pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-onyx-500">This Week's Race</p>
      </div>
    </div>
  );
}
