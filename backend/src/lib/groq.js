import { ENV } from "./env.js";

// ============================================================
// GROQ CLIENT — the AI provider (replaces Gemini)
// ============================================================
// Groq exposes an OpenAI-compatible chat API, so we just POST to its endpoint
// with `fetch` (built into Node 18+). No SDK/dependency required — paste your
// GROQ_API_KEY into backend/.env and you're done.
//
// Get a key at https://console.groq.com/keys

if (!ENV.GROQ_API_KEY) {
  console.error("CRITICAL: GROQ_API_KEY is missing in .env file.");
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Single source of truth for the model. Swap this one line to change models.
// llama-3.3-70b-versatile = strong general model with a large context window and
// a generous free tier. Other options: "llama-3.1-8b-instant" (faster/cheaper),
// "openai/gpt-oss-120b", "moonshotai/kimi-k2-instruct".
export const GROQ_MODEL = "llama-3.3-70b-versatile";

// The AI's baseline personality. Persona system prompts (Phase 4) replace this;
// the conversation memory (Phase 3) gets appended to whichever is in effect.
export const BASE_SYSTEM_PROMPT = `You are Convo AI, an intelligent and helpful AI assistant built into ConvoApp.
- Provide concise, helpful, and professional responses.
- Maintain awareness of the conversation history.
- Use Markdown for formatting (bold, lists, code snippets).
- Always identify yourself as Convo AI when asked.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Low-level call to Groq. `messages` is OpenAI format: [{ role, content }],
// where role is "system" | "user" | "assistant". Returns the assistant's text.
//
// Retries on 429 (rate limit) with backoff. The free tier caps tokens-per-minute,
// and bursty features like the AI Roundtable can trip it; retrying lets the call
// self-heal once the window resets instead of failing the whole flow.
const callGroq = async (body, attempt = 0) => {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: GROQ_MODEL, ...body }),
  });

  if (res.status === 429 && attempt < 4) {
    // Honor the server's Retry-After when present; otherwise back off 2s, 4s, 8s…
    const retryAfter = parseFloat(res.headers.get("retry-after"));
    const waitMs = (Number.isFinite(retryAfter) ? retryAfter : 2 ** attempt) * 1000;
    console.warn(`[Groq] 429 rate-limited — retrying in ${waitMs}ms (attempt ${attempt + 1}/4)`);
    await sleep(waitMs);
    return callGroq(body, attempt + 1);
  }

  if (!res.ok) {
    const detail = await res.text();
    const err = new Error(`Groq API ${res.status}: ${detail}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

/**
 * Plain chat completion. Used for AI / persona replies.
 * @param messages  OpenAI-format message array (system + history + the prompt)
 * @returns the assistant reply as a string
 */
export const generateChat = async (messages, { maxTokens = 1024, temperature } = {}) => {
  return callGroq({
    messages,
    max_tokens: maxTokens,
    ...(temperature != null ? { temperature } : {}),
  });
};

/**
 * JSON-mode completion. Used by the memory summarizer.
 * Groq guarantees valid JSON when response_format is json_object (the prompt
 * must mention JSON — ours does). Returns the PARSED object.
 */
export const generateJson = async (messages, { maxTokens = 2048, temperature = 0.2 } = {}) => {
  const text = await callGroq({
    messages,
    max_tokens: maxTokens,
    temperature,
    response_format: { type: "json_object" },
  });
  return JSON.parse(text);
};

/**
 * Log AI errors in a readable way (mirrors the old Gemini helper so callers
 * don't have to change). 401 = bad key, 429 = rate limit/quota.
 */
export const handleAiError = (error) => {
  console.error("--- GROQ API ERROR ---");
  if (error.status === 401) {
    console.error("Error 401: Invalid or missing GROQ_API_KEY. Check backend/.env.");
  } else if (error.status === 429) {
    console.error("Error 429: Rate limit / quota exceeded. Slow down or check your Groq plan.");
  } else if (error.status === 400) {
    console.error("Error 400: Bad request (often an unsupported model or malformed payload).");
    console.error(error.message);
  } else {
    console.error(error.message);
  }
  console.error("----------------------");
};
