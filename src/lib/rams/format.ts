import type { ConditionCategory, Priority, Treatment } from "./types";

const ETB = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatEtb(n: number): string {
  return ETB.format(n).replace("ETB", "ETB");
}

export function formatKm(n: number): string {
  return `${NUM.format(n)} km`;
}

export function formatInt(n: number): string {
  return INT.format(n);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function classLabel(c: string): string {
  return c.replace(/-/g, " ");
}

export function treatmentLabel(t: Treatment | string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function priorityLabel(p: Priority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export const CONDITION_TONE: Record<ConditionCategory, string> = {
  Excellent: "bg-ok/12 text-ok border-ok/25",
  Good: "bg-ok/8 text-ok border-ok/20",
  Fair: "bg-warn/12 text-warn border-warn/25",
  Poor: "bg-warn/16 text-warn border-warn/30",
  Critical: "bg-danger/12 text-danger border-danger/25",
};

export const PRIORITY_TONE: Record<Priority, string> = {
  low: "bg-ok/10 text-ok border-ok/20",
  medium: "bg-warn/12 text-warn border-warn/25",
  high: "bg-warn/18 text-warn border-warn/35",
  critical: "bg-danger/12 text-danger border-danger/25",
};

export const CONDITION_LINE: Record<ConditionCategory, string> = {
  Excellent: "#1f5c45",
  Good: "#3d7a5c",
  Fair: "#a07a32",
  Poor: "#b45309",
  Critical: "#8f2d2d",
};
