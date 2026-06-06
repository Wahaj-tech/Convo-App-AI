import express from "express";
import {
  getPersonas,
  createPersona,
  updatePersona,
  deletePersona,
} from "../controller/persona.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// Same protection stack as the rest of the API: rate-limit/bot check, then auth.
router.use(arcjetProtection);

router.get("/", protectRoute, getPersonas);
router.post("/", protectRoute, createPersona);
router.put("/:id", protectRoute, updatePersona);
router.delete("/:id", protectRoute, deletePersona);

export default router;
