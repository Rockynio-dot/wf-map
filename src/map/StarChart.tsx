import { useMemo, useRef, useState } from "preact/hooks";
import { LOCATIONS, Loc } from "./locations";
import { Best, pct } from "./data";

const W = 1590, H = 968, CX = 795, CY = 515;
const FULL = { x: 0, y: 0, w: W, h: H };
type Box = typeof FULL;

export const GOLD = "#f5c451";
export const TEAL = "#4fe3ee";

interface Props {
  selected: number;
  lit?: Map<number, Best>;
  onSelect: (loc: number) => void;
}

// Deterministic star field (no artwork, just dots)
const STARS = (() => {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 220 }, () => ({ x: rnd() * W, y: rnd() * H, r: rnd() * 1.3 + 0.2, o: rnd() * 0.6 + 0.15 }));
})();
const ORBITS = [130, 200, 270, 345, 420, 495, 570, 640];

const clampBox = (b: Box): Box => {
  const w = Math.min(W, Math.max(W / 6, b.w));
  const h = (w * H) / W;
  return { w, h, x: Math.min(W - w, Math.max(0, b.x)), y: Math.min(H - h, Math.max(0, b.y)) };
};

const Label = ({ loc, active, color }: { loc: Loc; active: boolean; color?: string }) => {
  const lines = loc.id === "Kuva Fortress" ? ["KUVA", "FORTRESS"] : [loc.name.toUpperCase()];
  return (
    <g class="wf-label" opacity={active ? 1 : 0.82}>
      <circle cx={loc.lx! - 9} cy={loc.ly! - 5} r={3} fill="none" stroke={color ?? "#cfe6ea"} stroke-width={1.2} />
      {lines.map((t, i) => (
        <text x={loc.lx} y={loc.ly! + i * 18} fill={color ?? "#dce9ec"}>{t}</text>
      ))}
    </g>
  );
};

const Body = ({ loc }: { loc: Loc }) => {
  const { x, y, r, color, shape } = loc as Required<Loc>;
  if (shape === "void")
    return (
      <g>
        <ellipse cx={x} cy={y} rx={70} ry={6} fill="url(#wf-void)" />
        <ellipse cx={x} cy={y} rx={34} ry={2.2} fill="#eef2ff" opacity={0.9} />
      </g>
    );
  if (shape === "glow")
    return (
      <g>
        <circle cx={x} cy={y} r={r * 2.4} fill="url(#wf-glow)" />
        <circle cx={x} cy={y} r={r * 0.6} fill={color} />
        <circle cx={x} cy={y} r={r} fill="none" stroke={color} stroke-width={1.5} opacity={0.7} />
      </g>
    );
  if (shape === "diamond")
    return <path d={`M${x} ${y - r * 1.4}L${x + r} ${y}L${x} ${y + r * 1.4}L${x - r} ${y}Z`} fill={color} stroke="#ff8a7a" stroke-width={1} />;
  return (
    <g>
      {shape === "ring" && <ellipse cx={x} cy={y} rx={r * 1.9} ry={r * 0.45} fill="none" stroke="#c8b89a" stroke-opacity={0.45} stroke-width={3} transform={`rotate(-14 ${x} ${y})`} />}
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x} cy={y} r={r} fill="url(#wf-shade)" />
      {shape === "ring" && (
        <path
          d={`M${x - r * 1.9} ${y} A${r * 1.9} ${r * 0.45} 0 0 0 ${x + r * 1.9} ${y}`}
          fill="none" stroke="#c8b89a" stroke-opacity={0.6} stroke-width={3} transform={`rotate(-14 ${x} ${y})`}
        />
      )}
    </g>
  );
};

