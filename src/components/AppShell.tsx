"use client";

import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TabNav, type AppTab } from "@/components/TabNav";
import { LoadingState } from "@/components/ui/LoadingState";
import { AdminManager } from "@/components/admin/AdminManager";
import { ExpenseManager } from "@/components/expenses/ExpenseManager";
import { PerformanceManager } from "@/components/performance/PerformanceManager";
import { PersonProfile } from "@/components/profile/PersonProfile";
import { TaskManager } from "@/components/tasks/TaskManager";
import { TodoManager } from "@/components/todos/TodoManager";
import { usePersonSession } from "@/context/PersonSessionContext";
import type { PersonId } from "@/lib/types";

export function AppShell() {
  const {
    hydrated,
    isLoggedIn,
    isAdmin,
    personId,
    loginAsPerson,
    loginAsAdmin,
  } = usePersonSession();
  const [tab, setTab] = useState<AppTab>("tasks");
  const [profilePersonId, setProfilePersonId] = useState<PersonId | null>(null);

  useEffect(() => {
    if (!isAdmin && (tab === "performance" || tab === "admin")) {
      setTab("tasks");
    }
  }, [isAdmin, tab]);

  useEffect(() => {
    if (tab === "profile") {
      if (isAdmin) {
        setProfilePersonId((prev) => prev ?? "don");
      } else if (personId) {
        setProfilePersonId(personId);
      }
    }
  }, [tab, isAdmin, personId]);

  const openProfile = (id: PersonId) => {
    setProfilePersonId(id);
    setTab("profile");
  };

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

  const viewingProfileId =
    profilePersonId ?? (isAdmin ? "don" : personId);

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <Header />
      <TabNav active={tab} onChange={setTab} isAdmin={isAdmin} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-fade-in">
          {tab === "tasks" && <TaskManager onNavigateTab={setTab} />}
          {tab === "todos" && <TodoManager />}
          {tab === "expenses" && <ExpenseManager />}
          {tab === "performance" && isAdmin && (
            <PerformanceManager onOpenProfile={openProfile} />
          )}
          {tab === "admin" && isAdmin && <AdminManager />}
          {tab === "profile" && viewingProfileId && (
            <PersonProfile
              personId={viewingProfileId}
              canBrowseAll={isAdmin}
              onSelectPerson={isAdmin ? setProfilePersonId : undefined}
              onBack={
                isAdmin
                  ? () => setTab("performance")
                  : undefined
              }
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
