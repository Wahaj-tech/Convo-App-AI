import React, { useState } from "react";
import { Landmark, CircleCheckBig, TriangleAlert, ShieldQuestion, Sparkles, ListOrdered, ChevronDown, MessagesSquare } from "lucide-react";
import { C } from "../lib/theme";

/*
  AI Roundtable "Decision Card" — the moderator's synthesized verdict.
  meta = {
    finalRecommendation, recommendationConfidence, agreeCount, totalAdvisors,
    mainRisk, dissentingView, whyThisWon[], actionPlan[], influencedBy[],
    stances[{name,color,stance,confidence}], avgConfidence, panel[], question
  }
*/

function Meter({ label, value, sub }) {
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: C.teal }}>{sub}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: C.deep }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: C.teal }} />
      </div>
    </div>
  );
}

function Section({ icon, label, color, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: color || C.muted }}>
        {React.createElement(icon, { size: 13 })} {label}
      </div>
      {children}
    </div>
  );
}

export default function PanelVerdictCard({ meta }) {
  const [showDiscussion, setShowDiscussion] = useState(false);
  if (!meta) return null;
  const {
    finalRecommendation, recommendationConfidence, agreeCount, totalAdvisors,
    mainRisk, dissentingView, whyThisWon = [], actionPlan = [], influencedBy = [],
    stances = [], avgConfidence, panel = [], discussion = [],
  } = meta;

  const takes = discussion.filter((d) => d.round === 1);
  const crossTalk = discussion.filter((d) => d.round === 2);

  const confidence = recommendationConfidence ?? avgConfidence ?? 0;
  const consensusPct = totalAdvisors ? Math.round((agreeCount / totalAdvisors) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border"
        style={{ background: C.panel, borderColor: C.teal, boxShadow: `0 0 0 1px ${C.teal}33` }}
      >
        {/* header */}
        <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: C.border, background: C.tealDim }}>
          <Landmark size={18} style={{ color: C.teal }} />
          <span className="font-semibold" style={{ color: C.text }}>AI Panel Verdict</span>
          {panel.length > 0 && (
            <span className="ml-auto text-xs" style={{ color: C.muted }}>{panel.join(" · ")}</span>
          )}
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* final recommendation */}
          <div className="flex items-start gap-3">
            <CircleCheckBig size={22} style={{ color: C.teal }} className="mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Final Recommendation</div>
              <div className="text-lg font-semibold leading-snug" style={{ color: C.text }}>{finalRecommendation}</div>
            </div>
          </div>

          {/* meters */}
          <div className="flex gap-6">
            <Meter label="Confidence" value={confidence} sub={`${confidence}%`} />
            {totalAdvisors > 0 && (
              <Meter label="Consensus" value={consensusPct} sub={`${agreeCount}/${totalAdvisors} agree`} />
            )}
          </div>

          {/* stance chips (mini consensus visualization) */}
          {stances.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stances.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                  style={{ background: C.deep, borderColor: C.border, color: C.text }}
                >
                  <span className="size-2 rounded-full" style={{ background: s.color || C.teal }} />
                  <span className="font-medium">{s.name}:</span> {s.stance}
                  <span style={{ color: C.muted }}>· {s.confidence}%</span>
                </span>
              ))}
            </div>
          )}

          {/* main risk */}
          {mainRisk && (
            <Section icon={TriangleAlert} label="Main Risk" color="#e06c75">
              <p className="text-sm" style={{ color: C.text }}>{mainRisk}</p>
            </Section>
          )}

          {/* dissenting view */}
          {dissentingView && (
            <Section icon={ShieldQuestion} label="Dissenting View" color="#d9a406">
              <p className="text-sm" style={{ color: C.text }}>{dissentingView}</p>
            </Section>
          )}

          {/* why this won */}
          {whyThisWon.length > 0 && (
            <Section icon={Sparkles} label="Why This Decision Won" color={C.teal}>
              <ul className="flex flex-col gap-1 pl-1">
                {whyThisWon.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: C.text }}>
                    <span style={{ color: C.teal }}>•</span><span>{t}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* action plan */}
          {actionPlan.length > 0 && (
            <Section icon={ListOrdered} label="Immediate Action Plan" color={C.teal}>
              <ol className="flex flex-col gap-1 pl-1">
                {actionPlan.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: C.text }}>
                    <span className="font-semibold" style={{ color: C.teal }}>{i + 1}.</span><span>{t}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* influenced by */}
          {influencedBy.length > 0 && (
            <p className="text-xs" style={{ color: C.muted }}>
              Decision shaped most by <span style={{ color: C.text }}>{influencedBy.join(", ")}</span>.
            </p>
          )}

          {/* collapsible panel discussion (verdict-only by default) */}
          {discussion.length > 0 && (
            <div className="border-t pt-3" style={{ borderColor: C.border }}>
              <button
                onClick={() => setShowDiscussion((v) => !v)}
                className="flex w-full items-center gap-2 text-sm font-medium"
                style={{ color: C.teal }}
              >
                <MessagesSquare size={15} />
                {showDiscussion ? "Hide" : "View"} Panel Discussion ({discussion.length} messages)
                <ChevronDown
                  size={16}
                  className="ml-auto transition-transform duration-300"
                  style={{ transform: showDiscussion ? "rotate(180deg)" : "none" }}
                />
              </button>

              {/* grid-rows trick → smooth height animation */}
              <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: showDiscussion ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-4 pt-4">
                    {/* initial takes */}
                    {takes.map((d, i) => (
                      <div key={`t${i}`} className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="size-2 rounded-full" style={{ background: d.color || C.teal }} />
                          <span className="text-sm font-medium" style={{ color: d.color || C.text }}>{d.name}</span>
                          {d.stance && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: `${d.color || C.teal}1f`, color: d.color || C.teal }}
                            >
                              {d.stance} · {d.confidence}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: C.text }}>{d.text}</p>
                      </div>
                    ))}

                    {/* cross-talk */}
                    {crossTalk.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="h-px flex-1" style={{ background: C.border }} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Cross-talk</span>
                          <div className="h-px flex-1" style={{ background: C.border }} />
                        </div>
                        {crossTalk.map((d, i) => (
                          <p key={`c${i}`} className="text-sm leading-relaxed" style={{ color: C.text }}>
                            <span className="font-medium" style={{ color: d.color || C.text }}>{d.name}:</span>{" "}
                            <span style={{ color: C.muted }}>{d.text}</span>
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
