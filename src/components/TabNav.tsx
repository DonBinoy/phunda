"use client";

type Tab = "tasks" | "todos" | "expenses";

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "tasks", label: "Tasks", desc: "Chores" },
  { id: "todos", label: "Todos", desc: "Lists" },
  { id: "expenses", label: "Money", desc: "Expenses" },
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <div className="sticky top-[61px] z-40 border-b border-onyx-800/60 bg-onyx-950/60 backdrop-blur-xl">
      <nav className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="glass-card flex gap-1 p-1">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`relative flex flex-1 flex-col items-center rounded-xl px-3 py-2.5 transition-all sm:flex-row sm:justify-center sm:gap-2 sm:py-3 ${
                  isActive
                    ? "bg-gradient-to-b from-sea-500/20 to-sea-500/5 text-sea-300 shadow-sm ring-1 ring-sea-500/30"
                    : "text-onyx-500 hover:bg-onyx-800/50 hover:text-onyx-300"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${isActive ? "text-sea-300" : ""}`}
                >
                  {tab.label}
                </span>
                <span className="hidden text-[10px] text-onyx-600 sm:inline">
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
