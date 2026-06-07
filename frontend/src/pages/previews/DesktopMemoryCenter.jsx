import React, { useState } from "react";
import {
  Search,
  BrainCircuit,
  Settings,
  MoreVertical,
  TrendingUp,
  Cloud,
  Boxes,
  Banknote,
  UserPlus,
  ListChecks,
  Check,
  Plus,
} from "lucide-react";
import { C } from "./theme";
import SideNav from "./SideNav";
import { InitialsAvatar } from "./ui";

/*
  "Desktop Memory Center - Deep Dark" (Figma node 3:1110) — 3-pane memory hub:
  shared side nav · memory list · main canvas (rolling summary + insights,
  key-decisions grid, action-items checklist) with an ambient status toast.
  Responsive: side nav hides < lg, memory list hides < md, panels stack on small.
*/

const MEMORIES = [
  {
    title: "Project Alpha Strategy",
    time: "2m ago",
    preview: "The team finalized the architectural roadmap for the Q4 rollout...",
    active: true,
  },
  {
    title: "Market Analysis Sync",
    time: "1h ago",
    preview: "Competitor research indicates a shift toward edge computing solutions...",
  },
  {
    title: "Security Audit V2",
    time: "Yesterday",
    preview: "Initial findings show no critical vulnerabilities in the core...",
  },
];

const DECISIONS = [
  {
    icon: Cloud,
    tag: "Critical",
    title: "Cloud Provider Selection",
    desc: "Formal commitment to AWS for multi-region scalability over GCP's offer.",
    footer: "confirmed",
  },
  {
    icon: Boxes,
    tag: "Structural",
    title: "Architecture V3.1",
    desc: "Approval of the micro-services migration plan targeting complete transition by Q1.",
    footer: "Approved 2d ago",
  },
  {
    icon: Banknote,
    tag: "Budget",
    title: "Marketing Allocation",
    desc: "Reduced traditional spend by 15% to reinvest in AI-driven lead gen tools.",
    footer: "Finalized Yesterday",
  },
  {
    icon: UserPlus,
    tag: "Hiring",
    title: "New Senior Architect",
    desc: "Extend offer to Candidate #402 following exceptional deep-dive results.",
    footer: "Drafting Offer",
  },
];

const ITEMS = [
  { id: 1, text: "Schedule AWS kickoff meeting", meta: "Due: Oct 24", done: true },
  { id: 2, text: "Draft recruitment brief for Q1 hires", meta: "Due: Oct 25", done: true },
  { id: 3, text: "Refine multi-region database latency report", meta: "Priority: High • Due: Oct 28", done: false },
  { id: 4, text: "Sync with security lead on V2 findings", meta: "Priority: Critical • Due: Oct 29", done: false },
  { id: 5, text: "Present marketing reallocation to board", meta: "Due: Oct 31", done: false },
];

function DecisionCard({ decision }) {
  const Icon = decision.icon;
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-6"
      style={{ background: C.panelAlt, borderColor: C.border }}
    >
      <div className="flex items-center justify-between">
        <Icon size={24} style={{ color: C.teal }} />
        <span
          className="rounded-sm border px-2 py-0.5 text-[10px] uppercase"
          style={{ background: C.deep, borderColor: C.border, color: C.text }}
        >
          {decision.tag}
        </span>
      </div>
      <h5 className="pt-2 text-base" style={{ color: C.text }}>
        {decision.title}
      </h5>
      <p className="flex-1 text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
        {decision.desc}
      </p>
      <div className="flex items-center gap-2 pt-2 text-xs" style={{ color: C.muted }}>
        {decision.footer === "confirmed" ? (
          <>
            <span>Confirmed by:</span>
            <div className="flex">
              <div style={{ marginRight: -8 }}>
                <InitialsAvatar name="Alex Rivera" size={24} ring={C.panelAlt} />
              </div>
              <InitialsAvatar name="Sarah Jenkins" size={24} ring={C.panelAlt} />
            </div>
          </>
        ) : (
          <span>{decision.footer}</span>
        )}
      </div>
    </div>
  );
}

