import type { LatLng } from "./types";

/** Survey GPS fixed at a known chainage (km from section/road start). */
export type ChainageGps = {
  chainageKm: number;
  position: LatLng;
};

/** Haversine distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Cumulative length (km) along a polyline. */
export function polylineLengthKm(path: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < path.length; i++) sum += haversineKm(path[i - 1], path[i]);
  return sum;
}

export function densifyPathToChainageGps(
  path: LatLng[],
  startKm = 0,
  endKm?: number,
  stepKm = 1,
): ChainageGps[] {
  if (!path.length) return [];
  if (path.length === 1) {
    return [{ chainageKm: startKm, position: path[0] }];
  }

  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = haversineKm(path[i - 1], path[i]);
    segLens.push(d);
    total += d;
  }
  if (total <= 0) {
    return path.map((p, i) => ({
      chainageKm: startKm + (i / Math.max(1, path.length - 1)) * ((endKm ?? startKm) - startKm),
      position: p,
    }));
  }

  const targetEnd = endKm ?? startKm + total;
  const span = targetEnd - startKm;
  const points: ChainageGps[] = [];

  const steps = Math.max(1, Math.ceil(Math.abs(span) / stepKm));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const chainageKm = startKm + t * span;
    const distAlong = t * total;
    points.push({
      chainageKm: round3(chainageKm),
      position: pointAtDistance(path, segLens, distAlong),
    });
  }

  points[0] = { chainageKm: round3(startKm), position: path[0] };
  points[points.length - 1] = {
    chainageKm: round3(targetEnd),
    position: path[path.length - 1],
  };
  return points;
}

function pointAtDistance(path: LatLng[], segLens: number[], distKm: number): LatLng {
  if (distKm <= 0) return path[0];
  let remaining = distKm;
  for (let i = 0; i < segLens.length; i++) {
    const seg = segLens[i];
    if (remaining <= seg || i === segLens.length - 1) {
      const f = seg > 0 ? Math.min(1, remaining / seg) : 0;
      return lerp(path[i], path[i + 1], f);
    }
    remaining -= seg;
  }
  return path[path.length - 1];
}

function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function pathFromChainageGps(points: ChainageGps[]): LatLng[] {
  return points.map((p) => p.position);
}

export function positionAtChainage(
  points: ChainageGps[],
  chainageKm: number,
): LatLng | null {
  if (!points.length) return null;
  if (points.length === 1) return points[0].position;

  const sorted = [...points].sort((a, b) => a.chainageKm - b.chainageKm);
  if (chainageKm <= sorted[0].chainageKm) return sorted[0].position;
  if (chainageKm >= sorted[sorted.length - 1].chainageKm) {
    return sorted[sorted.length - 1].position;
  }

  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (chainageKm <= b.chainageKm) {
      const span = b.chainageKm - a.chainageKm;
      const t = span > 0 ? (chainageKm - a.chainageKm) / span : 0;
      return lerp(a.position, b.position, t);
    }
  }
  return sorted[sorted.length - 1].position;
}

export function sliceChainageGps(
  points: ChainageGps[],
  startKm: number,
  endKm: number,
): ChainageGps[] {
  if (!points.length) return [];
  const sorted = [...points].sort((a, b) => a.chainageKm - b.chainageKm);
  const lo = Math.min(startKm, endKm);
  const hi = Math.max(startKm, endKm);

  const out: ChainageGps[] = [];
  const startPos = positionAtChainage(sorted, lo);
  if (startPos) out.push({ chainageKm: round3(lo), position: startPos });

  for (const p of sorted) {
    if (p.chainageKm > lo && p.chainageKm < hi) {
      out.push(p);
    }
  }

  const endPos = positionAtChainage(sorted, hi);
  if (endPos) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last.chainageKm - hi) > 0.001) {
      out.push({ chainageKm: round3(hi), position: endPos });
    }
  }
  return out;
}

export function ensureDensePath(
  path: LatLng[],
  startKm: number,
  endKm: number,
  stepKm = 1,
): LatLng[] {
  if (path.length < 2) return path;
  const gps = densifyPathToChainageGps(path, startKm, endKm, stepKm);
  return pathFromChainageGps(gps);
}
