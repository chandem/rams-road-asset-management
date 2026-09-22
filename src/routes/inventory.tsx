import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ConditionBadge, PciMeter } from "@/components/rams/badges";
import { ChainageImportPanel } from "@/components/rams/chainage-import";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { classLabel, formatInt, formatKm } from "@/lib/rams/format";
import { sectionAssessment, sectionLength, useRams } from "@/lib/rams/store";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

function InventoryPage() {
  const roads = useRams((s) => s.roads);
  const sections = useRams((s) => s.sections);
  const defects = useRams((s) => s.defects);
  const assets = useRams((s) => s.assets);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return roads
      .map((road) => {
        const secs = sections.filter((s) => s.roadId === road.id);
        const km = secs.reduce((n, s) => n + sectionLength(s), 0) || road.lengthKm;
        const pci =
          km === 0
            ? 0
            : secs.reduce(
                (n, s) => n + sectionAssessment(s, defects, road).score * sectionLength(s),
                0,
              ) / km;
        const category = sectionAssessment(
          {
            ...secs[0],
            inspectionRating: pci,
          },
          [],
          road,
        ).category;
        return {
          road,
          km,
          pci,
          category,
          sections: secs.length,
          assets: assets.filter((a) => a.roadId === road.id).length,
        };
      })
      .filter((r) => {
        if (!query) return true;
        const hay = `${r.road.code} ${r.road.name} ${r.road.start} ${r.road.end}`.toLowerCase();
        return hay.includes(query);
      });
  }, [roads, sections, defects, assets, q]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Register</p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Road inventory</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Chainage-referenced corridors, sections and attached assets.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, name, place"
          className="max-w-sm"
          aria-label="Search inventory"
        />
      </header>

      <div className="flex flex-col gap-3">
        {rows.map(({ road, km, pci, category, sections: nSec, assets: nAst }) => (
          <Link key={road.id} to="/inventory/$roadId" params={{ roadId: road.id }}>
            <Card className="transition-colors hover:bg-surface-2/60">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted">{road.code}</span>
                    <ConditionBadge category={category} />
                    <span className="text-[11px] uppercase tracking-wide text-subtle">
                      {classLabel(road.roadClass)}
                    </span>
                  </div>
                  <div className="mt-1 font-display text-xl font-medium tracking-tight">
                    {road.name}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {road.start} → {road.end}
                  </div>
                </div>
                <div className="grid w-full grid-cols-3 gap-3 sm:w-72">
                  <Stat label="Length" value={formatKm(km)} />
                  <Stat label="AADT" value={formatInt(road.aadt)} />
                  <Stat label="Assets" value={String(nAst)} />
                  <div className="col-span-3">
                    <div className="mb-1 text-[11px] uppercase tracking-wide text-muted">PCI</div>
                    <PciMeter score={pci} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <span className="sr-only">{nSec} sections</span>
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            No corridors match that search.
          </p>
        )}
      </div>

      <ChainageImportPanel />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}
