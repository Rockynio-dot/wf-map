import { useState } from "preact/hooks";
import { ItemAnalysis, MapIndex, MapNode, pct } from "./data";
import { LOCATIONS } from "./locations";
import { Badge, Empty } from "./ui";

interface Props {
  idx: MapIndex;
  loc: number;
  analysis?: ItemAnalysis;
  onNode: (node: MapNode) => void;
}

const PlanetPanel = ({ idx, loc, analysis, onNode }: Props) => {
  const [q, setQ] = useState("");
  let nodes = idx.nodesByLoc[loc];
  if (q) nodes = nodes.filter((n) => (n.name + " " + n.type).toLowerCase().includes(q.toLowerCase()));
  if (analysis) {
    const score = (n: MapNode) => {
      const b = analysis.nodeBest.get(n.key);
      return b ? (b.via === "direct" ? 1000 : 0) + b.chance : -1;
    };
    nodes = [...nodes].sort((a, b) => score(b) - score(a));
  }

  return (
    <div>
      <h2 class="wf-h2">{LOCATIONS[loc].name}</h2>
      <p class="wf-muted">{idx.nodesByLoc[loc].length} nodů</p>
      {idx.nodesByLoc[loc].length > 8 && (
        <input class="wf-input mt-3" placeholder="Filtrovat nody…" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
      )}
      <div class="flex flex-col gap-1.5 mt-3">
        {nodes.length === 0 && <Empty>Nic nenalezeno.</Empty>}
        {nodes.map((n) => {
          const b = analysis?.nodeBest.get(n.key);
          const color = b ? (b.via === "direct" ? "var(--wf-gold)" : "var(--wf-teal)") : undefined;
          return (
            <button class={`wf-line ${b ? (b.via === "direct" ? "wf-tone-gold" : "wf-tone-teal") : analysis ? "opacity-50" : ""}`} onClick={() => onNode(n)}>
              <div class="flex items-center gap-2">
                <div class="flex-1 min-w-0 text-left">
                  <div class="wf-line-title">
                    {n.name} {n.hasEvent && <Badge tone="event">event</Badge>}
                  </div>
                  <div class="wf-line-sub">{n.type || "—"}</div>
                </div>
                {b && <div class="wf-line-chance" style={{ color }}>{pct(b.chance)}</div>}
                <span class="opacity-40">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlanetPanel;
