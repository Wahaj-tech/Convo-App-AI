import { Bot } from "lucide-react";
import { C } from "../lib/theme";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full" style={{ background: C.tealDim }}>
        <Bot className="size-8" style={{ color: C.teal }} />
      </div>
      <h3 className="mb-3 text-lg font-medium" style={{ color: C.text }}>
        Start your conversation with {name}
      </h3>
      <p className="mb-5 max-w-md text-sm" style={{ color: C.muted }}>
        This is the beginning of your conversation. Send a message — or mention <span style={{ color: C.teal }}>@ai</span> to bring in Convo AI.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {["👋 Say Hello", "🤝 How are you?", "📅 Meet up soon?"].map((t) => (
          <span
            key={t}
            className="rounded-full px-4 py-2 text-xs font-medium"
            style={{ background: C.tealDim, color: C.teal }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
