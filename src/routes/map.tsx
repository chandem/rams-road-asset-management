import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NetworkMap } from "@/components/rams/network-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRams } from "@/lib/rams/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({ component: MapPage });

export function MapPage() {
  const navigate = useNavigate();
  const roads = useRams((s) => s.roads);
  const sections = useRams((s) => s.sections);
  const defects = useRams((s) => s.defects);
  const assets = useRams((s) => s.assets);
  const [layers, setLayers] = useState({
    roads: true,
    defects: true,
    assets: true,
    chainages: true,
  });
  const [basemap, setBasemap] = useState<"streets" | "satellite">("streets");

  const totalGps = roads.reduce((n, r) => n + (r.chainageGps?.length ?? r.path.length), 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">GIS</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Network map</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Full corridor alignments from GPS at chainages. Click a section to open inventory. Toggle
          layers and basemap.
        </p>
        <p className="mt-1 text-xs text-subtle">
          {roads.length} corridors · {totalGps} chainage GPS points
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["roads", "Sections (PCI)"],
            ["chainages", "Km chainages"],
            ["defects", "Open defects"],
            ["assets", "Assets"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
            className={cn(
              "h-11 rounded-full border px-4 text-sm font-medium",
              layers[key]
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-muted",
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setBasemap((b) => (b === "streets" ? "satellite" : "streets"))}
          className="h-11 rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted"
        >
          Basemap: {basemap === "streets" ? "Streets" : "Satellite"}
        </button>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-3">
          <NetworkMap
            roads={roads}
            sections={sections}
            defects={defects}
            assets={assets}
            showRoads={layers.roads}
            showDefects={layers.defects}
            showAssets={layers.assets}
            showChainages={layers.chainages}
            basemap={basemap}
            onSectionClick={(_sectionId, roadId) => {
              void navigate({ to: "/inventory/$roadId", params: { roadId } });
            }}
            height={560}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legend & geometry</CardTitle>
          <CardDescription>
            PCI colour on section centrelines. Import surveyed GPS under Inventory to replace demo
            alignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          {[
            ["Excellent", "#1f5c45"],
            ["Good", "#3d7a5c"],
            ["Fair", "#a07a32"],
            ["Poor", "#b45309"],
            ["Critical", "#8f2d2d"],
          ].map(([name, color]) => (
            <span key={name} className="inline-flex items-center gap-2">
              <i className="inline-block h-1.5 w-6 rounded-full" style={{ background: color }} />
              {name}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
