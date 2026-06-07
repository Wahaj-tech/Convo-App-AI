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

// PRIMARY model — strong reasoning, but a smaller free-tier daily token budget.
export const GROQ_MODEL = "llama-3.3-70b-versatile";
// FALLBACK model — used automatically when the primary is rate-limited (429).
// Faster and with a much larger free daily budget, so the AI keeps working even
// after the 70b daily quota is exhausted. Other options: "openai/gpt-oss-120b".
const GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant";

// The AI's baseline personality. Persona system prompts (Phase 4) replace this;
// the conversation memory (Phase 3) gets appended to whichever is in effect.
export const BASE_SYSTEM_PROMPT = `You are Convo AI, an intelligent and helpful AI assistant built into ConvoApp.
- Provide concise, helpful, and professional responses.
- Maintain awareness of the conversation history.
- Use Markdown for formatting (bold, lists, code snippets).
- Always identify yourself as Convo AI when asked.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One call against a SPECIFIC model. `body` is the OpenAI-format payload
// (messages, max_tokens, …). Returns the assistant's text, or throws with
// `.status` set on failure.
//
// On 429 it does a SHORT same-model retry only for transient per-minute spikes
// (Retry-After ≤ 10s). It deliberately does NOT sleep out long Retry-After waits
// (a drained daily bucket can quote minutes) — instead it throws 429 fast so the
// caller can fall back to another model rather than freezing the request.
const callGroqOnce = async (model, body, attempt = 0) => {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, ...body }),
  });

  if (res.status === 429) {
    const retryAfter = parseFloat(res.headers.get("retry-after"));
    const waitSec = Number.isFinite(retryAfter) ? retryAfter : 2 ** attempt;
    if (waitSec <= 10 && attempt < 2) {
      console.warn(`[Groq] ${model} 429 — brief retry in ${waitSec}s (attempt ${attempt + 1})`);
      await sleep(waitSec * 1000);
      return callGroqOnce(model, body, attempt + 1);
    }
    const err = new Error(`Groq API 429 (${model}): rate limited (retry-after ${Math.round(waitSec)}s)`);
    err.status = 429;
    throw err;
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

// Low-level call to Groq. Tries the PRIMARY model first; if it's rate-limited
// (e.g. the 70b daily quota is exhausted), automatically retries the SAME request
// on the fallback model so the AI keeps working instead of failing.
const callGroq = async (body) => {
  try {
    return await callGroqOnce(GROQ_MODEL, body);
  } catch (error) {
    if (error.status === 429 && GROQ_FALLBACK_MODEL && GROQ_FALLBACK_MODEL !== GROQ_MODEL) {
      console.warn(`[Groq] ${GROQ_MODEL} rate-limited — falling back to ${GROQ_FALLBACK_MODEL}`);
      return await callGroqOnce(GROQ_FALLBACK_MODEL, body);
    }
    throw error;
  }
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
