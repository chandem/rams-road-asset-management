import { describe, expect, it } from "vitest";
import {
  densifyPathToChainageGps,
  haversineKm,
  pathFromChainageGps,
  positionAtChainage,
  sliceChainageGps,
} from "./geometry";

describe("geometry", () => {
  const path: [number, number][] = [
    [8.905, 38.762],
    [8.84, 38.86],
    [8.752, 38.981],
    [8.61, 39.116],
    [8.541, 39.269],
  ];

  it("haversine is positive between distinct points", () => {
    expect(haversineKm(path[0], path[1])).toBeGreaterThan(0);
  });

  it("densifies to ~1 km steps for a long corridor", () => {
    const gps = densifyPathToChainageGps(path, 0, 77.4, 1);
    expect(gps.length).toBeGreaterThan(50);
    expect(gps[0].chainageKm).toBe(0);
    expect(gps[gps.length - 1].chainageKm).toBe(77.4);
  });

  it("positionAtChainage interpolates between surveyed points", () => {
    const gps = densifyPathToChainageGps(path, 0, 77.4, 5);
    const mid = positionAtChainage(gps, 20);
    expect(mid).not.toBeNull();
    expect(mid![0]).toBeGreaterThan(8);
    expect(mid![0]).toBeLessThan(9.5);
  });

  it("sliceChainageGps returns section window", () => {
    const gps = densifyPathToChainageGps(path, 0, 77.4, 1);
    const slice = sliceChainageGps(gps, 18, 44);
    expect(slice[0].chainageKm).toBe(18);
    expect(slice[slice.length - 1].chainageKm).toBe(44);
    expect(slice.length).toBeGreaterThan(10);
    expect(pathFromChainageGps(slice).length).toBe(slice.length);
  });
});
