import type { MapData, PlaceMeta } from "../../buildMap";
import { LOCATIONS } from "./locations";

export interface Row {
  item: number;
  place: number;
  chance: number;
  rarity: number;
}

export interface MapNode {
  key: string;
  loc: number;
  name: string;
  type: string;
  hasEvent: boolean;
  onlyEvent: boolean;
  places: number[];
}

export type Via = "direct" | "relic";

export interface Best {
  chance: number;
  via: Via;
}

export interface Hit {
  place: number;
  chance: number;
}

export interface RelicInfo {
  name: string;
  item: number; // index of the relic as an item, -1 if it never drops anywhere
  refinements: Partial<Record<string, number>>;
  vaulted: boolean;
  drops: Hit[]; // mission places where the relic drops, best first
}

export interface ItemAnalysis {
  item: number;
  direct: Hit[];
  relics: RelicInfo[];
  others: Hit[];
  locBest: Map<number, Best>;
  nodeBest: Map<string, Best>;
  relicItems: Set<number>;
  best?: Best;
}

const REFINEMENTS = ["Intact", "Exceptional", "Flawless", "Radiant"];
const TABLE_ORDER = (label: string) =>
  (label.startsWith("Caches") ? 20 : label.startsWith("Extra") ? 40 : 0) +
  (label.match(/Rotace ([A-Z])$/)?.[1].charCodeAt(0) ?? 90) - 64;

export const nodeKey = (loc: number, name: string) => `${loc}|${name}`;

export class MapIndex {
  items: string[];
  places: string[];
  meta: PlaceMeta[];
  rarities: string[];
  byItem: Row[][];
  byPlace: Row[][];
  nodes = new Map<string, MapNode>();
  nodesByLoc: MapNode[][] = LOCATIONS.map(() => []);
  itemByName = new Map<string, number>();
  private lower: string[];
  private cache = new Map<number, ItemAnalysis>();

  constructor(d: MapData) {
    this.items = d.items;
    this.places = d.places;
    this.meta = d.meta;
    this.rarities = d.rarities;
    this.byItem = d.items.map(() => []);
    this.byPlace = d.places.map(() => []);
    for (let k = 0; k < d.rows.length; k += 4) {
      const r: Row = { item: d.rows[k], place: d.rows[k + 1], chance: d.rows[k + 2] / 100, rarity: d.rows[k + 3] };
      this.byItem[r.item].push(r);
      this.byPlace[r.place].push(r);
    }
    this.byPlace.forEach((rows) => rows.sort((a, b) => b.chance - a.chance));
    d.items.forEach((n, i) => this.itemByName.set(n, i));
    this.lower = d.items.map((n) => n.toLowerCase());

    d.meta.forEach(([loc, name, type, , isEvent, kind], place) => {
      if (kind !== 0 || loc < 0) return;
      const key = nodeKey(loc, name);
      let node = this.nodes.get(key);
      if (!node) {
        node = { key, loc, name, type: "", hasEvent: false, onlyEvent: true, places: [] };
        this.nodes.set(key, node);
        this.nodesByLoc[loc].push(node);
      }
      if (!node.type && type) node.type = type;
      if (isEvent) node.hasEvent = true;
      else node.onlyEvent = false;
      node.places.push(place);
    });
    for (const node of this.nodes.values()) {
      node.places.sort((a, b) => {
        const ma = this.meta[a], mb = this.meta[b];
        return ma[4] - mb[4] || TABLE_ORDER(ma[3]) - TABLE_ORDER(mb[3]) || ma[3].localeCompare(mb[3]);
      });
    }
    this.nodesByLoc.forEach((l) => l.sort((a, b) => a.name.localeCompare(b.name)));
  }

  nodeOf(place: number) {
    const [loc, name, , , , kind] = this.meta[place];
    return kind === 0 && loc >= 0 ? this.nodes.get(nodeKey(loc, name)) : undefined;
  }

