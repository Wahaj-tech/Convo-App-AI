import { MessageSquare } from "lucide-react";
import { C } from "../lib/theme";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center" style={{ background: C.deep }}>
      <div className="mb-6 flex size-20 items-center justify-center rounded-full" style={{ background: C.tealDim }}>
        <MessageSquare className="size-10" style={{ color: C.teal }} />
      </div>
      <h3 className="mb-2 text-xl font-semibold" style={{ color: C.text }}>
        Select a conversation
      </h3>
      <p className="max-w-md" style={{ color: C.muted }}>
        Choose a chat or contact from the sidebar to start chatting, or continue a previous conversation.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;
