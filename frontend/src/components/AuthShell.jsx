import React from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

/*
  Editorial (Dayos-style) auth layout — FULL-SCREEN, full-bleed (no centered card).
  Left half: form on a light canvas, with a condensed display headline.
  Right half: the actual 3D block animation (the reference mp4), object-cover, full height.
  Frontend-only shell; pages plug in their own form.
*/

const CANVAS = "#f1f0ec"; // warm light gray, blends with the video background
const INK = "#0f0f0f";
const MUTED = "#6b6b6b";
const GREEN = "#ea580c"; // accent (orange) — name kept for brevity
const FIELD_BG = "#ffffff";
const FIELD_BORDER = "#e0ddd4";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISPLAY = "'Barlow Condensed', sans-serif";
const BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";

// The "block tower" — the Dayos concept rebuilt with OUR features (no 3rd-party
// logos). Chunky extruded blocks stacked into a column, gently floating; a couple
// of accent cubes "burst" out. Right-side hero of the auth pages.
const BLOCKS = [
  { label: "AI Personas", face: "#ea580c", side: "#b8470a", text: "#ffffff" },
  { label: "Real-time Chat", face: "#f4f2ed", side: "#d8d4ca", text: "#0f0f0f" },
  { label: "AI Roundtable", face: "#0f0f0f", side: "#000000", text: "#ffffff" },
  { label: "Conversation Memory", face: "#f4f2ed", side: "#d8d4ca", text: "#0f0f0f" },
  { label: "Inline @ai Replies", face: "#fff100", side: "#cabf00", text: "#0f0f0f" },
  { label: "Group Collaboration", face: "#f4f2ed", side: "#d8d4ca", text: "#0f0f0f" },
];
const STAGGER = [0, 26, -14, 18, -8, 22]; // horizontal offset per block for a hand-stacked look

function FeatureBlocks() {
  return (
    <div
      className="relative hidden w-1/2 items-center justify-center overflow-hidden md:flex"
      style={{ background: "linear-gradient(160deg, #f4f3ef 0%, #e9e7e0 100%)" }}
    >
      {/* kicker — links to the marketing page */}
      <Link
        to="/why"
        className="absolute left-12 top-10 z-10 transition-colors hover:opacity-70"
        style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "-0.02em", color: MUTED }}
      >
        [ WHY CONVOAPP ]
      </Link>

      {/* floating accent cubes */}
      <span className="animate-cube-spin absolute right-16 top-24 size-10 rounded-md" style={{ background: "#fff100", boxShadow: "5px 5px 0 #cabf00" }} />
      <span className="animate-cube-spin absolute bottom-28 left-20 size-8 rounded-md" style={{ background: "#ea580c", boxShadow: "4px 4px 0 #b8470a", animationDirection: "reverse" }} />
      <span className="animate-cube-spin absolute right-24 bottom-20 size-6 rounded-md" style={{ background: "#ff6b5e", boxShadow: "4px 4px 0 #d44a3e" }} />

      {/* the tower */}
      <div className="flex flex-col items-center gap-4" style={{ transform: "rotate(-2deg)" }}>
        {BLOCKS.map((b, i) => (
          <div
            key={b.label}
            className="animate-block-float flex items-center gap-3 rounded-xl px-6"
            style={{
              marginLeft: STAGGER[i],
              minWidth: 260,
              height: 66,
              background: b.face,
              color: b.text,
              boxShadow: `7px 7px 0 ${b.side}`,
              animationDelay: `${i * 0.35}s`,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 12, opacity: 0.55 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Light-theme labelled input with a leading icon.
export function AuthField({ label, icon, ...props }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "-0.02em", color: MUTED }}>
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border px-3" style={{ borderColor: FIELD_BORDER, background: FIELD_BG }}>
        {React.createElement(icon, { size: 18, style: { color: "#9b9b9b", flexShrink: 0 } })}
        <input
          {...props}
          className="w-full bg-transparent py-3 outline-none"
          style={{ fontFamily: BODY, fontSize: 16, color: INK }}
        />
      </div>
    </div>
  );
}

// Editorial filled-dark button (the conversion surface).
export function AuthButton({ children, loading, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="flex w-full items-center justify-center rounded-lg py-3.5 transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: INK, color: "#fff", fontFamily: BODY, fontWeight: 500, fontSize: 16 }}
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : children}
    </button>
  );
}

export default function AuthShell({ kicker, title, accent, children, footer }) {
  return (
    <div className="relative flex min-h-screen w-full" style={{ background: CANVAS, fontFamily: BODY }}>
      {/* brand — pinned top-left with padding */}
      <div className="absolute left-6 top-6 z-30 flex items-center gap-2.5 md:left-10 md:top-8">
        <img src="/logo.svg" alt="ConvoApp" className="size-9 rounded-[10px]" />
        <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", color: INK }}>
          ConvoApp
        </span>
      </div>

      {/* LEFT — form, full height, full-bleed (no card) */}
      <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-[440px]">

          {kicker && (
            <p className="mb-4" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "-0.02em", color: MUTED }}>
              {kicker}
            </p>
          )}

          <h1
            className="mb-10"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: "clamp(52px, 6vw, 84px)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: INK,
              textTransform: "uppercase",
            }}
          >
            {title} {accent && <span style={{ color: GREEN }}>{accent}</span>}
          </h1>

          {children}

          {footer && <div className="mt-6 text-sm" style={{ color: MUTED, fontFamily: BODY }}>{footer}</div>}
        </div>
      </div>

      {/* RIGHT — animated block tower of our features, full-bleed (desktop only) */}
      <FeatureBlocks />
    </div>
  );
}
