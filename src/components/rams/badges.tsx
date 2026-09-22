import { cn } from "@/lib/utils";
import { CONDITION_TONE, PRIORITY_TONE, treatmentLabel } from "@/lib/rams/format";
import type { ConditionCategory, Priority, Treatment } from "@/lib/rams/types";

export function ConditionBadge({ category }: { category: ConditionCategory }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        CONDITION_TONE[category],
      )}
    >
      {category}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        PRIORITY_TONE[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function PciMeter({ score, className }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted">
        {score.toFixed(0)}
      </span>
    </div>
  );
}

export function TreatmentChip({ treatment }: { treatment: Treatment }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-fg">
      {treatmentLabel(treatment)}
    </span>
  );
}
