import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  Bot,
  User,
  Settings,
  CircleHelp,
  Search,
  Plus,
  BrainCircuit,
  Sparkles,
  MoreVertical,
  Paperclip,
  Mic,
  Send,
  ArrowLeft,
  Menu,
  Share2,
  Workflow,
} from "lucide-react";

/*
  ChatHubPage — a faithful, RESPONSIVE implementation of the
  "Desktop Chat Hub - Deep Dark" Figma design.

  Desktop (lg+): 3 panes -> SideNav (256px) | Conversation List (320px) | Active Chat (flex).
  Tablet  (md) : 2 panes -> Conversation List | Active Chat (side nav hidden, opens as a drawer).
  Mobile  (<md): 1 pane  -> toggles between the list and the active chat.

  Colors are pulled straight from the Figma file (WhatsApp-style deep-dark teal palette).
  Icons use lucide-react (already a project dependency) instead of the temporary Figma asset URLs.
*/

// ---- palette (from the Figma design) --------------------------------------
const C = {
  deep: "#0b141a", // app / chat background
  panel: "#111b21", // side nav + cards
  panelAlt: "#202c33", // search input + AI bubble
  active: "#2a3942", // active/selected conversation
  border: "#222d34",
  teal: "#00a884", // primary accent
  text: "#e9edef", // primary text
  muted: "#8696a0", // secondary text
  userBubble: "#005c4b", // outgoing message bubble
};

// ---- sample data (matches the design) -------------------------------------
const CONVERSATIONS = [
  {
    id: "claude",
    name: "@Claude",
    preview: "Sprint metrics are looking strong...",
    time: "Just now",
    type: "ai",
    online: true,
    accent: true,
  },
  {
    id: "alex",
    name: "Alexander Vance",
    preview: "The board approved the new roadmap.",
    time: "12m",
    type: "user",
    initials: "AV",
  },
  {
    id: "sarah",
    name: "Sarah Jenkins",
    preview: "Let's check the design sync core.",
    time: "2h",
    type: "user",
    initials: "SJ",
  },
  {
    id: "design-sync",
    name: "Design Sync Core",
    preview: "3 new files uploaded to prototype.",
    time: "5h",
    type: "group",
  },
];

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Chats", active: true },
  { icon: Users, label: "Contacts" },
  { icon: Bot, label: "Personas" },
  { icon: User, label: "Profile" },
];

// ---- small reusable bits --------------------------------------------------

// Teal-tinted circular avatar used for the AI / "@Claude".
function AiAvatar({ size = 40 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: "rgba(0,168,132,0.1)" }}
    >
      <Bot size={size * 0.5} style={{ color: C.teal }} />
    </div>
  );
}

// Initials avatar for human contacts (replaces the expiring Figma photos).
function InitialsAvatar({ initials, size = 48 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border font-semibold"
      style={{
        width: size,
        height: size,
        background: C.active,
        borderColor: C.border,
        color: C.text,
        fontSize: size * 0.32,
      }}
    >
      {initials}
    </div>
  );
}

function ConversationAvatar({ conv }) {
  if (conv.type === "ai") {
    return (
      <div className="relative shrink-0">
        <AiAvatar size={48} />
        {conv.online && (
          <span
            className="absolute bottom-0 right-0 size-3 rounded-full border-2"
            style={{ background: C.teal, borderColor: C.active }}
          />
        )}
      </div>
    );
  }
  if (conv.type === "group") {
    return (
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded border"
        style={{ background: C.active, borderColor: C.border }}
      >
        <Workflow size={22} style={{ color: C.muted }} />
      </div>
    );
  }
  return <InitialsAvatar initials={conv.initials} />;
}

// ---- side navigation ------------------------------------------------------
function SideNavContent({ onNavigate }) {
  return (
    <div className="flex h-full w-64 flex-col px-4 py-6" style={{ background: C.panel }}>
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 pb-10">
        <div
          className="flex size-8 items-center justify-center rounded"
          style={{ background: "rgba(0,168,132,0.15)" }}
        >
          <MessageSquare size={18} style={{ color: C.teal }} />
        </div>
        <div className="leading-tight">
          <p className="text-2xl font-bold" style={{ color: C.teal }}>
            ConvoApp
          </p>
          <p className="text-xs font-semibold tracking-wider" style={{ color: C.muted }}>
            AI Collaboration
          </p>
        </div>
      </div>

      {/* New chat */}
      <button
        className="mb-6 flex items-center justify-center gap-2 rounded py-2 text-base font-medium transition-opacity hover:opacity-90"
        style={{ background: C.teal, color: C.panel }}
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ icon, label, active }) => (
          <button
            key={label}
            onClick={onNavigate}
            className="flex items-center gap-4 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: active ? C.teal : C.muted,
              borderRight: active ? `2px solid ${C.teal}` : "2px solid transparent",
            }}
          >
            {React.createElement(icon, { size: 20 })}
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t pt-6" style={{ borderColor: C.border }}>
        <button className="flex items-center gap-4 px-4 py-2 text-sm font-medium" style={{ color: C.muted }}>
          <Settings size={20} />
          Settings
        </button>
        <button className="flex items-center gap-4 px-4 py-2 text-sm font-medium" style={{ color: C.muted }}>
          <CircleHelp size={20} />
          Help
        </button>
        <div className="flex items-center gap-2 px-4 pt-2">
          <InitialsAvatar initials="AR" size={32} />
          <div className="leading-tight">
            <p className="text-sm font-medium" style={{ color: C.text }}>
              Alex Rivera
            </p>
            <p className="text-xs font-semibold tracking-wider" style={{ color: C.muted }}>
              Premium Plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- conversation list (middle pane) --------------------------------------
