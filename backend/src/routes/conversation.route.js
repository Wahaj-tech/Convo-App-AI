import express from "express";
import {
  createConversation,
  getMyConversations,
  getConversationById,
  updateConversation,
  addMembers,
  removeMembers,
  leaveConversation,
  getConversationMemory,
  updateActionItemStatus,
  addActionItem,
  regenerateMemory,
  updateConversationPersonas,
} from "../controller/conversation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// All conversation routes are protected by:
// 1. arcjetProtection — rate limiting & bot detection (runs on ALL routes below)
// 2. protectRoute — JWT authentication (only logged-in users can access)

router.use(arcjetProtection);

// POST /api/conversations/       → Create a new direct or group conversation
router.post("/", protectRoute, createConversation);

// GET /api/conversations/        → Get all conversations the logged-in user is part of (sidebar)
router.get("/", protectRoute, getMyConversations);

// GET /api/conversations/:id     → Get a single conversation by ID (when clicking on it)
router.get("/:id", protectRoute, getConversationById);

// PUT /api/conversations/:id     → Update group name or image (admin only)
router.put("/:id", protectRoute, updateConversation);

// POST /api/conversations/:id/members   → Add members to a group (admin only)
router.post("/:id/members", protectRoute, addMembers);

// DELETE /api/conversations/:id/members → Remove members from a group (admin only)
router.delete("/:id/members", protectRoute, removeMembers);

// DELETE /api/conversations/:id         → Leave a group conversation
router.delete("/:id", protectRoute, leaveConversation);

// --- Phase 3: Conversation Memory ---
// GET /api/conversations/:id/memory      → fetch the AI's distilled memory
router.get("/:id/memory", protectRoute, getConversationMemory);

// POST /api/conversations/:id/memory/action-items → add a todo by hand
router.post("/:id/memory/action-items", protectRoute, addActionItem);

// POST /api/conversations/:id/memory/regenerate → rebuild the memory from scratch
router.post("/:id/memory/regenerate", protectRoute, regenerateMemory);

// PATCH /api/conversations/:id/memory/action-items/:itemId → toggle a todo's status
router.patch("/:id/memory/action-items/:itemId", protectRoute, updateActionItemStatus);

// --- Phase 4: AI Personas ---
// PUT /api/conversations/:id/personas → set which personas are enabled in this chat
router.put("/:id/personas", protectRoute, updateConversationPersonas);

export default router;
