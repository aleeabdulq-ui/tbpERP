import type { HTMLAttributes } from "react";
import { cn, labelize, toneBadge, type Tone } from "@/lib/utils";

export function Badge({ className, tone = "primary", children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap", toneBadge[tone], className)} {...props}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, map }: { status?: string | null; map?: Partial<Record<string, Tone>> }) {
  const tone = map?.[status ?? ""] ?? defaultStatusTone(status);
  return <Badge tone={tone}>{labelize(status)}</Badge>;
}

function defaultStatusTone(status?: string | null): Tone {
  switch (status) {
    case "ACTIVE": case "APPROVED": case "COMPLETED": case "PRESENT": case "PAID": return "success";
    case "PENDING": case "REVIEW": case "ASSIGNED": case "PLANNING": case "DRAFT": case "LATE": return "warning";
    case "REJECTED": case "OVERDUE": case "TERMINATED": case "CANCELLED": case "CRITICAL": case "ABSENT": return "danger";
    case "ON_HOLD": case "ON_LEAVE": case "RETURNED": case "INACTIVE": return "violet";
    default: return "primary";
  }
}

export function Skeleton({ className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-ink-100", className)} />;
}

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-100", className)}>
      <div className={cn("h-full rounded-full bg-accent-500 transition-all", barClassName)} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[21px] font-semibold tracking-tight text-ink-900">{title}</h1>
        {description ? <p className="mt-0.5 text-[13px] text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
      {icon ? <div className="mb-1 text-ink-300">{icon}</div> : null}
      <p className="text-[13.5px] font-medium text-ink-600">{title}</p>
      {hint ? <p className="max-w-72 text-[12.5px] text-ink-400">{hint}</p> : null}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-ink-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-accent-500" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}
