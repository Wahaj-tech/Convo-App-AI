import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Monitor, Smartphone } from "lucide-react";
import { PREVIEWS } from "./previews/registry";

/*
  Public index of all Figma design previews. Lists every implemented design as
  a card linking to /preview/:slug. Keeps the real (login-gated) app untouched.
*/
export default function PreviewIndexPage() {
  return (
    <div
      className="mx-auto flex h-[92vh] w-full max-w-[1280px] flex-col overflow-y-auto rounded-2xl border p-6 shadow-2xl md:p-10"
      style={{ background: "#0b141a", borderColor: "#222d34" }}
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#00a884" }}>
          ConvoApp — Design Previews
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8696a0" }}>
          Figma designs implemented in React + Tailwind. {PREVIEWS.length} of 9 ready.
          The real app (login required) is unchanged at <code>/</code>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PREVIEWS.map((p) => {
          const Icon = p.viewport === "desktop" ? Monitor : Smartphone;
          return (
            <Link
              key={p.slug}
              to={`/preview/${p.slug}`}
              className="group flex flex-col rounded-xl border p-5 transition-colors"
              style={{ background: "#111b21", borderColor: "#222d34" }}
            >
              <div className="mb-3 flex items-center gap-2" style={{ color: "#00a884" }}>
                <Icon size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8696a0" }}>
                  {p.group}
                </span>
              </div>
              <h2 className="text-lg font-medium" style={{ color: "#e9edef" }}>
                {p.title}
              </h2>
              <span
                className="mt-4 flex items-center gap-1 text-sm transition-transform group-hover:translate-x-1"
                style={{ color: "#00a884" }}
              >
                View design <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
