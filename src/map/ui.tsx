import { ComponentChildren } from "preact";
import { pct } from "./data";

export const Badge = ({ children, tone = "slate" }: { children: ComponentChildren; tone?: "slate" | "event" | "gold" | "teal" | "vault" }) => (
  <span class={`wf-badge wf-badge-${tone}`}>{children}</span>
);

/** One clickable line with a chance bar under it. */
export const ChanceLine = ({
  title, sub, chance, tone, onClick, right,
}: {
  title: ComponentChildren;
  sub?: ComponentChildren;
  chance: number;
  tone?: "gold" | "teal" | "plain";
  onClick?: () => void;
  right?: ComponentChildren;
}) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag class={`wf-line wf-tone-${tone ?? "plain"}`} onClick={onClick}>
      <div class="flex items-start gap-2 min-w-0">
        <div class="flex-1 min-w-0 text-left">
          <div class="wf-line-title">{title}</div>
          {sub && <div class="wf-line-sub">{sub}</div>}
        </div>
        <div class="text-right shrink-0">
          <div class="wf-line-chance">{pct(chance)}</div>
          {right && <div class="wf-line-sub">{right}</div>}
        </div>
      </div>
      <div class="wf-bar"><span style={{ width: `${Math.max(1.5, Math.min(100, chance))}%` }} /></div>
    </Tag>
  );
};

export const Section = ({ title, count, children }: { title: string; count?: number; children: ComponentChildren }) => (
  <section class="mt-5">
    <h3 class="wf-h3">
      {title}
      {count !== undefined && <span class="ml-2 opacity-60">{count}</span>}
    </h3>
    <div class="flex flex-col gap-1.5">{children}</div>
  </section>
);

export const Empty = ({ children }: { children: ComponentChildren }) => <p class="wf-empty">{children}</p>;
