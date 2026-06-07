import React, { useState } from "react";
import {
  Sparkles,
  Code,
  ListChecks,
  Scale,
  MessageSquare,
  Users,
  Bot,
  User,
  SquarePen,
} from "lucide-react";
import { C } from "./theme";
import { InitialsAvatar } from "./ui";

/*
  "AI Personas - Deep Dark" (Figma node 3:795) — mobile persona picker.
  Header · title + blurb · 4 persona cards (icon, role, toggle, description,
  trait chips; the enabled card gets a teal glow) · bottom tab bar.
*/

const PERSONAS = [
  {
    id: "claude",
    name: "Claude",
    role: "General Assistant",
    icon: Sparkles,
    desc: "Claude excels at creative synthesis, nuance, and helpful dialogue. Perfect for brainstorming and everyday tasks.",
    tags: ["Creative", "Versatile"],
    enabled: true,
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    role: "Technical Expert",
    icon: Code,
    desc: "Specialized in architectural integrity, security patterns, and clean code optimization across multiple stacks.",
    tags: ["Algorithmic", "Logical"],
  },
  {
    id: "project-manager",
    name: "Project Manager",
    role: "Organization",
    icon: ListChecks,
    desc: "Streamlines workflows, manages dependencies, and tracks velocity. Built for high-stakes professional delivery.",
    tags: ["Strategic", "Efficient"],
  },
  {
    id: "devils-advocate",
    name: "Devil's Advocate",
    role: "Critical Thinker",
    icon: Scale,
    desc: "Designed to challenge assumptions, identify blind spots, and rigorously test strategies before execution.",
    tags: ["Critical", "Analytical"],
  },
];

const TABS = [
  { icon: MessageSquare, label: "Chats" },
  { icon: Users, label: "Contacts" },
  { icon: Bot, label: "Personas", active: true },
  { icon: User, label: "Profile" },
];

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative h-6 w-12 shrink-0 rounded-full transition-colors"
      style={{ background: on ? C.teal : C.active, boxShadow: `0 0 0 1px ${C.active}` }}
      aria-pressed={on}
    >
      <span
        className="absolute top-1 size-4 rounded-full transition-all"
        style={{ left: on ? 28 : 4, background: on ? C.panel : C.muted }}
      />
    </button>
  );
}

function PersonaCard({ persona, on, onToggle }) {
  const Icon = persona.icon;
  return (
    <div
      className="relative flex flex-col gap-4 overflow-hidden rounded-lg border p-6"
      style={{
        background: C.panel,
        borderColor: on ? C.teal : C.active,
        boxShadow: on ? `0 0 0 2px ${C.teal}` : "none",
      }}
    >
      {/* corner glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-32 rounded-full blur-3xl"
        style={{ background: "rgba(0,168,132,0.06)" }}
      />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex size-14 items-center justify-center rounded-xl border"
            style={{ background: C.tealDim, borderColor: "rgba(0,168,132,0.2)" }}
          >
            <Icon size={22} style={{ color: C.teal }} />
          </div>
          <div>
            <p className="text-base" style={{ color: C.text }}>
              {persona.name}
            </p>
            <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(0,168,132,0.8)" }}>
              {persona.role}
            </p>
          </div>
        </div>
        <Toggle on={on} onClick={onToggle} />
      </div>

      <p className="text-base" style={{ color: C.muted }}>
        {persona.desc}
      </p>

      <div className="flex flex-wrap gap-2">
        {persona.tags.map((t) => (
          <span
            key={t}
            className="rounded-sm border px-2 py-1 text-[10px] uppercase"
            style={{ background: C.panel, borderColor: C.active, color: C.muted }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AiPersonas() {
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(PERSONAS.map((p) => [p.id, !!p.enabled])),
  );
  const toggle = (id) => setEnabled((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="relative flex min-h-full flex-col" style={{ background: C.deep, color: C.text }}>
      {/* header */}
      <header
        className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4"
        style={{ background: C.deep, borderColor: C.active }}
      >
        <div className="flex items-center gap-4">
          <InitialsAvatar name="Alex Rivera" size={40} />
          <span className="text-2xl font-bold" style={{ color: C.teal }}>
            ConvoApp
          </span>
        </div>
        <button style={{ color: C.teal }} aria-label="Compose">
          <SquarePen size={22} />
        </button>
      </header>

      {/* main */}
      <main className="flex flex-1 flex-col gap-10 px-4 pb-28 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold" style={{ color: C.text }}>
            Choose AI Persona
          </h1>
          <p className="text-base" style={{ color: C.muted }}>
            Select your primary intelligence partner. Each persona is engineered with specialized cognitive
            frameworks to assist your workflow.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {PERSONAS.map((p) => (
            <PersonaCard key={p.id} persona={p} on={enabled[p.id]} onToggle={() => toggle(p.id)} />
          ))}
        </div>
      </main>

      {/* bottom tab bar */}
      <nav
        className="sticky bottom-0 z-10 flex h-20 items-center justify-around border-t px-4"
        style={{ background: C.deep, borderColor: C.active }}
      >
        {TABS.map(({ icon, label, active }) => (
          <button
            key={label}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1"
            style={{ color: active ? C.deep : C.muted, background: active ? C.teal : "transparent" }}
          >
            {React.createElement(icon, { size: 20 })}
            <span className="text-xs font-semibold tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
