import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { generateChat, handleAiError } from "../lib/groq.js";
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
