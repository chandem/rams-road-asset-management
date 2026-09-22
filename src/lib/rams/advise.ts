import { createServerFn } from "@tanstack/react-start";
import {
  remainingServiceLife,
  treatmentFor,
  conditionCategory,
} from "./condition";
import { estimateTreatmentCost, TREATMENT_RATE_ETB_PER_KM } from "./optimizer";
import type { Priority, Treatment } from "./types";

type AdviseInput = {
  roadName: string;
  sectionCode: string;
  pci: number;
  category: string;
  iri: number | null;
  defects: { type: string; severity: string; description: string }[];
  budgetHint: number;
  lengthKm?: number;
  aadt?: number;
};

type AdviseResult = { ok: true; text: string } | { ok: false; error: string };

/** Local rule-based pavement engineering advisor. */
export function buildEngineeringAdvice(input: AdviseInput): string {
  const pci = Math.max(0, Math.min(100, Number(input.pci) || 0));
  const category = input.category || conditionCategory(pci);
  const iri = input.iri != null && Number.isFinite(input.iri) ? input.iri : null;
  const defects = input.defects ?? [];
  const lengthKm = input.lengthKm && input.lengthKm > 0 ? input.lengthKm : 1;
  const aadt = input.aadt && input.aadt > 0 ? input.aadt : null;
  const budget = Math.max(0, Number(input.budgetHint) || 0);

  const openBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const byType: Record<string, number> = {};
  for (const d of defects) {
    const sev = String(d.severity || "low").toLowerCase() as keyof typeof openBySeverity;
    if (sev in openBySeverity) openBySeverity[sev] += 1;
    const t = String(d.type || "other").toLowerCase();
    byType[t] = (byType[t] || 0) + 1;
  }

  const priority: Priority =
    pci < 30 || openBySeverity.critical > 0
      ? "critical"
      : pci < 50 || openBySeverity.high >= 2
        ? "high"
        : pci < 70 || openBySeverity.high === 1
          ? "medium"
          : "low";

  const treatment: Treatment = treatmentFor(pci, priority);
  const rsl = remainingServiceLife(pci);
  const unitRate = TREATMENT_RATE_ETB_PER_KM[treatment] ?? TREATMENT_RATE_ETB_PER_KM.overlay;
  const estCost = estimateTreatmentCost(treatment, lengthKm);

  const lines: string[] = [];
  lines.push(`## Engineering assessment — ${input.roadName} · ${input.sectionCode}`);
  lines.push("");
  lines.push(
    `**Condition:** PCI ${pci.toFixed(1)} (${category}). Estimated remaining service life ≈ **${rsl} years** under current loading.`,
  );
  if (iri != null) {
    const iriNote =
      iri <= 2.5
        ? "smooth (IRI ≤ 2.5 m/km)"
        : iri <= 4.0
          ? "acceptable for primary roads (IRI 2.5–4.0)"
          : iri <= 6.0
            ? "rough — comfort and safety degraded (IRI 4–6)"
            : "very rough — intervention recommended (IRI > 6)";
    lines.push(`**Ride quality:** IRI ${iri.toFixed(2)} m/km — ${iriNote}.`);
  }
  if (aadt != null) {
    const trafficBand =
      aadt >= 30000 ? "very high urban / expressway traffic" : aadt >= 15000 ? "high traffic" : aadt >= 5000 ? "moderate traffic" : "low–moderate traffic";
    lines.push(`**Traffic context:** AADT ≈ ${Math.round(aadt).toLocaleString("en-US")} (${trafficBand}).`);
  }
  lines.push("");
  lines.push("### Defect picture");
  if (defects.length === 0) {
    lines.push("No open defects recorded for this section. Maintain routine inspection cadence.");
  } else {
    lines.push(
      `${defects.length} open defect(s): critical ${openBySeverity.critical}, high ${openBySeverity.high}, medium ${openBySeverity.medium}, low ${openBySeverity.low}.`,
    );
    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t, n]) => `${t} (${n})`)
      .join(", ");
    if (topTypes) lines.push(`Dominant types: ${topTypes}.`);
    if ((byType.pothole || 0) > 0) lines.push("• **Potholes** — prioritise patching; flag for milling if clustered over >50 m.");
    if ((byType.cracking || 0) > 0) lines.push("• **Cracking** — seal before the wet season; widespread alligator cracking needs structural rehab.");
    if ((byType.rutting || 0) > 0) lines.push("• **Rutting** — check structural capacity; deep rutting usually needs rehabilitation.");
    if ((byType.drainage || 0) > 0 || (byType.erosion || 0) > 0) lines.push("• **Drainage / erosion** — clear drains and culverts first.");
    if ((byType["edge-break"] || 0) > 0) lines.push("• **Edge break** — restore shoulders and edge restraint.");
  }
  lines.push("");
  lines.push("### Recommended treatment");
  lines.push(`**Primary recommendation:** **${treatment.toUpperCase()}** (priority: ${priority}).`);
  lines.push(
    `Indicative unit rate ≈ **ETB ${unitRate.toLocaleString("en-US")} / km** → ~${lengthKm.toFixed(1)} km: **ETB ${estCost.toLocaleString("en-US")}** (planning figure).`,
  );
  if (budget > 0) {
    if (estCost <= budget * 0.15) {
      lines.push(`Cost is a modest share of programme budget (ETB ${budget.toLocaleString("en-US")}).`);
    } else if (estCost <= budget) {
      lines.push(`Cost is material relative to budget (ETB ${budget.toLocaleString("en-US")}). Rank against other critical sections.`);
    } else {
      lines.push(`Cost exceeds budget (ETB ${budget.toLocaleString("en-US")}). Consider staging, holding treatment, or supplemental funding.`);
    }
  }
  lines.push("");
  lines.push("### Suggested next actions");
  if (priority === "critical") {
    lines.push("1. Issue priority work order for safety-critical defects within 7 days.");
    lines.push("2. Confirm structural capacity before locking reconstruction vs rehab.");
    lines.push("3. Protect traffic with temporary repairs until permanent works start.");
  } else if (priority === "high") {
    lines.push("1. Place this section in the current-year programme with high weight.");
    lines.push("2. Complete defect map and quantity take-off for tender documents.");
    lines.push("3. Schedule works before the main rainy season if drainage-related.");
  } else if (priority === "medium") {
    lines.push("1. Include in preventive / overlay package with neighbouring sections.");
    lines.push("2. Re-inspect after the wet season; escalate if PCI drops >8 points.");
  } else {
    lines.push("1. Continue routine maintenance and annual PCI/IRI survey.");
    lines.push("2. Use as control section for network deterioration curves.");
  }
  lines.push("");
  lines.push(
    "_On-device rule engine (PCI, IRI, defect mix, traffic, Ethiopian unit rates). Not a substitute for site investigation._",
  );
  return lines.join("\n");
}

export const adviseSection = createServerFn({ method: "POST" })
  .validator((input: AdviseInput) => input)
  .handler(async ({ data }): Promise<AdviseResult> => {
    try {
      const text = buildEngineeringAdvice(data);
      return { ok: true, text };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Advisor failed to produce guidance.",
      };
    }
  });
