import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  progress?: { done: number; total: number };
}

export function PageHeader({
  title,
  subtitle,
  badge,
  action,
  progress,
}: PageHeaderProps) {
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-onyx-50 sm:text-2xl">
            {title}
          </h2>
          {badge && (
            <span className="rounded-full bg-sea-500/15 px-2.5 py-0.5 text-xs font-medium text-sea-400 ring-1 ring-sea-500/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-onyx-400">{subtitle}</p>
        )}
        {progress && progress.total > 0 && (
          <div className="mt-3 max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-onyx-500">
              <span>{progress.done} of {progress.total} done</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-onyx-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sea-600 to-sea-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {action}
    </div>
  );
}
