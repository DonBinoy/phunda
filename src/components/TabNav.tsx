"use client";

type Tab = "tasks" | "todos" | "expenses";

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "tasks", label: "Tasks", icon: "✓" },
    { id: "todos", label: "Todos", icon: "☑" },
    { id: "expenses", label: "Expenses", icon: "₹" },
  ];

  return (
    <nav className="mx-auto flex max-w-5xl gap-2 px-4 pt-4 sm:px-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all sm:flex-none sm:px-5 ${
            active === tab.id
              ? "bg-sea-500/15 text-sea-400 border border-sea-500/40 shadow-sm shadow-sea-500/10"
              : "bg-onyx-900 text-onyx-400 border border-onyx-800 hover:border-onyx-700 hover:text-onyx-200"
          }`}
        >
          <span className="text-base">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
