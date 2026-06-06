import mongoose from "mongoose";

// ============================================================
// PERSONA MODEL (Phase 4)
// ============================================================
// A "persona" is a named AI personality you can summon in a chat — e.g.
// @CodeReviewer, @ProjectManager, @DevilsAdvocate. Each one is really just a
// different SYSTEM PROMPT (a set of instructions that tells Gemini how to behave)
// plus a name and a color so the UI can tell them apart.
//
// Two kinds:
//   - DEFAULT personas (isDefault: true, createdBy: null) — shipped with the app,
//     available to everyone. Created by scripts/seedPersonas.js.
//   - CUSTOM personas (isDefault: false, createdBy: <user>) — made by a user for
//     their own use.
const personaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 50, trim: true },
    avatar: { type: String, default: "" }, // optional image URL; UI falls back to a colored initial
    description: { type: String, maxlength: 200, default: "" }, // one-liner shown in the picker
    // The heart of a persona: the instructions handed to Gemini as its system prompt.
    systemPrompt: { type: String, required: true, maxlength: 4000 },
    isDefault: { type: Boolean, default: false }, // true = system-provided, everyone can use it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for defaults; set to the owner for custom ones
    },
    color: { type: String, default: "#8B5CF6" }, // hex, used for the bubble border/label in the UI
  },
  { timestamps: true }
);

// Fast lookups for "give me the defaults + this user's own personas".
personaSchema.index({ isDefault: 1 });
personaSchema.index({ createdBy: 1 });

const Persona = mongoose.model("Persona", personaSchema);
export default Persona;
