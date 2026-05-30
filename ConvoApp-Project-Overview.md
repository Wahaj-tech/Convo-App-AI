# ConvoApp: AI-Native Collaboration Platform

## What Is ConvoApp?

ConvoApp is a **real-time collaboration platform where AI is a first-class conversation participant** — not a sidebar chatbot bolted onto a messaging app. Think of it as what happens when you merge the intimacy of a group chat with the intelligence of an AI that actually _remembers_ your conversations, understands context, and can wear different hats depending on what you need.

The core idea: **conversation itself becomes intelligent.** When your team discusses a feature, the AI is _in_ the chat — listening, contributing when mentioned, remembering decisions, tracking action items, and responding in character as different personas (a code reviewer, a project manager, a devil's advocate). It's a board of advisors that lives inside your chat.

---

## The Vision

Most AI integrations treat AI as a tool you go _to_ — you leave your conversation, open a chatbot window, paste context, get a response, then go back. ConvoApp flips this:

- **AI lives inside conversations** — mention `@AI` or `@Code Reviewer` and it responds inline, in the same thread, visible to everyone.
- **AI has memory** — it doesn't start fresh every time. It remembers what your team decided last week, what action items are pending, what topics you've covered.
- **AI has personalities** — you can summon different AI personas with different expertise and communication styles into the same conversation.
- **Everything is real-time** — AI typing indicators, instant message delivery, live online status — the same real-time experience you expect from modern chat apps.

---

## Current State (Baseline)

ConvoApp already works as a polished 1-on-1 real-time chat application. Here's what exists today:

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Express 5 (ES modules), Node.js |
| **Database** | MongoDB with Mongoose 9 |
| **Real-time** | Socket.io 4 |
| **Frontend** | React 19 + Vite 7 |
| **State Management** | Zustand 5 |
| **Styling** | Tailwind CSS 4 + DaisyUI 5 |
| **Auth** | JWT (httpOnly cookies, 7-day expiry) |
| **Image Uploads** | Cloudinary (base64 from client) |
| **Email** | Resend (welcome emails) |
| **Security** | Arcjet (rate limiting + bot detection) |
| **Deployment** | Render.com |

### What Works Today

- **User authentication** — Signup, login, logout with JWT-based auth, httpOnly cookies, profile picture upload
- **1-on-1 real-time messaging** — Send text and images, messages delivered instantly via Socket.io
- **Online status** — See who's online in real-time
- **Contact discovery** — Browse all users, see recent chat partners
- **Responsive UI** — Dark-themed interface with DaisyUI components, keyboard sound effects, loading skeletons
- **Production deployment** — Backend serves the built frontend in production mode, deployed on Render

### Architecture Overview

```
frontend/                         backend/
├── src/                          ├── src/
│   ├── App.jsx                   │   ├── app.js (entry point)
│   ├── pages/                    │   ├── models/
│   │   ├── ChatPage.jsx          │   │   ├── User.js
│   │   ├── LoginPage.jsx         │   │   └── Message.js
│   │   └── SignUpPage.jsx        │   ├── controller/
│   ├── components/               │   │   ├── auth.controller.js
│   │   ├── ChatContainer.jsx     │   │   └── message.controller.js
│   │   ├── ChatHeader.jsx        │   ├── routes/
│   │   ├── ChatsList.jsx         │   │   ├── auth.route.js
│   │   ├── ContactList.jsx       │   │   └── message.route.js
│   │   ├── MessageInput.jsx      │   ├── middleware/
│   │   └── ...                   │   │   ├── auth.middleware.js
│   ├── store/                    │   │   ├── arcjet.middleware.js
│   │   ├── useAuthStore.js       │   │   └── socket.auth.middleware.js
│   │   └── useChatStore.js       │   ├── lib/
│   └── lib/                      │   │   ├── socket.js (creates Express app + HTTP server)
│       └── axios.js              │   │   ├── db.js
│                                 │   │   ├── cloudinary.js
│                                 │   │   ├── env.js
│                                 │   │   ├── utils.js (JWT generation)
│                                 │   │   ├── arcjet.js
│                                 │   │   └── resend.js
│                                 │   └── emails/
│                                 │       ├── emailHandler.js
│                                 │       └── emailTemplate.js
```

### Current Limitations

- **Strictly 1-on-1**: Every message has a `senderId` and `receiverId` — no concept of group conversations
- **No conversation container**: Messages are flat documents linked to two users, not grouped into conversations
- **No AI integration**: Purely human-to-human chat
- **No message pagination**: All messages loaded at once
- **User timestamps bug**: `{timeStamps: true}` (capital S) is silently ignored by Mongoose — `createdAt`/`updatedAt` are NOT tracked on users

---

## Transformation Roadmap

The transformation happens in **4 phases**, each building on the previous:

```
Phase 1: Conversations + Groups     ─── Foundation
    │
    v
Phase 2: @AI Integration            ─── Core Innovation
    │
    ├──────────────┐
    v              v
Phase 3: Memory    Phase 4: Personas ─── Can be built in parallel
```

---

### Phase 1: Conversation Model + Group Chats

**The Problem:** The current `senderId`/`receiverId` model on messages can't support groups or AI participants. We need a `Conversation` container.

**What Changes:**

- **New `Conversation` model** — Wraps messages into conversations with `type` (direct/group), `members`, `name`, `groupImage`, `admin`, `lastMessage`
- **Message model updated** — Gains `conversationId` (required) and `senderType` ("user"/"ai" — prep for Phase 2)
- **New conversation API** — Full CRUD: create, list, get, update, add/remove members, leave
- **Socket.io rooms** — Instead of emitting to individual user sockets, messages are emitted to conversation rooms (`conv:{id}`). This is what makes group messaging work efficiently.
- **Frontend state overhaul** — `selectedUser` becomes `selectedConversation`, chat list renders conversations instead of users
- **New UI components** — `CreateGroupModal` (multi-select contact picker, group name/image) and `GroupSettingsPanel` (manage members, edit group info)
- **Data migration script** — Converts all existing 1-on-1 message pairs into `Conversation` documents, backfills `conversationId` on all messages
- **Bug fix** — Corrects the `timeStamps` typo in User model

**Why This Matters:** This is pure infrastructure — no visible AI yet — but it's the foundation everything else depends on. Without conversations as a first-class concept, neither groups nor AI participation work.

---

### Phase 2: @AI Integration with Claude API

**The Problem:** We want AI to respond _inside_ conversations, not in a separate interface.

**How It Works:**

1. User sends a message containing `@AI` (e.g., _"@AI what should we name this feature?"_)
2. Message is saved and delivered to all conversation members instantly (HTTP 200 returns immediately)
3. Backend detects the `@AI` mention and fires an async process:
   - Emits `aiTyping` event to the conversation room (frontend shows typing indicator)
   - Fetches the last 50 messages for context
   - Calls Claude API (claude-sonnet-4-20250514) with the conversation context
   - Saves the AI response as a new message (`senderType: "ai"`)
   - Emits the AI message via socket to the conversation room
4. All members see the AI response appear in real-time, styled distinctly (violet/purple gradient bubble)

**Key Design Decisions:**
- **Fire-and-forget**: The user's message is confirmed instantly. AI processing happens asynchronously — no one waits for the AI.
- **Sentinel AI user**: A dedicated User document with a fixed ObjectId represents the AI in the database. AI messages have a real `senderId` pointing to this user.
- **Rate limiting**: 20 AI calls per user per hour (in-memory counter) to prevent abuse.
- **Error handling**: If Claude API fails, an `aiError` event is emitted to the conversation — no silent failures.

**New Files:**
- `backend/src/lib/anthropic.js` — Anthropic SDK client initialization
- `backend/src/services/ai.service.js` — Mention detection, prompt extraction, context building, Claude API calls
- `backend/src/middleware/aiRateLimit.middleware.js` — Per-user rate limiting
- `frontend/src/components/AiTypingIndicator.jsx` — Pulsing dots animation

---

### Phase 3: Conversation Memory

**The Problem:** Without memory, AI starts fresh every conversation. It can't answer "what did we decide about X last week?" because it only sees the last 50 messages.

**How It Works:**

A `ConversationMemory` document is maintained per conversation, containing:

- **Rolling summary** — AI-generated summary of the entire conversation history
- **Key decisions** — Structured list of decisions with who made them, when, and context
- **Action items** — Tasks extracted from conversation, with assignee and status (pending/in_progress/done)
- **Topics** — Tags representing what the conversation has covered

**Summarization Pipeline:**
- A background job runs every 30 minutes, processing conversations that have new unsummarized messages
- Claude reads the new messages + existing summary, and produces an updated structured summary
- When AI responds to an `@AI` mention, the system prompt now includes the conversation summary, key decisions, and pending action items — giving the AI deep context

**Frontend:**
- A "Memory" button in the chat header opens `ConversationMemoryPanel`
- Users can see the AI-generated summary, browse decisions, and toggle action items as done
- Users can see and correct what the AI "remembers" — transparency and control

---

### Phase 4: AI Personas

**The Problem:** A single AI personality is limiting. Different tasks benefit from different expertise and communication styles.

**The Solution:** Multiple AI personas that can be summoned into any conversation:

| Persona | Color | Role |
|---------|-------|------|
| **Claude** | Violet | General assistant — helpful, balanced |
| **Code Reviewer** | Cyan | Reviews shared code snippets, suggests improvements |
| **Project Manager** | Amber | Tracks decisions, tasks, timelines |
| **Devil's Advocate** | Red | Challenges assumptions, finds weaknesses |

**How It Works:**
- Each persona has a unique `systemPrompt` that shapes its behavior and expertise
- Users mention personas by name: `@Code Reviewer check this function` or `@Devil's Advocate is this a good idea?`
- AI messages are saved with a `personaId` and rendered with the persona's color (border + tinted bubble + name label)
- Conversations have a `personas` array — admins can toggle which personas are available
- Users can create custom personas with their own name, description, system prompt, and color

**Frontend:**
- `PersonaSelector` — Toggle personas on/off for a conversation
- `CreatePersonaModal` — Create custom personas
- `@mention autocomplete` — Type `@` in the message input and see available personas
- Each AI persona's messages are visually distinct with their assigned color

---

## API Routes (Complete)

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Create account |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| PUT | `/update-profile` | Update profile picture |
| GET | `/check` | Check auth status |

### Messages (`/api/messages`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/contacts` | Get all users |
| GET | `/:conversationId` | Get messages (with cursor pagination) |
| POST | `/send/:conversationId` | Send message (triggers AI if @mentioned) |

### Conversations (`/api/conversations`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create conversation (direct or group) |
| GET | `/` | Get my conversations |
| GET | `/:id` | Get conversation by ID |
| PUT | `/:id` | Update conversation (name, image) |
| POST | `/:id/members` | Add members (admin only) |
| DELETE | `/:id/members` | Remove members |
| DELETE | `/:id` | Leave conversation |
| GET | `/:id/memory` | Get conversation memory (Phase 3) |

### Personas (`/api/personas`) — Phase 4
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all personas (defaults + custom) |
| POST | `/` | Create custom persona |
| PUT | `/:id` | Update persona |
| DELETE | `/:id` | Delete persona |
| PUT | `/conversations/:id/personas` | Set conversation personas |

---

## Socket.io Events

### Client -> Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinConversations` | `[conversationId]` | Join rooms for all user's conversations |
| `joinConversation` | `conversationId` | Join a single conversation room |
| `leaveConversation` | `conversationId` | Leave a conversation room |

### Server -> Client
| Event | Payload | Description |
|-------|---------|-------------|
| `getOnlineUsers` | `[userId]` | Online users list update |
| `newMessage` | `Message` | New message in a conversation |
| `aiTyping` | `{ conversationId, isTyping }` | AI is generating a response |
| `aiError` | `{ conversationId, error }` | AI processing failed |

---

## Data Models

### User
```
fullName, email, password (hashed), profilePic, timestamps
```

### Conversation
```
type (direct/group), name, groupImage, members[], admin,
lastMessage, lastMessageAt, personas[], timestamps
```

### Message
```
conversationId, senderId, senderType (user/ai), personaId,
text, image, timestamps
```

### ConversationMemory
```
conversationId, summary, keyDecisions[], actionItems[],
topics[], lastSummarizedAt, lastSummarizedMessageId,
totalMessagesProcessed
```

### Persona
```
name, avatar, description, systemPrompt, isDefault,
createdBy, color
```

---

## What Makes ConvoApp Different

1. **AI is IN the chat, not next to it** — No context switching. AI participates in the same thread as humans.

2. **Conversation memory is persistent** — AI doesn't start fresh. It knows what your team decided, what's pending, what topics have been covered.

3. **Multiple AI perspectives** — Not just one generic AI. Summon a code reviewer, a PM, a devil's advocate — each with distinct personality and expertise.

4. **Real-time AI experience** — Typing indicators, instant message delivery, async processing. AI feels like a fast-typing team member, not a loading spinner.

5. **Users control AI memory** — The memory panel lets users see, verify, and correct what the AI remembers. Transparency over black-box behavior.

6. **Group + AI = collaborative intelligence** — Groups aren't just multi-user chat. When combined with AI personas and memory, they become decision-making environments where AI contributes as a participant.

---

## Environment & Development

### Prerequisites
- Node.js 18+
- MongoDB instance
- Anthropic API key (for Phase 2+)

### Environment Variables (backend/.env)
```
PORT=3000
MONGO_URI=<mongodb connection string>
JWT_SECRET=<secret>
NODE_ENV=development
CLIENT_URL=http://localhost:5173
RESEND_API_KEY=<key>
EMAIL_FROM=<email>
EMAIL_FROM_NAME=<name>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
ARCJET_KEY=<key>
ARCJET_ENV=development
ANTHROPIC_API_KEY=<key>          # Phase 2+
```

### Running Locally
```bash
# Backend (hot-reload)
cd backend && npm install && npm run dev

# Frontend (Vite dev server on :5173)
cd frontend && npm install && npm run dev
```

### Production Build
```bash
npm run build    # installs both + builds frontend
npm run start    # backend serves frontend/dist
```

---

## Estimated Timeline

| Phase | Scope | Duration | Dependencies |
|-------|-------|----------|-------------|
| Phase 1 | Conversations + Groups | 3-5 days | None |
| Phase 2 | @AI Integration | 2-3 days | Phase 1 + API key |
| Phase 3 | Conversation Memory | 2-3 days | Phase 2 |
| Phase 4 | AI Personas | 2-3 days | Phase 2 |
| **Total** | | **~10-14 days** | Phases 3 & 4 can run in parallel |
