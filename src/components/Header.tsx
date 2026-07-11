"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-onyx-800 bg-onyx-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-sea-500/20">
            <Image
              src="/logo.jpeg"
              alt="PHUNDA Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-onyx-50">
              PHUNDA
            </h1>
            <p className="text-xs text-onyx-400">Home tasks & expenses</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-pine-700/50 bg-pine-900/40 px-3 py-1 text-xs text-pine-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sea-500 animate-pulse" />
          Auto-rotating chores
        </div>
      </div>
    </header>
  );
}
