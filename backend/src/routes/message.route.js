import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessages,
  sendMessage,
} from "../controller/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// All message routes are protected by:
// 1. arcjetProtection — rate limiting & bot detection (runs on ALL routes below)
// 2. protectRoute — JWT authentication (only logged-in users can access)
router.use(arcjetProtection);

// GET /api/messages/contacts → list all users you could chat with (everyone except yourself)
router.get("/contacts", protectRoute, getAllContacts);

// GET /api/messages/chats → DEPRECATED — old sidebar endpoint that scanned all messages
// to figure out who you've chatted with. Replaced by GET /api/conversations/ which
// is faster and supports group chats. Kept temporarily for backward compatibility.
router.get("/chats", protectRoute, getChatPartners);

// GET /api/messages/:conversationId → load messages for a conversation (with cursor pagination)
//
// IMPORTANT: This route MUST come after /contacts and /chats.
// WHY? Express matches routes top-to-bottom. If this was first, a request to
// GET /api/messages/contacts would match :conversationId with the value "contacts"
// — and try to look up a conversation with ID "contacts" (which would fail).
// By putting the specific word-based routes first, they get matched before this
// catch-all parameter route.
//
// Query params for pagination:
//   ?before=<messageId>  → load messages older than this ID (cursor)
//   ?limit=50            → how many to load (default 50, max 100)
router.get("/:conversationId", protectRoute, getMessages);

// POST /api/messages/send/:conversationId → send a message to a conversation
//
// OLD: POST /api/messages/send/:id (where :id was a USER ID — the receiver)
// NEW: POST /api/messages/send/:conversationId (targets the conversation, not a person)
//
// The body contains { text, image } — what the message is.
// The URL contains which conversation to send it to.
// The JWT (from cookie) tells us who is sending it.
router.post("/send/:conversationId", protectRoute, sendMessage);

export default router;