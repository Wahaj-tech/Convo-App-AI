import React, { useState } from "react";
import {
  Search,
  SquarePen,
  MessageSquare,
  Users,
  Bot,
  User,
  CheckCheck,
} from "lucide-react";
import { C } from "./theme";
import { InitialsAvatar } from "./ui";

/*
  "Conversations - Deep Dark" (Figma node 3:680) — mobile chat list.
  Top app bar · search · Direct/Groups segmented tabs · conversation list ·
  floating compose button · bottom tab bar.
*/

const CHATS = [
  {
    name: "Alexander Vance",
    time: "10:24 AM",
    preview: "The architectural review for the new kernel is complete. Let's discuss.",
    unread: 3,
    online: true,
    activeTime: true,
  },
  {
    name: "Sarah Jenkins",
    time: "Yesterday",
    preview: "Sent an attachment: quarterly_report.pdf",
  },
  {
    name: "Design Sync Core",
    time: "Oct 12",
    group: true,
    sender: "Marc:",
    preview: " Updated the Figma tokens for dark mode.",
  },
  {
    name: "David Chen",
    time: "Oct 10",
    preview: "The API migration is finally complete on prod.",
    read: true,
  },
  {
    name: "Elena Rodriguez",
    time: "Oct 09",
    preview: "Can you check the latest pull request when you have time?",
  },
];

const TABS = [
  { icon: MessageSquare, label: "Chats", active: true },
  { icon: Users, label: "Contacts" },
  { icon: Bot, label: "Personas" },
  { icon: User, label: "Profile" },
];

function ChatRow({ chat }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-lg p-4 text-left">
      <div className="relative shrink-0">
        {chat.group ? (
          <div
            className="flex size-14 items-center justify-center rounded-xl border"
            style={{ background: C.active, borderColor: C.border }}
          >
            <Users size={26} style={{ color: C.muted }} />
          </div>
        ) : (
          <InitialsAvatar name={chat.name} size={56} ring={chat.online ? C.teal : undefined} />
        )}
        {chat.online && (
          <span
            className="absolute bottom-0 right-0 size-4 rounded-full border-2"
            style={{ background: C.teal, borderColor: C.deep }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate text-sm"
            style={{ color: C.text, fontWeight: chat.unread ? 700 : 500 }}
          >
            {chat.name}
          </span>
          <span
            className="shrink-0 text-[10px]"
            style={{ color: chat.activeTime ? C.teal : C.muted, fontWeight: chat.activeTime ? 700 : 400 }}
          >
            {chat.time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-base" style={{ color: C.muted }}>
            {chat.sender && <span style={{ color: C.teal }}>{chat.sender}</span>}
            {chat.preview}
          </p>
          {chat.unread ? (
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
              style={{ background: C.teal, color: C.deep }}
            >
              {chat.unread}
            </span>
          ) : chat.read ? (
            <CheckCheck size={14} className="shrink-0" style={{ color: C.teal }} />
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function Conversations() {
  const [tab, setTab] = useState("Direct");

  return (
    <div className="relative flex min-h-full flex-col" style={{ background: C.deep, color: C.text }}>
      {/* top app bar */}
      <header
        className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4"
        style={{ background: C.deep, borderColor: C.border }}
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
      <main className="flex flex-1 flex-col gap-6 px-4 pb-28 pt-6">
        {/* search + tabs */}
        <div className="flex flex-col gap-4">
          <div
            className="relative flex items-center rounded-lg px-4 py-3.5"
            style={{ background: C.panelAlt }}
          >
            <Search size={18} style={{ color: C.muted }} />
            <input
              placeholder="Search conversations..."
              className="ml-3 w-full bg-transparent text-base outline-none"
              style={{ color: C.text }}
            />
          </div>

          <div
            className="flex gap-1 rounded-xl border p-1.5"
            style={{ background: C.panel, borderColor: C.border }}
          >
            {["Direct", "Groups"].map((t) => {
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 rounded-xl py-2 text-sm font-medium transition-colors"
                  style={{
                    background: active ? C.teal : "transparent",
                    color: active ? C.deep : C.muted,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* chat list */}
        <div className="flex flex-col gap-1">
          {CHATS.map((c) => (
            <ChatRow key={c.name} chat={c} />
          ))}
        </div>
      </main>

      {/* floating compose button */}
      <button
        className="fixed bottom-24 right-6 z-20 flex size-14 items-center justify-center rounded-xl shadow-lg sm:absolute"
        style={{ background: C.teal, color: C.deep }}
        aria-label="New conversation"
      >
        <SquarePen size={24} />
      </button>

      {/* bottom tab bar */}
      <nav
        className="sticky bottom-0 z-10 flex h-20 items-center justify-around border-t px-4"
        style={{ background: C.deep, borderColor: C.border }}
      >
        {TABS.map(({ icon, label, active }) => (
          <button
            key={label}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1"
            style={{
              color: active ? C.teal : C.muted,
              background: active ? C.panelAlt : "transparent",
            }}
          >
            {React.createElement(icon, { size: 20 })}
            <span className="text-xs font-semibold tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
