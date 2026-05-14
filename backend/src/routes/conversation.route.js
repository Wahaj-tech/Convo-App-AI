import express from "express";
import {
  createConversation,
  getMyConversations,
  getConversationById,
  updateConversation,
  addMembers,
  removeMembers,
  leaveConversation,
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

export default router;
