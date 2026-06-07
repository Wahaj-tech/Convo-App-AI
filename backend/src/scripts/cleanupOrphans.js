import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import ConversationMemory from "../models/ConversationMemory.js";
import User from "../models/User.js";

// ============================================================
// CLEANUP ORPHANED CONVERSATIONS
// ============================================================
// After deleting users directly in the database, their 1-on-1 chats are left
// "orphaned" — the conversation still references a user that no longer exists,
// so the UI shows a nameless "Chat". This script:
//   - deletes direct chats whose other participant no longer exists
//   - deletes groups that dropped below 2 real members
//   - prunes deleted members out of surviving groups (and reassigns admin if needed)
//   - removes the messages + memory of any deleted conversation
//
// RUN:  cd backend && node src/scripts/cleanupOrphans.js

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const users = await User.find({}).select("_id");
    const liveIds = new Set(users.map((u) => u._id.toString()));
    console.log(`Live users: ${liveIds.size}`);

    const conversations = await Conversation.find({});
    let deleted = 0;
    let pruned = 0;

    for (const conv of conversations) {
      const existing = conv.members.filter((m) => liveIds.has(m.toString()));
      const isOrphan =
        (conv.type === "direct" && existing.length < 2) ||
        (conv.type === "group" && existing.length < 2);

      if (isOrphan) {
        await Message.deleteMany({ conversationId: conv._id });
        await ConversationMemory.deleteOne({ conversationId: conv._id });
        await Conversation.deleteOne({ _id: conv._id });
        deleted++;
        console.log(`  ✗ deleted ${conv.type} conversation ${conv._id}`);
        continue;
      }

      // Surviving group with some deleted members → prune them.
      if (conv.type === "group" && existing.length !== conv.members.length) {
        conv.members = existing;
        if (!liveIds.has(conv.admin?.toString())) conv.admin = existing[0];
        await conv.save();
        pruned++;
        console.log(`  ↺ pruned deleted members from group ${conv._id}`);
      }
    }

    console.log(`Done. Deleted ${deleted} orphaned conversations, pruned ${pruned} groups.`);
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
};

run();
