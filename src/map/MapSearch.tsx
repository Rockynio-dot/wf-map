import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { MapIndex, MapNode } from "./data";
import { LOCATIONS } from "./locations";

interface Props {
  idx?: MapIndex;
  value: string;
  onItem: (item: number) => void;
  onNode: (node: MapNode) => void;
  onClear: () => void;
}

type Option = { kind: "item"; item: number } | { kind: "node"; node: MapNode };

const MapSearch = ({ idx, value, onItem, onNode, onClear }: Props) => {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => setQ(value), [value]);

  const options: Option[] = useMemo(() => {
    if (!idx || !open || !q.trim()) return [];
    return [
      ...idx.suggest(q, 10).map((item) => ({ kind: "item" as const, item })),
      ...idx.suggestNodes(q, 4).map((node) => ({ kind: "node" as const, node })),
    ];
  }, [idx, q, open]);

  useEffect(() => setHi(0), [q]);

  const pick = (o?: Option) => {
    if (!o) return;
    setOpen(false);
    input.current?.blur();
    if (o.kind === "item") {
      setQ(idx!.items[o.item]);
      onItem(o.item);
    } else {
      setQ(value);
      onNode(o.node);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(options[hi] ?? options[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const markup = (text: string) => {
    const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
    if (i < 0 || !q.trim()) return text;
    const n = q.trim().length;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + n)}</mark>
        {text.slice(i + n)}
      </>
    );
  };

  return (
    <div class="relative flex-1 min-w-0">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={input}
        class="wf-input wf-search"
        placeholder={idx ? "Hledat item, relikvii nebo node…" : "Načítám data…"}
        disabled={!idx}
        value={q}
        role="combobox"
        aria-expanded={options.length > 0}
        aria-autocomplete="list"
        onInput={(e) => {
          setQ((e.target as HTMLInputElement).value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          (e.target as HTMLInputElement).select();
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {(q || value) && (
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 wf-x"
          aria-label="Zrušit hledání"
          onClick={() => {
            setQ("");
            onClear();
            input.current?.focus();
          }}
        >
          ×
        </button>
      )}
      {options.length > 0 && (
        <ul class="wf-suggest" role="listbox">
          {options.map((o, i) => (
            <li
              role="option"
              aria-selected={i === hi}
              class={i === hi ? "is-hi" : ""}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
            >
              {o.kind === "item" ? (
                <span>{markup(idx!.items[o.item])}</span>
              ) : (
                <span>
                  <span class="wf-badge wf-badge-slate mr-2">node</span>
                  {markup(o.node.name)} <span class="opacity-50">· {LOCATIONS[o.node.loc].name}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MapSearch;
