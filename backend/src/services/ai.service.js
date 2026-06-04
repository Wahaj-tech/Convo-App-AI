import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { geminiModel, handleGeminiError } from "../lib/gemini.js";
import { emitToConversation } from "../lib/socket.js";

const AI_USER_ID = "6751e1b5f1a2c3d4e5f6a7b8";

/**
 * Detects if the message mentions @AI
 * Improved regex to handle cases like "@ai," or "@ai!"
 */
export const detectAiMention = (text) => {
    if (!text) return false;
    // Look for @ai preceded by start of string or whitespace, followed by non-word char or end of string
    return /(^|\s)@ai(\b|[^\w])/i.test(text);
};

/**
 * Extracts the user prompt by stripping the @AI mention
 */
export const extractAiPrompt = (text) => {
    if (!text) return "";
    return text.replace(/(^|\s)@ai(\b|[^\w])/gi, "").trim();
};

/**
 * Main pipeline to process AI response asynchronously
 */
export const processAiResponse = async (conversationId, userMessage) => {
    try {
        console.log(`[AI] Starting response for conv: ${conversationId}`);
        // 1. Notify that AI is thinking
        emitToConversation(conversationId, "aiTyping", { conversationId, isTyping: true });

        // 2. Build History for Context (latest 20 messages)
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("senderId", "fullName");

        console.log(`[AI] Context fetched: ${messages.length} messages`);

        // Format for Gemini History
        // We reverse it to be chronological (oldest first)
        const history = messages.reverse()
            .filter(msg => msg._id.toString() !== userMessage._id.toString()) // Exclude the current message from history to avoid redundancy
            .map(msg => {
                const role = msg.senderType === "ai" ? "model" : "user";
                const senderName = msg.senderId?.fullName || "User";
                return {
                    role: role,
                    parts: [{ text: `[${senderName}]: ${msg.text}` }]
                };
            });

        const prompt = extractAiPrompt(userMessage.text);
        console.log(`[AI] Prompt: "${prompt}"`);
        
        // 3. Request Generation from Gemini
        console.log("[AI] Calling Gemini API...");
        const chat = geminiModel.startChat({
            history: history,
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const responseText = response.text();
        console.log("[AI] Gemini response received.");

        // 4. Persistence: Save AI response as a message
        const aiMessage = await Message.create({
            conversationId,
            senderId: AI_USER_ID,
            senderType: "ai",
            text: responseText,
        });

        // 5. Update Conversation Metadata
        await Conversation.updateOne(
            { _id: conversationId },
            { 
                lastMessage: aiMessage._id, 
                lastMessageAt: aiMessage.createdAt 
            }
        );

        // 6. Broadcast Response via Socket
        await aiMessage.populate("senderId", "fullName profilePic");
        console.log("[AI] Emitting newMessage via socket...");
        emitToConversation(conversationId, "newMessage", aiMessage);
        console.log("[AI] Process complete.");

    } catch (error) {
        console.error("[AI] Error in processAiResponse:", error);
        handleGeminiError(error);
        
        emitToConversation(conversationId, "aiError", { 
            conversationId, 
            error: "Convo AI encountered an error. Please try again." 
        });
    } finally {
        emitToConversation(conversationId, "aiTyping", { conversationId, isTyping: false });
    }
};
