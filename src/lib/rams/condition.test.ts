import { describe, expect, it } from "vitest";
import { assessCondition, conditionCategory, projectPci } from "./condition";

describe("condition engine", () => {
  it("returns Excellent for high rating with no defects", () => {
    const a = assessCondition(92, []);
    expect(a.category).toBe("Excellent");
    expect(a.score).toBeGreaterThanOrEqual(85);
  });

  it("applies critical defect penalty", () => {
    const a = assessCondition(80, [
      {
        severity: "critical",
        type: "pothole",
        lengthM: 2,
        widthM: 1,
        depthMm: 100,
        status: "open",
      },
    ]);
    expect(a.score).toBeLessThan(80);
    expect(a.priority).toBe("critical");
  });

  it("ignores repaired defects", () => {
    const a = assessCondition(80, [
      {
        severity: "critical",
        type: "pothole",
        lengthM: 2,
        widthM: 1,
        depthMm: 100,
        status: "repaired",
      },
    ]);
    expect(a.score).toBe(80);
  });

  it("maps score bands", () => {
    expect(conditionCategory(90)).toBe("Excellent");
    expect(conditionCategory(40)).toBe("Poor");
    expect(conditionCategory(10)).toBe("Critical");
  });

  it("projects deterioration over years", () => {
    const later = projectPci(80, 3, 20000);
    expect(later).toBeLessThan(80);
    expect(later).toBeGreaterThan(0);
  });
});
