// Star Chart locations shared by the data generator (buildMap.ts) and the UI.
// Coordinates are in the SVG viewBox 0 0 1590 968 (sun / centre at 795, 515).

export type Shape = "planet" | "ring" | "diamond" | "void" | "glow" | "chip";

export interface Loc {
  id: string;
  name: string;
  shape: Shape;
  x?: number;
  y?: number;
  r?: number;
  color?: string;
  lx?: number;
  ly?: number;
}

export const LOCATIONS: Loc[] = [
  { id: "Mercury", name: "Mercury", shape: "planet", x: 692, y: 602, r: 15, color: "#5e4632", lx: 633, ly: 560 },
  { id: "Venus", name: "Venus", shape: "planet", x: 870, y: 676, r: 20, color: "#b8642c", lx: 835, ly: 627 },
  { id: "Earth", name: "Earth", shape: "planet", x: 1020, y: 512, r: 24, color: "#3f5a8a", lx: 975, ly: 462 },
  { id: "Lua", name: "Lua", shape: "planet", x: 1086, y: 526, r: 9, color: "#9ea4ad", lx: 1086, ly: 480 },
  { id: "Mars", name: "Mars", shape: "planet", x: 970, y: 352, r: 14, color: "#7a3424", lx: 948, ly: 310 },
  { id: "Phobos", name: "Phobos", shape: "planet", x: 1040, y: 272, r: 7, color: "#6b5546", lx: 998, ly: 241 },
  { id: "Deimos", name: "Deimos", shape: "planet", x: 800, y: 415, r: 13, color: "#6e4f3a", lx: 795, ly: 352 },
  { id: "Ceres", name: "Ceres", shape: "planet", x: 630, y: 310, r: 12, color: "#3b3633", lx: 600, ly: 271 },
  { id: "Jupiter", name: "Jupiter", shape: "planet", x: 455, y: 508, r: 44, color: "#9a6a45", lx: 405, ly: 436 },
  { id: "Europa", name: "Europa", shape: "planet", x: 320, y: 512, r: 14, color: "#8a7462", lx: 275, ly: 470 },
  { id: "Saturn", name: "Saturn", shape: "ring", x: 550, y: 750, r: 27, color: "#6b5a46", lx: 508, ly: 695 },
  { id: "Uranus", name: "Uranus", shape: "ring", x: 790, y: 858, r: 25, color: "#3c6f96", lx: 742, ly: 803 },
  { id: "Neptune", name: "Neptune", shape: "planet", x: 1185, y: 785, r: 25, color: "#1d3866", lx: 1128, ly: 732 },
  { id: "Pluto", name: "Pluto", shape: "planet", x: 1412, y: 505, r: 11, color: "#6a5f5a", lx: 1340, ly: 468 },
  { id: "Sedna", name: "Sedna", shape: "planet", x: 793, y: 156, r: 13, color: "#4a2a20", lx: 760, ly: 118 },
  { id: "Eris", name: "Eris", shape: "planet", x: 1203, y: 345, r: 12, color: "#5a4f6e", lx: 1188, ly: 303 },
  { id: "Kuva Fortress", name: "Kuva Fortress", shape: "diamond", x: 1356, y: 497, r: 9, color: "#c23a30", lx: 1205, ly: 498 },
  { id: "Void", name: "Void", shape: "void", x: 150, y: 520, r: 18, color: "#b8c6ff", lx: 132, ly: 462 },
  { id: "Zariman", name: "Zariman", shape: "glow", x: 148, y: 370, r: 15, color: "#4fe3ee", lx: 65, ly: 308 },
  // Not on the Star Chart → chips under the map
  { id: "Duviri", name: "Duviri", shape: "chip" },
  { id: "Veil Proxima", name: "Veil Proxima", shape: "chip" },
  { id: "Höllvania", name: "Höllvania", shape: "chip" },
  { id: "Sanctuary", name: "Sanctuary", shape: "chip" },
  { id: "Dark Refractory", name: "Dark Refractory", shape: "chip" },
  { id: "Other", name: "Ostatní", shape: "chip" },
];

export const OTHER_LOC = LOCATIONS.length - 1;
