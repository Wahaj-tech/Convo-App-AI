import mongoose from "mongoose";

// ============================================================
// CONVERSATION MEMORY MODEL (Phase 3)
// ============================================================
// WHAT IS THIS?
// A "brain" for each conversation. While the Message collection stores the raw
// chat line-by-line, this stores the *distilled understanding* of the chat:
//   - a rolling plain-English summary
//   - the key decisions the group made
//   - open action items (todos)
//   - the topics discussed
//
// WHY DO WE NEED IT?
// The AI can only "see" the last ~30 messages when it answers (otherwise we'd
// send thousands of messages to Gemini on every reply — slow and expensive).
// But people ask things like "what did we decide last week?". Those answers
// live far above the last 30 messages. So instead of re-reading the WHOLE chat
// every time, we keep ONE compact memory document that we update incrementally.
// When the AI answers, we hand it this small memory PLUS the recent messages.
//
// EFFICIENCY IDEA: we never re-summarize the whole conversation. We remember
// the last message we already summarized (lastSummarizedMessageId) and only feed
// the AI the NEW messages since then, merged into the existing memory.

// One decision the group reached, e.g. "Use Gemini instead of Claude".
// _id: false → these are tiny embedded notes, they don't need their own IDs.
const keyDecisionSchema = new mongoose.Schema(
  {
    decision: { type: String, required: true }, // the decision itself
    madeBy: { type: String, default: "Unknown" }, // sender's display name (a string, not an ID — simpler)
    context: { type: String, default: "" }, // one line of "why"
    // Who actually made the call: "human" = the team agreed to it; "ai" = an AI
    // persona only *suggested* it (so the UI can keep team decisions and AI
    // suggestions visually distinct, not lumped together).
    source: { type: String, enum: ["human", "ai"], default: "human" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// One todo/follow-up the group needs to act on.
// NOTE: this one KEEPS its _id — the frontend needs an ID to toggle a single
// action item's status (pending → in_progress → done) without touching the others.
const actionItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  assignedTo: { type: String, default: "Unassigned" }, // sender's display name
  status: {
    type: String,
    enum: ["pending", "in_progress", "done"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: { type: String, default: "" }, // short free-text deadline if one was mentioned (e.g. "Fri", "Oct 24")
  createdAt: { type: Date, default: Date.now },
});

const conversationMemorySchema = new mongoose.Schema(
  {
    // One memory document per conversation — enforced by `unique`.
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      unique: true,
      index: true,
    },
    summary: { type: String, default: "" },
    keyDecisions: [keyDecisionSchema],
    actionItems: [actionItemSchema],
    topics: [String],

    // --- The "bookmark" that makes summarization INCREMENTAL ---
    // lastSummarizedMessageId = the last message we already folded into memory.
    // Next time we only read messages with an _id GREATER than this one.
    lastSummarizedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastSummarizedAt: { type: Date, default: null },
    totalMessagesProcessed: { type: Number, default: 0 }, // running tally, for display/debugging
  },
  { timestamps: true }
);

const ConversationMemory = mongoose.model(
  "ConversationMemory",
  conversationMemorySchema
);
export default ConversationMemory;
