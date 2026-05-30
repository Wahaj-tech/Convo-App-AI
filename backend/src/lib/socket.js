// ============================================================
// SOCKET.IO SERVER SETUP — The Real-Time Engine
// ============================================================
//
// WHAT IS THIS FILE?
// This is the "live wire" of the app. HTTP requests (like GET, POST) are
// like sending letters — you send a request, wait for a response. Socket.io
// is like a phone call — once connected, both sides can talk to each other
// instantly, anytime, without asking first.
//
// WHY DO WE NEED IT?
// Chat apps need instant delivery. Without sockets, you'd have to keep
// refreshing the page (or poll the server every second) to check for new
// messages. With sockets, the server PUSHES new messages to you the moment
// they arrive — zero delay.
//
// THE BIG CHANGE (Phase 1.6): ROOMS
// ─────────────────────────────────
// OLD WAY: When Alice sent a message to Bob, we looked up Bob's socket ID
//   and sent the message directly to that one socket. This worked for 1-on-1
//   but breaks for groups — you'd have to loop through every member and send
//   individually. Messy, slow, and error-prone.
//
// NEW WAY: We use Socket.io "rooms." Think of a room like a group chat room
//   in real life. Everyone in conversation "conv_abc" joins a virtual room
//   called "conv:conv_abc". When a message is sent, we just say "broadcast
//   this to the conv:conv_abc room" — Socket.io handles delivering it to
//   everyone in that room automatically. Works perfectly for both 1-on-1
//   (room with 2 people) and groups (room with N people).
//
// ANALOGY: Imagine an office building.
//   OLD: To tell Bob something, you walk to his desk (socket ID) and tell him.
//        To tell a group, you walk to each person's desk one by one.
//   NEW: Everyone sits in meeting rooms (Socket.io rooms). To tell the
//        "Project Alpha" group, you just announce it in the "Project Alpha"
//        room — everyone there hears it at once.

import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socektAuthMiddleware } from "../middleware/socket.auth.middleware.js";

// ── Create the Express app and HTTP server ──
// WHY is the Express app created HERE instead of in app.js?
// Because Socket.io needs to "wrap" the same HTTP server that Express uses.
// If we created the server in app.js and the socket server somewhere else,
// they'd be two separate servers on two separate ports. By creating both
// here and exporting them, everything shares one port (e.g., localhost:3000).
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true, // allows cookies (our JWT) to be sent with socket connections
  },
});

// Authenticate every socket connection using the JWT from cookies.
// This runs ONCE when a user first connects. If their JWT is invalid
// or missing, the connection is rejected — they can't listen to any events.
io.use(socektAuthMiddleware);

// ============================================================
// ONLINE USERS TRACKING
// ============================================================
// This map tracks which users are currently connected and their socket IDs.
// Format: { "user123": "socketId_abc", "user456": "socketId_def" }
//
// WHY keep this even with rooms?
// Rooms handle message delivery, but the "green dot" (online indicator)
// still needs to know WHO is connected. The sidebar shows "Ali is online" —
// that comes from this map, not from rooms.
const userSocketMap = {};

// ── Helper: get a user's socket ID (used for checking if someone is online) ──
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// ============================================================
// ROOM-BASED EMISSION — The New Way to Send Messages
// ============================================================
//
// This is the KEY function that replaced the old "loop through members" approach.
//
// HOW IT WORKS:
//   Every conversation has a room named "conv:<conversationId>"
//   When someone sends a message in conversation "abc123", we call:
//     emitToConversation("abc123", "newMessage", messageData)
//   Socket.io delivers it to everyone in room "conv:abc123" automatically.
//
// THE excludeUserId PARAMETER:
//   When Alice sends a message, she already sees it in her UI (optimistic update).
//   If we also sent it back to her via socket, she'd see it TWICE — a duplicate.
//   So we pass excludeUserId: Alice's ID, and her socket is skipped.
//
//   HOW does the exclusion work technically?
//   Socket.io's .except(socketId) says "send to everyone in the room EXCEPT
//   this socket." We look up Alice's socket ID from userSocketMap, and exclude it.
//   If Alice is offline (no socket ID), there's nothing to exclude — no problem.
//
// EXAMPLE FLOW (group chat with Alice, Bob, Charlie):
//   1. Alice sends "Hello everyone!"
//   2. Server calls: emitToConversation("conv123", "newMessage", msg, aliceId)
//   3. Socket.io broadcasts to room "conv:conv123", EXCEPT Alice's socket
//   4. Bob's socket receives it → his UI shows the message
//   5. Charlie's socket receives it → her UI shows the message
//   6. Alice doesn't receive it (excluded) — she already has it from step 1
export function emitToConversation(conversationId, event, data, excludeUserId) {
  const roomName = `conv:${conversationId}`;

  if (excludeUserId) {
    // Find the sender's socket ID so we can skip them
    const senderSocketId = userSocketMap[excludeUserId.toString()];
    if (senderSocketId) {
      // .to(room) = target this room
      // .except(socketId) = but skip this one person
      // .emit(event, data) = send it
      io.to(roomName).except(senderSocketId).emit(event, data);
    } else {
      // Sender is offline (no socket) — just broadcast to the whole room.
      // This can happen if the sender's socket disconnected between sending
      // the HTTP request and this emission running.
      io.to(roomName).emit(event, data);
    }
  } else {
    // No exclusion — everyone in the room gets it.
    // Used for system events like "member added" or "AI typing" where
    // everyone (including the person who triggered it) should see it.
    io.to(roomName).emit(event, data);
  }
}

