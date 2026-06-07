# ConvoApp

Collaborative AI for real-time conversations. ConvoApp is a chat platform where the
AI is a participant in the conversation rather than a separate tool you switch to.
You mention it inline (`@ai`, or a named persona like `@CodeReviewer`), it answers
with the context of the discussion, it remembers what the team decided, and a panel
of AI advisors can debate a question and hand back a single recommendation.

It supports one-on-one and group chats, real-time messaging, image sharing, long-term
conversation memory, multiple AI personas, and a multi-agent "AI Roundtable".

## Features

- Real-time messaging over WebSockets, for both direct and group conversations.
- Live presence (online/offline) and AI typing indicators.
- Authentication with JSON Web Tokens stored in httpOnly cookies.
- Inline AI replies powered by Groq (Llama 3.3 70B), triggered by mentions.
- Conversation memory: a rolling summary, key decisions, action items, and topics,
  maintained incrementally so the cost stays the same no matter how long a chat grows.
- AI personas: built-in roles (Code Reviewer, Project Manager, Devil's Advocate,
  Growth Advisor, and a general assistant), plus custom personas you create yourself.
- AI Roundtable: the enabled personas deliberate over a question in two rounds and a
  moderator synthesises the discussion into a structured decision card.
- Image sharing through Cloudinary and a responsive web interface.

## Tech stack

Frontend: React 19, Vite, Zustand, Tailwind CSS v4, daisyUI, Socket.io client.

Backend: Node.js, Express (ES modules), MongoDB with Mongoose, Socket.io.

Supporting services: Groq (AI inference), Cloudinary (image storage),
Resend (transactional email), Arcjet (rate limiting and bot protection),
MongoDB Atlas (database).

## Repository layout

This is a monorepo with two independent npm packages and a small root package that
orchestrates the build and start commands.

```
backend/    Express API, Socket.io server, MongoDB models, AI services
frontend/   React single-page application (built with Vite)
package.json  Root scripts for building and starting the whole app
```

In production the backend serves the built frontend, so the entire application runs
as a single Node process on one port.

## Prerequisites

- Node.js 18 or newer and npm
- A MongoDB connection string (a free MongoDB Atlas cluster works well)
- API keys for Groq, Cloudinary, and Arcjet (all have free tiers); Resend is optional

## Environment variables

Create a file at `backend/.env` with the following values:

```
NODE_ENV=development
PORT=3000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret
CLIENT_URL=http://localhost:5173

GROQ_API_KEY=your-groq-key

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

ARCJET_KEY=your-arcjet-key
ARCJET_ENV=development

RESEND_API_KEY=your-resend-key
EMAIL_FROM=you@example.com
```

## Running locally

Install dependencies and start each package in its own terminal.

```
# Terminal 1 - backend
cd backend
npm install
npm run dev

# Terminal 2 - frontend
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and talks to the backend on port 3000.

Before the AI features work, seed the two required records once (from `backend/`):

```
node src/scripts/seedAiUser.js     # the AI participant account (required)
node src/scripts/seedPersonas.js   # the default AI personas
```

## Production build

From the repository root:

```
npm run build   # installs both packages and builds the frontend
npm run start   # starts the backend, which also serves the built frontend
```

For production, set `NODE_ENV=production` and point `CLIENT_URL` at your deployed URL.

## Deployment

The application is designed to run as a single Node service that serves both the API
and the built frontend. It has been deployed on an Oracle Cloud Always Free virtual
machine using PM2 to keep the process running and Nginx as a reverse proxy for HTTPS.
The database runs on MongoDB Atlas. The high-level steps are:

1. Provision a small Always Free VM and open the required ports.
2. Install Node.js, clone the repository, and create `backend/.env`.
3. Build the project (`npm run build`) and start it with PM2 (`npm run start`).
4. Put Nginx in front of the app to handle the domain and TLS certificate.
5. Run the two seed scripts once against the production database.

## Acknowledgements

Developed as a mini-project by the Department of Computer Science and Business Systems,
Dayananda Sagar College of Engineering, Bengaluru.
