import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchNetwork } from "@/lib/rams/search";
import { useRams } from "@/lib/rams/store";
import { cn } from "@/lib/utils";

export function GlobalSearch({ className }: { className?: string }) {
  const snapshot = useRams((s) => ({
    roads: s.roads,
    sections: s.sections,
    assets: s.assets,
    inspections: s.inspections,
    defects: s.defects,
    activities: s.activities,
    workOrders: s.workOrders,
    plans: s.plans,
  }));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchNetwork(snapshot, q), [snapshot, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        root.current?.querySelector("input")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={root} className={cn("relative w-full max-w-sm", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search roads, defects, WO… (⌘K)"
          className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
          aria-label="Global search"
        />
      </div>
      {open && q.trim() && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg">
          {hits.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted">No matches</p>
          )}
          {hits.map((h) => (
            <Link
              key={`${h.kind}-${h.id}`}
              to={h.href}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              className="block border-b border-border px-3 py-2 last:border-0 hover:bg-surface-2"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {h.kind}
                </span>
                <span className="text-sm font-medium">{h.title}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">{h.subtitle}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
