import {
  pathFromChainageGps,
  sliceChainageGps,
} from "./geometry";
import type { ChainageGps, Road, Section } from "./types";

export type CsvImportResult = {
  ok: true;
  points: ChainageGps[];
  roadCode: string | null;
  appliedTo: "road" | "section" | "none";
  targetId: string | null;
  message: string;
} | {
  ok: false;
  error: string;
};

/**
 * Parse chainage GPS CSV.
 * Accepted headers (case-insensitive):
 *   chainage_km | chainage | km
 *   lat | latitude
 *   lng | lon | longitude
 * Optional: road_code | road | code
 *
 * Rows may be comma or semicolon separated.
 */
export function parseChainageCsv(text: string): {
  points: ChainageGps[];
  roadCode: string | null;
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length < 2) {
    return { points: [], roadCode: null, errors: ["CSV needs a header row and at least one data row."] };
  }

  const delim = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const idxChain =
    headers.findIndex((h) => ["chainage_km", "chainage", "km", "chainagekm"].includes(h));
  const idxLat = headers.findIndex((h) => ["lat", "latitude", "y"].includes(h));
  const idxLng = headers.findIndex((h) => ["lng", "lon", "long", "longitude", "x"].includes(h));
  const idxRoad = headers.findIndex((h) =>
    ["road_code", "road", "code", "corridor", "roadcode"].includes(h),
  );

  if (idxChain < 0 || idxLat < 0 || idxLng < 0) {
    return {
      points: [],
      roadCode: null,
      errors: [
        "Missing required columns. Need chainage_km (or chainage/km), lat, and lng (or lon/longitude).",
      ],
    };
  }

  const points: ChainageGps[] = [];
  const errors: string[] = [];
  let roadCode: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map((c) => c.trim());
    const chainageKm = Number(cols[idxChain]);
    const lat = Number(cols[idxLat]);
    const lng = Number(cols[idxLng]);
    if (!Number.isFinite(chainageKm) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push(`Row ${i + 1}: invalid numbers`);
      continue;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push(`Row ${i + 1}: lat/lng out of range`);
      continue;
    }
    points.push({ chainageKm, position: [lat, lng] });
    if (idxRoad >= 0 && cols[idxRoad] && !roadCode) {
      roadCode = cols[idxRoad];
    }
  }

  points.sort((a, b) => a.chainageKm - b.chainageKm);
  return { points, roadCode, errors };
}

/**
 * Apply surveyed chainage GPS to a matching road (by code or id) and refresh section paths.
 */
export function applyChainageGpsToNetwork(
  roads: Road[],
  sections: Section[],
  points: ChainageGps[],
  roadCodeOrId?: string | null,
): { roads: Road[]; sections: Section[]; targetId: string | null; message: string } {
  if (points.length < 2) {
    return {
      roads,
      sections,
      targetId: null,
      message: "Need at least 2 GPS points to build an alignment.",
    };
  }

  let target =
    roadCodeOrId
      ? roads.find(
          (r) =>
            r.id === roadCodeOrId ||
            r.code.toLowerCase() === roadCodeOrId.toLowerCase(),
        )
      : null;

  if (!target) {
    const span = points[points.length - 1].chainageKm - points[0].chainageKm;
    target = [...roads].sort(
      (a, b) => Math.abs(a.lengthKm - span) - Math.abs(b.lengthKm - span),
    )[0];
  }

  if (!target) {
    return { roads, sections, targetId: null, message: "No matching corridor found." };
  }

  const chainageGps = points.map((p) => ({
    chainageKm: p.chainageKm,
    position: p.position as [number, number],
  }));
  const path = pathFromChainageGps(chainageGps);
  const lengthKm = Math.max(
    target.lengthKm,
    points[points.length - 1].chainageKm - points[0].chainageKm,
  );

  const nextRoads = roads.map((r) =>
    r.id === target!.id
      ? {
          ...r,
          chainageGps,
          path,
          lengthKm,
        }
      : r,
  );

  const nextSections = sections.map((sec) => {
    if (sec.roadId !== target!.id) return sec;
    const slice = sliceChainageGps(chainageGps, sec.startChainage, sec.endChainage);
    if (slice.length < 2) return sec;
    return {
      ...sec,
      chainageGps: slice,
      path: pathFromChainageGps(slice),
    };
  });

  return {
    roads: nextRoads,
    sections: nextSections,
    targetId: target.id,
    message: `Applied ${points.length} GPS points to ${target.code} (${target.name}); updated section alignments.`,
  };
}

export const SAMPLE_CHAINAGE_CSV = `chainage_km,lat,lng,road_code
0,8.905,38.762,A1
10,8.875,38.805,A1
20,8.830,38.870,A1
30,8.780,38.940,A1
40,8.720,39.020,A1
50,8.650,39.100,A1
60,8.590,39.180,A1
70,8.555,39.240,A1
77.4,8.541,39.269,A1
`;
