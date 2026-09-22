import type {
  ConditionAssessment,
  ConditionCategory,
  Defect,
  Priority,
  Treatment,
} from "./types";

/** Severity penalties (points deducted from baseline PCI). */
export const SEVERITY_PENALTY: Record<string, number> = {
  critical: 35,
  high: 25,
  medium: 12,
  low: 5,
};

/** Relative structural / safety weight by defect type. */
export const TYPE_WEIGHT: Record<string, number> = {
  pothole: 1,
  cracking: 0.85,
  rutting: 0.9,
  drainage: 0.8,
  erosion: 0.75,
  bleeding: 0.55,
  "edge-break": 0.7,
  raveling: 0.65,
};

export const RECOMMENDATION_BY_PRIORITY: Record<Priority, string> = {
  critical: "Emergency repair / immediate rehabilitation assessment",
  high: "Prioritize rehabilitation or major maintenance",
  medium: "Schedule preventive or routine maintenance",
  low: "Monitor and include in routine maintenance",
};

export function conditionCategory(score: number): ConditionCategory {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

export function maintenancePriority(
  score: number,
  criticalCount: number,
  highCount: number,
): Priority {
  if (score < 30 || criticalCount > 0) return "critical";
  if (score < 50 || highCount >= 2) return "high";
  if (score < 70 || highCount === 1) return "medium";
  return "low";
}

export function treatmentFor(score: number, priority: Priority): Treatment {
  if (priority === "critical" || score < 30) return "reconstruction";
  if (score < 50) return "rehabilitation";
  if (score < 70) return "overlay";
  if (score < 85) return "preventive";
  return "routine";
}

export type ConditionContext = {
  iri?: number | null;
  aadt?: number | null;
  ageYears?: number | null;
};

/**
 * Transparent 0–100 condition score from inspection rating + defects (+ optional IRI/traffic/age).
 * Inspection rating is the baseline when available; otherwise 100.
 * Defect impact is capped at 70 so one source cannot produce a negative score.
 */
export function assessCondition(
  inspectionRating: number | null,
  defects: Pick<Defect, "severity" | "type" | "lengthM" | "widthM" | "depthMm" | "status">[],
  context?: ConditionContext,
): ConditionAssessment {
  const baseline =
    inspectionRating == null
      ? 100
      : Math.max(0, Math.min(100, inspectionRating));
  let impact = 0;
  let criticalCount = 0;
  let highCount = 0;
  let defectCount = 0;

  for (const defect of defects) {
    if (defect.status === "repaired") continue;
    const severity = String(defect.severity || "low").toLowerCase();
    const defectType = String(defect.type || "").toLowerCase();
    const penalty = SEVERITY_PENALTY[severity] ?? 5;
    const typeWeight = TYPE_WEIGHT[defectType] ?? 0.6;
    let quantityFactor = 1;
    const lengthM = defect.lengthM;
    const widthM = defect.widthM;
    const depthMm = defect.depthMm;
    if (lengthM > 0) quantityFactor += Math.min(lengthM / 100, 1) * 0.25;
    if (widthM > 0) quantityFactor += Math.min(widthM / 100, 1) * 0.25;
    if (depthMm > 0) quantityFactor += Math.min(depthMm / 500, 1) * 0.25;
    impact += penalty * typeWeight * quantityFactor;
    defectCount += 1;
    if (severity === "critical") criticalCount += 1;
    else if (severity === "high") highCount += 1;
  }

  let iriPenalty = 0;
  if (context?.iri != null && Number.isFinite(context.iri)) {
    const iri = context.iri;
    if (iri > 6) iriPenalty = 12;
    else if (iri > 4) iriPenalty = 6 + (iri - 4) * 3;
    else if (iri > 2.5) iriPenalty = (iri - 2.5) * 2;
  }

  let trafficPenalty = 0;
  if (context?.aadt != null && context.aadt > 0) {
    if (context.aadt >= 40000) trafficPenalty = 5;
    else if (context.aadt >= 25000) trafficPenalty = 3;
    else if (context.aadt >= 15000) trafficPenalty = 1.5;
  }

  let agePenalty = 0;
  if (context?.ageYears != null && context.ageYears > 0) {
    agePenalty = Math.min(8, Math.max(0, (context.ageYears - 12) * 0.25));
  }

  const defectImpact = Math.min(70, impact);
  const contextImpact = Math.min(20, iriPenalty + trafficPenalty + agePenalty);
  const score = Math.max(0, Math.min(100, baseline - defectImpact - contextImpact));
  const category = conditionCategory(score);
  const priority = maintenancePriority(score, criticalCount, highCount);
  const treatment = treatmentFor(score, priority);

  return {
    score: round2(score),
    category,
    priority,
    recommendation: RECOMMENDATION_BY_PRIORITY[priority],
    treatment,
    defectImpact: round2(defectImpact + contextImpact),
    defectCount,
  };
}

export function remainingServiceLife(score: number): number {
  if (score >= 85) return 12;
  if (score >= 70) return 8;
  if (score >= 50) return 5;
  if (score >= 30) return 2;
  return 0.5;
}

export function projectPci(score: number, years: number, aadt = 15000): number {
  const baseRate = score >= 70 ? 1.8 : score >= 50 ? 2.8 : 4.2;
  const trafficFactor = aadt >= 30000 ? 1.35 : aadt >= 15000 ? 1.1 : 0.9;
  const annual = baseRate * trafficFactor;
  return round2(Math.max(0, score - annual * Math.max(0, years)));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
