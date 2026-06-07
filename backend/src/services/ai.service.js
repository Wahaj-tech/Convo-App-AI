import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { generateChat, generateJson, handleAiError } from "../lib/groq.js";
import { emitToConversation } from "../lib/socket.js";
import * as memoryService from "./memory.service.js";
import * as personaService from "./persona.service.js";

const AI_USER_ID = "6751e1b5f1a2c3d4e5f6a7b8";

/**
 * Detects if the message mentions @AI (kept for backward compatibility).
 */
export const detectAiMention = (text) => {
    if (!text) return false;
    return /(^|\s)@ai(\b|[^\w])/i.test(text);
};

/**
 * Strips a plain @ai mention (kept for backward compatibility).
 */
export const extractAiPrompt = (text) => {
    if (!text) return "";
    return text.replace(/(^|\s)@ai(\b|[^\w])/gi, "").trim();
};

// ============================================================
// handleAiMentions (Phase 4) — the entry point the controller calls
// ============================================================
// Works out WHICH personas were summoned by a message, then has each of them
// reply. Multiple personas (a "board of advisors") reply one after another so
// they can build on each other and share the same up-to-date context.
export const handleAiMentions = async (conversation, userMessage, isAiPrompt = false) => {
    try {
        const text = userMessage.text || "";

        // 1. Figure out the usable personas for this chat.
        const { enabled, defaultPersona } =
            await personaService.resolveConversationPersonas(conversation);

        // 2. Which ones did this message actually summon?
        const mentioned = personaService.detectMentionedPersonas(text, enabled, {
            isAiPrompt,
            defaultPersona,
        });
        if (mentioned.length === 0) return; // nobody was called — do nothing

        // 3. Clean the question once (strip the @handles) and let each persona reply.
        const prompt = personaService.stripMentions(text, enabled) || text;

        for (const persona of mentioned) {
            await processAiResponse(conversation._id, userMessage, persona, prompt);
        }
    } catch (error) {
        console.error("[AI] handleAiMentions failed:", error.message);
    }
};

/**
 * Generate ONE persona's reply, persist it, and broadcast it.
 *
 * @param persona  the persona doc (or the generic fallback). Drives the system
 *                 prompt, the saved personaId, and the bubble color in the UI.
 * @param prompt   the user's question with @mentions already stripped.
 */
export const processAiResponse = async (conversationId, userMessage, persona, prompt) => {
    const meta = personaService.personaMeta(persona);
    try {
        console.log(`[AI] ${meta?.name || "Convo AI"} responding in conv: ${conversationId}`);
        // 1. Notify that THIS persona is thinking (UI shows its name/color).
        emitToConversation(conversationId, "aiTyping", {
            conversationId,
            isTyping: true,
            persona: meta,
        });

        // 2. Build context: persona's instructions + conversation memory + recent msgs.
        const { systemPrompt, history } = await memoryService.buildAiContext(
            conversationId,
            userMessage._id,
            persona?.systemPrompt
        );

        const finalPrompt = prompt || extractAiPrompt(userMessage.text) || "(no prompt provided)";
        console.log(`[AI] prompt: "${finalPrompt}" | history turns: ${history.length}`);

        // 3. Call Groq: system prompt (persona + memory) + chat history + the question.
        const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: finalPrompt },
        ];
        const responseText = await generateChat(messages, { maxTokens: 1024 });

        // Safety net: never let a long reply blow past the Message text limit (8000).
        const MAX_LEN = 8000;
        const safeText =
            responseText.length > MAX_LEN
                ? responseText.slice(0, MAX_LEN - 1) + "…"
                : responseText;

        // 4. Persist as an AI message, tagged with which persona spoke.
        const aiMessage = await Message.create({
            conversationId,
            senderId: AI_USER_ID,
            senderType: "ai",
            personaId: persona?._id || null,
            text: safeText,
        });

        // 5. Update conversation metadata (sidebar preview / ordering).
        await Conversation.updateOne(
            { _id: conversationId },
            { lastMessage: aiMessage._id, lastMessageAt: aiMessage.createdAt }
        );

        // 6. Broadcast — populate persona so the UI can style the bubble.
        await aiMessage.populate("senderId", "fullName profilePic");
        if (persona?._id) await aiMessage.populate("personaId", "name color avatar");
        emitToConversation(conversationId, "newMessage", aiMessage);

        // 7. PHASE 3: refresh long-term memory in the background (fire-and-forget).
        memoryService.maybeSummarize(conversationId).catch((e) =>
            console.error("[AI] background summarize failed:", e.message)
        );
    } catch (error) {
        console.error("[AI] Error in processAiResponse:", error);
        handleAiError(error);
        emitToConversation(conversationId, "aiError", {
            conversationId,
            error: `${meta?.name || "Convo AI"} encountered an error. Please try again.`,
        });
    } finally {
        emitToConversation(conversationId, "aiTyping", {
            conversationId,
            isTyping: false,
            persona: meta,
        });
    }
};

