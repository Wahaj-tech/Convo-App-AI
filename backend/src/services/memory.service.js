import Message from "../models/Message.js";
import ConversationMemory from "../models/ConversationMemory.js";
import {
  generateJson,
  BASE_SYSTEM_PROMPT,
  handleAiError,
} from "../lib/groq.js";
import { emitToConversation } from "../lib/socket.js";

// ============================================================
// MEMORY SERVICE (Phase 3) — all the brains live here, server-side
// ============================================================
//
// Three public jobs:
//   1. buildAiContext()         → assemble what the AI "knows" before it answers
//   2. maybeSummarize()         → top up the memory if the chat moved on a lot
//   3. setActionItemStatus()    → let a human tick a todo as done
//
// Everything is incremental and bounded so it stays cheap no matter how long
// the conversation gets.

// How many recent raw messages we always show the AI (short-term memory).
const RECENT_CONTEXT_LIMIT = 30;
// How many NEW messages must pile up before we bother calling the LLM to
// re-summarize (long-term memory). Keeps API calls infrequent.
const SUMMARY_TRIGGER_THRESHOLD = 10;
// Safety cap: never feed the summarizer more than this many messages at once.
const MAX_MESSAGES_PER_SUMMARY = 100;

// In-memory lock: the set of conversation IDs currently being summarized.
// Prevents the inline trigger and the 30-min background job from summarizing
// the same conversation at the same time (which would waste tokens and could
// race on the saved document).
const summarizing = new Set();

