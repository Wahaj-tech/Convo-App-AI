# Phase 4 — AI Personas (Study Guide)

A plain-English walkthrough of how I turned the single Convo AI into a **board of
advisors** — multiple AI personalities (Code Reviewer, Project Manager, Devil's
Advocate, + your own custom ones) that you summon by name with `@mentions`.
Read top-to-bottom and you'll understand the whole feature, the code logic, and
the flow.

---

## 1. The idea (what we're building and why)

Before Phase 4 there was exactly one AI. You typed `@ai` and got one generic
assistant. Phase 4 lets a conversation have **several AI personalities**, each
with its own expertise, and you pick who answers:

- `@CodeReviewer is this function safe?` → a senior-engineer AI reviews the code.
- `@ProjectManager what's our status?` → a PM AI summarizes decisions & deadlines.
- `@DevilsAdvocate poke holes in this plan` → a skeptic AI argues the counter-case.
- You can even `@mention two at once` and **both reply**, like a panel.

### The key realization

A "persona" sounds fancy, but technically it's almost nothing new. The AI's
behavior is controlled by its **system prompt** (the hidden instructions we send
to Gemini saying "you are X, behave like Y"). So a persona is just:

> **a saved name + color + a different system prompt.**

Everything else — calling Gemini, saving the reply, broadcasting it — is the same
machinery Phase 2 and 3 already built. Phase 4 is mostly about **picking which
system prompt to use** based on who you mentioned.

### Analogy

Think of one actor who can play many roles. The *actor* (Gemini) is the same.
The *script* you hand them (the system prompt) decides whether they play the
strict code reviewer or the skeptical devil's advocate. A persona is a script.

---

## 2. The files (what I added / changed)

**Backend (all the logic — fully server-side):**

| File | What it does |
|------|--------------|
| `models/Persona.js` | **NEW.** The shape of a persona (name, color, description, systemPrompt, isDefault, createdBy). |
| `models/Conversation.js` | **CHANGED.** Added `personas: [ref Persona]` — which personas are enabled in a chat. |
| `models/Message.js` | **CHANGED.** Added `personaId` (which persona "spoke") + raised text limit to 8000. |
| `services/persona.service.js` | **NEW.** The "who should answer?" brain: detect mentions, strip them, resolve a chat's personas. |
| `services/ai.service.js` | **CHANGED.** Now persona-aware: `handleAiMentions` fans out to each summoned persona. |
| `services/memory.service.js` | **CHANGED.** `buildAiContext` accepts a persona's system prompt + labels AI history by persona name. |
| `lib/gemini.js` | **CHANGED.** Bounded reply length (`maxOutputTokens`) so replies stay snappy and fit the message limit. |
| `controller/persona.controller.js` | **NEW.** CRUD endpoints for personas. |
| `controller/conversation.controller.js` | **CHANGED.** `updateConversationPersonas` + populate personas on reads. |
| `routes/persona.route.js` | **NEW.** Wires `/api/personas`. |
| `routes/conversation.route.js` + `app.js` | **CHANGED.** Mount the persona routes + the conversation-personas route. |
| `scripts/seedPersonas.js` | **NEW.** Creates the 4 built-in personas. |

**Frontend (thin UI):**

| File | What it does |
|------|--------------|
| `store/usePersonaStore.js` | **NEW.** Fetch/create/update/delete personas. |
| `store/useChatStore.js` | **CHANGED.** `setConversationPersonas` + the typing indicator now carries the persona. |
| `components/PersonaSelector.jsx` | **NEW.** Toggle personas on/off for a chat; create/edit/delete custom ones. |
| `components/CreatePersonaModal.jsx` | **NEW.** Form to build a custom persona. |
| `components/ChatContainer.jsx` | **CHANGED.** AI bubbles are tinted with the persona's color + show its name. |
| `components/AiTypingIndicator.jsx` | **CHANGED.** Shows which persona is "thinking", in its color. |
| `components/MessageInput.jsx` | **CHANGED.** `@mention` autocomplete dropdown. |
| `components/ChatHeader.jsx` | **CHANGED.** 🤖 button opens the persona selector. |

