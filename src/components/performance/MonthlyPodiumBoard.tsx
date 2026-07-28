"use client";

import { PERSON_COLORS } from "@/lib/personColors";
import type { MonthlyPodium } from "@/lib/performance";
import type { PersonId } from "@/lib/types";

function Medal({ place }: { place: 1 | 2 | 3 }) {
  const styles = {
    1: "from-fawn-400 to-fawn-600 text-onyx-950 ring-fawn-300/50",
    2: "from-onyx-200 to-onyx-400 text-onyx-900 ring-onyx-100/40",
    3: "from-fawn-600 to-onyx-800 text-fawn-100 ring-fawn-500/40",
  } as const;

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black ring-2 ${styles[place]}`}
    >
      {place}
    </div>
  );
}

interface MonthlyPodiumBoardProps {
  podium: MonthlyPodium;
  onSelectPerson?: (personId: PersonId) => void;
}

export function MonthlyPodiumBoard({
  podium,
  onSelectPerson,
}: MonthlyPodiumBoardProps) {
  const [gold, silver, bronze] = podium.places;
  const order: Array<{
    place: 1 | 2 | 3;
    person: (typeof podium.places)[0];
    height: string;
  }> = [
    { place: 2, person: silver, height: "h-24 sm:h-28" },
    { place: 1, person: gold, height: "h-32 sm:h-40" },
    { place: 3, person: bronze, height: "h-20 sm:h-24" },
  ];

  const hasAnyone = podium.places.some(Boolean);

  return (
    <section className="glass-card overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-onyx-100">
            Monthly podium
          </h3>
          <p className="mt-0.5 text-xs text-onyx-500">
            {podium.label}
            {podium.isComplete ? " · Final" : " · In progress"}
          </p>
        </div>
        <span
          className={`chip ${
            podium.isComplete
              ? "bg-sea-500/15 text-sea-300 ring-1 ring-sea-500/30"
              : "bg-fawn-500/15 text-fawn-300 ring-1 ring-fawn-500/30"
          }`}
        >
          {podium.isComplete ? "Locked in" : "Live standings"}
        </span>
      </div>

      {!hasAnyone ? (
        <p className="rounded-xl border border-dashed border-onyx-800 py-10 text-center text-sm text-onyx-500">
          No completions this month yet — podium opens when chores get done.
        </p>
      ) : (
        <div className="flex items-end justify-center gap-2 sm:gap-4">
          {order.map(({ place, person, height }) => {
            if (!person) {
              return (
                <div
                  key={place}
                  className="flex w-[30%] max-w-[140px] flex-col items-center"
                >
                  <div
                    className={`flex w-full flex-col items-center justify-end rounded-t-2xl border border-dashed border-onyx-800 bg-onyx-900/40 ${height}`}
                  >
                    <span className="pb-3 text-xs text-onyx-600">—</span>
                  </div>
                  <Medal place={place} />
                </div>
              );
            }

            const colors = PERSON_COLORS[person.personId];
            const clickable = !!onSelectPerson;

            return (
              <button
                key={place}
                type="button"
                disabled={!clickable}
                onClick={() => onSelectPerson?.(person.personId)}
                className={`flex w-[30%] max-w-[140px] flex-col items-center ${
                  clickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="mb-2 text-center">
                  <p className={`text-sm font-bold ${colors.text}`}>
                    {person.name}
                  </p>
                  <p className="text-[11px] tabular-nums text-onyx-500">
                    {person.completed} done · {person.rate}%
                  </p>
                </div>
                <div
                  className={`relative flex w-full flex-col items-center justify-end rounded-t-2xl border bg-gradient-to-t ${height} ${
                    place === 1
                      ? "border-fawn-500/40 from-fawn-500/25 via-sea-500/10 to-transparent shadow-[0_0_28px_rgba(209,155,46,0.2)]"
                      : place === 2
                        ? "border-onyx-500/40 from-onyx-400/20 to-transparent"
                        : "border-fawn-600/35 from-fawn-600/20 to-transparent"
                  }`}
                >
                  {place === 1 && (
                    <span className="absolute -top-3 rounded-full bg-gradient-to-r from-fawn-500 to-sea-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-onyx-950">
                      Gold
                    </span>
                  )}
                </div>
                <div className="-mt-3">
                  <Medal place={place} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
