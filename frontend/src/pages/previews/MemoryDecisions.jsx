import React, { useState } from "react";
import {
  ScrollText,
  Database,
  Lightbulb,
  ListChecks,
  RefreshCw,
  X,
  GripVertical,
  Check,
  Plus,
  Users,
  Bot,
  User,
  MessageSquare,
} from "lucide-react";
import { C } from "./theme";
import { InitialsAvatar, AiAvatar } from "./ui";

/*
  "Memory & Decisions - Deep Dark" (Figma node 3:450) — tall scrollable
  conversation-memory page: rolling summary, stats, key decisions, action items.
*/

const DECISION_BG = "#233138"; // green-tinted card used for decisions & action items

const DECISIONS = [
  {
    id: "DEC-084",
    title: "Adopt Tailwind CSS v3 as the exclusive UI framework.",
    context:
      "Necessary for rapid prototyping and maintaining the unified 4px soft grid across the dashboard and landing pages.",
  },
  {
    id: "DEC-085",
    title: "Implement Tonal Layering for depth.",
    context:
      "To move away from heavy box-shadows and emphasize the flat, minimalist professional aesthetic.",
  },
];

const INITIAL_ITEMS = [
  { id: 1, text: "Fix typography typo in header component", meta: "High priority • Frontend", done: false },
  { id: 2, text: "Update API authentication layer", meta: "Security • Backend", done: false },
  { id: 3, text: "Generate memory panel layout", meta: "Completed", done: true },
];

const TABS = [
  { icon: MessageSquare, label: "Chats" },
  { icon: Users, label: "Contacts" },
  { icon: Bot, label: "Personas", active: true },
  { icon: User, label: "Profile" },
];

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: C.border }}>
      {React.createElement(icon, { size: 20, style: { color: C.teal } })}
      <h2 className="text-2xl font-semibold" style={{ color: C.text }}>
        {title}
      </h2>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span
      className="rounded-sm px-2 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{ background: C.active, color: C.muted }}
    >
      {children}
    </span>
  );
}

