"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { TabNav } from "@/components/TabNav";
import { ExpenseManager } from "@/components/expenses/ExpenseManager";
import { TaskManager } from "@/components/tasks/TaskManager";

export default function Home() {
  const [tab, setTab] = useState<"tasks" | "expenses">("tasks");

  return (
    <>
      <Header />
      <TabNav active={tab} onChange={setTab} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {tab === "tasks" ? <TaskManager /> : <ExpenseManager />}
      </main>
      <footer className="mt-auto border-t border-onyx-900 py-4 text-center text-xs text-onyx-600">
        PHUNDA — Don · Bijo · Suraj · Adithyan
      </footer>
    </>
  );
}
