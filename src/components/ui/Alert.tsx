import type { ReactNode } from "react";

export function Alert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "warning" | "info";
}) {
  const styles = {
    error: "border-fawn-500/30 bg-fawn-500/10 text-fawn-200",
    warning: "border-fawn-500/40 bg-fawn-500/10 text-fawn-300",
    info: "border-sea-500/30 bg-sea-500/10 text-sea-200",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-sm ${styles[variant]}`}
    >
      {children}
    </div>
  );
}