function ConversationList({ activeId, onSelect, onOpenNav }) {
  return (
    <div
      className="flex h-full w-full flex-col border-r md:w-80"
      style={{ background: C.deep, borderColor: C.border }}
    >
      {/* search + mobile hamburger */}
      <div className="flex items-center gap-2 p-4">
        <button
          onClick={onOpenNav}
          className="rounded p-2 lg:hidden"
          style={{ color: C.muted, background: C.panelAlt }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div
          className="relative flex flex-1 items-center rounded border px-3 py-2.5"
          style={{ background: C.panelAlt, borderColor: C.border }}
        >
          <Search size={16} style={{ color: C.muted }} />
          <input
            placeholder="Search chats..."
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:opacity-100"
            style={{ color: C.text }}
          />
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <p className="px-1 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          Recent
        </p>
        <div className="flex flex-col gap-1">
          {CONVERSATIONS.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className="flex items-center gap-4 rounded border p-3 text-left transition-colors"
                style={{
                  background: isActive ? C.active : "transparent",
                  borderColor: isActive ? C.border : "transparent",
                }}
              >
                <ConversationAvatar conv={conv} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="truncate text-base"
                      style={{ color: conv.accent ? C.teal : C.text }}
                    >
                      {conv.name}
                    </span>
                    <span className="shrink-0 text-sm" style={{ color: C.muted }}>
                      {conv.time}
                    </span>
                  </div>
                  <p className="truncate text-base" style={{ color: C.muted }}>
                    {conv.preview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- sprint metric card (inside the AI message) ---------------------------
function SprintMetricCard() {
  return (
    <div className="rounded border" style={{ background: C.panel, borderColor: C.border }}>
      {/* header */}
      <div
        className="flex items-center justify-between border-b px-4 py-4"
        style={{ borderColor: C.border }}
      >
        <span className="text-base" style={{ color: C.text }}>
          Sprint S-44 Velocity
        </span>
        <span
          className="rounded-sm px-2 py-1 text-sm"
          style={{ background: "rgba(0,168,132,0.2)", color: C.teal }}
        >
          In Progress
        </span>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="rounded-sm border p-4" style={{ background: C.deep, borderColor: C.border }}>
          <p className="text-base" style={{ color: C.muted }}>
            Velocity
          </p>
          <p className="text-base" style={{ color: C.teal }}>
            64 pts
          </p>
        </div>
        <div className="rounded-sm border p-4" style={{ background: C.deep, borderColor: C.border }}>
          <p className="text-base" style={{ color: C.muted }}>
            Capacity
          </p>
          <p className="text-base" style={{ color: C.text }}>
            70 pts
          </p>
        </div>
      </div>

      {/* progress */}
      <div className="flex flex-col gap-1 px-4 pb-4">
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: C.deep }}>
          <div className="h-full" style={{ width: "91%", background: C.teal }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base" style={{ color: C.muted }}>
            91% Utilization
          </span>
          <span className="text-base" style={{ color: C.muted }}>
            Goal: 85%
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- active chat pane (right) ---------------------------------------------
function ChatPane({ onBack }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col" style={{ background: C.deep }}>
      {/* header */}
      <header
        className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6"
        style={{ borderColor: C.border }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded p-1 md:hidden" style={{ color: C.text }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <AiAvatar size={40} />
          <div className="leading-tight">
            <p className="text-base" style={{ color: C.text }}>
              @Claude
            </p>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: C.teal }} />
              <span className="text-sm" style={{ color: C.muted }}>
                Product Team AI Assistant
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="hidden items-center gap-2 rounded border px-4 py-2 text-base sm:flex"
            style={{ borderColor: C.border, color: C.text }}
          >
            <BrainCircuit size={18} />
            Memory
          </button>
          <button className="rounded-xl p-2" style={{ color: C.text }} aria-label="AI actions">
            <Sparkles size={18} />
          </button>
          <button className="rounded-xl p-2" style={{ color: C.text }} aria-label="More">
            <MoreVertical size={18} />
          </button>
          <button
            className="flex items-center gap-2 rounded px-4 py-2 text-base font-medium"
            style={{ background: C.teal, color: C.panel }}
          >
            <Share2 size={16} className="sm:hidden" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* message feed */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:gap-10 md:p-10">
        {/* date divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1" style={{ background: C.border }} />
          <span className="shrink-0 text-sm uppercase tracking-wide" style={{ color: C.muted }}>
            Today, Oct 24
          </span>
          <div className="h-px flex-1" style={{ background: C.border }} />
        </div>

        {/* outgoing user message */}
        <div className="flex justify-end">
          <div
            className="flex max-w-[85%] flex-col gap-2 rounded-bl-lg rounded-br-lg rounded-tl-lg p-4 md:max-w-[576px]"
            style={{ background: C.userBubble }}
          >
            <p className="text-base" style={{ color: C.text }}>
              Claude, can you pull up the latest sprint metrics? I need to know the velocity vs. capacity for the
              Core UI team.
            </p>
            <span className="self-end text-sm" style={{ color: C.muted }}>
              14:02
            </span>
          </div>
        </div>

        {/* AI response */}
        <div className="flex items-start gap-3 md:gap-4">
          <AiAvatar size={40} />
          <div
            className="flex max-w-[85%] flex-col gap-3 rounded-bl-lg rounded-br-lg rounded-tr-lg border p-4 md:max-w-[672px] md:p-6"
            style={{ background: C.panelAlt, borderColor: C.border }}
          >
            <p className="text-base" style={{ color: C.text }}>
              Fetching data from the current sprint (S-44)... Here is the summary for the Core UI team:
            </p>

            <SprintMetricCard />

            <p className="text-base" style={{ color: C.text }}>
              The team is currently operating at high efficiency. There are 3 tasks remaining in the "Review" stage
              that might risk the Friday cutoff if not addressed by tonight.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                className="rounded-sm border px-4 py-2 text-sm font-medium"
                style={{ background: C.panel, borderColor: C.border, color: C.text }}
              >
                Show blocking tasks
              </button>
              <button
                className="rounded-sm border px-4 py-2 text-sm font-medium"
                style={{ background: C.panel, borderColor: C.border, color: C.text }}
              >
                Generate report
              </button>
            </div>

            <span className="text-sm" style={{ color: C.muted }}>
              14:03
            </span>
          </div>
        </div>
      </div>

      {/* input area */}
      <footer
        className="flex shrink-0 flex-col gap-2 border-t px-4 pb-4 pt-5 md:px-6"
        style={{ borderColor: C.border }}
      >
        <div
          className="relative mx-auto flex w-full max-w-[896px] items-center rounded-lg border"
          style={{ background: C.panelAlt, borderColor: C.border }}
        >
          <input
            placeholder="Message @Claude..."
            className="w-full bg-transparent px-4 py-4 text-base outline-none"
            style={{ color: C.text }}
          />
          <div className="flex items-center gap-1 pr-2">
            <button className="p-2" style={{ color: C.muted }} aria-label="Attach">
              <Paperclip size={18} />
            </button>
            <button className="p-2" style={{ color: C.muted }} aria-label="Voice">
              <Mic size={18} />
            </button>
            <button className="rounded p-2" style={{ background: C.teal, color: C.panel }} aria-label="Send">
              <Send size={16} />
            </button>
          </div>
        </div>
        <p className="text-center text-sm" style={{ color: C.muted }}>
          Claude can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  );
}

// ---- page shell -----------------------------------------------------------
export default function ChatHubPage() {
  const [activeId, setActiveId] = useState("claude");
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'chat' (mobile only)
  const [navOpen, setNavOpen] = useState(false);

  const handleSelect = (id) => {
    setActiveId(id);
    setMobileView("chat");
  };

  return (
    <div
      className="mx-auto flex h-[92vh] w-full max-w-[1280px] overflow-hidden rounded-2xl border shadow-2xl"
      style={{ background: C.deep, borderColor: C.border }}
    >
      {/* Desktop side nav (always visible on lg+) */}
      <div className="hidden lg:flex">
        <SideNavContent onNavigate={() => {}} />
      </div>

      {/* Mobile / tablet side-nav drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="animate-in shadow-2xl">
            <SideNavContent onNavigate={() => setNavOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setNavOpen(false)} />
        </div>
      )}

      {/* Conversation list — visible on md+, or on mobile when in list view */}
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} w-full md:flex md:w-auto`}>
        <ConversationList activeId={activeId} onSelect={handleSelect} onOpenNav={() => setNavOpen(true)} />
      </div>

      {/* Active chat — visible on md+, or on mobile when in chat view */}
      <div className={`${mobileView === "list" ? "hidden" : "flex"} min-w-0 flex-1 md:flex`}>
        <ChatPane onBack={() => setMobileView("list")} />
      </div>
    </div>
  );
}
