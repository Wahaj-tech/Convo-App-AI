import Persona from "../models/Persona.js";
import { BASE_SYSTEM_PROMPT } from "../lib/groq.js";

// ============================================================
// PERSONA SERVICE (Phase 4) — the "who should answer?" brain
// ============================================================
// Turns a chat message like "@CodeReviewer @PM is this safe?" into the list of
// AI personalities that should reply, and figures out the clean prompt to send
// each of them. All of this is server-side so the frontend stays dumb.

// The name of the built-in general assistant — what plain "@ai" maps to.
export const DEFAULT_PERSONA_NAME = "Convo AI";

// A safety fallback used ONLY if nobody has run seedPersonas.js yet. It lets
// "@ai" keep working (Phase 2 behavior) even before any persona exists in the DB.
const GENERIC_PERSONA = {
  _id: null,
  name: DEFAULT_PERSONA_NAME,
  color: "#8B5CF6",
  avatar: "",
  systemPrompt: BASE_SYSTEM_PROMPT,
  isDefault: true,
};

// Turn a display name into a @mention handle: "Code Reviewer" → "codereviewer".
// We strip everything that isn't a letter/number so the handle is one safe word.
export const personaHandle = (name) =>
  (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Build a regex that finds "@handle" as a standalone mention (not part of a
// bigger word/email). `(^|\s)` = start or a space before; `(\b|[^\w])` = a word
// boundary or non-word char after.
const mentionRegex = (handle) =>
  new RegExp(`(^|\\s)@${handle}(\\b|[^\\w])`, "i");

const AI_MENTION = /(^|\s)@ai(\b|[^\w])/i;

// ------------------------------------------------------------
// resolveConversationPersonas: which personas are usable in this chat?
// ------------------------------------------------------------
// Returns:
//   enabled        → the personas you can @mention here (curated list, or the
//                    defaults if the conversation hasn't curated any)
//   defaultPersona → what plain "@ai" / the ✨ button maps to (the general one)
export const resolveConversationPersonas = async (conversation) => {
  const defaults = await Persona.find({ isDefault: true });

  let enabled;
  if (conversation.personas && conversation.personas.length) {
    enabled = await Persona.find({ _id: { $in: conversation.personas } });
  } else {
    enabled = defaults; // not curated → everyone gets the default board of advisors
  }

  const defaultPersona =
    defaults.find((p) => p.name === DEFAULT_PERSONA_NAME) ||
    enabled[0] ||
    defaults[0] ||
    GENERIC_PERSONA; // nothing seeded → fall back so @ai still works

  return { enabled, defaultPersona };
};

// ------------------------------------------------------------
// detectMentionedPersonas: which personas did this message summon?
// ------------------------------------------------------------
// Scans the text for each enabled persona's @handle. Also handles plain "@ai"
// and the ✨ "Ask AI" button (isAiPrompt), both of which map to the default.
export const detectMentionedPersonas = (
  text,
  enabled,
  { isAiPrompt = false, defaultPersona } = {}
) => {
  const found = [];
  const body = text || "";

  for (const p of enabled) {
    if (mentionRegex(personaHandle(p.name)).test(body)) found.push(p);
  }

  const aiMentioned = AI_MENTION.test(body);
  // Add the general assistant if the user typed "@ai", OR pressed the ✨ button
  // without naming a specific persona.
  if ((aiMentioned || (isAiPrompt && found.length === 0)) && defaultPersona) {
    const already = found.some(
      (p) => String(p._id) === String(defaultPersona._id)
    );
    if (!already) found.push(defaultPersona);
  }

  return found;
};

// ------------------------------------------------------------
// stripMentions: remove the @handles so we send the AI a clean question.
// "@CodeReviewer is this safe?" → "is this safe?"
// ------------------------------------------------------------
export const stripMentions = (text, enabled) => {
  if (!text) return "";
  let out = ` ${text} `;
  out = out.replace(/(^|\s)@ai(\b|[^\w])/gi, " ");
  for (const p of enabled) {
    const h = personaHandle(p.name);
    if (!h) continue;
    out = out.replace(new RegExp(`(^|\\s)@${h}(\\b|[^\\w])`, "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
};

// Small helper: the persona info we attach to socket events so the UI can render
// the right name/color/avatar without another request.
export const personaMeta = (persona) =>
  persona
    ? {
        _id: persona._id || null,
        name: persona.name,
        color: persona.color,
        avatar: persona.avatar,
      }
    : null;
