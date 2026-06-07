import React from "react";
import { AlignLeft, Tag, Lightbulb, ListChecks, X, CheckSquare, Square } from "lucide-react";
import { MONO } from "./theme";

/*
  "Conversation Memory - Monochrome" (Figma node 3:116) — the memory drawer,
  shown full-screen as on mobile: summary, topics, key decisions, action items,
  with a sticky "Share Discussion Memory" footer.
*/

const GREEN = "#3fb950"; // done
const AMBER = MONO.amber; // active

const TOPICS = ["Security", "Architecture", "Sprint 4"];

const ITEMS = [
  { text: "Fix typography typo in header", status: "done" },
  { text: "Update API authentication layer", status: "active" },
  { text: "Audit legacy component library", status: "pending" },
];

function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2">
      {React.createElement(icon, { size: 13, style: { color: MONO.muted } })}
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: MONO.muted }}>
        {children}
      </span>
    </div>
  );
}

function ActionRow({ item }) {
  const done = item.status === "done";
  const active = item.status === "active";
  return (
    <div className="flex items-center justify-between rounded p-2">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckSquare size={20} style={{ color: GREEN }} />
        ) : (
          <Square size={20} style={{ color: active ? AMBER : MONO.muted }} />
        )}
        <span
          className="text-sm"
          style={{
            color: done ? MONO.muted : MONO.text,
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {item.text}
        </span>
      </div>
      {done && <Badge color={GREEN}>DONE</Badge>}
      {active && <Badge color={AMBER}>ACTIVE</Badge>}
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span
      className="rounded border px-1.5 py-0.5 text-[9px] font-bold"
      style={{ background: `${color}1a`, borderColor: `${color}4d`, color }}
    >
      {children}
    </span>
  );
}

export default function ConversationMemoryMono() {
  return (
    <div className="flex min-h-full flex-col" style={{ background: "#1a2028", color: MONO.text }}>
      {/* drawer header */}
      <header
        className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4"
        style={{ background: "#1a2028", borderColor: MONO.border }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl tracking-tight" style={{ color: "#fff" }}>
            summarize
          </span>
          <span className="text-xl font-semibold tracking-tight" style={{ color: MONO.text }}>
            Memory
          </span>
        </div>
        <button className="rounded-full p-2" style={{ color: MONO.muted }} aria-label="Close">
          <X size={14} />
        </button>
      </header>

      {/* scrollable content */}
      <main className="flex flex-1 flex-col gap-6 p-4">
        {/* summary */}
        <section className="flex flex-col gap-2">
          <SectionLabel icon={AlignLeft}>Summary</SectionLabel>
          <div
            className="rounded-lg border p-4 text-sm leading-relaxed"
            style={{ background: "#161c24", borderColor: MONO.border }}
          >
            Overview of the current <b style={{ color: "#fff" }}>Frontend Architecture & API Security</b> strategy.
            Discussion focused on mitigating risks through <b style={{ color: "#fff" }}>JWT Auth</b> implementations
            and leveraging <b style={{ color: "#fff" }}>Tailwind v4</b> for a more robust, JIT-optimized design
            system that reduces runtime overhead.
          </div>
        </section>

        {/* topics */}
        <section className="flex flex-col gap-2">
          <SectionLabel icon={Tag}>Topics</SectionLabel>
          <div className="flex flex-wrap gap-1">
            {TOPICS.map((t) => (
              <span
                key={t}
                className="rounded border px-2.5 py-1 text-xs font-medium"
                style={{ background: "#242a33", borderColor: MONO.border, color: MONO.text }}
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* key decisions */}
        <section className="flex flex-col gap-2">
          <SectionLabel icon={Lightbulb}>Key Decisions</SectionLabel>
          <div
            className="flex flex-col gap-1 rounded-lg border p-2.5"
            style={{ background: "#141a22", borderColor: MONO.bubbleBorder }}
          >
            <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: "#fff" }}>
              Infrastructure
            </p>
            <p className="text-sm font-medium" style={{ color: MONO.text }}>
              Adopt Tailwind CSS v3 as exclusive UI framework
            </p>
            <div
              className="mt-1 flex items-center justify-between border-t pt-1.5 text-[11px]"
              style={{ borderColor: "rgba(68,71,74,0.3)", color: MONO.muted }}
            >
              <span>Sarah Jenkins</span>
              <span>Oct 24</span>
            </div>
          </div>
        </section>

        {/* action items */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel icon={ListChecks}>Action Items</SectionLabel>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "#2f353e", color: MONO.text }}
            >
              3/8 COMPLETE
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {ITEMS.map((item) => (
              <ActionRow key={item.text} item={item} />
            ))}
          </div>
        </section>
      </main>

      {/* sticky footer */}
      <div
        className="sticky bottom-0 border-t p-4"
        style={{ background: "#1a2028", borderColor: MONO.border }}
      >
        <button
          className="w-full rounded py-2 text-xs font-bold tracking-wide"
          style={{ background: "#fff", color: "#2a3136" }}
        >
          Share Discussion Memory
        </button>
      </div>
    </div>
  );
}
