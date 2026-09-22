import type { RamsSnapshot } from "./store";

export type SearchHit = {
  id: string;
  kind: "road" | "section" | "defect" | "work" | "asset";
  title: string;
  subtitle: string;
  href: string;
};

/** Lightweight global search across corridors, sections, defects, work orders, assets. */
export function searchNetwork(s: RamsSnapshot, query: string, limit = 12): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const hits: SearchHit[] = [];
  const roadById = Object.fromEntries(s.roads.map((r) => [r.id, r]));
  const sectionById = Object.fromEntries(s.sections.map((sec) => [sec.id, sec]));

  for (const r of s.roads) {
    const hay = `${r.code} ${r.name} ${r.start} ${r.end}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: r.id,
        kind: "road",
        title: `${r.code} · ${r.name}`,
        subtitle: `${r.lengthKm} km · ${r.roadClass}`,
        href: `/inventory/${r.id}`,
      });
    }
  }

  for (const sec of s.sections) {
    const road = roadById[sec.roadId];
    const hay = `${sec.code} ${road?.code ?? ""} ${road?.name ?? ""}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: sec.id,
        kind: "section",
        title: sec.code,
        subtitle: `${road?.name ?? sec.roadId} · km ${sec.startChainage}–${sec.endChainage}`,
        href: `/inventory/${sec.roadId}`,
      });
    }
  }

  for (const d of s.defects) {
    const sec = sectionById[d.sectionId];
    const road = sec ? roadById[sec.roadId] : undefined;
    const hay = `${d.type} ${d.description} ${d.severity} ${d.id} ${road?.code ?? ""}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: d.id,
        kind: "defect",
        title: `${d.severity} ${d.type}`,
        subtitle: `${road?.code ?? "—"} · km ${d.chainageKm} · ${d.status}`,
        href: "/defects",
      });
    }
  }

  for (const w of s.workOrders) {
    const hay = `${w.code} ${w.title} ${w.assignee} ${w.notes}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: w.id,
        kind: "work",
        title: `${w.code} · ${w.title}`,
        subtitle: `${w.status} · ${w.assignee || "unassigned"}`,
        href: "/works",
      });
    }
  }

  for (const a of s.assets) {
    const hay = `${a.code} ${a.type} ${a.description}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: a.id,
        kind: "asset",
        title: `${a.code} · ${a.type}`,
        subtitle: a.description.slice(0, 80),
        href: `/inventory/${a.roadId}`,
      });
    }
  }

  return hits.slice(0, limit);
}
