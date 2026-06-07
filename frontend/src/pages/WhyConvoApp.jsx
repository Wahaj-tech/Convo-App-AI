import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ChevronDown, Bot, MessagesSquare, Landmark, BrainCircuit, Users, Sparkles,
} from "lucide-react";
import ParticleField from "../components/ParticleField";

// Reveals its children (fade + rise) the first time they scroll into view.
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setShown(true); io.disconnect(); }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "in-view" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/*
  "Why ConvoApp" — an animated marketing/landing screen. Light cream canvas +
  orange accent (consistent with the auth pages), with a live particle
  constellation (ParticleField) as the hero visual, Dala-style.
*/
const CREAM = "#f1f0ec";
const INK = "#141414";
const MUTED = "#6b6b6b";
const ORANGE = "#ea580c";

const DISPLAY = "'Barlow Condensed', sans-serif";
const BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const FEATURES = [
  "AI Personas",
  "Real-time Chat",
  "AI Roundtable",
  "Conversation Memory",
  "Group Collaboration",
];

const HOW_IT_WORKS = [
  { n: "01", title: "Chat in real time", desc: "Start a direct or group conversation. Messages, images, and presence are instant over WebSockets." },
  { n: "02", title: "Bring in the AI", desc: "Mention @ai — or a specialist like @CodeReviewer — right inside the thread. It replies with the full context of the discussion." },
  { n: "03", title: "It remembers & decides", desc: "Memory tracks your decisions and action items, and the AI Roundtable convenes a panel that debates and returns a verdict." },
];

const CARDS = [
  { icon: Bot, title: "AI Personas", desc: "Summon expert AI roles — Code Reviewer, Project Manager, Devil's Advocate, Growth Advisor — with a single @mention, or build your own." },
  { icon: MessagesSquare, title: "Real-time Chat", desc: "Socket-powered messaging for one-on-one and group conversations, with live online status and typing indicators." },
  { icon: Landmark, title: "AI Roundtable", desc: "A panel of personas deliberates your question across rounds, then a moderator synthesizes a clear decision with risks and an action plan." },
  { icon: BrainCircuit, title: "Conversation Memory", desc: "Rolling summaries, key decisions, and action items — built automatically as you talk, so nothing important gets lost." },
  { icon: Users, title: "Group Collaboration", desc: "Bring your whole team and the AI into one shared space where everyone — human and AI — contributes." },
  { icon: Sparkles, title: "Smart Summaries", desc: "Catch up on a long thread in seconds, and ask the AI what was decided about anything, anytime." },
];

export default function WhyConvoApp() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: CREAM, fontFamily: BODY }}>
      {/* nav */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="ConvoApp" className="size-9 rounded-[10px]" />
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", color: INK }}>
            ConvoApp
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/login" className="text-sm font-medium" style={{ color: MUTED }}>
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full px-5 py-2 text-sm font-semibold"
            style={{ background: ORANGE, color: "#fff" }}
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* hero */}
      <main className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 pb-16 md:px-10 lg:flex-row lg:gap-4">
        {/* left: text */}
        <div className="relative z-10 w-full lg:w-1/2">
          <p className="mb-5" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: ORANGE }}>
            [ WHY CONVOAPP ]
          </p>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: "clamp(56px, 8vw, 104px)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: INK,
            }}
          >
            Where your team{" "}
            <span style={{ color: ORANGE }}>and AI think together.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed" style={{ color: MUTED }}>
            ConvoApp puts AI inside the conversation, not in a sidebar. It remembers your
            decisions, tracks action items, and convenes a panel of expert personas that
            debate a question and hand back a verdict — all over real-time chat.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: ORANGE, color: "#fff" }}
            >
              Get started <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="rounded-full border px-6 py-3 text-sm font-semibold"
              style={{ borderColor: "#d8d4ca", color: INK }}
            >
              Log in
            </Link>
          </div>

          {/* feature strip */}
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
            {FEATURES.map((f) => (
              <span key={f} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: MUTED }}>
                {f.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* right: live particle constellation */}
        <div className="relative h-[44vh] w-full lg:h-[78vh] lg:w-1/2">
          <ParticleField className="absolute inset-0" />
        </div>
      </main>

      {/* scroll hint */}
      <div className="relative z-10 flex justify-center pb-8" style={{ color: MUTED }}>
        <div className="flex flex-col items-center gap-1">
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }}>SCROLL</span>
          <ChevronDown size={18} className="animate-bounce" />
        </div>
      </div>

      {/* ── ORANGE SECTION: product story · how it works · features ── */}
      <section style={{ background: ORANGE, color: "#fff" }}>
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
          {/* about */}
          <Reveal>
            <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)" }}>
              [ ABOUT CONVOAPP ]
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2
              className="mt-4 max-w-3xl"
              style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(40px, 6vw, 76px)", lineHeight: 0.95, letterSpacing: "-0.02em", textTransform: "uppercase" }}
            >
              The AI is in the room, not in a sidebar.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
              Most apps make you copy-paste between your chat and a separate AI tool. ConvoApp removes that
              seam — the AI is a first-class participant that shares your context, remembers what the team
              decided, and can bring a whole panel of perspectives into a single decision.
            </p>
          </Reveal>

          {/* how it works */}
          <Reveal delay={80}>
            <h3 className="mt-20 mb-8" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)" }}>
              [ HOW IT WORKS ]
            </h3>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="h-full rounded-3xl border p-7" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, lineHeight: 1, color: "rgba(255,255,255,0.55)" }}>{s.n}</div>
                  <h4 className="mt-3 text-xl font-semibold" style={{ fontFamily: BODY }}>{s.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* feature cards */}
          <Reveal delay={80}>
            <h3 className="mb-8 mt-20" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)" }}>
              [ WHAT YOU GET ]
            </h3>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 100}>
                <div
                  className="group h-full rounded-3xl bg-white p-7 transition-transform duration-300 hover:-translate-y-1.5"
                  style={{ color: INK }}
                >
                  <div
                    className="mb-5 flex size-12 items-center justify-center rounded-2xl transition-colors"
                    style={{ background: "rgba(234,88,12,0.1)" }}
                  >
                    {React.createElement(c.icon, { size: 24, style: { color: ORANGE } })}
                  </div>
                  <h4 className="text-lg font-semibold" style={{ fontFamily: BODY }}>{c.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* closing CTA */}
          <Reveal delay={120}>
            <div className="mt-24 flex flex-col items-center text-center">
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                Ready to think together?
              </h2>
              <Link
                to="/signup"
                className="mt-8 flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ color: ORANGE }}
              >
                Get started free <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
