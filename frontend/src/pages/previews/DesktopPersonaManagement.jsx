import React, { useState } from "react";
import {
  Search,
  Cpu,
  Sparkles,
  MoreVertical,
  Plus,
  Code,
  ListChecks,
  Scale,
  Zap,
  FileText,
  GitBranch,
  ShieldCheck,
  RefreshCw,
  Eye,
} from "lucide-react";
import { C } from "./theme";
import SideNav from "./SideNav";

/*
  "Desktop Persona Management - Deep Dark" (Figma node 3:914).
  Shared side nav + top bar + hero + 2-col grid of persona cards (toggle, role,
  description, capability footer) + "Add Custom Module" placeholder.
  Responsive: side nav hides < lg, grid collapses to one column on small screens.
*/

const PERSONAS = [
  {
    id: "claude",
    name: "Claude",
    role: "General Assistant",
    icon: Sparkles,
    desc: "A versatile and nuanced conversational partner optimized for deep research, creative writing, and complex problem-solving with a focus on ethical reasoning.",
    meta: [
      { icon: Zap, label: "High Latency" },
      { icon: FileText, label: "Token limit: 200k" },
    ],
    on: true,
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    role: "Engineering Specialist",
    icon: Code,
    desc: "Scrutinizes pull requests for security vulnerabilities, architectural consistency, and performance bottlenecks. Expert in TypeScript, Rust, and Go.",
    meta: [
      { icon: GitBranch, label: "Git Integrated" },
      { icon: ShieldCheck, label: "Compliance-Ready" },
    ],
    on: true,
  },
  {
    id: "project-manager",
    name: "Project Manager",
    role: "Operational Strategy",
    icon: ListChecks,
    desc: "Synthesizes meeting notes into actionable JIRA tasks, manages project timelines, and identifies potential blockers in cross-functional workflows.",
    meta: [{ icon: RefreshCw, label: "Kanban Auto-sync" }],
    on: false,
  },
  {
    id: "devils-advocate",
    name: "Devil's Advocate",
    role: "Critical Analysis",
    icon: Scale,
    desc: "Designed to challenge your assumptions. This persona rigorously stress-tests your ideas, identifies logical fallacies, and suggests worst-case scenarios for any strategic plan.",
    meta: [{ icon: Eye, label: "High Scrutiny" }],
    on: true,
  },
];

function PillToggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: on ? C.teal : C.active }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 size-5 rounded-full bg-white transition-all"
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  );
}

function PersonaCard({ persona, on, onToggle }) {
  const Icon = persona.icon;
  return (
    <div
      className="flex flex-col rounded-lg border p-6"
      style={{ background: C.panel, borderColor: C.border }}
    >
      <div className="flex items-start justify-between pb-4">
        <div
          className="flex size-14 items-center justify-center rounded-lg border"
          style={{ background: C.deep, borderColor: C.border }}
        >
          <Icon size={26} style={{ color: C.teal }} />
        </div>
        <PillToggle on={on} onClick={onToggle} />
      </div>
      <h3 className="text-2xl font-semibold" style={{ color: C.text }}>
        {persona.name}
      </h3>
      <p className="pb-4 pt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: C.teal }}>
        {persona.role}
      </p>
      <p className="flex-1 pb-6 text-base" style={{ color: C.muted }}>
        {persona.desc}
      </p>
      <div className="flex flex-wrap gap-4 border-t pt-4" style={{ borderColor: C.border }}>
        {persona.meta.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            {React.createElement(icon, { size: 13, style: { color: C.muted } })}
            <span className="text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DesktopPersonaManagement() {
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(PERSONAS.map((p) => [p.id, p.on])),
  );
  const toggle = (id) => setEnabled((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div
      className="mx-auto flex h-[92vh] w-full max-w-[1280px] overflow-hidden rounded-2xl border shadow-2xl"
      style={{ background: C.deep, borderColor: C.border }}
    >
      <SideNav active="Personas" />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header
          className="flex h-12 shrink-0 items-center justify-between border-b px-6"
          style={{ background: C.deep, borderColor: C.border }}
        >
          <div className="relative flex items-center rounded border px-3 py-1.5" style={{ background: C.active, borderColor: C.border }}>
            <Search size={16} style={{ color: C.muted }} />
            <input
              placeholder="Search personas..."
              className="ml-2 w-40 bg-transparent text-sm outline-none sm:w-56"
              style={{ color: C.text }}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2" style={{ color: C.muted }} aria-label="Settings">
              <Cpu size={18} />
            </button>
            <button className="p-2" style={{ color: C.muted }} aria-label="AI">
              <Sparkles size={18} />
            </button>
            <button
              className="rounded-sm px-4 py-1.5 text-sm font-medium"
              style={{ background: C.teal, color: C.deep }}
            >
              Share
            </button>
            <button className="p-2" style={{ color: C.muted }} aria-label="More">
              <MoreVertical size={16} />
            </button>
          </div>
        </header>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {/* hero */}
          <div className="flex flex-col items-start justify-between gap-4 pb-10 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: C.text }}>
                AI Personas
              </h1>
              <p className="mt-2 max-w-xl text-lg" style={{ color: C.muted }}>
                Configure specialized intelligence profiles to streamline your high-velocity professional
                workflows.
              </p>
            </div>
            <button
              className="flex shrink-0 items-center gap-2 rounded border px-6 py-3 text-sm font-medium"
              style={{ borderColor: C.border, color: C.text }}
            >
              <Plus size={16} />
              Create Custom Persona
            </button>
          </div>

          {/* grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PERSONAS.map((p) => (
              <PersonaCard key={p.id} persona={p} on={enabled[p.id]} onToggle={() => toggle(p.id)} />
            ))}

            {/* add custom module placeholder */}
            <button
              className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-20"
              style={{ background: "rgba(17,27,33,0.3)", borderColor: C.border }}
            >
              <div
                className="mb-4 flex size-16 items-center justify-center rounded-xl"
                style={{ background: C.active }}
              >
                <Plus size={19} style={{ color: C.muted }} />
              </div>
              <p className="text-2xl font-semibold" style={{ color: C.muted }}>
                Add Custom Module
              </p>
              <p className="pt-2 text-sm font-medium opacity-60" style={{ color: C.muted }}>
                Define custom system prompts & API keys
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
