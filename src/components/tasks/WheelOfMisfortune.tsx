"use client";

import { useState } from "react";
import { getWeekendAssignments, personName, taskName } from "@/lib/rotation";

interface WheelOfMisfortuneProps {
  date: Date;
}

export function WheelOfMisfortune({ date }: WheelOfMisfortuneProps) {
  const [spun, setSpun] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const assignments = getWeekendAssignments(date);

  const handleSpin = () => {
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setSpun(true);
    }, 3000); // 3 second dramatic spin
  };

  if (!spun && !spinning) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-onyx-700 bg-gradient-to-br from-onyx-900 to-onyx-950 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-onyx-800 ring-4 ring-onyx-700">
          <span className="text-5xl">🎡</span>
        </div>
        <h3 className="mb-2 text-2xl font-black text-onyx-50">Weekend Chores Await</h3>
        <p className="mb-8 text-sm text-onyx-400">
          The rotation has been decided. Who will face the bathroom duty?
        </p>
        <button
          type="button"
          onClick={handleSpin}
          className="rounded-full bg-gradient-to-r from-fawn-500 to-rose-500 px-8 py-3 text-lg font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-transform hover:scale-105 active:scale-95"
        >
          Spin the Wheel
        </button>
      </div>
    );
  }

  if (spinning) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-onyx-700 bg-gradient-to-br from-onyx-900 to-onyx-950 p-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-24 w-24 animate-spin items-center justify-center rounded-full bg-onyx-800 ring-4 ring-rose-500/50">
          <span className="text-5xl">🎡</span>
        </div>
        <h3 className="animate-pulse text-xl font-bold text-rose-400">Consulting the Oracle...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-black text-onyx-50">The Wheel has Spoken</h3>
        <p className="text-xs text-onyx-400">May the odds be ever in your favor.</p>
      </div>
      {assignments.map((assignment) => (
        <div
          key={assignment.taskId}
          className="flex items-center justify-between rounded-xl border border-onyx-800 bg-onyx-900/50 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {assignment.taskId === "kitchen" && "🍳"}
              {assignment.taskId === "bathroom" && "🚽"}
              {assignment.taskId === "room" && "🧹"}
            </span>
            <span className="font-semibold text-onyx-100">
              {taskName(assignment.taskId)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            {assignment.personIds.map((p) => (
              <span
                key={p}
                className="rounded-full bg-onyx-800 px-2.5 py-1 text-xs font-bold text-fawn-300"
              >
                {personName(p)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