export default function DesktopMemoryCenter() {
  const [items, setItems] = useState(ITEMS);
  const toggle = (id) => setItems((arr) => arr.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div
      className="mx-auto flex h-[92vh] w-full max-w-[1280px] overflow-hidden rounded-2xl border shadow-2xl"
      style={{ background: C.deep, borderColor: C.border }}
    >
      <SideNav active="Personas" />

      {/* middle: memory list */}
      <div
        className="hidden h-full w-80 shrink-0 flex-col border-r md:flex"
        style={{ background: C.deep, borderColor: C.border }}
      >
        <div className="flex h-16 items-center border-b px-6" style={{ background: C.panel, borderColor: C.border }}>
          <div className="relative flex w-full items-center rounded-xl px-3 py-2.5" style={{ background: C.border }}>
            <Search size={15} style={{ color: C.muted }} />
            <input
              placeholder="Search memories..."
              className="ml-2 w-full bg-transparent text-sm outline-none"
              style={{ color: C.text }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {MEMORIES.map((m) => (
              <button
                key={m.title}
                className="flex flex-col gap-1 rounded-lg border p-4 text-left"
                style={{
                  background: m.active ? C.active : "transparent",
                  borderColor: m.active ? C.border : "transparent",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-base" style={{ color: m.active ? C.teal : C.text }}>
                    {m.title}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase" style={{ color: C.muted }}>
                    {m.time}
                  </span>
                </div>
                <p className="text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
                  {m.preview}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* main */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header
          className="flex h-12 shrink-0 items-center justify-between border-b px-6"
          style={{ background: C.panel, borderColor: C.border }}
        >
          <div className="flex items-center gap-4">
            <BrainCircuit size={19} style={{ color: C.teal }} />
            <h2 className="text-2xl font-semibold" style={{ color: C.text }}>
              Memory & Decisions
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button style={{ color: C.muted }} aria-label="Settings">
              <Settings size={18} />
            </button>
            <button style={{ color: C.muted }} aria-label="More">
              <MoreVertical size={16} />
            </button>
            <button className="rounded px-6 py-2 text-base font-medium" style={{ background: C.teal, color: C.panel }}>
              Share
            </button>
          </div>
        </header>

        {/* scrollable canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {/* hero stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* rolling summary */}
            <div
              className="relative overflow-hidden rounded-lg border p-6 lg:col-span-2"
              style={{ background: C.panelAlt, borderColor: C.border }}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full blur-3xl"
                style={{ background: "rgba(0,168,132,0.05)" }}
              />
              <p className="text-base uppercase tracking-widest" style={{ color: C.teal }}>
                Rolling Summary
              </p>
              <h3 className="pt-2 text-2xl font-semibold" style={{ color: C.text }}>
                Project Alpha Strategy Alignment
              </h3>
              <p className="max-w-2xl pt-2 text-base leading-relaxed" style={{ color: C.muted }}>
                Throughout the last three sessions, the focus has shifted from initial ideation to technical
                feasibility. The core objective remains{" "}
                <span style={{ color: C.teal }}>Scaling Infrastructure</span> to support 1M concurrent users. Key
                hurdles identified include global database latency and local edge caching protocols. The team is
                currently in consensus on the hybrid-cloud approach using AWS as the primary provider.
              </p>
            </div>

            {/* intelligence insights */}
            <div
              className="flex flex-col rounded-lg border p-6"
              style={{ background: C.border, borderColor: C.border }}
            >
              <p className="text-base uppercase tracking-widest" style={{ color: C.teal }}>
                Intelligence Insights
              </p>
              <div className="flex items-center gap-2 pt-1">
                <TrendingUp size={20} style={{ color: C.text }} />
                <span className="text-2xl font-bold" style={{ color: C.text }}>
                  84%
                </span>
              </div>
              <p className="flex-1 pt-1 text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
                Strategic confidence index based on historical decision outcomes and data-driven projections.
              </p>
              <button
                className="mt-4 rounded border py-2 text-sm font-medium"
                style={{ borderColor: C.border, color: C.text }}
              >
                View Detailed Report
              </button>
            </div>
          </div>

          {/* decisions + action items */}
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* key decisions */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-semibold" style={{ color: C.text }}>
                  Key Decisions
                </h4>
                <span
                  className="rounded-xl border px-4 py-1 text-xs font-semibold tracking-wide"
                  style={{ background: C.panel, borderColor: C.border, color: C.muted }}
                >
                  Last 7 Days
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {DECISIONS.map((d) => (
                  <DecisionCard key={d.title} decision={d} />
                ))}
              </div>
            </div>

            {/* action items */}
            <div
              className="flex flex-col rounded-lg border lg:col-span-5"
              style={{ background: C.panelAlt, borderColor: C.border }}
            >
              <div className="flex items-center justify-between border-b p-6" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2">
                  <ListChecks size={20} style={{ color: C.teal }} />
                  <h4 className="text-xl" style={{ color: C.text }}>
                    Action Items
                  </h4>
                </div>
                <span className="text-right text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
                  {doneCount}/{items.length} Complete
                </span>
              </div>
              <div className="flex flex-col gap-6 p-6">
                {items.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-start gap-4">
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-sm border"
                      style={{
                        background: item.done ? C.teal : "transparent",
                        borderColor: item.done ? C.teal : "#3b4a54",
                      }}
                      aria-pressed={item.done}
                    >
                      {item.done && <Check size={13} style={{ color: C.deep }} />}
                    </button>
                    <div style={{ opacity: item.done ? 0.4 : 1 }}>
                      <p
                        className="text-base"
                        style={{ color: C.text, textDecoration: item.done ? "line-through" : "none" }}
                      >
                        {item.text}
                      </p>
                      <p className="text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
                        {item.meta}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-2 border-t p-6" style={{ background: C.border, borderColor: C.border }}>
                <Plus size={12} style={{ color: C.muted }} />
                <input
                  placeholder="Add custom action item..."
                  className="w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "#6b7280", color: C.text }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ambient status toast */}
        <div
          className="absolute bottom-6 right-6 flex items-center gap-4 rounded-lg border px-6 py-4 shadow-2xl"
          style={{ background: C.active, borderColor: C.border }}
        >
          <span className="size-2 rounded-full" style={{ background: C.teal }} />
          <span className="text-base" style={{ color: C.text }}>
            Intelligence engine synchronized.
          </span>
        </div>
      </div>
    </div>
  );
}