---

## 3. The Persona model (`Persona.js`)

```js
{
  name: "Code Reviewer",          // shown in UI; also becomes the @handle
  avatar: "",                     // optional image; UI falls back to a colored dot
  description: "Reviews code…",   // one-liner in the picker
  systemPrompt: "You are Code Reviewer…",   // THE thing that makes it behave a certain way
  isDefault: true,                // true = built-in, everyone can use, read-only
  createdBy: null,                // null for defaults; a user id for custom ones
  color: "#06B6D4",               // used for the bubble/label tint
}
```

Two kinds:
- **Default** personas (`isDefault: true`, `createdBy: null`) — shipped with the
  app via `seedPersonas.js`. Nobody can edit/delete them.
- **Custom** personas (`createdBy: <you>`) — you make them; only you see and edit
  them.

---

## 4. The @handle trick (how a name becomes a mention)

You can't type `@Code Reviewer` (spaces break the mention). So we turn a name
into a **handle**: lowercase it and drop everything that isn't a letter/number.

```
"Code Reviewer"    → @codereviewer
"Project Manager"  → @projectmanager
"Devil's Advocate" → @devilsadvocate
"Convo AI"         → @convoai   (and plain @ai also maps to it)
```

This one function lives on both sides (server `personaHandle`, client `handleOf`)
so the autocomplete shows exactly what the backend will match.

---

## 5. The "who answers?" brain (`persona.service.js`)

This service has no idea how to talk to Gemini — its only job is to figure out
**which personas a message summoned** and **what the clean question is**.

### 5.1 `resolveConversationPersonas(conversation)`

Answers "which personas are usable in this chat?" Returns two things:

- `enabled` — the personas you can @mention here. If the conversation curated a
  list (`conversation.personas`), that's it; otherwise we fall back to **all the
  defaults** so the board of advisors works out of the box without setup.
- `defaultPersona` — what plain `@ai` (and the ✨ button) maps to: the general
  "Convo AI". If nobody ever ran the seed script, it falls back to a built-in
  generic persona so `@ai` still works (Phase 2 never breaks).

### 5.2 `detectMentionedPersonas(text, enabled, {isAiPrompt, defaultPersona})`

Scans the message for each enabled persona's `@handle` (using a careful regex so
`@codereviewer` matches but an email like `a@code` doesn't). Then:

- if the text says `@ai`, add the default persona;
- if the ✨ "Ask AI" button was used and no specific persona was named, add the
  default persona;
- de-duplicates, and returns the list of personas that should reply.

Example: `"@CodeReviewer @DevilsAdvocate thoughts?"` → `[Code Reviewer, Devil's Advocate]`.

### 5.3 `stripMentions(text, enabled)`

Removes the `@handles` so Gemini gets a clean question:
`"@CodeReviewer is this safe? @ai"` → `"is this safe?"`. We compute this **once**
and reuse it for every persona that replies.

> All of this is server-side. The browser just sends the raw text; the server
> decides everything.

---

## 6. The persona-aware pipeline (`ai.service.js`)

### 6.1 `handleAiMentions(conversation, userMessage, isAiPrompt)` — the entry point

This is what the message controller calls. It:

1. resolves the chat's personas,
2. detects which ones were summoned,
3. strips the mentions to get the clean prompt,
4. **loops over each summoned persona and has it reply, one after another**.

```js
const { enabled, defaultPersona } = await resolveConversationPersonas(conversation);
const mentioned = detectMentionedPersonas(text, enabled, { isAiPrompt, defaultPersona });
if (mentioned.length === 0) return;          // nobody called → do nothing
const prompt = stripMentions(text, enabled) || text;
for (const persona of mentioned) {
  await processAiResponse(conversation._id, userMessage, persona, prompt);
}
```

