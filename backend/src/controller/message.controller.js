import cloudinary from "../lib/cloudinary.js";
import { emitToConversation } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import * as aiService from "../services/ai.service.js";

// ============================================================
// GET ALL CONTACTS  (GET /api/messages/contacts)
// ============================================================
// Returns every user in the app EXCEPT the logged-in user.
// This powers the "Contacts" tab — the list of all people you COULD chat with.
//
// FLOW:
//   User clicks "Contacts" tab → frontend calls GET /api/messages/contacts
//   → this function runs → returns all other users → UI renders them as a list
//
// Nothing changed here from the old system — contacts are still just "all users."
export const getAllContacts = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    // $ne = "not equal" → give me everyone except the logged-in user
    // .select("-password") → return all fields EXCEPT password (never expose passwords)
    const filterUsers = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    );

    res.status(200).json({ filterUsers });
  } catch (err) {
    console.error("Error in getAllContacts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET MESSAGES  (GET /api/messages/:conversationId)
// ============================================================
// Loads messages for a specific conversation, with CURSOR PAGINATION.
//
// --- What changed from the old version? ---
// OLD (getMessagesByUserId):
//   Used senderId + receiverId to find messages between two people.
//   Loaded ALL messages at once — fine for small chats, terrible for long ones.
//
// NEW (getMessages):
//   Uses conversationId — works for both 1-on-1 AND group chats.
//   Uses cursor pagination — loads messages in batches of 50 (or whatever limit you set).
//
// --- What is cursor pagination? ---
// Imagine a WhatsApp chat with 10,000 messages. You don't want to load all 10,000
// when you open the chat — that would be slow and waste memory. Instead:
//
//   1. First load: GET /api/messages/conv123?limit=50
//      → Returns the 50 most recent messages
//
//   2. User scrolls up (wants older messages): GET /api/messages/conv123?before=<oldest_message_id>&limit=50
//      → Returns the 50 messages BEFORE that message ID
//
//   3. User scrolls up again: GET /api/messages/conv123?before=<even_older_id>&limit=50
//      → Returns the next 50... and so on
//
// The "before" parameter is the CURSOR — it tells the server "I already have
// messages up to this point, give me the ones before it."
//
// WHY cursor pagination instead of page numbers (page=1, page=2)?
//   Page numbers break when new messages arrive. If someone sends a message while
//   you're on "page 2", all the pages shift and you'd see duplicate or missing messages.
//   Cursors are anchored to a specific message ID, so they're stable even when new
//   messages come in.
//
// FLOW:
//   User opens a chat → frontend calls GET /api/messages/conv123
//   → returns 50 newest messages → user sees them
//   → user scrolls up → frontend calls GET /api/messages/conv123?before=<oldest_id>&limit=50
//   → returns next 50 → appended to the top of the chat
//   → repeat until no more messages (hasMore: false)
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // --- Step 1: Verify the conversation exists and user is a member ---
    // Security check: you can only read messages in conversations you belong to.
    // Without this, anyone could read any conversation by guessing the ID.
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    // --- Step 2: Build the query with optional cursor ---
    // "before" is an optional query parameter — a message ID.
    // "limit" is how many messages to fetch (default 50, max 100).
    //
    // If "before" is provided, we only fetch messages with an _id LESS THAN that value.
    // WHY does _id work for "older than"? Because MongoDB ObjectIds contain a timestamp —
    // an ObjectId created at 9:00 PM is always "greater than" one created at 8:55 PM.
    // So _id: { $lt: someId } literally means "messages created before this one."
    const { before, limit: rawLimit } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 50, 100); // default 50, max 100

    // Start building the query — always filter by conversation
    const query = { conversationId };

    // If the user sent a "before" cursor, add the "older than this" filter
    if (before) {
      query._id = { $lt: before };
    }

    // --- Step 3: Execute the query ---
    // .sort({ createdAt: -1 }) → newest first (so the first result is the most recent)
    // .limit(limit + 1) → we fetch ONE EXTRA message to check if there are more pages
    //
    // WHY limit + 1? Imagine limit=50. If we get back 51 messages, we know there are
    // more beyond these 50. If we get back 50 or fewer, we've reached the end.
    // We slice off the extra one before sending — it was just for the "hasMore" check.
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("senderId", "fullName profilePic");
    // .populate("senderId") loads the sender's name and profile pic so the frontend
    // can show WHO sent each message (important for group chats where multiple people talk)

    // --- Step 4: Determine if there are more messages and format the response ---
    const hasMore = messages.length > limit;
    // If we got the extra message (hasMore=true), remove it from the results
    const trimmed = hasMore ? messages.slice(0, limit) : messages;

    // Reverse so messages are in chronological order (oldest → newest).
    // WHY? We sorted by createdAt: -1 (newest first) for the query because that's
    // how the index works efficiently. But the frontend expects messages in
    // chronological order so it can render them top-to-bottom (oldest at top,
    // newest at bottom, just like any chat app). So we reverse after slicing.
    trimmed.reverse();

    res.status(200).json({
      messages: trimmed,
      hasMore, // tells the frontend "there are older messages you can load by scrolling up"
    });
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============================================================
// SEND MESSAGE  (POST /api/messages/send/:conversationId)
// ============================================================
// This is the core action — user types a message and hits send.
//
// --- What changed from the old version? ---
// OLD: POST /api/messages/send/:receiverId
//   Targeted a SPECIFIC USER. Created a message with senderId + receiverId.
//   Emitted via socket to that one receiver's socket ID.
//   No concept of conversations — just raw messages between two people.
//
// NEW: POST /api/messages/send/:conversationId
//   Targets a CONVERSATION. Creates a message with conversationId + senderId.
//   Emits to ALL members of the conversation (not just one receiver).
//   Updates the conversation's lastMessage and lastMessageAt (for sidebar ordering).
//   Works identically for 1-on-1 AND group chats.
//
// FLOW:
//   1. User types "Hello!" and hits send
//   2. Frontend sends POST /api/messages/send/conv123 with { text: "Hello!" }
//   3. This function:
//      a. Validates: Does this conversation exist? Is the user a member?
//      b. If there's an image, uploads it to Cloudinary
//      c. Creates the message in the database (linked to the conversation)
//      d. Updates the conversation's lastMessage pointer (so sidebar shows preview)
//      e. Emits the message via Socket.io to all other members in real-time
//      f. Returns the saved message to the sender
//   4. All online members instantly see the message (no page refresh needed)
//
// WHY update lastMessage and lastMessageAt on the conversation?
//   The sidebar shows your chats sorted by most recent activity, with a preview
//   of the last message. Without these fields, you'd have to query the Messages
//   collection for every conversation to figure out the order and preview — very slow.
//   By updating them here, the sidebar query is just:
//     Conversation.find({ members: userId }).sort({ lastMessageAt: -1 })
//   One fast query instead of hundreds.
export const sendMessage = async (req, res) => {
  try {
    const { text, image, isAiPrompt } = req.body;
    const { conversationId } = req.params;
    const senderId = req.user._id;

    console.log(`[MSG] Incoming message: conv=${conversationId}, isAiPrompt=${isAiPrompt}, text="${text}"`);


    // --- Validation ---
    // Must have at least text or image — can't send an empty message
    if (!text && !image) {
      return res.status(400).json({ message: "Text or Image is required" });
    }

    // --- Step 1: Verify conversation exists and user is a member ---
    // This is the AUTHORIZATION check. Just because you know a conversation ID
    // doesn't mean you're allowed to send messages in it. You must be a member.
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.members.some(
      (m) => m.toString() === senderId.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    // --- Step 2: Handle image upload (if any) ---
    // Images are sent as base64 strings from the frontend (the raw image data
    // encoded as text). We upload to Cloudinary (a cloud image hosting service)
    // and store the resulting URL — much more efficient than storing raw image
    // data in the database.
    let imageURL;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageURL = uploadResponse.secure_url;
    }

    // --- Step 3: Create the message in the database ---
    // Notice: no receiverId! In the old system, every message had a specific receiver.
    // Now the conversation knows who the members are — the message just needs to know
    // which conversation it belongs to and who sent it.
    const newMessage = await Message.create({
      conversationId,
      senderId,
      text,
      image: imageURL,
    });

    // --- Step 4: Update the conversation's "last message" info ---
    // This is what keeps the sidebar fresh. After saving the message, we update
    // two fields on the conversation:
    //   lastMessage → points to this new message (for the preview text)
    //   lastMessageAt → the time of this message (for sorting)
    //
    // WHY use updateOne instead of findById + save?
    //   Performance. updateOne sends a single database command:
    //     "UPDATE conversation SET lastMessage=X, lastMessageAt=Y WHERE _id=Z"
    //   findById + save would do TWO operations: a read then a write.
    //   For something that happens on EVERY message sent, this adds up.
    await Conversation.updateOne(
      { _id: conversationId },
      { lastMessage: newMessage._id, lastMessageAt: newMessage.createdAt }
    );

    // --- Step 5: Populate sender info for the socket emission ---
    // The frontend needs to show the sender's name and profile pic next to each
    // message (especially in group chats). Rather than making the frontend do a
    // separate request to fetch this, we populate it before emitting.
    await newMessage.populate("senderId", "fullName profilePic");

    // --- Step 6: Emit the message to all other conversation members via Socket.io ---
    //
    // OLD WAY (before rooms):
    //   We looped through every member in the conversation, looked up their socket ID,
    //   and sent the message to each one individually. Like walking to each person's desk.
    //
    // NEW WAY (with rooms — Phase 1.6):
    //   Every user has already joined a Socket.io room named "conv:<conversationId>".
    //   We just broadcast to that room — Socket.io delivers it to everyone automatically.
    //   Like announcing in a meeting room — everyone present hears it at once.
    //
    // We pass senderId as the third argument (excludeUserId) so the sender is SKIPPED.
    // WHY? The sender already has the message in their UI (added instantly via optimistic
    // update when they hit "send"). If we also sent it via socket, they'd see it TWICE.
    emitToConversation(conversationId, "newMessage", newMessage, senderId);

    // --- AI Integration (Phase 2) ---
    // Check if the message mentions @AI or has the isAiPrompt flag.
    if (isAiPrompt || aiService.detectAiMention(text)) {
      aiService.processAiResponse(conversationId, newMessage);
    }

    res.status(200).json(newMessage);
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============================================================
// GET CHAT PARTNERS  (GET /api/messages/chats)  — DEPRECATED
// ============================================================
// This is the OLD way of getting the sidebar list — it scanned every message
// to figure out who you've chatted with. It's been REPLACED by getMyConversations
// in the conversation controller (GET /api/conversations/).
//
// WHY keep it? Two reasons:
//   1. The frontend might still reference it during the transition
//   2. The migration script (step 1.10) needs the old data to still be accessible
//
// Once the frontend is fully migrated to use conversations, this can be deleted.
//
// OLD FLOW (how this used to work):
//   1. Find all messages where logged-in user is sender OR receiver
//   2. For each message, extract the OTHER person's ID
//   3. Remove duplicates (Set)
//   4. Look up those user IDs to get names and profile pics
//
// NEW FLOW (getMyConversations):
//   1. Conversation.find({ members: userId }) — one query, done
//   Much simpler, works for groups too, and includes lastMessage preview.
export const getChatPartners = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUser }, { receiverId: loggedInUser }],
    });

    const chatPartnerId = [
      ...new Set(
        messages.map((msg) => {
          return msg.senderId.toString() === loggedInUser.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString();
        })
      ),
    ];

    const chatPartner = await User.find({
      _id: { $in: chatPartnerId },
    }).select("-password");
    res.status(200).json(chatPartner);
  } catch (err) {
    console.error("Error in getChatPartner:", err);
    res.status(500).json({ message: "Internal Server error" });
  }
};
