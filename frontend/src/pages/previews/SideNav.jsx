import React from "react";
import {
  MessageSquare,
  Users,
  Bot,
  User,
  Settings,
  CircleHelp,
  Plus,
} from "lucide-react";
import { C } from "./theme";
import { InitialsAvatar } from "./ui";

/*
  Shared desktop left side-navigation (Figma "Aside - SideNavBar"), reused by the
  Desktop Chat Hub, Persona Management, and Memory Center screens. `active` picks
  the highlighted nav item.
*/

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Chats" },
  { icon: Users, label: "Contacts" },
  { icon: Bot, label: "Personas" },
  { icon: User, label: "Profile" },
];

export default function SideNav({ active = "Chats" }) {
  return (
    <aside
      className="hidden h-full w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex"
      style={{ background: C.panel, borderColor: C.border }}
    >
      {/* brand */}
      <div className="px-2 pb-10">
        <p className="text-2xl font-bold" style={{ color: C.teal }}>
          ConvoApp
        </p>
        <p className="text-sm font-medium opacity-70" style={{ color: C.muted }}>
          AI Collaboration
        </p>
      </div>

      {/* new chat */}
      <button
        className="mb-10 flex items-center justify-center gap-2 rounded py-2 text-sm font-medium"
        style={{ background: C.teal, color: C.deep }}
      >
        <Plus size={14} />
        New Chat
      </button>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map(({ icon, label }) => {
          const on = label === active;
          return (
            <button
              key={label}
              className="flex items-center gap-4 rounded px-4 py-2 text-sm font-medium"
              style={{
                color: on ? C.teal : C.muted,
                background: on ? C.active : "transparent",
                borderRight: on ? `2px solid ${C.teal}` : "2px solid transparent",
              }}
            >
              {React.createElement(icon, { size: 20 })}
              {label}
            </button>
          );
        })}
      </nav>

      {/* footer */}
      <div className="flex flex-col gap-2 border-t pt-6" style={{ borderColor: C.border }}>
        <button className="flex items-center gap-4 px-4 py-2 text-sm font-medium" style={{ color: C.muted }}>
          <Settings size={20} />
          Settings
        </button>
        <button className="flex items-center gap-4 px-4 py-2 text-sm font-medium" style={{ color: C.muted }}>
          <CircleHelp size={20} />
          Help
        </button>
        <div className="flex items-center gap-4 px-4 pt-1">
          <InitialsAvatar name="Alex Rivera" size={40} />
          <div className="leading-tight">
            <p className="text-sm font-medium" style={{ color: C.text }}>
              Alex Rivera
            </p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
              Pro Tier
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
