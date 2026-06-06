// ============================================================
// PHASE 3 MEMORY — END-TO-END SMOKE TEST
// ============================================================
// Drives the WHOLE server-side memory pipeline against your real MongoDB,
// without needing the frontend or two browser windows. It:
//   1. creates 2 throwaway test users + a conversation
//   2. inserts a scripted chat (with a decision + todos + an AI reply)
//   3. runs maybeSummarize() — forcing the threshold so it actually summarizes
//   4. prints the resulting memory doc (summary / decisions / action items / topics)
//   5. prints what buildAiContext() would feed Gemini (system prompt + history)
//   6. cleans everything up (pass --keep to leave the data in the DB)
//
// RUN:  cd backend && node src/scripts/testMemory.js
//       cd backend && node src/scripts/testMemory.js --keep   (don't delete test data)
//
// Requires a valid MONGO_URI and GEMINI_API_KEY in backend/.env

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import ConversationMemory from "../models/ConversationMemory.js";
import * as memoryService from "../services/memory.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const AI_USER_ID = "6751e1b5f1a2c3d4e5f6a7b8";
const KEEP = process.argv.includes("--keep");

const line = (s = "") => console.log(s);
const rule = () => line("─".repeat(60));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  line("✓ connected to MongoDB\n");

  // --- ensure the AI sentinel user exists (memory uses it for AI messages) ---
  const aiExists = await User.findById(AI_USER_ID);
  if (!aiExists) {
    console.error(
      "✗ AI user not found. Run `node src/scripts/seedAiUser.js` first."
    );
    process.exit(1);
  }

  // --- 1. create two throwaway users ---
  const [wahaj, ali] = await User.create([
    { fullName: "Test Wahaj", email: `t-wahaj-${Date.now()}@test.local`, password: "test123" },
    { fullName: "Test Ali", email: `t-ali-${Date.now()}@test.local`, password: "test123" },
  ]);

  // --- create a direct conversation between them ---
  const convo = await Conversation.create({
    type: "direct",
    members: [wahaj._id, ali._id].sort(),
  });
  line(`✓ created test conversation ${convo._id}\n`);

  // --- 2. insert a scripted chat (a real decision + two todos) ---
  const script = [
    [wahaj._id, "user", "Hey, we need to pick the AI provider for the app."],
    [ali._id, "user", "I was thinking Claude, but it's pricey for our volume."],
    [wahaj._id, "user", "Let's go with Gemini instead to save cost."],
    [ali._id, "user", "Agreed — final decision: we use Gemini."],
    [wahaj._id, "user", "Ali, can you set up the GEMINI_API_KEY by Friday?"],
    [ali._id, "user", "Sure, I'll handle the API key setup."],
    [wahaj._id, "user", "Also someone needs to write the onboarding docs."],
    [ali._id, "user", "I'll take the docs too."],
    [wahaj._id, "user", "Great. Let's target launch next Monday."],
    [ali._id, "user", "Sounds good, Monday launch it is."],
    [wahaj._id, "user", "@ai summarize what we've decided so far"],
    [AI_USER_ID, "ai", "So far: you chose **Gemini** over Claude to save cost, Ali will set up the API key by Friday and write the docs, and launch is targeted for Monday."],
  ];

  for (const [senderId, senderType, text] of script) {
    await Message.create({ conversationId: convo._id, senderId, senderType, text });
  }
  line(`✓ inserted ${script.length} messages\n`);

  // --- 3. summarize (threshold 1 forces it to run for the test) ---
  rule();
  line("Running maybeSummarize() (threshold=1 to force a summary)…");
  rule();
  await memoryService.maybeSummarize(convo._id, 1);

  // --- 4. show the resulting memory document ---
  const memory = await ConversationMemory.findOne({ conversationId: convo._id });
  line();
  line("📋 MEMORY DOCUMENT");
  rule();
  line("SUMMARY:\n  " + (memory.summary || "(empty)"));
  line("\nKEY DECISIONS:");
  memory.keyDecisions.forEach((d) =>
    line(`  • ${d.decision}${d.madeBy ? `  (by ${d.madeBy})` : ""}`)
  );
  line("\nACTION ITEMS:");
  memory.actionItems.forEach((a) =>
    line(`  • [${a.status}] ${a.task}${a.assignedTo !== "Unassigned" ? `  → ${a.assignedTo}` : ""}  (id: ${a._id})`)
  );
  line("\nTOPICS:  " + memory.topics.join(", "));
  line(`\nbookmark (lastSummarizedMessageId): ${memory.lastSummarizedMessageId}`);
  line(`totalMessagesProcessed: ${memory.totalMessagesProcessed}`);

  // --- 4b. prove a human "done" toggle survives a re-summarize ---
  if (memory.actionItems.length) {
    const first = memory.actionItems[0];
    await memoryService.setActionItemStatus(convo._id, first._id, "done");
    await memoryService.updateConversationSummary(convo._id); // re-run
    const after = await ConversationMemory.findOne({ conversationId: convo._id });
    const stillDone = after.actionItems.find(
      (a) => a.task.trim().toLowerCase() === first.task.trim().toLowerCase()
    );
    line(
      `\n✓ human "done" override test: "${first.task}" → ${
        stillDone?.status === "done" ? "STAYED done ✅" : "was reset ❌"
      }`
    );
  }

  // --- 5. show what the AI would actually receive next time ---
  const { systemPrompt, history } = await memoryService.buildAiContext(convo._id);
  line();
  line("🤖 WHAT buildAiContext() FEEDS GEMINI");
  rule();
  line("SYSTEM PROMPT (persona + memory):");
  line(systemPrompt);
  line(`\nHISTORY: ${history.length} turns (roles: ${history.map((h) => h.role).join(", ")})`);

  // --- 6. cleanup ---
  if (!KEEP) {
    await Message.deleteMany({ conversationId: convo._id });
    await ConversationMemory.deleteMany({ conversationId: convo._id });
    await Conversation.findByIdAndDelete(convo._id);
    await User.deleteMany({ _id: { $in: [wahaj._id, ali._id] } });
    line("\n✓ cleaned up test data");
  } else {
    line(`\n(kept test data — conversation ${convo._id})`);
  }

  await mongoose.disconnect();
  line("\n✅ done");
  process.exit(0);
};

run().catch((err) => {
  console.error("✗ test failed:", err);
  process.exit(1);
});
