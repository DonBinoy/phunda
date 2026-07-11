import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({
  title,
  subtitle,
  action,
  children,
  className = "",
}: SectionProps) {
  return (
    <section className={`glass-card p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-onyx-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-onyx-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
