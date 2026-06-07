import Conversation from "../models/Conversation.js";
import userModel from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io, emitToConversation } from "../lib/socket.js";
import * as memoryService from "../services/memory.service.js";
import Persona from "../models/Persona.js";

// ============================================================
// CREATE CONVERSATION  (POST /api/conversations/)
// ============================================================
// This is the ENTRY POINT for starting any chat.
// It handles TWO completely different scenarios:
//   1. Direct (1-on-1): When you click on a contact in the sidebar
//   2. Group: When you create a new group chat
//
// WHY one endpoint for both?
//   Because from the frontend's perspective, "start a chat" is
//   one action — the only difference is how many people are in it.
//   The `type` field tells us which path to take.
export const createConversation = async (req, res) => {
  try {
    const { type, members, name, groupImage } = req.body;
    const userId = req.user._id; // comes from protectRoute middleware (JWT)

    // Basic validation — we need to know what kind of chat and who's in it
    if (!type || !members || !Array.isArray(members)) {//array conntains multiple values like ["u1", "u2", "u3"] but frontend can send members = "u1" , memeber=25,member={name:"wahaj"} etc. so we check if it's an array or not
      return res.status(400).json({ message: "type and members array are required" });
    }

    // Auto-include the creator in the members list.(group bnane p creator ko auto include krna)
    // WHY? The frontend might send members: ["otherUserId"] without including
    // the current user. Instead of making the frontend remember to always add
    // itself, we handle it here — defensive coding.
    if (!members.includes(userId.toString())) {
      members.push(userId.toString());
    }

    // --- DIRECT (1-on-1) conversation ---
    if (type === "direct") {
      // A direct chat is ALWAYS exactly 2 people — no more, no less
      if (members.length !== 2) {
        return res.status(400).json({ message: "Direct conversations must have exactly 2 members" });
      }

      // Sort member IDs alphabetically before searching/creating.
      // WHY? Imagine Wahaj starts a chat with Ali → members: ["wahaj_id", "ali_id"]
      // Later Ali starts a chat with Wahaj → members: ["ali_id", "wahaj_id"]
      // Without sorting, these look like two different conversations!
      // By always sorting, both become ["ali_id", "wahaj_id"] → same conversation found.
      const sortedMembers = members.map(String).sort();

      // Check if a direct conversation between these two people ALREADY EXISTS.
      // WHY? We don't want duplicate conversations. If Wahaj and Ali already have
      // a chat, clicking on Ali should open that existing chat — not create a new one.
      // $all means "array contains ALL of these" and $size: 2 means "array has exactly 2 items"
      const existing = await Conversation.findOne({
        type: "direct",
        members: { $all: sortedMembers, $size: 2 },//sortedMembers=["ali_id", "wahaj_id"] ->$all means:This array must contain ALL these values. ...why $size? Because we want to ensure it's exactly 2 people. If we only did $all without $size, then a group chat with 3+ members that includes both Ali and Wahaj would also match — not what we want for a direct chat.
      }).populate("members", "-password").populate("lastMessage");

      // If found, just return the existing conversation — no new one created
      if (existing) {
        return res.status(200).json(existing);
      }

      // Make sure the other user actually exists in the database
      const otherUserId = sortedMembers.find((id) => id !== userId.toString());
      const otherUserExists = await userModel.exists({ _id: otherUserId });
      if (!otherUserExists) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create the new direct conversation
      const conversation = await Conversation.create({
        type: "direct",
        members: sortedMembers,
      });

      // Populate member details (name, profile pic) before sending back.
      // WHY? The frontend needs the member objects (not just IDs) to display
      // the other person's name and avatar in the sidebar. "-password" means
      // "give me everything EXCEPT the password field" — never expose passwords.
      const populated = await Conversation.findById(conversation._id)
        .populate("members", "-password");//Replace IDs with actual full data from another collection. In this case, we replace the member IDs with their full user objects (name, profilePic) so the frontend can show that info in the chat sidebar. We exclude the password field for security.

      // Join both members' sockets to the room and notify them, so a brand-new
      // direct chat shows up live for the other person too (no refresh needed).
      for (const memberId of sortedMembers) {
        const memberSocketId = getReceiverSocketId(memberId.toString());
        if (memberSocketId) {
          const memberSocket = io.sockets.sockets.get(memberSocketId);
          if (memberSocket) memberSocket.join(`conv:${conversation._id}`);
        }
      }
      emitToConversation(conversation._id, "conversationUpdated", populated);

      return res.status(201).json(populated);
    }

    // --- GROUP conversation ---
    if (type === "group") {
      // Groups must have a name (direct chats don't — they show the other person's name)
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Group name is required" });
      }
      // Minimum 3 members — otherwise it's just a direct chat
      if (members.length < 3) {
        return res.status(400).json({ message: "Groups need at least 3 members" });
      }

      // Verify ALL member IDs are real users in the database.
      // WHY? Someone could send fake user IDs in the request. We check that
      // every ID maps to a real user. If any don't exist, we reject the whole request.
      const validMembers = await userModel.find({ _id: { $in: members } }).select("_id");
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: "One or more members not found" });
      }

      // If a group image was provided (as base64), upload it to Cloudinary
      let imageURL = "";
      if (groupImage) {
        const uploadResponse = await cloudinary.uploader.upload(groupImage);
        imageURL = uploadResponse.secure_url;
      }

      // Create the group conversation.
      // The person creating it becomes the admin — they can add/remove members,
      // rename the group, and change the image.
      const conversation = await Conversation.create({
        type: "group",
        name: name.trim(),
        groupImage: imageURL,
        members,
        admin: userId,
      });

      const populated = await Conversation.findById(conversation._id)
        .populate("members", "-password");

      // --- Auto-join all online members into the new conversation's socket room ---
      // When a group is created, every member who is currently online needs to
      // join the Socket.io room for this conversation. Otherwise they won't
      // receive real-time messages until they refresh the page.
      //
      // HOW: For each member, check if they have an active socket connection.
      // If they do, tell that socket to join the room "conv:<conversationId>".
      // Members who are offline will join the room when they next connect
      // (the frontend sends "joinConversations" with all their conversation IDs on connect).
      for (const memberId of members) {
        const memberSocketId = getReceiverSocketId(memberId.toString());
        if (memberSocketId) {
          const memberSocket = io.sockets.sockets.get(memberSocketId);
          if (memberSocket) {
            memberSocket.join(`conv:${conversation._id}`);
          }
        }
      }

      // Now that members are in the room, tell their clients about the new group
      // so it appears in their chat list in real time (no refresh needed).
      emitToConversation(conversation._id, "conversationUpdated", populated);

      return res.status(201).json(populated);
    }

    // If type is neither "direct" nor "group", reject it
    return res.status(400).json({ message: "type must be 'direct' or 'group'" });
  } catch (err) {
    console.error("Error in createConversation:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================================================
// GET MY CONVERSATIONS  (GET /api/conversations/)
// ============================================================
// This is what the SIDEBAR calls when you open the app.
// It returns ALL conversations you're part of — direct AND group —
// sorted by most recent activity.
//
// FLOW: User opens app → frontend calls GET /api/conversations/ →
//       this function runs → returns all your chats → sidebar renders them(sidebar p dikheg ki kisse baatein hui hai)
//
// This REPLACES the old "getChatPartners" function which only worked
// for 1-on-1 chats. Now one query handles both direct and group.
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find every conversation where this user is in the members array.
    // .populate("members") → load full user objects (name, profilePic) instead of just IDs
    // .populate("lastMessage") → load the last message so sidebar can show a preview
    // .sort({ lastMessageAt: -1 }) → newest activity first (just like WhatsApp/iMessage)
    const conversations = await Conversation.find({ members: userId })//"Find all conversations where this user exists inside members array.""
      .populate("members", "-password")
      .populate("lastMessage")
      .populate("personas")
      .sort({ lastMessageAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error("Error in getMyConversations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET SINGLE CONVERSATION  (GET /api/conversations/:id)
// ============================================================
// When you click on a conversation in the sidebar, the frontend
// needs the full conversation object (members, last message, etc).
// This fetches it by ID.
//
// Security check: you can only view conversations you're a member of.
// Without this check, anyone could read any conversation by guessing IDs.
export const getConversationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params; // conversation ID from URL: /api/conversations/abc123

    const conversation = await Conversation.findById(id)
      .populate("members", "-password")
      .populate("lastMessage")
      .populate("personas");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Membership check — only members can view the conversation
    const isMember = conversation.members.some(//some means "is there at least one member in this conversation whose ID matches the requester?"  if any one member machtes it return true and stop checking the rest .
      (member) => member._id.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this conversation" });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error("Error in getConversationById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE CONVERSATION  (PUT /api/conversations/:id)
// ============================================================
// Lets the GROUP ADMIN change the group name or group image.
// Direct chats can't be "updated" — there's nothing to change
// (they don't have names or images).
//
// Three security checks:
//   1. Conversation must exist
//   2. Must be a group (not direct)
//   3. Requester must be the admin
export const updateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, groupImage } = req.body;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Can only update group conversations" });
    }
    // Only the person who created the group (admin) can rename/re-image it
    if (conversation.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can update group info" });
    }

    if (name) conversation.name = name.trim();

    if (groupImage) {
      const uploadResponse = await cloudinary.uploader.upload(groupImage);
      conversation.groupImage = uploadResponse.secure_url;
    }

    await conversation.save();

    const populated = await Conversation.findById(id)
      .populate("members", "-password")
      .populate("lastMessage");

    // Notify all members that the group info changed (name or image updated).
    // Their sidebar and chat header will update in real-time without refreshing.
    emitToConversation(id, "conversationUpdated", populated);

    res.status(200).json(populated);
  } catch (err) {
    console.error("Error in updateConversation:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// ADD MEMBERS  (POST /api/conversations/:id/members)
// ============================================================
// Lets the admin add new people to a group chat.
//
// FLOW: Admin clicks "Add Member" → picks users → frontend sends
//       POST /api/conversations/:id/members with { members: ["id1", "id2"] }
//       → this adds them → returns updated conversation
//
// Smart checks:
//   - Only admin can add
//   - Only works on groups (can't add people to a direct chat)
//   - Verifies all new member IDs are real users
//   - Skips users who are already members (no duplicates)
export const addMembers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { members } = req.body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "members array is required" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Can only add members to group conversations" });
    }
    if (conversation.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Check that all the user IDs being added are real users
    const validMembers = await userModel.find({ _id: { $in: members } }).select("_id");//$in means "find users whose _id is IN this array of members we're trying to add." If we ask for 3 IDs but only 2 exist, validMembers will only have 2 results.for $in:ANY ONE match is enough — we just want to verify that every ID in the members array corresponds to a real user. If any of them don't exist, we reject the whole request. if any ID matches a real user it give result and add that user to validateMembers array
    if (validMembers.length !== members.length) {
      return res.status(400).json({ message: "One or more users not found" });
    }

    // Filter out anyone who's already a member — avoid duplicates
    const currentMemberIds = conversation.members.map((m) => m.toString());//it states that "currentMemberIds" is an array of strings representing the IDs of the current members in the conversation. We convert each member ID to a string for easy comparison with the incoming "members" array, which also contains string IDs.
    const newMembers = members.filter((m) => !currentMemberIds.includes(m));//to avoid adding duplicates members we filter the incoming "members" array to only include those who are not already in the conversation. The result is stored in "newMembers". If all the incoming members are already part of the conversation, "newMembers" will be an empty array.

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "All users are already members" });
    }

    conversation.members.push(...newMembers);
    await conversation.save();

    // --- Join new members into the conversation's socket room ---
    // Same idea as group creation — if the new members are online, make
    // their sockets join the room so they immediately start receiving messages.
    // Also notify the room that new members were added (so existing members'
    // UI can update the member list without refreshing).
    for (const memberId of newMembers) {
      const memberSocketId = getReceiverSocketId(memberId.toString());
      if (memberSocketId) {
        const memberSocket = io.sockets.sockets.get(memberSocketId);
        if (memberSocket) {
          memberSocket.join(`conv:${id}`);
        }
      }
    }

    const populated = await Conversation.findById(id)
      .populate("members", "-password")
      .populate("lastMessage");

    // Notify everyone in the conversation that members were added.
    // The frontend can listen for "conversationUpdated" to refresh the member list.
    emitToConversation(id, "conversationUpdated", populated);

    res.status(200).json(populated);
  } catch (err) {
    console.error("Error in addMembers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// REMOVE MEMBERS  (DELETE /api/conversations/:id/members)
// ============================================================
// Lets the admin kick people out of a group.
//
// Important rules:
//   - Admin cannot remove themselves (they should use "leave" instead)
//   - Group must keep at least 3 members after removal
//   - Only removes people who are actually in the group
export const removeMembers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { members } = req.body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "members array is required" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Can only remove members from group conversations" });
    }
    if (conversation.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Admin can't kick themselves — use leaveConversation for that
    if (members.includes(userId.toString())) {
      return res.status(400).json({ message: "Admin cannot remove themselves — use leave instead" });
    }

    // Only try to remove people who are actually in the group
    const currentMemberIds = conversation.members.map((m) => m.toString());
    const toRemove = members.filter((m) => currentMemberIds.includes(m));

    if (toRemove.length === 0) {
      return res.status(400).json({ message: "None of these users are members" });
    }

    // Filter the members array — keep everyone NOT in the removal list
    conversation.members = conversation.members.filter(
      (m) => !toRemove.includes(m.toString())
    );

    // Enforce minimum group size — a group with 2 people is just a direct chat
    if (conversation.members.length < 3) {
      return res.status(400).json({ message: "Group must have at least 3 members" });
    }

    await conversation.save();

    // --- Remove kicked members from the conversation's socket room ---
    // They should immediately stop receiving messages from this conversation.
    // Also notify them that they were removed (so their UI can update).
    for (const memberId of toRemove) {
      const memberSocketId = getReceiverSocketId(memberId.toString());
      if (memberSocketId) {
        const memberSocket = io.sockets.sockets.get(memberSocketId);
        if (memberSocket) {
          // Tell the removed member they were kicked BEFORE removing them from the room.
          // If we remove from the room first, they won't receive this notification.
          memberSocket.emit("removedFromConversation", { conversationId: id });
          memberSocket.leave(`conv:${id}`);
        }
      }
    }

    const populated = await Conversation.findById(id)
      .populate("members", "-password")
      .populate("lastMessage");

    // Notify remaining members that the group was updated (member list changed)
    emitToConversation(id, "conversationUpdated", populated);

    res.status(200).json(populated);
  } catch (err) {
    console.error("Error in removeMembers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// LEAVE CONVERSATION  (DELETE /api/conversations/:id)
// ============================================================
// Any member (including admin) can leave a group voluntarily.
//
// Special cases handled:
//   1. Can't leave a direct chat (it's permanent — like contacts)
//   2. If the admin leaves, ownership transfers to the next member
//   3. If only 1 person would remain after leaving, delete the whole group
//      (a group of 1 makes no sense)
//
// FLOW: User clicks "Leave Group" → frontend sends DELETE /api/conversations/:id
//       → this removes them from members → if admin, transfers admin to someone else
//       → if group would be <2 people, deletes it entirely
export const leaveConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify the person is actually in this conversation
    const isMember = conversation.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(400).json({ message: "You are not a member of this conversation" });
    }

    // Direct chats are permanent — you can't "leave" a 1-on-1 conversation
    if (conversation.type === "direct") {
      return res.status(400).json({ message: "Cannot leave a direct conversation" });
    }

    // Remove the user from the members array
    conversation.members = conversation.members.filter(
      (m) => m.toString() !== userId.toString()
    );

    // If the person leaving is the admin, pass admin rights to the next person.
    // It's like passing the TV remote to whoever is sitting next to you when you leave.
    if (conversation.admin.toString() === userId.toString()) {
      if (conversation.members.length > 0) {
        conversation.admin = conversation.members[0];
      }
    }

    // --- Remove the leaving user from the conversation's socket room ---
    // They should stop receiving real-time messages from this group immediately.
    const leaverSocketId = getReceiverSocketId(userId.toString());
    if (leaverSocketId) {
      const leaverSocket = io.sockets.sockets.get(leaverSocketId);
      if (leaverSocket) {
        leaverSocket.leave(`conv:${id}`);
      }
    }

    // If only 0 or 1 person remains, delete the group — it's no longer viable
    if (conversation.members.length < 2) {
      await Conversation.findByIdAndDelete(id);
      return res.status(200).json({ message: "Group deleted — too few members remaining" });
    }

    await conversation.save();

    // Notify remaining members that someone left (so their UI updates the member list)
    const populated = await Conversation.findById(id)
      .populate("members", "-password")
      .populate("lastMessage");

    if (populated) {
      emitToConversation(id, "conversationUpdated", populated);
    }

    res.status(200).json({ message: "Left conversation successfully" });
  } catch (err) {
    console.error("Error in leaveConversation:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// HELPER: confirm the requester is a member of the conversation
// ============================================================
// Reused by the memory endpoints. Returns the conversation if the user belongs
// to it, otherwise sends the appropriate error response and returns null.
const requireMembership = async (conversationId, userId, res) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found" });
    return null;
  }
  const isMember = conversation.members.some(
    (m) => m.toString() === userId.toString()
  );
  if (!isMember) {
    res.status(403).json({ message: "You are not a member of this conversation" });
    return null;
  }
  return conversation;
};

// ============================================================
// GET CONVERSATION MEMORY  (GET /api/conversations/:id/memory)
// ============================================================
// Returns the distilled memory (summary, key decisions, action items, topics)
// so the frontend memory panel can show "what the AI remembers."
export const getConversationMemory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await requireMembership(id, userId, res);
    if (!conversation) return; // response already sent

    // get-or-create — a brand-new conversation simply returns an empty memory.
    const memory = await memoryService.getConversationMemory(id);
    res.status(200).json(memory);
  } catch (err) {
    console.error("Error in getConversationMemory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// ADD ACTION ITEM  (POST /api/conversations/:id/memory/action-items)
// ============================================================
// Lets any member add a todo by hand (not just AI-extracted ones).
export const addActionItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { task, assignedTo, priority, dueDate } = req.body;

    if (!task || !task.trim()) {
      return res.status(400).json({ message: "Task is required" });
    }

    const conversation = await requireMembership(id, userId, res);
    if (!conversation) return;

    const memory = await memoryService.addActionItem(id, { task, assignedTo, priority, dueDate });

    // Live-update everyone viewing this conversation's memory panel.
    emitToConversation(id, "memoryUpdated", memory);

    res.status(200).json(memory);
  } catch (err) {
    console.error("Error in addActionItem:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE ACTION ITEM STATUS
// (PATCH /api/conversations/:id/memory/action-items/:itemId)
// ============================================================
// Lets any member tick a todo as pending / in_progress / done.
// Broadcasts the updated memory so everyone's panel stays in sync.
export const updateActionItemStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, itemId } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "in_progress", "done"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const conversation = await requireMembership(id, userId, res);
    if (!conversation) return;

    const memory = await memoryService.setActionItemStatus(id, itemId, status);
    if (!memory) {
      return res.status(404).json({ message: "Memory or action item not found" });
    }

    // Live-update everyone viewing this conversation's memory panel.
    emitToConversation(id, "memoryUpdated", memory);

    res.status(200).json(memory);
  } catch (err) {
    console.error("Error in updateActionItemStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// REGENERATE MEMORY  (POST /api/conversations/:id/memory/regenerate)
// ============================================================
// Rebuilds the conversation's distilled memory from scratch (keeps manual todos).
export const regenerateMemory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await requireMembership(id, userId, res);
    if (!conversation) return;

    const memory = await memoryService.regenerateMemory(id);
    emitToConversation(id, "memoryUpdated", memory);
    res.status(200).json(memory);
  } catch (err) {
    console.error("Error in regenerateMemory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE CONVERSATION PERSONAS  (PUT /api/conversations/:id/personas)
// ============================================================
// Curates which AI personas are "enabled" (and shown in @mention autocomplete)
// for this conversation. Any member can set them. You may only enable default
// personas or personas you created — you can't enable someone else's private one.
export const updateConversationPersonas = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { personas } = req.body;

    if (!Array.isArray(personas)) {
      return res.status(400).json({ message: "personas must be an array of ids" });
    }

    const conversation = await requireMembership(id, userId, res);
    if (!conversation) return;

    // Only accept personas the requester is actually allowed to use.
    const valid = await Persona.find({
      _id: { $in: personas },
      $or: [{ isDefault: true }, { createdBy: userId }],
    }).select("_id");

    conversation.personas = valid.map((p) => p._id);
    await conversation.save();

    const populated = await Conversation.findById(id)
      .populate("members", "-password")
      .populate("lastMessage")
      .populate("personas");

    // Everyone in the chat refreshes their persona list / autocomplete.
    emitToConversation(id, "conversationUpdated", populated);

    res.status(200).json(populated);
  } catch (err) {
    console.error("Error in updateConversationPersonas:", err);
    res.status(500).json({ message: "Server error" });
  }
};