// ============================================================
// AI ROUNDTABLE (the "board of advisors that deliberates")
// ============================================================
// The enabled personas form an advisory panel. On a panel request they:
//   Round 1 — each gives an INDEPENDENT take (generated against the same clean
//             context, before any are saved, so they don't echo each other).
//   Round 2 — each sees the others' takes and reacts (agree / challenge / add).
//   Synthesis — a moderator distills everything (+ conversation memory) into a
//             structured Decision Card, saved as a `verdict` message.
// Everything is broadcast live over sockets so the panel "lights up" in the UI.

const PANEL_THINKING = { _id: null, name: "AI Panel", color: "#00a884", avatar: "" };
const MODERATOR_META = { _id: null, name: "Moderator", color: "#00a884", avatar: "" };
const MAX_PANEL = 4; // cost/latency guard — only the first N specialist personas convene

// Emit a per-persona "X is analyzing…" indicator so the panel feels alive/staggered.
const emitTyping = (conversationId, persona, isTyping) =>
    emitToConversation(conversationId, "aiTyping", {
        conversationId,
        isTyping,
        persona: persona ? personaService.personaMeta(persona) : PANEL_THINKING,
    });

const clampConfidence = (n) => {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 70;
    return Math.max(1, Math.min(100, v));
};

// Persist one AI message (optionally a verdict) and broadcast it.
const saveAndEmitAiMessage = async (conversationId, persona, text, extra = {}) => {
    const aiMessage = await Message.create({
        conversationId,
        senderId: AI_USER_ID,
        senderType: "ai",
        personaId: persona?._id || null,
        text,
        ...extra, // { messageType, meta }
    });
    await Conversation.updateOne(
        { _id: conversationId },
        { lastMessage: aiMessage._id, lastMessageAt: aiMessage.createdAt }
    );
    await aiMessage.populate("senderId", "fullName profilePic");
    if (persona?._id) await aiMessage.populate("personaId", "name color avatar");
    emitToConversation(conversationId, "newMessage", aiMessage);
    return aiMessage;
};

