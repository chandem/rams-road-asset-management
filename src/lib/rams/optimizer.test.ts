import { describe, expect, it } from "vitest";
import { optimizeMaintenance, type OptimizationCandidate } from "./optimizer";

function cand(
  partial: Partial<OptimizationCandidate> & { id: string },
): OptimizationCandidate {
  return {
    activityType: "overlay",
    priority: "medium",
    conditionScore: 55,
    estimatedCost: 1_000_000,
    plannedDate: "2026-06-01",
    status: "planned",
    score: 50,
    overdue: false,
    roadName: "Test",
    sectionCode: "T1",
    benefitCost: 10,
    ...partial,
  };
}

describe("optimizer", () => {
  it("respects budget ceiling", () => {
    const result = optimizeMaintenance(
      [
        cand({ id: "a", estimatedCost: 3_000_000, score: 90, benefitCost: 30, priority: "critical" }),
        cand({ id: "b", estimatedCost: 2_000_000, score: 70, benefitCost: 20 }),
        cand({ id: "c", estimatedCost: 4_000_000, score: 40, benefitCost: 5 }),
      ],
      5_000_000,
    );
    expect(result.totalRecommendedCost).toBeLessThanOrEqual(5_000_000);
    expect(result.recommended.length).toBeGreaterThan(0);
    expect(result.recommended.length + result.excluded.length).toBe(3);
  });

  it("excludes completed and cancelled", () => {
    const result = optimizeMaintenance(
      [
        cand({ id: "a", status: "completed", estimatedCost: 100 }),
        cand({ id: "b", status: "planned", estimatedCost: 100, score: 80 }),
      ],
      10_000,
    );
    expect(result.recommended.map((r) => r.id)).toEqual(["b"]);
  });
});
