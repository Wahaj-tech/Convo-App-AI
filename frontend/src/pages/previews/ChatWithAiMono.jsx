import React from "react";
import { BrainCircuit, Bot, Plus, Send, MessageSquare, Users, Search, User } from "lucide-react";
import { MONO } from "./theme";

/*
  "Chat with AI - Monochrome" (Figma node 3:36) — mobile multi-persona panel.
  Each AI persona replies in its own accent color (Code Reviewer = cyan,
  Project Manager = amber). Inline code chips, composer, bottom tab bar.
*/

function Code({ children }) {
  return (
    <span
      className="rounded border px-1 font-mono text-[13px]"
      style={{ background: MONO.codeBg, borderColor: MONO.codeBorder, color: MONO.text }}
    >
      {children}
    </span>
  );
}

function UserBubble({ children, time }) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex max-w-[85%] flex-col items-end gap-1">
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ background: MONO.bubble, borderColor: MONO.bubbleBorder, color: MONO.text }}
        >
          {children}
        </div>
        <span className="px-1 text-xs font-medium tracking-wide" style={{ color: MONO.muted }}>
          {time}
        </span>
      </div>
    </div>
  );
}

function PersonaBubble({ persona, color, time, children }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex max-w-[85%] flex-col items-start gap-1">
        <div className="flex items-center gap-2 pb-1">
          <span className="size-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-bold tracking-wide" style={{ color }}>
            {persona}
          </span>
        </div>
        <div
          className="rounded-xl border border-l-2 px-4 py-3 text-sm"
          style={{ background: `${color}1a`, borderColor: color, color: MONO.text }}
        >
          {children}
        </div>
        <span className="px-1 text-xs font-medium tracking-wide" style={{ color: MONO.muted }}>
          {time}
        </span>
      </div>
    </div>
  );
}

const NAV = [
  { icon: MessageSquare, active: true },
  { icon: Users },
  { icon: Search },
  { icon: User },
];

export default function ChatWithAiMono() {
  return (
    <div className="relative flex min-h-full flex-col" style={{ background: MONO.bg, color: MONO.text }}>
      {/* header */}
      <header
        className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4"
        style={{ background: MONO.bg, borderColor: MONO.border }}
      >
        <div className="flex items-center gap-4">
          <BrainCircuit size={19} style={{ color: MONO.text }} />
          <h1 className="text-xl font-bold tracking-tight" style={{ color: MONO.text }}>
            Product Team
          </h1>
        </div>
        <button style={{ color: MONO.text }} aria-label="AI personas">
          <Bot size={22} />
        </button>
      </header>

      {/* chat feed */}
      <main className="flex flex-1 flex-col gap-4 px-4 py-6 pb-28">
        <UserBubble time="10:42 AM">
          Is <Code>isAdmin(u){"{return u.role='admin'}"}</Code> safe?
        </UserBubble>

        <PersonaBubble persona="Code Reviewer" color={MONO.cyan} time="10:42 AM">
          This is unsafe. You are using a single <Code>=</Code> which is an assignment, not a comparison. Use{" "}
          <Code>===</Code> to check for equality.
        </PersonaBubble>

        <UserBubble time="11:05 AM">Docs are 70% done, will finish tomorrow.</UserBubble>

        <PersonaBubble persona="Project Manager" color={MONO.amber} time="11:06 AM">
          Noted. I've updated the roadmap. We are currently on track for the Friday release.
        </PersonaBubble>
      </main>

      {/* composer (sits above the bottom nav) */}
      <div
        className="sticky bottom-[65px] z-10 p-4 backdrop-blur-sm"
        style={{ background: "rgba(14,20,28,0.8)" }}
      >
        <div
          className="flex items-end gap-2 rounded-xl border p-2"
          style={{ background: "#1a2028", borderColor: MONO.bubbleBorder }}
        >
          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{ color: MONO.muted }}
            aria-label="Add"
          >
            <Plus size={20} />
          </button>
          <input
            placeholder="Message Product Team..."
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            style={{ color: MONO.text }}
          />
          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: MONO.text, color: MONO.bg }}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* bottom tab bar */}
      <nav
        className="sticky bottom-0 z-10 flex h-16 items-stretch border-t"
        style={{ background: MONO.bg, borderColor: MONO.border }}
      >
        {NAV.map(({ icon, active }, i) => (
          <button
            key={i}
            className="flex flex-1 items-center justify-center"
            style={{
              color: active ? MONO.text : MONO.muted,
              borderTop: active ? `2px solid ${MONO.text}` : "2px solid transparent",
            }}
          >
            {React.createElement(icon, { size: 20 })}
          </button>
        ))}
      </nav>
    </div>
  );
}