  /** Item suggestions: prefix matches first, then word-prefix, then substring. */
  suggest(q: string, limit = 12): number[] {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const a: number[] = [], b: number[] = [], c: number[] = [];
    this.lower.forEach((n, i) => {
      if (n.startsWith(s)) a.push(i);
      else if (n.includes(" " + s)) b.push(i);
      else if (n.includes(s)) c.push(i);
    });
    const byLen = (x: number, y: number) => this.items[x].length - this.items[y].length || this.items[x].localeCompare(this.items[y]);
    return [...a.sort(byLen), ...b.sort(byLen), ...c.sort(byLen)].slice(0, limit);
  }

  suggestNodes(q: string, limit = 5): MapNode[] {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: MapNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.name.toLowerCase().startsWith(s)) out.push(n);
      if (out.length >= limit) break;
    }
    return out;
  }

  analyze(item: number): ItemAnalysis {
    const cached = this.cache.get(item);
    if (cached) return cached;

    const direct: Hit[] = [], others: Hit[] = [];
    const relicMap = new Map<string, RelicInfo>();
    for (const r of this.byItem[item]) {
      const [, name, type, , , kind] = this.meta[r.place];
      if (kind === 0) direct.push({ place: r.place, chance: r.chance });
      else if (kind === 2) others.push({ place: r.place, chance: r.chance });
      else {
        let info = relicMap.get(name);
        if (!info) {
          const ri = this.itemByName.get(name) ?? -1;
          const drops: Hit[] = ri < 0 ? [] : this.byItem[ri]
            .filter((x) => this.meta[x.place][5] === 0)
            .map((x) => ({ place: x.place, chance: x.chance }))
            .sort((a, b) => b.chance - a.chance);
          info = { name, item: ri, refinements: {}, vaulted: drops.length === 0, drops };
          relicMap.set(name, info);
        }
        info.refinements[type] = r.chance;
      }
    }
    direct.sort((a, b) => b.chance - a.chance);
    others.sort((a, b) => b.chance - a.chance);
    const relics = [...relicMap.values()].sort(
      (a, b) => +a.vaulted - +b.vaulted || (b.drops[0]?.chance ?? 0) - (a.drops[0]?.chance ?? 0) || a.name.localeCompare(b.name)
    );

    const nodeBest = new Map<string, Best>();
    const locBest = new Map<number, Best>();
    const add = (place: number, chance: number, via: Via) => {
      const node = this.nodeOf(place);
      if (!node) return;
      const put = (m: Map<any, Best>, k: any) => {
        const cur = m.get(k);
        // direct drops always win over relic drops
        if (!cur || (via === "direct" && cur.via === "relic") || (via === cur.via && chance > cur.chance)) m.set(k, { chance, via });
      };
      put(nodeBest, node.key);
      put(locBest, node.loc);
    };
    direct.forEach((h) => add(h.place, h.chance, "direct"));
    relics.forEach((r) => r.drops.forEach((h) => add(h.place, h.chance, "relic")));

    let best: Best | undefined;
    for (const b of locBest.values())
      if (!best || (b.via === "direct" && best.via === "relic") || (b.via === best.via && b.chance > best.chance)) best = b;

    const res: ItemAnalysis = {
      item,
      direct,
      relics,
      others,
      locBest,
      nodeBest,
      relicItems: new Set(relics.map((r) => r.item).filter((i) => i >= 0)),
      best,
    };
    this.cache.set(item, res);
    return res;
  }
}

export { REFINEMENTS };

let pending: Promise<MapIndex> | undefined;
export const loadMap = () =>
  (pending ??= fetch("/data/map.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d: MapData) => new MapIndex(d))
    .catch((e) => {
      pending = undefined;
      throw e;
    }));

export const pct = (n: number) =>
  n.toLocaleString("cs-CZ", { maximumFractionDigits: n < 1 ? 2 : n < 10 ? 2 : 1 }) + " %";
