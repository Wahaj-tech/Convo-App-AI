// ============================================================
// PHASE 4 PERSONAS — END-TO-END SMOKE TEST
// ============================================================
// Verifies the persona pipeline against the real DB (no frontend needed):
//   1. seeds-check: requires default personas (run seedPersonas.js first)
//   2. creates 2 throwaway users + a conversation + an AI sentinel check
//   3. inserts a code snippet, then a message mentioning TWO personas
//   4. runs handleAiMentions → expects TWO AI replies, each tagged with the
//      correct personaId
//   5. prints the saved AI messages, then cleans up (pass --keep to retain)
//
// RUN:  cd backend && node src/scripts/testPersona.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Persona from "../models/Persona.js";
import ConversationMemory from "../models/ConversationMemory.js";
import * as aiService from "../services/ai.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const AI_USER_ID = "6751e1b5f1a2c3d4e5f6a7b8";
const KEEP = process.argv.includes("--keep");
const line = (s = "") => console.log(s);

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  line("✓ connected\n");

  const defaults = await Persona.find({ isDefault: true });
  if (defaults.length === 0) {
    console.error("✗ No default personas. Run `node src/scripts/seedPersonas.js` first.");
    process.exit(1);
  }
  if (!(await User.findById(AI_USER_ID))) {
    console.error("✗ AI user missing. Run `node src/scripts/seedAiUser.js` first.");
    process.exit(1);
  }

  const [wahaj, ali] = await User.create([
    { fullName: "Test Wahaj", email: `tp-w-${Date.now()}@test.local`, password: "test123" },
    { fullName: "Test Ali", email: `tp-a-${Date.now()}@test.local`, password: "test123" },
  ]);
  const convo = await Conversation.create({ type: "direct", members: [wahaj._id, ali._id].sort() });
  line(`✓ test conversation ${convo._id}\n`);

  // Seed a couple of human messages incl. a code snippet for Code Reviewer.
  await Message.create([
    { conversationId: convo._id, senderId: wahaj._id, text: "Here's the login check:" },
    { conversationId: convo._id, senderId: wahaj._id, text: "function isAdmin(u){ return u.role = 'admin' }" },
  ]);

  // The triggering message mentions TWO personas at once.
  const trigger = await Message.create({
    conversationId: convo._id,
    senderId: ali._id,
    text: "@CodeReviewer @DevilsAdvocate what do you think of this?",
  });
  line('trigger message: "@CodeReviewer @DevilsAdvocate what do you think of this?"');
  line("→ running handleAiMentions (expect 2 replies)…\n");

  await aiService.handleAiMentions(convo, trigger, false);

  // Inspect the AI replies that were saved.
  const aiMessages = await Message.find({ conversationId: convo._id, senderType: "ai" })
    .sort({ createdAt: 1 })
    .populate("personaId", "name color");

  line(`📨 AI replies saved: ${aiMessages.length}`);
  line("─".repeat(60));
  for (const m of aiMessages) {
    line(`● ${m.personaId?.name || "Convo AI"}  (color ${m.personaId?.color || "n/a"}, personaId ${m.personaId?._id})`);
    line("  " + (m.text || "").replace(/\n/g, "\n  ").slice(0, 400));
    line("");
  }

  const names = aiMessages.map((m) => m.personaId?.name).sort();
  const ok =
    aiMessages.length === 2 &&
    names.includes("Code Reviewer") &&
    names.includes("Devil's Advocate");
  line(ok ? "✅ PASS: both mentioned personas replied with correct tags" : "❌ FAIL: unexpected reply set → " + names.join(", "));

  if (!KEEP) {
    await Message.deleteMany({ conversationId: convo._id });
    await ConversationMemory.deleteMany({ conversationId: convo._id });
    await Conversation.findByIdAndDelete(convo._id);
    await User.deleteMany({ _id: { $in: [wahaj._id, ali._id] } });
    line("\n✓ cleaned up");
  } else {
    line(`\n(kept data — conversation ${convo._id})`);
  }

  await mongoose.disconnect();
  process.exit(ok ? 0 : 2);
};

run().catch((e) => {
  console.error("✗ test failed:", e);
  process.exit(1);
});
