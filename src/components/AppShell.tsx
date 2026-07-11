"use client";

import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TabNav } from "@/components/TabNav";
import { LoadingState } from "@/components/ui/LoadingState";
import { ExpenseManager } from "@/components/expenses/ExpenseManager";
import { TaskManager } from "@/components/tasks/TaskManager";
import { TodoManager } from "@/components/todos/TodoManager";
import { usePersonSession } from "@/context/PersonSessionContext";

export function AppShell() {
  const {
    hydrated,
    isLoggedIn,
    loginAsPerson,
    loginAsAdmin,
  } = usePersonSession();
  const [tab, setTab] = useState<"tasks" | "todos" | "expenses">("tasks");

  if (!hydrated) {
    return (
      <div className="app-bg flex min-h-screen flex-col">
        <LoadingState />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginPerson={loginAsPerson}
        onLoginAdmin={loginAsAdmin}
      />
    );
  }

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <Header />
      <TabNav active={tab} onChange={setTab} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-fade-in">
          {tab === "tasks" && <TaskManager />}
          {tab === "todos" && <TodoManager />}
          {tab === "expenses" && <ExpenseManager />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
