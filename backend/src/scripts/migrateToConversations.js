import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Models
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Load ENV
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

const migrate = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // 1. Find all messages that don't have a conversationId
    console.log("Finding unmigrated messages...");
    const unmigratedMessages = await Message.find({
      $or: [
        { conversationId: { $exists: false } },
        { conversationId: null }
      ]
    });

    if (unmigratedMessages.length === 0) {
      console.log("No unmigrated messages found. Migration complete.");
      process.exit(0);
    }

    console.log(`Found ${unmigratedMessages.length} unmigrated messages.`);

    // 2. Group messages by unique sender-receiver pairs
    const pairs = {};
    unmigratedMessages.forEach((msg) => {
      if (msg.senderId && msg.receiverId) {
        // Sort IDs to ensure ["A", "B"] and ["B", "A"] result in the same key
        const pair = [msg.senderId.toString(), msg.receiverId.toString()].sort().join("_");
        if (!pairs[pair]) {
          pairs[pair] = [];
        }
        pairs[pair].push(msg);
      }
    });

    console.log(`Identified ${Object.keys(pairs).length} unique conversation pairs.`);

    // 3. For each pair, find/create conversation and update messages
    for (const pairKey of Object.keys(pairs)) {
      const memberIds = pairKey.split("_");
      const messagesInPair = pairs[pairKey];

      console.log(`Processing pair: ${pairKey} (${messagesInPair.length} messages)`);

      // Find or create direct conversation
      let conversation = await Conversation.findOne({
        type: "direct",
        members: { $all: memberIds, $size: 2 }
      });

      if (!conversation) {
        console.log(`Creating new direct conversation for ${pairKey}`);
        conversation = await Conversation.create({
          type: "direct",
          members: memberIds
        });
      }

      // Update messages with conversationId
      const messageIds = messagesInPair.map(m => m._id);
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { conversationId: conversation._id } }
      );

      // Update lastMessage and lastMessageAt on the conversation
      const latestMessage = messagesInPair.sort((a, b) => b.createdAt - a.createdAt)[0];
      
      // Only update if the latest message is newer than the current lastMessageAt
      if (!conversation.lastMessageAt || latestMessage.createdAt > conversation.lastMessageAt) {
        await Conversation.updateOne(
          { _id: conversation._id },
          { 
            lastMessage: latestMessage._id, 
            lastMessageAt: latestMessage.createdAt 
          }
        );
      }
    }

    console.log("Migration finished successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
