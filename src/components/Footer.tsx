"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-onyx-800/60">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2.5 px-4 py-6 sm:px-6">
        <Image
          src="/logo.jpeg"
          alt=""
          width={22}
          height={22}
          className="rounded-md object-cover opacity-90"
          aria-hidden
        />
        <span className="text-sm font-medium text-onyx-400">Phunda</span>
      </div>
    </footer>
  );
}
