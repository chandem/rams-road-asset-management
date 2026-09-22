import type { MaintenanceActivity, Priority } from "./types";

/** Port of backend maintenance optimiser with benefit/cost ranking. */
const PRIORITY_POINTS: Record<string, number> = {
  critical: 100,
  high: 80,
  medium: 60,
  low: 40,
};

const STATUS_URGENCY: Record<string, number> = {
  planned: 0,
  "in progress": 10,
  completed: 0,
  cancelled: -100,
};

export type OptimizationCandidate = {
  id: string;
  activityType: string;
  priority: Priority;
  conditionScore: number | null;
  estimatedCost: number;
  plannedDate: string | null;
  status: string;
  score: number;
  overdue: boolean;
  roadName: string;
  sectionCode: string | null;
  benefitCost?: number;
};

export type OptimizationResult = {
  recommended: OptimizationCandidate[];
  excluded: OptimizationCandidate[];
  totalRecommendedCost: number;
  budget: number | null;
  remainingBudget: number | null;
  avgScore: number;
};

export function optimizationScore(
  priority: string | null,
  conditionScore: number | null,
  plannedDate: string | null,
  status: string | null,
  today = new Date(),
): { score: number; overdue: boolean } {
  const priorityPoints = PRIORITY_POINTS[(priority || "low").toLowerCase()] ?? 40;
  const conditionPoints =
    conditionScore == null ? 50 : Math.max(0, Math.min(100, 100 - conditionScore));
  const overdue =
    plannedDate != null &&
    new Date(plannedDate) < today &&
    status !== "completed" &&
    status !== "cancelled";
  let urgencyPoints = STATUS_URGENCY[(status || "planned").toLowerCase()] ?? 0;
  if (overdue) urgencyPoints += 25;
  const score =
    priorityPoints * 0.55 +
    conditionPoints * 0.3 +
    Math.max(0, Math.min(100, urgencyPoints)) * 0.15;
  return { score: Math.round(score * 100) / 100, overdue };
}

function benefitProxy(priority: string, conditionScore: number | null): number {
  const p = PRIORITY_POINTS[(priority || "low").toLowerCase()] ?? 40;
  const gap = conditionScore == null ? 50 : Math.max(0, 100 - conditionScore);
  return p * 0.6 + gap * 0.4;
}

export function optimizeMaintenance(
  candidates: OptimizationCandidate[],
  budget: number | null,
  options?: { preferBenefitCost?: boolean },
): OptimizationResult {
  const preferBc = options?.preferBenefitCost !== false;

  const ranked = [...candidates].sort((a, b) => {
    if (preferBc && a.benefitCost != null && b.benefitCost != null) {
      if (b.benefitCost !== a.benefitCost) return b.benefitCost - a.benefitCost;
    }
    if (b.score !== a.score) return b.score - a.score;
    const pa = PRIORITY_POINTS[a.priority] ?? 40;
    const pb = PRIORITY_POINTS[b.priority] ?? 40;
    if (pb !== pa) return pb - pa;
    if (a.estimatedCost !== b.estimatedCost) return a.estimatedCost - b.estimatedCost;
    return a.id.localeCompare(b.id);
  });

  if (budget == null) {
    const total = ranked.reduce((s, c) => s + c.estimatedCost, 0);
    const avg =
      ranked.length === 0 ? 0 : ranked.reduce((s, c) => s + c.score, 0) / ranked.length;
    return {
      recommended: ranked,
      excluded: [],
      totalRecommendedCost: total,
      budget: null,
      remainingBudget: null,
      avgScore: Math.round(avg * 100) / 100,
    };
  }

  const recommended: OptimizationCandidate[] = [];
  const excluded: OptimizationCandidate[] = [];
  let spent = 0;
  for (const item of ranked) {
    if (item.status === "cancelled" || item.status === "completed") {
      excluded.push(item);
      continue;
    }
    if (spent + item.estimatedCost <= budget) {
      recommended.push(item);
      spent += item.estimatedCost;
    } else {
      excluded.push(item);
    }
  }
  const avg =
    recommended.length === 0
      ? 0
      : recommended.reduce((s, c) => s + c.score, 0) / recommended.length;
  return {
    recommended,
    excluded,
    totalRecommendedCost: spent,
    budget,
    remainingBudget: budget - spent,
    avgScore: Math.round(avg * 100) / 100,
  };
}

export function toCandidate(
  activity: MaintenanceActivity,
  extras: { conditionScore: number | null; roadName: string; sectionCode: string | null },
): OptimizationCandidate {
  const { score, overdue } = optimizationScore(
    activity.priority,
    extras.conditionScore,
    activity.plannedDate,
    activity.status,
  );
  const benefit = benefitProxy(activity.priority, extras.conditionScore);
  const cost = Math.max(1, activity.estimatedCost);
  const benefitCost = Math.round((benefit / (cost / 1_000_000)) * 100) / 100;
  return {
    id: activity.id,
    activityType: activity.activityType,
    priority: activity.priority,
    conditionScore: extras.conditionScore,
    estimatedCost: activity.estimatedCost,
    plannedDate: activity.plannedDate,
    status: activity.status,
    score,
    overdue,
    roadName: extras.roadName,
    sectionCode: extras.sectionCode,
    benefitCost,
  };
}

export const TREATMENT_RATE_ETB_PER_KM: Record<string, number> = {
  routine: 180_000,
  preventive: 1_200_000,
  overlay: 8_500_000,
  rehabilitation: 22_000_000,
  reconstruction: 55_000_000,
};

export function estimateTreatmentCost(treatment: string, lengthKm: number): number {
  const rate = TREATMENT_RATE_ETB_PER_KM[treatment] ?? TREATMENT_RATE_ETB_PER_KM.overlay;
  return Math.round(rate * Math.max(0, lengthKm));
}

export function summarizeOptimization(result: OptimizationResult): string {
  if (result.budget == null) {
    return `${result.recommended.length} activities ranked (no budget cap). Total indicative cost ETB ${result.totalRecommendedCost.toLocaleString("en-US")}.`;
  }
  return `${result.recommended.length} activities within budget of ETB ${result.budget.toLocaleString("en-US")} (spent ETB ${result.totalRecommendedCost.toLocaleString("en-US")}, remaining ETB ${(result.remainingBudget ?? 0).toLocaleString("en-US")}). ${result.excluded.length} deferred.`;
}
