// Builds public/data/map.json (compact data for the interactive Star Chart)
// from public/data/drops.json. Called from generateData.ts, or standalone:
//   npx tsx buildMap.ts
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { LOCATIONS, OTHER_LOC } from "./src/map/locations";

interface Drop {
  place: string;
  name: string;
  rarity: string;
  chance: number;
}

/** kind: 0 = mission / bounty / other mission-like, 1 = relic, 2 = enemy / container */
export type PlaceMeta = [
  loc: number,
  node: string,
  type: string,
  table: string,
  isEvent: 0 | 1,
  kind: 0 | 1 | 2
];

export interface MapData {
  locs: string[];
  rarities: string[];
  items: string[];
  places: string[];
  meta: PlaceMeta[];
  /** flat: itemIdx, placeIdx, chance × 100, rarityIdx */
  rows: number[];
}

const HUBS: Record<string, [string, string]> = {
  "Cetus Bounty": ["Earth", "Cetus – Plains of Eidolon"],
  "Ghoul Bounty": ["Earth", "Cetus – Plains of Eidolon"],
  "Plague Star": ["Earth", "Cetus – Plains of Eidolon"],
  "Orb Vallis Bounty": ["Venus", "Fortuna – Orb Vallis"],
  "Cambion Drift Bounty": ["Deimos", "Necralisk – Cambion Drift"],
  "Isolation Vault": ["Deimos", "Necralisk – Cambion Drift"],
  "Arcana Isolation Vault": ["Deimos", "Necralisk – Cambion Drift"],
};

const SEGMENTS: Record<string, string> = { "Dark Refractory, Deimos": "Dark Refractory" };

const locIndex = new Map(LOCATIONS.map((l, i) => [l.id, i]));

export const parsePlace = (raw: string): PlaceMeta => {
  let p = raw.trim();
  const isEvent = p.startsWith("Event: ") ? 1 : 0;
  if (isEvent) p = p.slice(7);

  const relic = p.match(/^(.+ Relic) \((Intact|Exceptional|Flawless|Radiant)\)$/);
  if (relic && !p.includes("/")) return [-1, relic[1], relic[2], "", 0, 1];
  if (!p.includes("/")) return [-1, "", "", "", 0, 2];

  const parts = p.split("/").map((s) => s.trim());
  let rot = "";
  const rm = parts[parts.length - 1].match(/^Rotation ([A-Z])$/);
  if (rm) {
    rot = rm[1];
    parts.pop();
  }
  const seg = parts[0];
  const rotLabel = rot ? `Rotace ${rot}` : "";

  // Open-world bounties → one hub node per planet
  const lvl = seg.match(/^Level \d+ - \d+ (.+)$/);
  if (lvl && HUBS[lvl[1]]) {
    const [planet, hub] = HUBS[lvl[1]];
    return [locIndex.get(planet)!, hub, "Bounty", [seg, rotLabel].filter(Boolean).join(" · "), isEvent, 0];
  }

  const locId = SEGMENTS[seg] ?? seg;
  const loc = locIndex.get(locId);
  if (loc !== undefined && loc !== OTHER_LOC && parts.length > 1) {
    let nodePart = parts.slice(1).join("/");
    let tag = "";
    if (/ Extra$/.test(nodePart)) {
      tag = "Extra";
      nodePart = nodePart.replace(/ Extra$/, "");
    }
    let node = nodePart;
    let type = "";
    const m = nodePart.match(/^(.*?)\s*\(([^()]*)\)$/);
    if (m) {
      node = m[1].trim();
      type = m[2];
    }
    if (type === "Caches") {
      tag = "Caches";
      type = "";
    }
    const table = [tag, rotLabel].filter(Boolean).join(" · ") || "Odměna";
    return [loc, node, type, table, isEvent, 0];
  }

  // Quests, Arbitrations, Nightmare, Granum Void, Nokko, …
  return [OTHER_LOC, seg, "", rotLabel || "Odměna", isEvent, 0];
};

export const buildMap = (drops: Drop[]): MapData => {
  const items: string[] = [];
  const places: string[] = [];
  const rarities: string[] = [];
  const iIdx = new Map<string, number>();
  const pIdx = new Map<string, number>();
  const rIdx = new Map<string, number>();
  const idx = (map: Map<string, number>, arr: string[], v: string) => {
    let i = map.get(v);
    if (i === undefined) {
      i = arr.push(v) - 1;
      map.set(v, i);
    }
    return i;
  };

  // Sum duplicate rows (same item in the same table), max 100 %
  const sums = new Map<string, [number, number, number, number]>();
  for (const d of drops) {
    const name = d.name.trim();
    const place = d.place.trim();
    const it = idx(iIdx, items, name);
    const pl = idx(pIdx, places, place);
    const key = `${it}|${pl}`;
    const prev = sums.get(key);
    if (prev) prev[2] += d.chance;
    else sums.set(key, [it, pl, d.chance, idx(rIdx, rarities, d.rarity)]);
  }

  const rows: number[] = [];
  for (const [it, pl, ch, ra] of sums.values()) {
    rows.push(it, pl, Math.round(Math.min(ch, 100) * 100), ra);
  }

  return {
    locs: LOCATIONS.map((l) => l.id),
    rarities,
    items,
    places,
    meta: places.map(parsePlace),
    rows,
  };
};

export const writeMap = (dir = "./public/data") => {
  const drops: Drop[] = JSON.parse(readFileSync(`${dir}/drops.json`, "utf8"));
  const map = buildMap(drops);
  writeFileSync(`${dir}/map.json`, JSON.stringify(map));
  console.log("Map:", map.items.length, "items,", map.places.length, "places,", map.rows.length / 4, "rows");
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) writeMap();