**Why sequential (`await` in a loop) and not all at once?** Two reasons:
(1) each persona's reply is saved before the next runs, so persona #2 can *see*
persona #1's answer and build on it — a real panel discussion; (2) it's gentler
on the Gemini rate limit.

### 6.2 `processAiResponse(conversationId, userMessage, persona, prompt)` — one reply

Generates a single persona's answer. The Phase 3 flow, now persona-flavored:

1. Emit `aiTyping: true` **with the persona's name/color** so the UI shows
   "Code Reviewer is thinking…" in cyan.
2. `buildAiContext(conversationId, userMessage._id, persona.systemPrompt)` — this
   is the key line: the **persona's system prompt becomes the AI's instructions**,
   with the conversation memory glued on (Phase 3) and the last 30 messages as
   history.
3. Call Gemini with that persona-specific model.
4. **Truncate** the reply to 8000 chars (safety net — see §8) and save it as a
   message tagged with `personaId: persona._id`.
5. Populate the persona and broadcast `newMessage` so the UI can color the bubble.
6. Fire-and-forget `maybeSummarize` (Phase 3 memory upkeep).
7. `finally`: emit `aiTyping: false`.

### 6.3 How memory plays along (`memory.service.js`)

`buildAiContext` got one new parameter: a persona system prompt. If given, it
**replaces** the generic base persona; the memory block is still appended. It also
now labels past AI messages by **which persona** said them (`[Code Reviewer]: …`),
so when multiple personas talk, Gemini can tell their turns apart.

---

## 7. The controller gate (efficiency)

In `message.controller.js`, after a message is saved, we only spin up the AI
machinery when it's actually needed:

```js
if (isAiPrompt || (text && text.includes("@"))) {
  aiService.handleAiMentions(conversation, newMessage, isAiPrompt);  // fire-and-forget
}
```

The `text.includes("@")` check means a normal message (no `@`) **never** triggers
a persona database lookup — we only pay that cost when there's a mention or the ✨
button. And it's fire-and-forget, so the sender's HTTP request returns instantly.

---

## 8. A real bug I hit (and how I fixed it)

End-to-end testing caught this: the **Devil's Advocate wrote a 2434-character
reply**, but `Message.text` had `maxlength: 2000` (a limit meant for *human*
messages). Saving threw, so that persona's reply silently vanished — only one of
the two replies survived.

Fix — **defense in depth**, all server-side:
1. **Raised the schema limit** to 8000 (AI replies are legitimately longer than a
   human chat line).
2. **Bounded Gemini's output** with `maxOutputTokens: 1024` so replies stay
   reasonable and cheap.
3. **Truncate as a guarantee** in `ai.service` (`slice(0, 7999) + "…"`) so a long
   reply can *never* fail to save, no matter what.

This is a good lesson: the AI is a non-deterministic input, so the save path must
be defensive about it.

---

## 9. The CRUD + curation endpoints

**Personas (`/api/personas`):**
- `GET /` → defaults + your own personas.
- `POST /` → create a custom persona (name + system prompt required).
- `PUT /:id` → edit (owner only; defaults are read-only).
- `DELETE /:id` → delete (owner only); also `$pull`s it out of any conversation
  that had it enabled, so nothing dangles.

**Curation (`/api/conversations/:id/personas`):**
- `PUT` → set which personas are enabled in this chat. Any member can do it. The
  server only accepts personas you're allowed to use (defaults or your own), then
  broadcasts `conversationUpdated` so everyone's autocomplete refreshes.

---

## 10. The frontend (thin viewer)

- **`usePersonaStore`** — loads personas, CRUD.
- **`PersonaSelector`** (🤖 button in the header) — a side panel with an on/off
  toggle per persona, each showing its `@handle`, color dot, and description.
  Custom ones have edit/delete. A "Create custom persona" button opens…
- **`CreatePersonaModal`** — name, description, color swatches, and the system
  prompt. It live-previews the `@handle` you'll use.