// ------------------------------------------------------------
// get-or-create the single memory doc for a conversation.
// Uses an upsert so two simultaneous callers can't create duplicates
// (the unique index on conversationId would reject the second one anyway).
// ------------------------------------------------------------
export const getConversationMemory = async (conversationId) => {
  return ConversationMemory.findOneAndUpdate(
    { conversationId },
    { $setOnInsert: { conversationId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Count how many messages exist that we have NOT yet folded into memory.
// `_id: { $gt: lastId }` works as "newer than" because MongoDB ObjectIds embed
// a creation timestamp — a cheap, index-backed way to find "everything after X".
const countNewMessages = async (conversationId, lastId) => {
  const query = { conversationId };
  if (lastId) query._id = { $gt: lastId };
  return Message.countDocuments(query);
};

// Turn a list of message docs into a plain "[Name]: text" transcript for the LLM.
// AI turns are prefixed "AI·" so the summarizer can tell humans from AI personas
// (only humans make "decisions"; AI personas merely "suggest").
const toTranscript = (messages) =>
  messages
    .map((m) => {
      const name =
        m.senderType === "ai"
          ? `AI·${m.personaId?.name || "Convo AI"}`
          : m.senderId?.fullName || "User";
      const body = m.text || (m.image ? "(sent an image)" : "");
      return `[${name}]: ${body}`;
    })
    .join("\n");

// ============================================================
// 1. updateConversationSummary — the heavy lifter
// ============================================================
// Reads ONLY the messages added since the last summary, asks Gemini to merge
// them into the existing memory, and saves the result. This is what makes
// memory "incremental": we never reprocess the whole history.
export const updateConversationSummary = async (conversationId) => {
  const key = conversationId.toString();
  if (summarizing.has(key)) return null; // already in progress — skip
  summarizing.add(key);

  try {
    const memory = await getConversationMemory(conversationId);

    // Fetch only the NEW messages (oldest-first), capped for safety.
    const query = { conversationId };
    if (memory.lastSummarizedMessageId) {
      query._id = { $gt: memory.lastSummarizedMessageId };
    }
    const newMessages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(MAX_MESSAGES_PER_SUMMARY)
      .populate("senderId", "fullName")
      .populate("personaId", "name");

    if (newMessages.length === 0) return memory; // nothing to do

    // Build the prompt: existing memory + the new transcript.
    const existing = {
      summary: memory.summary || "(none yet)",
      keyDecisions: memory.keyDecisions.map((d) => ({
        decision: d.decision,
        madeBy: d.madeBy,
        context: d.context,
        source: d.source,
      })),
      actionItems: memory.actionItems.map((a) => ({
        task: a.task,
        assignedTo: a.assignedTo,
        status: a.status,
        priority: a.priority,
        dueDate: a.dueDate,
      })),
      topics: memory.topics,
    };

    const prompt = `EXISTING MEMORY (JSON):
${JSON.stringify(existing, null, 2)}

NEW MESSAGES (chronological, "[Sender]: text"; speakers prefixed "AI·" are AI personas, not humans):
${toTranscript(newMessages)}

Produce the UPDATED memory by merging the new messages into the existing memory:
- summary: a concise rolling paragraph of what this conversation is about and where it stands.
- topics: short keyword list of subjects discussed (max ~12).
- keyDecisions: only decisions the HUMAN participants explicitly agreed to (source "human", madeBy = the human's name). An AI persona's recommendation that humans did NOT accept must either be omitted or marked source "ai" — never credited to a human. Keep prior decisions unless clearly reversed.
- actionItems: concrete todos with a real owner. Add priority (low/medium/high; infer from urgency, default medium) and dueDate (short text like "Fri"/"Oct 24" if stated, else ""). Keep prior items; preserve their status unless the messages clearly show progress/completion.
Ignore greetings, jokes, and off-topic chatter — never fabricate decisions or tasks from casual messages.`;

    // JSON-mode call to Groq — returns a parsed object matching the keys below.
    const parsed = await generateJson([
      {
        role: "system",
        content: `You maintain a structured, rolling memory of a team conversation. Merge faithfully — never invent decisions or tasks, and ignore casual/noise messages. Only HUMANS make "decisions"; AI personas (speakers prefixed "AI·") only suggest — mark those source "ai" and never attribute them to a human. Respond with ONLY a JSON object with exactly these keys:
{ "summary": string, "topics": string[], "keyDecisions": [{ "decision": string, "madeBy": string, "context": string, "source": "human"|"ai" }], "actionItems": [{ "task": string, "assignedTo": string, "status": "pending"|"in_progress"|"done", "priority": "low"|"medium"|"high", "dueDate": string }] }`,
      },
      { role: "user", content: prompt },
    ]);

    // --- Merge the AI output back into the document ---
    memory.summary = parsed.summary || memory.summary;
    memory.topics = Array.isArray(parsed.topics)
      ? parsed.topics.slice(0, 20)
      : memory.topics;

    // Preserve the ORIGINAL timestamp of a decision we already had (match by text),
    // so re-summarizing doesn't keep resetting "when" it was made. Cap to 25.
    const prevDecision = new Map(
      memory.keyDecisions.map((d) => [d.decision.trim().toLowerCase(), d])
    );
    memory.keyDecisions = (parsed.keyDecisions || []).slice(-25).map((d) => {
      const prev = prevDecision.get((d.decision || "").trim().toLowerCase());
      return {
        decision: d.decision,
        madeBy: d.madeBy || "Unknown",
        context: d.context || "",
        source: d.source === "ai" ? "ai" : "human",
        timestamp: prev?.timestamp || new Date(),
      };
    });

    // Action items: a human may have manually ticked one "done" via the panel.
    // We honor that — if it was done before, it STAYS done regardless of the LLM.
    // Otherwise we take the LLM's status. Original createdAt and any human priority
    // are preserved; new priority/dueDate are carried through. Cap to 30.
    const oldItems = memory.actionItems;
    const prevItem = new Map(
      oldItems.map((a) => [a.task.trim().toLowerCase(), a])
    );
    const merged = (parsed.actionItems || []).slice(-30).map((a) => {
      const prev = prevItem.get((a.task || "").trim().toLowerCase());
      const status = prev?.status === "done" ? "done" : a.status || prev?.status || "pending";
      const priority = ["low", "medium", "high"].includes(a.priority)
        ? a.priority
        : prev?.priority || "medium";
      return {
        task: a.task,
        assignedTo: a.assignedTo || "Unassigned",
        status,
        priority,
        dueDate: a.dueDate || prev?.dueDate || "",
        manual: prev?.manual || false,
        createdAt: prev?.createdAt || new Date(),
      };
    });
    // Never let the summarizer drop a user-added (manual) item.
    const mergedTasks = new Set(merged.map((m) => m.task.trim().toLowerCase()));
    for (const old of oldItems) {
      if (old.manual && !mergedTasks.has(old.task.trim().toLowerCase())) {
        merged.push(old.toObject ? old.toObject() : old);
      }
    }
    memory.actionItems = merged;

    // Move the bookmark forward and record bookkeeping.
    memory.lastSummarizedMessageId = newMessages[newMessages.length - 1]._id;
    memory.lastSummarizedAt = new Date();
    memory.totalMessagesProcessed += newMessages.length;

    await memory.save();

    // Push the fresh memory to anyone with the panel open (live update).
    emitToConversation(conversationId, "memoryUpdated", memory);

    console.log(
      `[Memory] Summarized conv ${conversationId} (+${newMessages.length} msgs)`
    );
    return memory;
  } catch (err) {
    console.error("[Memory] updateConversationSummary failed:", err.message);
    handleAiError(err);
    return null;
  } finally {
    summarizing.delete(key);
  }
};

// ============================================================
// 2. maybeSummarize — the cheap gatekeeper
// ============================================================
// Only spends an LLM call if the conversation has drifted far enough from the
// last summary. Called fire-and-forget after each AI reply, and by the job.
export const maybeSummarize = async (
  conversationId,
  threshold = SUMMARY_TRIGGER_THRESHOLD
) => {
  const memory = await getConversationMemory(conversationId);
  const behind = await countNewMessages(
    conversationId,
    memory.lastSummarizedMessageId
  );
  if (behind >= threshold) {
    return updateConversationSummary(conversationId);
  }
  return memory;
};

// ============================================================
// 3. buildAiContext — what the AI sees before answering
// ============================================================
// Combines LONG-term memory (the summary block) with SHORT-term memory (the
// last 30 raw messages). Returns a ready-to-use system prompt + chat history.
// `excludeMessageId` drops the just-sent triggering message from history so it
// isn't duplicated (the user's actual question is passed separately as the prompt).
export const buildAiContext = async (
  conversationId,
  excludeMessageId,
  personaSystemPrompt, // Phase 4: if given, this persona's instructions replace the base persona
  recentLimit = RECENT_CONTEXT_LIMIT // Roundtable passes a smaller value to keep token usage low
) => {
  const memory = await getConversationMemory(conversationId);

  const recent = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(recentLimit)
    .populate("senderId", "fullName")
    .populate("personaId", "name"); // so AI turns are labeled with which persona spoke

  // Oldest-first, drop the triggering message, drop empties, format as OpenAI
  // chat messages (Groq is OpenAI-compatible). AI turns → "assistant", humans →
  // "user". We prefix each with the speaker name so the model knows who said what
  // in a group chat. OpenAI-style APIs don't require strict user/model alternation.
  const history = recent
    .reverse()
    .filter((m) => !excludeMessageId || m._id.toString() !== excludeMessageId.toString())
    .filter((m) => m.text)
    .map((m) => {
      const name =
        m.senderType === "ai"
          ? m.personaId?.name || "Convo AI"
          : m.senderId?.fullName || "User";
      return {
        role: m.senderType === "ai" ? "assistant" : "user",
        content: `[${name}]: ${m.text}`,
      };
    });

  // Phase 4: the persona's own instructions become the base (falling back to the
  // generic persona), then we glue the conversation memory onto the end.
  const base = personaSystemPrompt || BASE_SYSTEM_PROMPT;
  const systemPrompt = `${base}\n\n${renderMemoryBlock(memory)}`;
  return { systemPrompt, history, memory };
};

// Render the memory document as a readable block for the system prompt.
const renderMemoryBlock = (memory) => {
  const hasMemory =
    memory &&
    (memory.summary ||
      memory.keyDecisions.length ||
      memory.actionItems.length);

  if (!hasMemory) {
    return "CONVERSATION MEMORY: (none yet — this is early in the conversation, rely on the recent messages).";
  }

  const decisions =
    memory.keyDecisions
      .map((d) => `- ${d.decision}${d.madeBy ? ` (by ${d.madeBy})` : ""}`)
      .join("\n") || "- none";

  const openItems =
    memory.actionItems
      .filter((a) => a.status !== "done")
      .map(
        (a) =>
          `- [${a.status}] ${a.task}${
            a.assignedTo && a.assignedTo !== "Unassigned"
              ? ` → ${a.assignedTo}`
              : ""
          }`
      )
      .join("\n") || "- none";

  const topics = memory.topics.length ? memory.topics.join(", ") : "none";

  return `CONVERSATION MEMORY (long-term context distilled from earlier in this conversation):
SUMMARY: ${memory.summary || "(none)"}
KEY DECISIONS:
${decisions}
OPEN ACTION ITEMS:
${openItems}
TOPICS: ${topics}

Use this memory to answer questions about the past accurately (e.g. "what did we decide about X?").`;
};

// ============================================================
// 6. regenerateMemory — rebuild the distilled memory from scratch
// ============================================================
// Clears the AI-derived content (summary, topics, decisions, AI action items)
// and the bookmark, then re-summarizes the conversation from the start (bounded
// to the last MAX_MESSAGES_PER_SUMMARY messages). User-added (manual) action
// items are preserved. Useful when older memory was captured under outdated logic.
export const regenerateMemory = async (conversationId) => {
  const memory = await getConversationMemory(conversationId);
  memory.summary = "";
  memory.topics = [];
  memory.keyDecisions = [];
  memory.actionItems = memory.actionItems.filter((a) => a.manual); // keep hand-added todos
  memory.lastSummarizedMessageId = null;
  memory.lastSummarizedAt = null;
  memory.totalMessagesProcessed = 0;
  await memory.save();

  const rebuilt = await updateConversationSummary(conversationId);
  return rebuilt || (await getConversationMemory(conversationId));
};

// ============================================================
// 4. setActionItemStatus — human override for a single todo
// ============================================================
export const setActionItemStatus = async (conversationId, itemId, status) => {
  const memory = await ConversationMemory.findOne({ conversationId });
  if (!memory) return null;

  const item = memory.actionItems.id(itemId); // Mongoose subdoc lookup by _id
  if (!item) return null;

  item.status = status;
  await memory.save();
  return memory;
};

// ============================================================
// 5. addActionItem — let a human add a todo by hand
// ============================================================
// Marked manual:true so the incremental summarizer never drops it.
export const addActionItem = async (conversationId, { task, assignedTo, priority, dueDate }) => {
  if (!task || !task.trim()) return null;
  const memory = await getConversationMemory(conversationId);
  memory.actionItems.push({
    task: task.trim().slice(0, 300),
    assignedTo: (assignedTo || "").trim() || "Unassigned",
    status: "pending",
    priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
    dueDate: (dueDate || "").trim(),
    manual: true,
  });
  await memory.save();
  return memory;
};
