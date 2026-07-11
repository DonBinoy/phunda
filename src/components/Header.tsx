"use client";

import Image from "next/image";
import { PEOPLE } from "@/lib/constants";
import { PERSON_COLORS } from "@/lib/personColors";
import { usePersonSession } from "@/context/PersonSessionContext";

export function Header() {
  const { isAdmin, personId, logout } = usePersonSession();

  const displayName = isAdmin
    ? "Admin"
    : PEOPLE.find((p) => p.id === personId)?.name ?? "";

  const personColor =
    !isAdmin && personId ? PERSON_COLORS[personId] : null;

  return (
    <header className="sticky top-0 z-50 border-b border-onyx-800/80 bg-onyx-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-sea-500/30 shadow-lg shadow-sea-500/10">
            <Image
              src="/logo.jpeg"
              alt="PHUNDA Logo"
              width={44}
              height={44}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-onyx-50 sm:text-xl">
              PHUNDA
            </h1>
            <p className="text-[11px] text-onyx-500 sm:text-xs">
              Home tasks & expenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:flex ${
              isAdmin
                ? "border border-fawn-500/30 bg-fawn-500/10 text-fawn-300"
                : `border ${personColor?.ring} ${personColor?.bg} ${personColor?.text}`
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sea-500 animate-pulse" />
            {isAdmin ? "Household view" : `${displayName}'s view`}
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-ghost flex items-center gap-2 py-1.5 text-xs"
          >
            <span className="font-medium text-onyx-200">
              {isAdmin ? "Admin" : displayName}
            </span>
            <span className="text-onyx-600">·</span>
            <span className="text-onyx-500">Switch</span>
          </button>
        </div>
      </div>
    </header>
  );
}
