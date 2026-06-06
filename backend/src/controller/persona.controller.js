import Persona from "../models/Persona.js";
import Conversation from "../models/Conversation.js";

// ============================================================
// PERSONA CONTROLLER (Phase 4)
// ============================================================
// CRUD for AI personas. Everyone sees the DEFAULT personas plus the ones they
// created themselves. Default personas are read-only (can't be edited/deleted).

// GET /api/personas/  → defaults + this user's custom personas
export const getPersonas = async (req, res) => {
  try {
    const userId = req.user._id;
    const personas = await Persona.find({
      $or: [{ isDefault: true }, { createdBy: userId }],
    }).sort({ isDefault: -1, name: 1 }); // defaults first, then alphabetical
    res.status(200).json(personas);
  } catch (err) {
    console.error("Error in getPersonas:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/personas/  → create a custom persona
export const createPersona = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, systemPrompt, color, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Persona name is required" });
    }
    if (!systemPrompt || !systemPrompt.trim()) {
      return res.status(400).json({ message: "System prompt is required" });
    }

    const persona = await Persona.create({
      name: name.trim(),
      description: description?.trim() || "",
      systemPrompt: systemPrompt.trim(),
      color: color || "#8B5CF6",
      avatar: avatar || "",
      isDefault: false,
      createdBy: userId,
    });

    res.status(201).json(persona);
  } catch (err) {
    console.error("Error in createPersona:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/personas/:id  → edit a custom persona (owner only, never defaults)
export const updatePersona = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, description, systemPrompt, color, avatar } = req.body;

    const persona = await Persona.findById(id);
    if (!persona) return res.status(404).json({ message: "Persona not found" });

    if (persona.isDefault) {
      return res.status(403).json({ message: "Default personas cannot be edited" });
    }
    if (persona.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own personas" });
    }

    if (name !== undefined) persona.name = name.trim();
    if (description !== undefined) persona.description = description.trim();
    if (systemPrompt !== undefined) persona.systemPrompt = systemPrompt.trim();
    if (color !== undefined) persona.color = color;
    if (avatar !== undefined) persona.avatar = avatar;

    await persona.save();
    res.status(200).json(persona);
  } catch (err) {
    console.error("Error in updatePersona:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/personas/:id  → delete a custom persona (owner only, never defaults)
export const deletePersona = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const persona = await Persona.findById(id);
    if (!persona) return res.status(404).json({ message: "Persona not found" });

    if (persona.isDefault) {
      return res.status(403).json({ message: "Default personas cannot be deleted" });
    }
    if (persona.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own personas" });
    }

    await Persona.findByIdAndDelete(id);
    // Tidy up: remove this persona from any conversation that had it enabled.
    await Conversation.updateMany({ personas: id }, { $pull: { personas: id } });

    res.status(200).json({ message: "Persona deleted" });
  } catch (err) {
    console.error("Error in deletePersona:", err);
    res.status(500).json({ message: "Server error" });
  }
};