const StarChart = ({ selected, lit, onSelect }: Props) => {
  const [box, setBox] = useState<Box>(FULL);
  const svg = useRef<SVGSVGElement>(null);
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ box: Box; dist: number; cx: number; cy: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const searching = !!lit;

  const planets = useMemo(() => LOCATIONS.map((l, i) => ({ l, i })).filter(({ l }) => l.shape !== "chip"), []);

  const centroid = () => {
    const pts = [...ptrs.current.values()];
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    return { cx, cy, dist };
  };
  const startGesture = (b: Box) => {
    const c = centroid();
    gesture.current = { box: b, ...c, moved: gesture.current?.moved ?? false };
  };

  const zoomAt = (factor: number, clientX?: number, clientY?: number, from = box) => {
    const rect = svg.current!.getBoundingClientRect();
    const fx = clientX === undefined ? 0.5 : (clientX - rect.left) / rect.width;
    const fy = clientY === undefined ? 0.5 : (clientY - rect.top) / rect.height;
    const w = Math.min(W, Math.max(W / 6, from.w / factor));
    const h = (w * H) / W;
    return clampBox({ w, h, x: from.x + fx * from.w - fx * w, y: from.y + fy * from.h - fy * h });
  };

  const onPointerDown = (e: PointerEvent) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 1) gesture.current = null;
    dragged.current = false;
    startGesture(box);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!ptrs.current.has(e.pointerId) || !gesture.current) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const c = centroid();
    if (!g.moved && Math.hypot(c.cx - g.cx, c.cy - g.cy) < 6 && Math.abs(c.dist - g.dist) < 6) return;
    if (!g.moved) {
      g.moved = true;
      svg.current?.setPointerCapture(e.pointerId);
    }
    dragged.current = true;
    let b = g.box;
    if (ptrs.current.size > 1 && g.dist > 0) b = zoomAt(c.dist / g.dist, g.cx, g.cy, g.box);
    const k = b.w / svg.current!.getBoundingClientRect().width;
    setBox(clampBox({ ...b, x: b.x - (c.cx - g.cx) * k, y: b.y - (c.cy - g.cy) * k }));
  };
  const onPointerUp = (e: PointerEvent) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size) startGesture(box);
    else gesture.current = null;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    setBox(zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY));
  };
  // A drag must not count as a click on a planet
  const onClickCapture = (e: Event) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
      dragged.current = false;
    }
  };

  const zoomed = box.w < W - 1;

  return (
    <div class="relative">
      <svg
        ref={svg}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        class="wf-chart block w-full h-auto select-none rounded-xl"
        style={{ touchAction: "none", aspectRatio: `${W} / ${H}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClickCapture={onClickCapture}
        role="img"
        aria-label="Star Chart"
      >
        <defs>
          <radialGradient id="wf-neb1" cx="35%" cy="45%" r="55%">
            <stop offset="0" stop-color="#1f4a52" stop-opacity="0.85" />
            <stop offset="1" stop-color="#0a1418" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="wf-neb2" cx="72%" cy="60%" r="50%">
            <stop offset="0" stop-color="#2a5a6e" stop-opacity="0.6" />
            <stop offset="1" stop-color="#0a1418" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="wf-sun">
            <stop offset="0" stop-color="#fff4d6" stop-opacity="0.55" />
            <stop offset="0.35" stop-color="#7fd0d8" stop-opacity="0.12" />
            <stop offset="1" stop-color="#0a1418" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="wf-shade" cx="32%" cy="30%" r="80%">
            <stop offset="0" stop-color="#fff" stop-opacity="0.38" />
            <stop offset="0.45" stop-color="#fff" stop-opacity="0" />
            <stop offset="1" stop-color="#000" stop-opacity="0.7" />
          </radialGradient>
          <radialGradient id="wf-glow">
            <stop offset="0" stop-color={TEAL} stop-opacity="0.75" />
            <stop offset="1" stop-color={TEAL} stop-opacity="0" />
          </radialGradient>
          <radialGradient id="wf-void">
            <stop offset="0" stop-color="#dfe6ff" stop-opacity="0.9" />
            <stop offset="1" stop-color="#b8c6ff" stop-opacity="0" />
          </radialGradient>
          <filter id="wf-blur"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>

        <g style={{ pointerEvents: "none" }}>
          <rect width={W} height={H} fill="#0a1418" />
          <rect width={W} height={H} fill="url(#wf-neb1)" />
          <rect width={W} height={H} fill="url(#wf-neb2)" />
          {STARS.map((s) => <circle cx={s.x} cy={s.y} r={s.r} fill="#e8f6f8" opacity={s.o} />)}
          {[0, 30, 60, 90, 120, 150].map((a) => {
            const rad = (a * Math.PI) / 180, L = 900;
            return <line x1={CX - Math.cos(rad) * L} y1={CY - Math.sin(rad) * L} x2={CX + Math.cos(rad) * L} y2={CY + Math.sin(rad) * L} stroke="#8fd3dc" stroke-opacity={0.07} />;
          })}
          {ORBITS.map((r) => <ellipse cx={CX} cy={CY} rx={r * 1.22} ry={r * 0.72} fill="none" stroke="#8fd3dc" stroke-opacity={0.13} stroke-width={1.2} />)}
          <circle cx={CX} cy={CY} r={90} fill="url(#wf-sun)" />
        </g>

        {planets.map(({ l, i }) => {
          const hit = lit?.get(i);
          const color = hit ? (hit.via === "direct" ? GOLD : TEAL) : undefined;
          const active = selected === i;
          const dim = searching && !hit && !active;
          const hr = Math.max((l.r ?? 10) + 8, 26);
          const lblY = l.shape === "void" ? l.y! + 26 : l.y! + (l.r ?? 10) + 22;
          return (
            <g
              class={`wf-loc${active ? " is-active" : ""}`}
              opacity={dim ? 0.38 : 1}
              onClick={() => onSelect(i)}
              tabIndex={0}
              role="button"
              aria-label={l.name + (hit ? `, ${pct(hit.chance)}` : "")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(i))}
            >
              {color && <circle cx={l.x} cy={l.y} r={(l.r ?? 12) + 14} fill={color} opacity={0.35} filter="url(#wf-blur)" class="wf-pulse" />}
              <Body loc={l} />
              {(color || active) && (
                <circle cx={l.x} cy={l.y} r={(l.shape === "void" ? 14 : l.r ?? 10) + 6} fill="none" stroke={active ? "#fff" : color} stroke-width={2} stroke-dasharray={active ? "" : "4 3"} />
              )}
              <Label loc={l} active={active || !!hit} color={color} />
              {hit && (
                <text x={l.x} y={lblY} class="wf-chance" fill={color} text-anchor="middle">{pct(hit.chance)}</text>
              )}
              <circle cx={l.x} cy={l.y} r={hr} fill="transparent" class="wf-hit" />
              {l.shape === "void" && <rect x={l.x! - 72} y={l.y! - 16} width={144} height={32} fill="transparent" />}
            </g>
          );
        })}
      </svg>

      <div class="absolute right-2 bottom-2 flex flex-col gap-1">
        <button class="wf-zoom" aria-label="Přiblížit" onClick={() => setBox(zoomAt(1.5))}>+</button>
        <button class="wf-zoom" aria-label="Oddálit" onClick={() => setBox(zoomAt(1 / 1.5))}>−</button>
        {zoomed && <button class="wf-zoom text-xs" aria-label="Celá mapa" onClick={() => setBox(FULL)}>⤢</button>}
      </div>
    </div>
  );
};

export default StarChart;
