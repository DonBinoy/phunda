"use client";

import Image from "next/image";
import { PEOPLE } from "@/lib/constants";
import { PERSON_COLORS } from "@/lib/personColors";
import type { PersonId } from "@/lib/types";

interface LoginScreenProps {
  onLoginPerson: (personId: PersonId) => void;
  onLoginAdmin: () => void;
}

export function LoginScreen({ onLoginPerson, onLoginAdmin }: LoginScreenProps) {
  return (
    <div className="app-bg flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="animate-fade-in w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl ring-2 ring-sea-500/30 shadow-2xl shadow-sea-500/20">
            <Image
              src="/logo.jpeg"
              alt="PHUNDA Logo"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <h1 className="bg-gradient-to-r from-onyx-50 to-onyx-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            PHUNDA
          </h1>
          <p className="mt-2 text-sm text-onyx-400">
            Home tasks & expenses for the family
          </p>
        </div>

        <div className="glass-card p-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-onyx-500">
            Who are you?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PEOPLE.map((person) => {
              const colors = PERSON_COLORS[person.id];
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onLoginPerson(person.id)}
                  className={`group flex flex-col items-center gap-3 rounded-2xl border border-onyx-800 bg-gradient-to-b ${colors.gradient} p-5 transition-all hover:scale-[1.02] hover:border-onyx-600 hover:shadow-lg active:scale-[0.98]`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold ring-2 ${colors.bg} ${colors.ring} ${colors.text}`}
                  >
                    {person.name[0]}
                  </div>
                  <span className="font-semibold text-onyx-100">{person.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onLoginAdmin}
          className="glass-card glass-card-hover w-full border-fawn-500/20 bg-gradient-to-r from-fawn-500/10 to-transparent px-5 py-4 text-center transition-all"
        >
          <span className="block text-sm font-semibold text-fawn-300">
            Continue as Admin
          </span>
          <span className="mt-0.5 block text-xs text-onyx-500">
            See everyone&apos;s tasks & expenses
          </span>
        </button>

        <p className="text-center text-xs text-onyx-600">
          No password — just pick your name
        </p>
      </div>
    </div>
  );
}
