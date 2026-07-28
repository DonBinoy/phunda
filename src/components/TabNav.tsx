"use client";

export type AppTab =
  | "tasks"
  | "todos"
  | "expenses"
  | "performance"
  | "profile";

interface TabNavProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  isAdmin?: boolean;
}

const BASE_TABS: { id: AppTab; label: string; desc: string }[] = [
  { id: "tasks", label: "Tasks", desc: "Chores" },
  { id: "todos", label: "Todos", desc: "Lists" },
  { id: "expenses", label: "Money", desc: "Expenses" },
  { id: "profile", label: "Profile", desc: "Badges" },
];

const ADMIN_TAB: { id: AppTab; label: string; desc: string } = {
  id: "performance",
  label: "Performance",
  desc: "Stats",
};

export function TabNav({ active, onChange, isAdmin = false }: TabNavProps) {
  const tabs = isAdmin
    ? [
        ...BASE_TABS.filter((t) => t.id !== "profile"),
        ADMIN_TAB,
        BASE_TABS.find((t) => t.id === "profile")!,
      ]
    : BASE_TABS;

  return (
    <div className="sticky top-[61px] z-40 border-b border-onyx-800/60 bg-onyx-950/60 backdrop-blur-xl">
      <nav className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="glass-card flex gap-1 overflow-x-auto p-1">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`relative flex min-w-0 flex-1 flex-col items-center rounded-xl px-2 py-2.5 transition-all sm:flex-row sm:justify-center sm:gap-2 sm:px-3 sm:py-3 ${
                  isActive
                    ? "bg-gradient-to-b from-sea-500/20 to-sea-500/5 text-sea-300 shadow-sm ring-1 ring-sea-500/30"
                    : "text-onyx-500 hover:bg-onyx-800/50 hover:text-onyx-300"
                }`}
              >
                <span
                  className={`text-xs font-semibold sm:text-sm ${isActive ? "text-sea-300" : ""}`}
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
