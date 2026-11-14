import { useState } from "preact/hooks";
import { ItemAnalysis, MapIndex, MapNode } from "./data";
import { LOCATIONS } from "./locations";
import { Badge, ChanceLine, Empty } from "./ui";

interface Props {
  idx: MapIndex;
  node: MapNode;
  analysis?: ItemAnalysis;
  onItem: (item: number) => void;
}

const NodePanel = ({ idx, node, analysis, onItem }: Props) => {
  const [onlyGuaranteed, setOnly] = useState(false);
  const hasRotations = node.places.some((p) => /Rotace [ABC]$/.test(idx.meta[p][3]));

  const tables = node.places.map((p) => {
    const rows = idx.byPlace[p].filter((r) => !onlyGuaranteed || r.chance >= 99.995);
    return { place: p, label: idx.meta[p][3], isEvent: !!idx.meta[p][4], rows };
  });
  const shown = tables.filter((t) => t.rows.length);

  return (
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="wf-h2">{node.name}</h2>
        {node.hasEvent && <Badge tone="event">event</Badge>}
      </div>
      <p class="wf-muted">
        {LOCATIONS[node.loc].name}
        {node.type && ` · ${node.type}`}
      </p>

      <label class="wf-toggle mt-3">
        <input type="checkbox" checked={onlyGuaranteed} onChange={(e) => setOnly((e.target as HTMLInputElement).checked)} />
        <span>Jen garantované (100 %)</span>
      </label>

      {hasRotations && (
        <p class="wf-note mt-3">
          Rotace se střídají v cyklu <b>A, A, B, C</b>, který se pak opakuje. U obrany každých 5 vln, u přežití/odposlechu každých 5 minut, u interception každé kolo.
        </p>
      )}

      {shown.length === 0 && <Empty>V tomto nodu nic nepadá se 100% šancí.</Empty>}

      {shown.map((t) => (
        <section class="mt-5" key={t.place}>
          <h3 class="wf-h3 flex items-center gap-2">
            {t.label}
            {t.isEvent && <Badge tone="event">event</Badge>}
            <span class="opacity-50 ml-auto normal-case tracking-normal">{t.rows.length}</span>
          </h3>
          <div class="flex flex-col gap-1.5">
            {t.rows.map((r) => {
              const isItem = analysis?.item === r.item;
              const isRelic = analysis?.relicItems.has(r.item);
              return (
                <ChanceLine
                  title={idx.items[r.item]}
                  sub={isRelic ? "obsahuje hledaný item" : undefined}
                  right={idx.rarities[r.rarity]}
                  chance={r.chance}
                  tone={isItem ? "gold" : isRelic ? "teal" : "plain"}
                  onClick={() => onItem(r.item)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default NodePanel;
