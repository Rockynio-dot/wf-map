import { useState } from "preact/hooks";
import { Hit, ItemAnalysis, MapIndex, pct } from "./data";
import { LOCATIONS } from "./locations";
import { Badge, ChanceLine, Empty, Section } from "./ui";

interface Props {
  idx: MapIndex;
  analysis: ItemAnalysis;
  onPlace: (place: number) => void;
  onItem: (item: number) => void;
}

const placeTitle = (idx: MapIndex, place: number) => {
  const node = idx.nodeOf(place);
  if (!node) return idx.places[place];
  return `${LOCATIONS[node.loc].name} · ${node.name}`;
};

const placeSub = (idx: MapIndex, place: number) => {
  const [, , type, table, isEvent] = idx.meta[place];
  const node = idx.nodeOf(place);
  return (
    <>
      {[node?.type || type, table].filter(Boolean).join(" · ")}
      {!!isEvent && <> <Badge tone="event">event</Badge></>}
    </>
  );
};

const HitList = ({ idx, hits, tone, onPlace, limit = 8 }: { idx: MapIndex; hits: Hit[]; tone: "gold" | "teal" | "plain"; onPlace?: (p: number) => void; limit?: number }) => {
  const [all, setAll] = useState(false);
  const list = all ? hits : hits.slice(0, limit);
  return (
    <>
      {list.map((h) => (
        <ChanceLine
          title={onPlace ? placeTitle(idx, h.place) : idx.places[h.place]}
          sub={onPlace ? placeSub(idx, h.place) : undefined}
          chance={h.chance}
          tone={tone}
          onClick={onPlace && (() => onPlace(h.place))}
        />
      ))}
      {hits.length > limit && (
        <button class="wf-more" onClick={() => setAll(!all)}>
          {all ? "Zobrazit méně" : `Zobrazit vše (${hits.length})`}
        </button>
      )}
    </>
  );
};

const ItemPanel = ({ idx, analysis, onPlace, onItem }: Props) => {
  const { direct, relics, others, best } = analysis;
  const active = relics.filter((r) => !r.vaulted);
  const vaulted = relics.filter((r) => r.vaulted);
  const [showVaulted, setShowVaulted] = useState(false);

  return (
    <div>
      <h2 class="wf-h2">{idx.items[analysis.item]}</h2>
      {best ? (
        <p class="wf-muted">
          Nejlepší šance na mapě: <b style={{ color: best.via === "direct" ? "var(--wf-gold)" : "var(--wf-teal)" }}>{pct(best.chance)}</b>{" "}
          {best.via === "direct" ? "přímo z mise" : "na relikvii"}
        </p>
      ) : (
        <p class="wf-muted">Na mapě nepadá – podívej se níž na nepřátele a kontejnery.</p>
      )}
      <div class="flex gap-3 mt-2 text-xs wf-muted">
        <span><i class="wf-dot" style={{ background: "var(--wf-gold)" }} /> z mise</span>
        <span><i class="wf-dot" style={{ background: "var(--wf-teal)" }} /> z relikvie</span>
      </div>

      {direct.length > 0 && (
        <Section title="Přímo z misí" count={direct.length}>
          <HitList idx={idx} hits={direct} tone="gold" onPlace={onPlace} />
        </Section>
      )}

      {relics.length > 0 && (
        <Section title="Z relikvií" count={relics.length}>
          {active.length === 0 && <Empty>Všechny relikvie s tímto itemem jsou vaultované.</Empty>}
          {[...active, ...(showVaulted || active.length === 0 ? vaulted : [])].map((r) => (
            <div class="wf-card">
              <div class="flex items-center gap-2 flex-wrap">
                <button class="wf-link font-semibold" disabled={r.item < 0} onClick={() => r.item >= 0 && onItem(r.item)}>{r.name}</button>
                {r.vaulted && <Badge tone="vault">vaultovaná</Badge>}
              </div>
              <p class="wf-line-sub mt-0.5">
                {r.refinements.Intact !== undefined && <>Intact {pct(r.refinements.Intact)}</>}
                {r.refinements.Radiant !== undefined && <> · Radiant {pct(r.refinements.Radiant)}</>}
              </p>
              {r.drops.length > 0 && (
                <div class="flex flex-col gap-1 mt-2">
                  <HitList idx={idx} hits={r.drops} tone="teal" onPlace={onPlace} limit={3} />
                </div>
              )}
            </div>
          ))}
          {active.length > 0 && vaulted.length > 0 && (
            <button class="wf-more" onClick={() => setShowVaulted(!showVaulted)}>
              {showVaulted ? "Skrýt vaultované" : `Vaultované relikvie (${vaulted.length})`}
            </button>
          )}
        </Section>
      )}

      {others.length > 0 && (
        <Section title="Nepřátelé, kontejnery a ostatní" count={others.length}>
          <HitList idx={idx} hits={others} tone="plain" />
        </Section>
      )}

      {!direct.length && !relics.length && !others.length && <Empty>Pro tento item nejsou žádná data.</Empty>}
    </div>
  );
};

export default ItemPanel;
