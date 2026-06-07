import React from "react";
import { Bot } from "lucide-react";
import { C } from "./theme";
import { colorFor, initialsOf } from "./avatarUtils";

/*
  Small shared building blocks for the design previews. Figma uses photo avatars
  via temporary asset URLs (they expire in 7 days), so we render deterministic
  initials avatars instead — no broken images later.
*/

export function InitialsAvatar({ name, size = 48, radius = 12, ring }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: colorFor(name),
        color: C.text,
        fontSize: size * 0.34,
        border: ring ? `2px solid ${ring}` : `1px solid ${C.border}`,
      }}
    >
      {initialsOf(name)}
    </div>
  );
}

// Teal-tinted circular avatar for the AI / personas.
export function AiAvatar({ size = 40, radius = 12, color = C.teal, bg = C.tealDim }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: radius, background: bg }}
    >
      <Bot size={size * 0.5} style={{ color }} />
    </div>
  );
}