- **`MessageInput`** — when you type `@`, a dropdown shows matching personas;
  clicking one inserts its handle. (Sending a message containing `@` triggers the
  AI through the normal send path — no special button needed.)
- **`ChatContainer` / `AiTypingIndicator`** — AI bubbles and the typing dots are
  tinted with the persona's color and labeled with its name, so a panel of three
  advisors is visually distinct at a glance.

---

## 11. The full flow (follow the arrows)

### Flow A — You summon one or more personas

```
You type "@CodeReviewer @DevilsAdvocate is this safe?"  and hit Send
   │
   ▼
sendMessage controller saves your message, broadcasts it, returns 200
   │  text contains "@"  →  fires handleAiMentions (does NOT block your send)
   ▼
persona.service:
   • resolveConversationPersonas → enabled personas for this chat
   • detectMentionedPersonas     → [Code Reviewer, Devil's Advocate]
   • stripMentions               → clean prompt "is this safe?"
   │
   ▼
for each persona (sequentially):
   emit aiTyping(persona)  → UI: "Code Reviewer is thinking…" (in cyan)
   buildAiContext(persona.systemPrompt + memory + recent msgs)
   Gemini → reply  →  truncate  →  save Message{ personaId, senderType:"ai" }
   broadcast newMessage  → UI renders a cyan "Code Reviewer" bubble
   emit aiTyping:false
   (then the SAME loop runs for Devil's Advocate — who can see CR's reply)
```

### Flow B — Plain @ai or the ✨ button

```
"@ai summarize this"  (or ✨ button with no @mention)
   │
   ▼
detectMentionedPersonas → defaultPersona ("Convo AI")
   ▼
one reply, exactly like Phase 2/3 — backward compatible
```

### Flow C — Curate a chat's personas

```
Open 🤖 panel → toggle "Project Manager" on
   ▼
PUT /conversations/:id/personas { personas:[...] }
   ▼
server validates you may use them → saves → broadcast conversationUpdated
   ▼
everyone's @mention autocomplete now lists Project Manager
```

---

## 12. Why this is efficient & server-side

- **A persona is just a system prompt** — we reuse the entire Phase 2/3 pipeline;
  no second AI integration.
- **The controller gate** (`includes("@")`) avoids any persona DB lookup on
  ordinary messages.
- **One clean prompt computed once**, reused for every persona that replies.
- **Sequential replies** share context (each sees the previous) and are kind to
  the rate limit.
- **Bounded + truncated output** keeps replies cheap and guarantees saves succeed.
- **All decisions are server-side**: the browser sends raw text; the server alone
  decides who answers, with what instructions, and stores the result. The frontend
  only displays colors and names.

---

## 13. How to run & try it

```bash
# one-time seeds
cd backend && node src/scripts/seedAiUser.js     # the AI sentinel user (Phase 2)
cd backend && node src/scripts/seedPersonas.js   # the 4 default personas (Phase 4)

# run it
cd backend  && npm run dev
cd frontend && npm run dev
```

In the app:
1. Open a chat, share a code snippet, then send `@CodeReviewer is this correct?`
   → a cyan "Code Reviewer" bubble reviews it.
2. Try `@CodeReviewer @DevilsAdvocate thoughts?` → **two** distinctly-colored
   replies, a mini panel.
3. Click the **🤖** header button → toggle personas on/off, or **Create custom
   persona** (e.g. "UX Critic") and then `@uxcritic ...`.
4. Type `@` in the message box → the autocomplete dropdown lists the personas.

### Fast backend test (no browser)
```bash
cd backend && node src/scripts/testPersona.js     # creates data, mentions 2 personas, verifies tags, cleans up
```

> Heads-up: the AI calls use Gemini's **free tier (20 requests/day)**. Each persona
> reply is one request, so a two-persona panel is two requests. If you see a `429`
> "quota exceeded" or a `503` "high demand", that's Google's limit/overload — wait
> and retry. The code degrades gracefully (it emits an `aiError` and never crashes).