export const runRoundtable = async (conversation, userMessage) => {
    const conversationId = conversation._id;
    try {
        // 1. Who's on the panel? Enabled personas MINUS the general "Convo AI"
        // (that voice is the moderator — keeping it out of the panel removes the
        // duplicated-moderator feel). Specialists only, capped for cost/latency.
        const { enabled } = await personaService.resolveConversationPersonas(conversation);
        const panel = (enabled || [])
            .filter((p) => p.name !== personaService.DEFAULT_PERSONA_NAME)
            .slice(0, MAX_PANEL);

        const prompt =
            stripPanel(personaService.stripMentions(userMessage.text || "", enabled)) ||
            stripPanel(userMessage.text || "") ||
            "(no prompt provided)";

        // A panel needs ≥2 distinct voices; otherwise just do a normal single reply.
        if (panel.length < 2) {
            const { defaultPersona } = await personaService.resolveConversationPersonas(conversation);
            return processAiResponse(conversationId, userMessage, panel[0] || defaultPersona, prompt);
        }

        // Snapshot a lighter context ONCE (last 8 msgs + memory). Reusing the same
        // history for every panelist keeps Round 1 independent AND keeps token usage
        // low — important for the free-tier rate limit.
        const PANEL_CONTEXT = 8;
        const { history: baseHistory } = await memoryService.buildAiContext(
            conversationId, userMessage._id, null, PANEL_CONTEXT
        );

        // ---- ROUND 1: independent, opinionated takes with a STANCE + CONFIDENCE ----
        // Sequential (never burst the rate limit). Each take is JSON so the UI can
        // show a stance chip + power the consensus engine.
        const takes = [];
        for (const persona of panel) {
            emitTyping(conversationId, persona, true);
            try {
                const { systemPrompt } = await memoryService.buildAiContext(
                    conversationId, userMessage._id, persona.systemPrompt, PANEL_CONTEXT
                );
                const r1 =
                    `You are on an expert advisory panel debating this question:\n\n"${prompt}"\n\n` +
                    `CRITICAL: You are NOT trying to be objectively correct. You are defending YOUR professional incentive and bias. ` +
                    `Answer ONLY from your lens. Take a CLEAR stance — never hedge, never default to agreement. If your incentive ` +
                    `points away from the obvious answer, fight for it.\n` +
                    `Your confidence (0-100) must reflect YOUR genuine conviction in YOUR domain — it should NOT match the other ` +
                    `advisors and should NOT be a lazy round number like 90. A specialist defending their turf is often 85-95; ` +
                    `outside your domain you'd be lower.\n` +
                    `Keep the argument to 2-4 punchy sentences in your own distinct voice. Reference your earlier position if you took one.\n\n` +
                    `Respond with ONLY a JSON object:\n` +
                    `{ "stance": "a 2-5 word position e.g. 'Freeze features' / 'Ship on time' / 'Delay 24h'", ` +
                    `"confidence": <integer 0-100>, "argument": "your 2-4 sentence argument" }`;
                const parsed = await generateJson(
                    [{ role: "system", content: systemPrompt }, ...baseHistory, { role: "user", content: r1 }],
                    { maxTokens: 400 }
                );
                const argument = truncate((parsed.argument || "").toString().trim());
                if (!argument) continue;
                const stance = (parsed.stance || "").toString().trim().slice(0, 60);
                const confidence = clampConfidence(parsed.confidence);
                // Collected, not saved inline — the whole debate is embedded in the
                // verdict's accordion (Part 2 UX) instead of cluttering the chat.
                takes.push({ persona, text: argument, stance, confidence });
            } catch (e) {
                console.error(`[Panel] round1 ${persona.name} failed:`, e.message);
            } finally {
                emitTyping(conversationId, persona, false);
            }
        }
        if (!takes.length) throw new Error("All panelists failed in round 1");

        // Nudge confidence variance: if the model returned identical values for all,
        // spread them deterministically so the consensus UI doesn't look fake.
        if (takes.length > 1 && takes.every((t) => t.confidence === takes[0].confidence)) {
            takes.forEach((t, i) => { t.confidence = clampConfidence(t.confidence - i * 6); });
        }

        // ---- ROUND 2: real cross-talk. Short, references another advisor by name. ----
        const transcript1 = takes
            .map((t) => `${t.persona.name} [${t.stance}, ${t.confidence}%]: ${t.text}`)
            .join("\n\n");
        const rebuttals = [];
        if (takes.length >= 2) {
            for (const { persona } of takes) {
                emitTyping(conversationId, persona, true);
                try {
                    const { systemPrompt } = await memoryService.buildAiContext(
                        conversationId, userMessage._id, persona.systemPrompt, PANEL_CONTEXT
                    );
                    const r2 =
                        `The panel was asked: "${prompt}"\n\nInitial positions:\n\n${transcript1}\n\n` +
                        `As ${persona.name}, react like a real person in a heated meeting — ONE or two short, sharp, conversational ` +
                        `sentences. Name ANOTHER advisor and push back on or build on what they said; let your bias show. ` +
                        `Avoid stiff, academic phrasing like "I disagree with X's assumption" — talk like a real expert ` +
                        `(e.g. "PM's underestimating how brutal first impressions are on mobile" or "If we delay every imperfect ` +
                        `release, we never ship"). Do NOT restate your own argument. Plain text only.`;
                    const text = truncate(
                        await generateChat(
                            [{ role: "system", content: systemPrompt }, ...baseHistory, { role: "user", content: r2 }],
                            { maxTokens: 160 }
                        )
                    );
                    if (text) rebuttals.push({ persona, text });
                } catch (e) {
                    console.error(`[Panel] round2 ${persona.name} failed:`, e.message);
                } finally {
                    emitTyping(conversationId, persona, false);
                }
            }
        }

        // ---- SYNTHESIS: one intelligent moderator verdict + consensus engine ----
        emitTyping(conversationId, MODERATOR_META, true);
        const positions = [...takes.map((t) => `${t.persona.name} [stance: ${t.stance}, ${t.confidence}%]: ${t.text}`),
            ...rebuttals.map((r) => `${r.persona.name} (rebuttal): ${r.text}`)].join("\n\n");

        // Deterministic part of the consensus engine.
        const avgConfidence = Math.round(takes.reduce((s, t) => s + t.confidence, 0) / takes.length);

        let verdict = null;
        try {
            verdict = await generateJson(
                [
                    {
                        role: "system",
                        content:
                            `You are the chair/moderator of an expert advisory panel. Read the question and every advisor's ` +
                            `position and rebuttal, then deliver ONE decisive verdict. Identify the strongest arguments and WHO ` +
                            `influenced the decision. EVEN IF the advisors converge, you MUST surface the key tension or tradeoff ` +
                            `and name the advisor who raised the strongest counterpoint — never present it as a flat average. ` +
                            `Respond with ONLY a JSON object with exactly these keys:\n` +
                            `{ "finalRecommendation": "imperative, starts with a verb", "recommendationConfidence": <int 0-100>, ` +
                            `"agreeCount": <int how many advisors align with the recommendation>, "mainRisk": string, ` +
                            `"dissentingView": "name the dissenter + their position; if none truly dissents, state the strongest tradeoff and who raised it", ` +
                            `"whyThisWon": string[] (2-4 short bullets), "actionPlan": string[] (2-5 imperative steps), ` +
                            `"influencedBy": string[] (advisor names) }`,
                    },
                    { role: "user", content: `QUESTION:\n${prompt}\n\nADVISOR POSITIONS:\n${positions}\n\nDeliver the panel's verdict as JSON.` },
                ],
                { maxTokens: 700 }
            );
        } catch (e) {
            console.error("[Panel] synthesis failed:", e.message);
        } finally {
            emitTyping(conversationId, MODERATOR_META, false);
        }

        if (verdict) {
            const total = takes.length;
            const agreeCount = Math.min(total, Math.max(0, Math.round(Number(verdict.agreeCount)) || 0));

            // The full debate, embedded so the UI can show it in a collapsible
            // accordion under the verdict (Part 2 UX) — keeps the chat uncluttered.
            const discussion = [
                ...takes.map((t) => ({
                    round: 1, name: t.persona.name, color: t.persona.color,
                    stance: t.stance, confidence: t.confidence, text: t.text,
                })),
                ...rebuttals.map((r) => ({
                    round: 2, name: r.persona.name, color: r.persona.color, text: r.text,
                })),
            ];

            const meta = {
                finalRecommendation: verdict.finalRecommendation || "(see panel)",
                recommendationConfidence: clampConfidence(verdict.recommendationConfidence),
                agreeCount,
                totalAdvisors: total,
                mainRisk: verdict.mainRisk || "",
                dissentingView: verdict.dissentingView || "",
                whyThisWon: Array.isArray(verdict.whyThisWon) ? verdict.whyThisWon.slice(0, 5) : [],
                actionPlan: Array.isArray(verdict.actionPlan) ? verdict.actionPlan.slice(0, 6) : [],
                influencedBy: Array.isArray(verdict.influencedBy) ? verdict.influencedBy.slice(0, 4) : [],
                stances: takes.map((t) => ({ name: t.persona.name, color: t.persona.color, stance: t.stance, confidence: t.confidence })),
                avgConfidence,
                panel: panel.map((p) => p.name),
                question: prompt,
                discussion,
            };

            // Verdict message text is richer markdown so the memory summarizer
            // captures the actual decision (the round messages are no longer saved).
            const verdictText =
                `**Panel verdict:** ${meta.finalRecommendation}` +
                (meta.mainRisk ? `\n\n**Main risk:** ${meta.mainRisk}` : "") +
                (meta.actionPlan.length ? `\n\n**Action plan:**\n${meta.actionPlan.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "");

            await saveAndEmitAiMessage(conversationId, null, verdictText, { messageType: "verdict", meta });
        }

        // Fold the deliberation into long-term memory (fire-and-forget).
        memoryService.maybeSummarize(conversationId).catch((e) =>
            console.error("[Panel] background summarize failed:", e.message)
        );
    } catch (error) {
        console.error("[Panel] runRoundtable failed:", error.message);
        handleAiError(error);
        emitToConversation(conversationId, "aiError", {
            conversationId,
            error: "The AI panel hit an error. Please try again.",
        });
    } finally {
        emitToConversation(conversationId, "aiTyping", { conversationId, isTyping: false, persona: PANEL_THINKING });
    }
};

// Strip a leading/standalone "@panel" mention from the prompt.
const stripPanel = (text) =>
    (text || "").replace(/(^|\s)@panel(\b|[^\w])/gi, " ").replace(/\s+/g, " ").trim();

// Never let a reply exceed the Message text cap (8000).
const truncate = (text, max = 8000) =>
    text && text.length > max ? text.slice(0, max - 1) + "…" : text;