export default function MemoryDecisions() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const toggle = (id) => setItems((arr) => arr.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  return (
    <div className="relative flex min-h-full flex-col" style={{ background: C.deep, color: C.text }}>
      {/* header */}
      <header
        className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4"
        style={{ background: C.panel, borderColor: C.border }}
      >
        <div className="flex items-center gap-2">
          <AiAvatar size={32} bg={C.panelAlt} color={C.text} />
          <span className="text-2xl font-bold" style={{ color: C.teal }}>
            ConvoApp
          </span>
        </div>
        <div className="flex items-center gap-4" style={{ color: C.muted }}>
          <button aria-label="Refresh">
            <RefreshCw size={19} />
          </button>
          <button aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* main */}
      <main className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
        {/* title */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: C.text }}>
            Conversation Memory
          </h1>
          <p className="mt-1 text-base" style={{ color: C.muted }}>
            Synchronized contextual bridge between ConvoAI and your workspace.
          </p>
        </div>

        {/* rolling summary */}
        <section
          className="flex flex-col gap-4 rounded-lg border p-6"
          style={{ background: C.panel, borderColor: C.border }}
        >
          <SectionHeader icon={ScrollText} title="Rolling Summary" />
          <div
            className="rounded border-l-2 px-4 py-4 text-lg leading-relaxed"
            style={{ borderColor: C.teal, color: C.text }}
          >
            The discussion focused on accelerating the ConvoApp frontend architecture. The team agreed to
            prioritize dark-mode first development with a slate and yellow palette to maintain professional
            aesthetic. We identified a bottleneck in the current API documentation and decided to implement a more
            robust contextual memory panel to handle long-running architectural decisions. The conversation shifted
            toward ensuring mobile-first responsiveness before the next major release cycle.
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip>Archived 10m ago</Chip>
            <Chip>Context: Sprint 4</Chip>
          </div>
        </section>

        {/* stats */}
        <section className="flex flex-col gap-4">
          <div
            className="flex items-center justify-between rounded-lg border p-4"
            style={{ background: C.panel, borderColor: C.border }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                Memory Usage
              </p>
              <p className="text-2xl font-semibold" style={{ color: C.teal }}>
                842 Tokens
              </p>
            </div>
            <Database size={26} style={{ color: C.muted }} />
          </div>
          <div
            className="flex items-center justify-between rounded-lg border p-4"
            style={{ background: C.panel, borderColor: C.border }}
          >
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                Participants
              </p>
              <div className="flex items-center">
                <div style={{ marginRight: -8 }}>
                  <InitialsAvatar name="Alex Rivera" size={32} radius={12} ring={C.deep} />
                </div>
                <div style={{ marginRight: -8 }}>
                  <div
                    className="flex size-8 items-center justify-center rounded-xl border-2"
                    style={{ background: C.tealDim, borderColor: C.deep }}
                  >
                    <Bot size={16} style={{ color: C.teal }} />
                  </div>
                </div>
                <div
                  className="flex size-8 items-center justify-center rounded-xl border-2 text-[10px] font-bold"
                  style={{ background: C.active, borderColor: C.deep, color: C.text }}
                >
                  +2
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* key decisions */}
        <section
          className="flex flex-col gap-4 rounded-lg border p-6"
          style={{ background: C.panel, borderColor: C.border }}
        >
          <SectionHeader icon={Lightbulb} title="Key Decisions" />
          <div className="flex flex-col gap-4">
            {DECISIONS.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-1 rounded border p-4"
                style={{ background: DECISION_BG, borderColor: C.border }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wider"
                    style={{ background: "rgba(0,92,75,0.2)", color: C.teal }}
                  >
                    Decision
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: C.muted }}>
                    ID: {d.id}
                  </span>
                </div>
                <p className="text-sm font-bold" style={{ color: C.text }}>
                  {d.title}
                </p>
                <p className="text-base">
                  <span className="font-bold" style={{ color: C.text }}>
                    Context:
                  </span>{" "}
                  <span style={{ color: C.muted }}>{d.context}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* action items */}
        <section
          className="flex flex-col gap-4 rounded-lg border p-6"
          style={{ background: C.panel, borderColor: C.border }}
        >
          <SectionHeader icon={ListChecks} title="Action Items" />
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-4 rounded border p-4"
                style={{ background: DECISION_BG, borderColor: C.border }}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm border"
                  style={{
                    background: item.done ? C.teal : C.panel,
                    borderColor: item.done ? C.teal : "#3b4a54",
                  }}
                  aria-pressed={item.done}
                >
                  {item.done && <Check size={14} style={{ color: C.deep }} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: item.done ? C.muted : C.text,
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    {item.text}
                  </p>
                  <p className="text-[10px] uppercase" style={{ color: C.muted }}>
                    {item.meta}
                  </p>
                </div>
                {!item.done && <GripVertical size={16} className="shrink-0" style={{ color: C.muted }} />}
              </label>
            ))}

            <button
              className="mt-4 flex items-center justify-center gap-2 rounded border-2 border-dashed py-4 text-base"
              style={{ borderColor: C.border, color: C.muted }}
            >
              <Plus size={14} />
              Add New Action Item
            </button>
          </div>
        </section>
      </main>

      {/* bottom tab bar */}
      <nav
        className="sticky bottom-0 z-10 flex h-20 items-center justify-around border-t px-4"
        style={{ background: C.panel, borderColor: C.border }}
      >
        {TABS.map(({ icon, label, active }) => (
          <button
            key={label}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1"
            style={{ color: active ? C.teal : C.muted, background: active ? C.userBubble : "transparent" }}
          >
            {React.createElement(icon, { size: 20 })}
            <span className="text-xs font-semibold tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
