import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import StarChart, { GOLD, TEAL } from "./StarChart";
import MapSearch from "./MapSearch";
import ItemPanel from "./ItemPanel";
import PlanetPanel from "./PlanetPanel";
import NodePanel from "./NodePanel";
import { loadMap, MapIndex, MapNode, nodeKey, pct } from "./data";
import { LOCATIONS } from "./locations";

interface Route {
  item?: string;
  loc?: string;
  node?: string;
}

export const MAP_HASH = "#mapa";

const readRoute = (): Route => {
  const q = new URLSearchParams(location.hash.split("?")[1] ?? "");
  return { item: q.get("i") ?? undefined, loc: q.get("l") ?? undefined, node: q.get("n") ?? undefined };
};

const go = (r: Route) => {
  const q = new URLSearchParams();
  if (r.item) q.set("i", r.item);
  if (r.loc) q.set("l", r.loc);
  if (r.node) q.set("n", r.node);
  const s = q.toString();
  const hash = MAP_HASH + (s ? "?" + s : "");
  if (location.hash !== hash) location.hash = hash;
};

const MapView = () => {
  const [idx, setIdx] = useState<MapIndex>();
  const [error, setError] = useState("");
  const [route, setRoute] = useState<Route>(readRoute);
  const panel = useRef<HTMLDivElement>(null);

  const load = () => {
    setError("");
    loadMap().then(setIdx, (e) => setError(String(e?.message ?? e)));
  };
  useEffect(load, []);

  useEffect(() => {
    const on = () => setRoute(readRoute());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  const itemIdx = idx && route.item ? idx.itemByName.get(route.item) : undefined;
  const analysis = useMemo(() => (idx && itemIdx !== undefined ? idx.analyze(itemIdx) : undefined), [idx, itemIdx]);
  const locIdx = route.loc ? LOCATIONS.findIndex((l) => l.id === route.loc) : -1;
  const node = idx && locIdx >= 0 && route.node ? idx.nodes.get(nodeKey(locIdx, route.node)) : undefined;

  // Scroll the panel to the top whenever the view changes (and into view on mobile)
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
    if (window.innerWidth < 900 && (route.loc || route.item) && panel.current) {
      const top = panel.current.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.6) panel.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [route.item, route.loc, route.node]);

  const selectItem = (i: number) => go({ item: idx!.items[i] });
  const selectLoc = (l: number) => go({ item: route.item, loc: LOCATIONS[l].id });
  const selectNode = (n: MapNode) => go({ item: route.item, loc: LOCATIONS[n.loc].id, node: n.name });
  const selectPlace = (p: number) => {
    const n = idx!.nodeOf(p);
    if (n) selectNode(n);
  };

  const chips = LOCATIONS.map((l, i) => ({ l, i })).filter(({ l }) => l.shape === "chip");

  const crumbs: { label: string; onClick?: () => void }[] = [{ label: "Mapa", onClick: () => go({}) }];
  if (route.item) crumbs.push({ label: route.item, onClick: () => go({ item: route.item }) });
  if (locIdx >= 0) crumbs.push({ label: LOCATIONS[locIdx].name, onClick: () => go({ item: route.item, loc: route.loc }) });
  if (node) crumbs.push({ label: node.name });
  crumbs[crumbs.length - 1].onClick = undefined;

  let body;
  if (error)
    body = (
      <div class="wf-empty">
        Data mapy se nepodařilo načíst ({error}). <button class="wf-link" onClick={load}>Zkusit znovu</button>
      </div>
    );
  else if (!idx) body = <div class="wf-empty">Načítám drop tabulky…</div>;
  else if (node) body = <NodePanel key={node.key} idx={idx} node={node} analysis={analysis} onItem={selectItem} />;
  else if (locIdx >= 0) body = <PlanetPanel key={locIdx} idx={idx} loc={locIdx} analysis={analysis} onNode={selectNode} />;
  else if (analysis) body = <ItemPanel key={analysis.item} idx={idx} analysis={analysis} onPlace={selectPlace} onItem={selectItem} />;
  else if (route.item) body = <div class="wf-empty">Item „{route.item}“ v drop tabulkách není.</div>;
  else
    body = (
      <div>
        <h2 class="wf-h2">Star Chart</h2>
        <p class="wf-muted mt-1">
          Klikni na planetu a vyber node – uvidíš, co tam padá po rotacích. Nebo vyhledej item: planety se rozsvítí podle nejlepší šance.
        </p>
        <div class="flex gap-3 mt-3 text-xs wf-muted">
          <span><i class="wf-dot" style={{ background: GOLD }} /> padá přímo z mise</span>
          <span><i class="wf-dot" style={{ background: TEAL }} /> padá relikvie s itemem</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5 mt-4">
          {LOCATIONS.map((l, i) => (
            <button class="wf-line text-left" onClick={() => selectLoc(i)}>
              <div class="wf-line-title">{l.name}</div>
              <div class="wf-line-sub">{idx.nodesByLoc[i].length} nodů</div>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div class="wf-map">
      <div class="max-w-[1500px] mx-auto p-3 sm:p-4 flex flex-col min-[900px]:flex-row gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex gap-2 mb-3">
            <MapSearch
              idx={idx}
              value={route.item ?? ""}
              onItem={selectItem}
              onNode={selectNode}
              onClear={() => go({ loc: route.loc, node: route.node })}
            />
          </div>
          <StarChart selected={locIdx} lit={analysis?.locBest} onSelect={selectLoc} />
          <div class="flex flex-wrap gap-2 mt-3">
            {chips.map(({ l, i }) => {
              const hit = analysis?.locBest.get(i);
              const color = hit ? (hit.via === "direct" ? GOLD : TEAL) : undefined;
              return (
                <button
                  class={`wf-chip${locIdx === i ? " is-active" : ""}${analysis && !hit ? " opacity-40" : ""}`}
                  style={color ? { borderColor: color, color, boxShadow: `0 0 12px ${color}55` } : undefined}
                  onClick={() => selectLoc(i)}
                >
                  {l.name}
                  {hit && <b class="ml-1.5">{pct(hit.chance)}</b>}
                </button>
              );
            })}
          </div>
          <p class="wf-muted text-xs mt-3 hidden min-[900px]:block">
            Kolečko myši = zoom, tažením posuneš mapu. Na mobilu dvěma prsty.
          </p>
        </div>

        <aside class="wf-panel min-[900px]:w-[420px] shrink-0" ref={panel}>
          <nav class="wf-crumbs" aria-label="Navigace">
            {crumbs.map((c, i) => (
              <>
                {i > 0 && <span class="opacity-40">›</span>}
                {c.onClick ? <button class="wf-link" onClick={c.onClick}>{c.label}</button> : <span class="text-white truncate">{c.label}</span>}
              </>
            ))}
          </nav>
          <div class="p-4 pt-2">{body}</div>
        </aside>
      </div>
    </div>
  );
};

export default MapView;
