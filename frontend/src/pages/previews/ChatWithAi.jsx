import React from "react";
import { BrainCircuit, Paperclip, AtSign, Send } from "lucide-react";
import { C } from "./theme";
import { AiAvatar } from "./ui";

/*
  "Chat with AI - Deep Dark" (Figma node 3:598) — mobile @AI conversation.
  Header (group + online + Memory) · date separator · AI/user bubbles with
  inline code chips · animated typing indicator · input footer.
*/

function Code({ children }) {
  return (
    <span
      className="rounded-sm px-1 font-mono text-[15px]"
      style={{ background: "#3b4a54", color: C.teal }}
    >
      {children}
    </span>
  );
}

function MessageMeta({ who, time, mine }) {
  return (
    <div className={`flex items-center gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <span className="text-base uppercase" style={{ color: mine ? C.muted : C.teal }}>
        {who}
      </span>
      <span className="text-base" style={{ color: "rgba(134,150,160,0.5)" }}>
        {time}
      </span>
    </div>
  );
}

export default function ChatWithAi() {
  return (
    <div className="relative flex min-h-full flex-col" style={{ background: C.deep, color: C.text }}>
      {/* header */}
      <header
        className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4"
        style={{ background: C.panel, borderColor: C.border }}
      >
        <div className="flex items-center gap-2">
          <AiAvatar size={40} bg="#3b4a54" color={C.text} />
          <div className="leading-tight">
            <p className="text-lg" style={{ color: C.text }}>
              Product Team
            </p>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: C.teal }} />
              <span className="text-sm uppercase tracking-wider" style={{ color: C.muted }}>
                Online
              </span>
            </div>
          </div>
        </div>
        <button
          className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-base"
          style={{ background: C.border, borderColor: C.border, color: C.text }}
        >
          <BrainCircuit size={16} />
          Memory
        </button>
      </header>

      {/* messages */}
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        {/* date separator */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: C.border }} />
          <span className="text-base" style={{ color: C.muted }}>
            TODAY
          </span>
          <div className="h-px flex-1" style={{ background: C.border }} />
        </div>

        {/* AI message */}
        <div className="flex max-w-[85%] flex-col gap-2">
          <MessageMeta who="@Claude" time="10:24 AM" />
          <div
            className="rounded border p-4 text-base"
            style={{ background: C.panelAlt, borderColor: C.border, color: C.text }}
          >
            I've analyzed the latest sprint metrics. The development velocity has increased by 14% compared to
            last week. Would you like me to generate a summary for the stakeholders or focus on the current
            bottlenecks?
          </div>
        </div>

        {/* user message */}
        <div className="flex max-w-[85%] flex-col gap-2 self-end">
          <MessageMeta who="You" time="10:26 AM" mine />
          <div
            className="rounded border p-4 text-base"
            style={{ background: C.userBubble, borderColor: C.border, color: C.text }}
          >
            That's great news. Let's focus on the bottlenecks first. Can you identify which modules are causing
            the most significant delays in the review process?
          </div>
        </div>

        {/* AI message with inline code */}
        <div className="flex max-w-[85%] flex-col gap-2">
          <MessageMeta who="@Claude" time="10:27 AM" />
          <div
            className="rounded border p-4 text-base leading-7"
            style={{ background: C.panelAlt, borderColor: C.border, color: C.text }}
          >
            Scanning the repository and pull request logs now. I'm seeing a pattern in the <Code>auth-service</Code>{" "}
            and the <Code>billing-connector</Code>. Specifically, recursive dependencies are extending testing
            cycles by an average of 42 minutes per commit.
          </div>
        </div>

        {/* typing indicator */}
        <div className="flex flex-col gap-2">
          <span className="text-base uppercase" style={{ color: C.teal }}>
            @AI
          </span>
          <div
            className="flex w-fit items-center gap-1.5 rounded border px-4 py-2.5"
            style={{ background: C.panelAlt, borderColor: C.border }}
          >
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="size-1.5 animate-bounce rounded-full"
                style={{ background: C.teal, animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* input footer */}
      <footer
        className="sticky bottom-0 z-10 flex h-20 items-center gap-4 border-t px-4"
        style={{ background: C.panel, borderColor: C.border }}
      >
        <div className="flex items-center gap-1">
          <button className="flex size-10 items-center justify-center" style={{ color: C.muted }} aria-label="Attach">
            <Paperclip size={20} />
          </button>
          <button className="flex size-10 items-center justify-center" style={{ color: C.muted }} aria-label="Mention">
            <AtSign size={20} />
          </button>
        </div>
        <input
          placeholder="Type a message..."
          className="h-11 flex-1 rounded border px-4 text-base outline-none"
          style={{ background: C.panelAlt, borderColor: C.border, color: C.text }}
        />
        <button
          className="flex size-12 shrink-0 items-center justify-center rounded"
          style={{ background: C.teal, color: C.deep }}
          aria-label="Send"
        >
          <Send size={19} />
        </button>
      </footer>
    </div>
  );
}