// ============================================================
// CONNECTION HANDLER — What Happens When a User Connects
// ============================================================
//
// This runs every time a user opens the app (or reconnects after losing internet).
//
// FLOW:
//   1. User opens app → browser creates socket connection → server authenticates (JWT)
//   2. This handler fires → adds user to online tracking (userSocketMap)
//   3. Broadcasts updated online users list to ALL connected clients
//   4. Listens for room management events (join/leave conversation rooms)
//   5. On disconnect → cleans up everything

io.on("connection", (socket) => {
  console.log("A User Connected:", socket.user.fullName);

  const userId = socket.userId; // set by the auth middleware

  // ── Track this user as "online" ──
  userSocketMap[userId] = socket.id;//here userID is key and socket.id is value.eg.{"user123":"socketId_abc"}

  // ── Broadcast the updated online users list to EVERYONE ──
  // Every connected client receives this, so all sidebars update their
  // green dots simultaneously. Object.keys gives us an array of user IDs.
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ============================================================
  // ROOM EVENTS — How Users Join/Leave Conversation Rooms
  // ============================================================
  //
  // Think of these like subscribing/unsubscribing to TV channels.
  // When you "join" a conversation room, you start receiving all
  // messages from that conversation. When you "leave," you stop.

  // ── joinConversations: Join MULTIPLE rooms at once ──
  // WHEN IS THIS USED?
  //   Right after login/signup. The frontend fetches all your conversations,
  //   then sends this event with ALL their IDs. You instantly join every room,
  //   so you'll receive messages from all your chats.
  //
  // EXAMPLE:
  //   User has 3 conversations: ["conv_001", "conv_002", "conv_003"]
  //   Frontend emits: socket.emit("joinConversations", ["conv_001", "conv_002", "conv_003"])
  //   Server joins all 3 rooms: "conv:conv_001", "conv:conv_002", "conv:conv_003"
  //   Now any message in any of those conversations reaches this user instantly.
  socket.on("joinConversations", (conversationIds) => {//we re getting this array of conversationIds from frontend after login/signup so that we can join all the rooms of those conversations and get messages from them
    if (!Array.isArray(conversationIds)) return; // safety check

    for (const convId of conversationIds) {
      socket.join(`conv:${convId}`);
    }
    console.log(
      `${socket.user.fullName} joined ${conversationIds.length} conversation rooms`
    );
  });

  // ── joinConversation: Join ONE room ──
  // WHEN IS THIS USED?
  //   When a NEW conversation is created (you click a contact for the first
  //   time, or someone creates a group and adds you). You need to join this
  //   new room so you receive its messages going forward.
  //
  //   Also used when someone adds you to an existing group — the frontend
  //   detects the new conversation and joins its room.
  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) return;

    socket.join(`conv:${conversationId}`);
    console.log(
      `${socket.user.fullName} joined room conv:${conversationId}`
    );
  });

  // ── leaveConversation: Leave ONE room ──
  // WHEN IS THIS USED?
  //   When a user leaves a group chat (clicks "Leave Group") or gets removed
  //   by the admin. They should stop receiving messages from that conversation.
  //
  // NOTE: This only affects the SOCKET room (real-time delivery). The actual
  //   "am I a member?" check is in the database — the conversation controller
  //   handles removing you from the members array. This just stops the live feed.
  socket.on("leaveConversation", (conversationId) => {
    if (!conversationId) return;

    socket.leave(`conv:${conversationId}`);
    console.log(
      `${socket.user.fullName} left room conv:${conversationId}`
    );
  });

  // ── Handle Disconnect ──
  // WHEN: User closes the tab, loses internet, or logs out.
  // 1. Remove from online tracking → sidebar green dots update
  // 2. Socket.io automatically removes them from ALL rooms — no manual cleanup needed.
  //    (This is a built-in Socket.io behavior — when a socket disconnects,
  //    it's removed from every room it was in.)
  socket.on("disconnect", () => {
    console.log("A User Disconnected:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };