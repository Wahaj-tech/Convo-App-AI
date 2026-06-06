import Conversation from "../models/Conversation.js";
import * as memoryService from "../services/memory.service.js";

// ============================================================
// SUMMARIZATION JOB (Phase 3) — the safety net
// ============================================================
// WHY DO WE NEED THIS IF ai.service ALREADY SUMMARIZES?
// The inline trigger only fires after the AI is mentioned (@ai). But a group can
// chat for an hour WITHOUT mentioning the AI — those messages would never get
// folded into memory. This job sweeps every conversation periodically and tops
// up any memory that has fallen behind, so "what did we decide?" works even if
// nobody pinged the AI in between.
//
// It's cheap: maybeSummarize() does a quick indexed COUNT first and only calls
// the LLM for conversations that actually drifted past the threshold.

const INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes
const JOB_THRESHOLD = 5; // job is a bit more eager than the inline trigger

const runSummarizationCycle = async () => {
  try {
    // Only conversations that have ever had a message are worth checking.
    const conversations = await Conversation.find({
      lastMessageAt: { $ne: null },
    })
      .select("_id")
      .lean();

    console.log(`[MemoryJob] cycle start — scanning ${conversations.length} conversations`);

    // Process one at a time to avoid hammering the Gemini API in parallel.
    for (const c of conversations) {
      await memoryService.maybeSummarize(c._id, JOB_THRESHOLD);
    }

    console.log("[MemoryJob] cycle complete");
  } catch (err) {
    console.error("[MemoryJob] cycle failed:", err.message);
  }
};

export const startSummarizationJob = () => {
  console.log("[MemoryJob] scheduled to run every 30 minutes");
  setInterval(runSummarizationCycle, INTERVAL_MS);
};
